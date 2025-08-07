import type { NextFunction, Request, Response } from "express";

 const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Something went wrong",
    errors: err.errors || [],
    data: err.data || null,
  });
};

export default errorHandler