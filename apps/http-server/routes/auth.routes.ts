import { Router } from "express";
import { googleLogin , googleLogout } from "../controller/auth.controller"; 
import asyncHandler from "utils/AsyncHandler";

const router = Router();

router.post("/google", asyncHandler(googleLogin));
router.post("/logout", asyncHandler(googleLogout));

export default router;