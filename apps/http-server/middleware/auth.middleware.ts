import {type Request,type Response,type NextFunction } from "express"
import jwt from "jsonwebtoken"
import ApiError from "utils/ApiError"
import client from "db/client"

declare global{
    namespace Express {
        interface Request {
            userId: string
        }
    }
}

export const authMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.token
  console.log(req.body)
  
  if (!token) {
    throw new ApiError(401, "Unauthorized: No token provided")
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    req.userId = decoded.userId // attach user to request
    next()
  } catch (err) {
    throw new ApiError(401, "Invalid or expired token")
  }
}
