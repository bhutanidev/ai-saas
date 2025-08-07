import { type Request, type Response } from "express"
import { OAuth2Client } from "google-auth-library"
import jwt from "jsonwebtoken"
import ApiResponse from "utils/ApiResponse"
import ApiError from "utils/ApiError"
import client from "db/client"

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID!)

export const googleLogin = async (req: Request, res: Response) => {
  const { credential } = req.body

  if (!credential) {
    throw new ApiError(400, "Missing Google credential")
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  })

  const payload = ticket.getPayload()

  if (!payload || !payload.email) {
    throw new ApiError(403, "Invalid Google token")
  }

  // Find or create user
  let user = await client.user.findUnique({
    where: { email: payload.email },
  })

  if (!user) {
    user = await client.user.create({
      data: {
        email: payload.email,
        name: payload.name || "No Name",
        googleId: payload.sub,
        picture: payload.picture,
      },
    })
  }
  console.log(payload);
  

  // Issue JWT (1 day expiry)
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET!,
    { expiresIn: "1d" }
  )

  // Set HTTP-only cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  })

  res.status(200).json(new ApiResponse(200, user, "Login successful"))
}

export const googleLogout = async (_req: Request, res: Response) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "strict" })
  res.status(200).json(new ApiResponse(200, null, "Logout successful"))
}
