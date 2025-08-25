import { Router } from "express";
import { askGenAI } from "../controller/genai.controller";
import { authMiddleware } from "../middleware/auth.middleware";


const genaiRouter = Router();


// POST /genai/query
// Body: { query, type: 'ORGANIZATION'|'USER', organizationId?, ownerId?, topK?, filter?, conversationId? }
genaiRouter.post("/query",authMiddleware, askGenAI);


export default genaiRouter;