import { Router } from "express";
import Visitor from "../models/VisitorAnalytics.js";
import LandingPage from "../models/LandingPage.js";
import LandingOrder from "../models/LandingOrder.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const sessionPattern = /^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i;
const botPattern =
  /bot|spider|crawler|crawl|preview|facebookexternalhit|headless/i;

router.post("/visit", async (req, res, next) => {
  try {
    const { sessionId, pageType, path, device } = req.body || {};

    if (
      typeof sessionId !== "string" ||
      !sessionPattern.test(sessionId) ||
      !["website", "landing"].includes(pageType) ||
      typeof path !== "string" ||
      path.length > 180 ||
      !path.startsWith("/") ||
      !["mobile", "desktop", "tablet"].includes(device)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid analytics event"
      });
    }

    if (botPattern.test(req.get("user-agent") || "")) {
      return res.status(204).end();
    }

    let slug = "";
    let pageKey;

    if (pageType === "landing") {
      const match = path.match(/^\/lp\/([a-z0-9-]+)\/?$/);

      if (!match || !slugPattern.test(match[1])) {
        return res.status(400).json({
          success: false,
          message: "Invalid landing page"
        });
      }

      slug = match[1];

      const published = await LandingPage.exists({
        slug,
        status: "published"
      });

      if (!published) {
        return res.status(204).end();
      }

      pageKey = `/lp/${slug}`;
    } else {
      if (path.startsWith("/admin") ||
          path.startsWith("/lp/") ||
          path === "/checkout") {
        return res.status(400).json({
          success: false,
          message: "Page not trackable"
        });
      }

      // Track website-level activity without storing query strings.
      pageKey = path.replace(/\/+$/, "") || "/";
    }

    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    const expiresAt = new Date(now);
    expiresAt.setUTCDate(expiresAt.getUTCDate() + 90);

    const filter = { sessionId, day, pageKey };

    const update = {
      $setOnInsert: {
        sessionId,
        day,
        pageKey,
        pageType,
        slug,
        device,
        expiresAt
      },
      $inc: { views: 1 },
      $set: { lastSeen: now }
    };

    try {
      await Visitor.updateOne(filter, update, { upsert: true });
    } catch (error) {
      if (error.code !== 11000) throw error;

      await Visitor.updateOne(
        filter,
        {
          $inc: { views: 1 },
          $set: { lastSeen: now }
        }
      );
    }

    return res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.get("/summary", requireAdmin, async (req, res, next) => {
  try {
    const days = Number(req.query.days || 7);

    if (![1, 7, 30].includes(days)) {
      return res.status(400).json({
        success: false,
        message: "Days must be 1, 7 or 30"
      });
    }

    const now = new Date();
    const start = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    ));
    start.setUTCDate(start.getUTCDate() - days + 1);

    const firstDay = start.toISOString().slice(0, 10);
    const match = { day: { $gte: firstDay } };

    const [
      views,
      sessions,
      daily,
      devices,
      landing,
      orders,
      pages
    ] = await Promise.all([
      Visitor.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$pageType",
            views: { $sum: "$views" }
          }
        }
      ]),
      Visitor.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$sessionId"
          }
        },
        { $count: "total" }
      ]),
      Visitor.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$day",
            views: { $sum: "$views" }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Visitor.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$device",
            views: { $sum: "$views" }
          }
        }
      ]),
      Visitor.aggregate([
        { $match: { ...match, pageType: "landing" } },
        {
          $group: {
            _id: "$slug",
            views: { $sum: "$views" },
            sessions: { $addToSet: "$sessionId" }
          }
        }
      ]),
      LandingOrder.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: "$pageSlug",
            orders: { $sum: 1 }
          }
        }
      ]),
      LandingPage.find({})
        .select("title slug status")
        .lean()
    ]);

    const viewTotals = Object.fromEntries(
      views.map(x => [x._id, x.views])
    );

    const orderTotals = Object.fromEntries(
      orders.map(x => [x._id, x.orders])
    );

    const landingTotals = Object.fromEntries(
      landing.map(x => [x._id, x])
    );

    const landingPages = pages.map(page => {
      const stats = landingTotals[page.slug];
      const pageViews = stats?.views || 0;
      const orderCount = orderTotals[page.slug] || 0;

      return {
        title: page.title,
        slug: page.slug,
        status: page.status,
        views: pageViews,
        sessions: stats?.sessions.length || 0,
        orders: orderCount,
        orderRate: pageViews
          ? Number((orderCount * 100 / pageViews).toFixed(2))
          : 0
      };
    }).sort((a, b) => b.views - a.views);

    const websiteViews = viewTotals.website || 0;
    const landingViews = viewTotals.landing || 0;

    const timeline = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setUTCDate(date.getUTCDate() + i);
      const label = date.toISOString().slice(0, 10);

      timeline.push({
        date: label,
        views: daily.find(x => x._id === label)?.views || 0
      });
    }

    return res.json({
      success: true,
      data: {
        days,
        timezone: "UTC",
        uniqueSessions: sessions[0]?.total || 0,
        totalViews: websiteViews + landingViews,
        websiteViews,
        landingViews,
        landingOrders: orders.reduce(
          (sum, item) => sum + item.orders, 0
        ),
        devices: {
          mobile: 0,
          desktop: 0,
          tablet: 0,
          ...Object.fromEntries(
            devices.map(x => [x._id, x.views])
          )
        },
        timeline,
        landingPages
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
