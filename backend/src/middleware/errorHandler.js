export function errorHandler(error, req, res, next) {
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Email or product slug already exists"
    });
  }

  if (error.name === "ValidationError" ||
      error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid input data"
    });
  }

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON"
    });
  }

  console.error("API Error:", error.message);

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
}
