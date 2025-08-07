import { type Request, type Response, type NextFunction } from "express";
import { getPresignedUploadUrl } from "../utils/awsS3.utils";
import ApiError from "utils/ApiError";
import ApiResponse from "utils/ApiResponse";
import { v4 as uuidv4 } from "uuid";
import client from "db/client";

export const generatePersonalUploadUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename, contentType } = req.body;
    const userId = req.userId;

    if (!filename || !contentType) {
      return next(new ApiError(400, "Filename and content type are required"));
    }

    const key = `docs/${userId}/${uuidv4()}-${filename}`;
    const url = await getPresignedUploadUrl({ key, contentType });

    return res.status(200).json(new ApiResponse(200, { url, key }, "Presigned URL generated"));
  } catch (err) {
    next(new ApiError(500, "Failed to generate presigned URL"));
  }
};

export const generateOrganizationUploadUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename, contentType, organizationId } = req.body;
    const userId = req.userId;

    if (!filename || !contentType || !organizationId) {
      return next(new ApiError(400, "Filename, content type and organizationId are required"));
    }

    const organization = await client.organization.findUnique({
      where: { id: organizationId },
      select: { adminId: true }
    });

    if (!organization || organization.adminId !== userId) {
      return next(new ApiError(403, "Only organization admins can upload organization documents"));
    }

    const key = `org-docs/${organizationId}/${uuidv4()}-${filename}`;
    const url = await getPresignedUploadUrl({ key, contentType });

    return res.status(200).json(new ApiResponse(200, { url, key }, "Presigned URL generated"));
  } catch (err) {
    next(new ApiError(500, "Failed to generate presigned URL"));
  }
};

export const savePersonalDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, fileKey , description } = req.body;
    const userId = req.userId;

    if (!title || !fileKey) {
      return next(new ApiError(400, "Missing required fields"));
    }

    const document = await client.document.create({
      data: {
        title,
        fileKey,
        type : "PERSONAL",
        ownerId:userId,
        description
      }
    });

    return res.status(201).json(new ApiResponse(201, document, "Personal document saved"));
  } catch (err) {
    next(new ApiError(500, "Failed to save personal document"));
  }
};


export const saveOrganizationDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, fileKey, organizationId , description } = req.body;
    const userId = req.userId;

    if (!title || !fileKey  || !organizationId) {
      return next(new ApiError(400, "Missing required fields"));
    }
    
    const isMember = await client.organizationMember.findFirst({
      where: {
        organizationId,
        userId,
        status: "ACCEPTED"
      }
    });

    if (!isMember || isMember.role !== 'ADMIN') {
      return next(new ApiError(403, "User does not have the right to upload"));
    }

    const document = await client.document.create({
      data: {
        title,
        fileKey,
        type : "ORGANIZATION",
        organizationId,
        description
      }
    });

    return res.status(201).json(new ApiResponse(201, document, "Organization document saved"));
  } catch (err) {
    next(new ApiError(500, "Failed to save organization document"));
  }
};

