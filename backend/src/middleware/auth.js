import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

export async function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const token = header.slice(7);

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] }
    );

    if (payload.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const admin = await Admin.findById(payload.sub);

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid administrator"
      });
    }

    req.admin = admin;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session"
    });
  }
}
