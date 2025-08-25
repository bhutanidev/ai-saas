// controllers/genai.controller.ts
import { type Request, type Response, type NextFunction } from "express";
import ApiError from "utils/ApiError";
import ApiResponse from "utils/ApiResponse";
import { runRAGChain } from "../helper/genai.helper";

// ---- Types ----
export type GenAIQueryBody = {
  // query to ask
  query: string;
  // owner & org scoping for namespace formation
  type: "ORGANIZATION" | "USER";
  organizationId?: string;
  topK?: number;
  filter?: Record<string, any>;
};


export const askGenAI = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { query, type, organizationId, topK = 5, filter } = req.body || {} as GenAIQueryBody;
    const ownerId = req.userId
    if (!query || typeof query !== "string") {
      throw new ApiError(400, "`query` (string) is required in request body");
    }
    if (type !== "ORGANIZATION" && type !== "USER") {
      throw new ApiError(400, "`type` must be either 'ORGANIZATION' or 'USER'");
    }

    const namespace = type === "ORGANIZATION" && organizationId
      ? `ORG_${organizationId}`
      : type === "USER" && ownerId
        ? `USER_${ownerId}`
        : null;
    if (!namespace) {
      throw new ApiError(400, type === "ORGANIZATION" ? "`organizationId` is required when type is ORGANIZATION" : "`ownerId` is required when type is USER");
    }

    const { answer, sources } = await runRAGChain({ namespace, query, topK, filter });

    return res.status(200).json(new ApiResponse(200, {
      namespace,
      answer,
      sources,
    },"successfull retrieval"));
  } catch (err) {
    return next(err instanceof ApiError ? err : new ApiError(500, (err as Error)?.message || "Something went wrong"));
  }
};

export default { askGenAI };
