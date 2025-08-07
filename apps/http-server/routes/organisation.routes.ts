import { Router } from "express";
import {
  createOrganization,
  addMember,
  removeMember,
  leaveOrganization,
  deleteOrganization
} from "../controller/organisation.controller"
import { authMiddleware } from "../middleware/auth.middleware";
import asyncHandler from "utils/AsyncHandler";

const router = Router()

router.post("/create", authMiddleware, asyncHandler(createOrganization))
router.post("/add-member", authMiddleware, asyncHandler(addMember))
router.post("/remove-member", authMiddleware, asyncHandler(removeMember))
router.post("/leave", authMiddleware, asyncHandler(leaveOrganization))
router.delete("/delete", authMiddleware, asyncHandler(deleteOrganization))

export default router
