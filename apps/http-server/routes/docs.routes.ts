import { Router } from "express";
import asyncHandler from "utils/AsyncHandler";
import { authMiddleware } from "../middleware/auth.middleware";
import { downloadDocumentById, downloadOrganizationDocument, generateOrganizationUploadUrl, generatePersonalUploadUrl, saveOrganizationDocument, savePersonalDocument } from "../controller/docs.controller";

const router = Router();

router.get('/personal/:id', authMiddleware, downloadDocumentById)
router.get('/organization/:id', authMiddleware, downloadOrganizationDocument)
router.post("/generate-personal", authMiddleware, asyncHandler(generatePersonalUploadUrl))
router.post("/generate-organisation", authMiddleware, asyncHandler(generateOrganizationUploadUrl))
router.post("/save-personal", authMiddleware, asyncHandler(savePersonalDocument))
router.post("/save-organisation", authMiddleware, asyncHandler(saveOrganizationDocument))

export default router