import LandingPage from "../models/LandingPage.js";

const fields = [
  "title", "slug", "subtitle", "description",
  "features", "images", "video", "pricing",
  "delivery", "seo"
];

function validSlug(slug) {
  return typeof slug === "string" &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) &&
    slug.length <= 100;
}

function validate(data) {
  if (data.title !== undefined &&
      (typeof data.title !== "string" ||
       !data.title.trim() ||
       data.title.length > 180)) {
    return "Invalid product title";
  }

  if (data.slug !== undefined && !validSlug(data.slug)) {
    return "Invalid URL slug";
  }

  if (data.pricing !== undefined) {
    if (!data.pricing || Array.isArray(data.pricing) ||
        typeof data.pricing !== "object") {
      return "Invalid pricing";
    }

    for (const key of ["salePrice", "regularPrice"]) {
      const value = data.pricing[key];
      if (value !== undefined &&
          (typeof value !== "number" ||
           !Number.isFinite(value) || value < 0)) {
        return `Invalid ${key}`;
      }
    }
  }

  if (data.delivery !== undefined) {
    if (!data.delivery || Array.isArray(data.delivery) ||
        typeof data.delivery !== "object") {
      return "Invalid delivery settings";
    }

    for (const key of ["insideDhaka", "outsideDhaka"]) {
      const value = data.delivery[key];
      if (value !== undefined &&
          (typeof value !== "number" ||
           !Number.isFinite(value) || value < 0)) {
        return `Invalid ${key}`;
      }
    }

    for (const key of ["freeDelivery", "cashOnDelivery"]) {
      if (data.delivery[key] !== undefined &&
          typeof data.delivery[key] !== "boolean") {
        return `Invalid ${key}`;
      }
    }
  }

  if (data.features !== undefined &&
      (!Array.isArray(data.features) ||
       data.features.length > 30 ||
       data.features.some(x =>
         typeof x !== "string" || x.length > 300))) {
    return "Invalid product features";
  }

  if (data.images !== undefined &&
      (!Array.isArray(data.images) ||
       data.images.length > 20 ||
       data.images.some(x =>
         !x || typeof x !== "object" ||
         typeof x.url !== "string" ||
         !/^https:\/\//.test(x.url)))) {
    return "Invalid product images";
  }

  if (data.video !== undefined &&
      (!data.video || typeof data.video !== "object" ||
       Array.isArray(data.video) ||
       (data.video.url &&
        (typeof data.video.url !== "string" ||
         !/^https:\/\//.test(data.video.url))))) {
    return "Invalid product video";
  }

  return null;
}

function pickFields(body) {
  const data = {};
  for (const key of fields) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      data[key] = body[key];
    }
  }
  return data;
}

function errorResponse(res, error) {
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "This URL slug already exists"
    });
  }

  if (error.name === "ValidationError" ||
      error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid landing page data"
    });
  }

  console.error("Landing Page API:", error.name);
  return res.status(500).json({
    success: false,
    message: "Landing page operation failed"
  });
}

export async function createLandingPage(req, res) {
  try {
    const data = pickFields(req.body || {});
    const problem = validate(data);

    if (problem) {
      return res.status(400).json({
        success: false, message: problem
      });
    }

    const page = await LandingPage.create({
      ...data,
      status: "draft",
      publishedAt: null
    });

    return res.status(201).json({
      success: true,
      data: page,
      publicPath: `/lp/${page.slug}`
    });
  } catch (error) {
    return errorResponse(res, error);
  }
}

export async function listLandingPages(req, res) {
  try {
    const pages = await LandingPage.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.json({ success: true, data: pages });
  } catch (error) {
    return errorResponse(res, error);
  }
}

export async function getAdminLandingPage(req, res) {
  try {
    const page = await LandingPage.findById(req.params.id);

    if (!page) {
      return res.status(404).json({
        success: false, message: "Landing page not found"
      });
    }

    return res.json({ success: true, data: page });
  } catch (error) {
    return errorResponse(res, error);
  }
}

export async function updateLandingPage(req, res) {
  try {
    const changes = pickFields(req.body || {});
    const problem = validate(changes);

    if (problem) {
      return res.status(400).json({
        success: false, message: problem
      });
    }

    const page = await LandingPage.findById(req.params.id);

    if (!page) {
      return res.status(404).json({
        success: false, message: "Landing page not found"
      });
    }

    for (const [key, value] of Object.entries(changes)) {
      if (["pricing", "delivery", "video", "seo"].includes(key)) {
        const previous = page.get(key)?.toObject?.() || {};
        page.set(key, { ...previous, ...value });
      } else {
        page.set(key, value);
      }
    }

    await page.save();

    return res.json({
      success: true,
      data: page,
      publicPath: `/lp/${page.slug}`
    });
  } catch (error) {
    return errorResponse(res, error);
  }
}

export async function changePublishStatus(req, res) {
  try {
    const { status } = req.body || {};

    if (!["draft", "published", "unpublished"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid publishing status"
      });
    }

    const page = await LandingPage.findById(req.params.id);

    if (!page) {
      return res.status(404).json({
        success: false, message: "Landing page not found"
      });
    }

    if (status === "published") {
      if (!page.title || !validSlug(page.slug) ||
          !Number.isFinite(page.pricing?.salePrice) ||
          page.pricing.salePrice <= 0 ||
          !page.images.length) {
        return res.status(400).json({
          success: false,
          message: "Add title, slug, price and at least one image before publishing"
        });
      }

      if (!page.delivery.cashOnDelivery) {
        return res.status(400).json({
          success: false,
          message: "Enable Cash on Delivery before publishing"
        });
      }

      page.publishedAt = page.publishedAt || new Date();
    }

    page.status = status;
    await page.save();

    return res.json({
      success: true,
      data: {
        id: page.id,
        status: page.status,
        slug: page.slug,
        publicPath: `/lp/${page.slug}`
      }
    });
  } catch (error) {
    return errorResponse(res, error);
  }
}

export async function getPublicLandingPage(req, res) {
  try {
    const page = await LandingPage.findOne({
      slug: req.params.slug,
      status: "published"
    }).lean();

    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Landing page not found"
      });
    }

    return res.json({ success: true, data: page });
  } catch (error) {
    return errorResponse(res, error);
  }
}


export async function deleteLandingPage(req, res) {
  try {
    const page = await LandingPage.findByIdAndDelete(req.params.id);

    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Landing page not found"
      });
    }

    return res.json({
      success: true,
      message: "Landing page deleted successfully",
      data: {
        id: page.id,
        slug: page.slug
      }
    });
  } catch (error) {
    return errorResponse(res, error);
  }
}
