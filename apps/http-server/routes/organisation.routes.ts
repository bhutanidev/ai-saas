import { Router } from "express";
import {
  createOrganization,
  addMember,
  removeMember,
  leaveOrganization,
  deleteOrganization
} from "../controller/organisation.controller"
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router()

router.post("/create", authMiddleware, createOrganization)
router.post("/add-member", authMiddleware, addMember)
router.post("/remove-member", authMiddleware, removeMember)
router.post("/leave", authMiddleware, leaveOrganization)
router.delete("/delete", authMiddleware, deleteOrganization)

export default router
