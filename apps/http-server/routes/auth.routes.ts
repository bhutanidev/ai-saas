import { Router } from "express";
import { googleLogin , googleLogout } from "../controller/auth.controller"; 
import asyncHandler from "utils/AsyncHandler";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware ,(req,res)=>res.json({"message":"authenticated"}));
router.post("/google", asyncHandler(googleLogin));
router.post("/logout", asyncHandler(googleLogout));

export default router;