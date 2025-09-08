import { type Request, type Response, type NextFunction } from "express";
import { generatePresignedUrlForDownload, getPresignedUploadUrl } from "utils/s3helper"
import ApiError from "utils/ApiError";
import ApiResponse from "utils/ApiResponse";
import { v4 as uuidv4 } from "uuid";
import client from "db/client";
import { publishDocumentToQueue } from "utils/rabithelper"

// ===== Helper for Validation =====
function validateDocumentPayload({ contentType, fileKey, textContent, url }: any) {
  if (!contentType) throw new ApiError(400, "contentType is required");

  if (contentType === "FILE") {
    if (!fileKey) throw new ApiError(400, "fileKey is required for FILE type");
  } else if (contentType === "TEXT") {
    if (!textContent) throw new ApiError(400, "textContent is required for TEXT type");
  } else if (contentType === "URL") {
    if (!url) throw new ApiError(400, "url is required for URL type");
  } else {
    throw new ApiError(400, "Invalid contentType. Must be FILE, TEXT, or URL");
  }
}

// ===== Presigned URL generation for personal files =====
export const generatePersonalUploadUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename, contentType } = req.body;
    const userId = req.userId;

    if (!filename || !contentType) {
      return next(new ApiError(400, "Filename and contentType are required"));
    }

    if (contentType !== "FILE") {
      return next(new ApiError(400, "Presigned URL generation is only for FILE contentType"));
    }

    const key = `docs/${userId}/${uuidv4()}-${filename}`;
    const url = await getPresignedUploadUrl({ key, contentType: "application/octet-stream" });

    return res.status(200).json(new ApiResponse(200, { url, key }, "Presigned URL generated"));
  } catch (err) {
    next(new ApiError(500, "Failed to generate presigned URL"));
  }
};

// ===== Presigned URL generation for organization files =====
export const generateOrganizationUploadUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename, contentType, organizationId } = req.body;
    const userId = req.userId;

    if (!filename || !contentType || !organizationId) {
      return next(new ApiError(400, "Filename, contentType and organizationId are required"));
    }

    if (contentType !== "FILE") {
      return next(new ApiError(400, "Presigned URL generation is only for FILE contentType"));
    }

    const organization = await client.organization.findUnique({
      where: { id: organizationId },
      select: { adminId: true }
    });

    if (!organization || organization.adminId !== userId) {
      return next(new ApiError(403, "Only organization admins can upload organization documents"));
    }

    const key = `org-docs/${organizationId}/${uuidv4()}-${filename}`;
    const url = await getPresignedUploadUrl({ key, contentType: "application/octet-stream" });

    return res.status(200).json(new ApiResponse(200, { url, key }, "Presigned URL generated"));
  } catch (err) {
    next(new ApiError(500, "Failed to generate presigned URL"));
  }
};

// ===== Save personal document =====
export const savePersonalDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, contentType, fileKey, textContent, url } = req.body;
    const userId = req.userId;

    if (!title) {
      return next(new ApiError(400, "Title is required"));
    }

    // Validate fields based on contentType
    validateDocumentPayload({ contentType, fileKey, textContent, url });

    const document = await client.document.create({
      data: {
        title,
        description,
        contentType,
        fileKey,
        textContent,
        url,
        type: "PERSONAL",
        ownerId: userId
      }
    });

    // Always publish to queue for embeddings
    await publishDocumentToQueue({
      id: document.id,
      type: "PERSONAL",
      ownerId: userId,
      contentType: document.contentType,
      fileKey: document.fileKey,
      createdAt: document.createdAt
    });

    return res.status(201).json(new ApiResponse(201, document, "Personal document saved"));
  } catch (err) {

    console.log(err)
    next(err instanceof ApiError ? err : new ApiError(500, "Failed to save personal document"));
  }
};

// ===== Save organization document =====
export const saveOrganizationDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, contentType, fileKey, textContent, url, organizationId } = req.body;
    const userId = req.userId;

    if (!title || !organizationId) {
      return next(new ApiError(400, "Title and organizationId are required"));
    }

    // Validate fields based on contentType
    validateDocumentPayload({ contentType, fileKey, textContent, url });

    const isMember = await client.organizationMember.findFirst({
      where: {
        organizationId,
        userId,
        status: "ACCEPTED"
      }
    });

    if (!isMember || isMember.role !== "ADMIN") {
      return next(new ApiError(403, "User does not have the right to upload"));
    }

    const document = await client.document.create({
      data: {
        title,
        description,
        contentType,
        fileKey,
        textContent,
        url,
        type: "ORGANIZATION",
        organizationId
      }
    });

    // Always publish to queue for embeddings
    await publishDocumentToQueue({
      id: document.id,
      type: "ORGANIZATION",
      ownerId: organizationId, // here ownerId means org ID
      contentType: document.contentType,
      fileKey: document.fileKey,
      createdAt: document.createdAt
    });

    return res.status(201).json(new ApiResponse(201, document, "Organization document saved"));
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError(500, "Failed to save organization document"));
  }
};

// ===== Fetch all user documents with pagination =====
export const getUserDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const type = req.query.type as string; // Optional filter: 'PERSONAL' | 'ORGANIZATION'
    const search = req.query.search as string; // Optional search term

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return next(new ApiError(400, "Invalid pagination parameters. Page must be >= 1, limit must be between 1-100"));
    }

    const skip = (page - 1) * limit;

    // Get user's organization memberships for organization documents
    const userMemberships = await client.organizationMember.findMany({
      where: {
        userId,
        status: "ACCEPTED"
      },
      select: {
        organizationId: true
      }
    });

    const userOrgIds = userMemberships.map(m => m.organizationId);

    // Build where conditions
    const whereConditions: any[] = [
      // Personal documents owned by user
      {
        type: "PERSONAL",
        ownerId: userId
      }
    ];

    // Add organization documents if user is member of any organizations
    if (userOrgIds.length > 0) {
      whereConditions.push({
        type: "ORGANIZATION",
        organizationId: {
          in: userOrgIds
        }
      });
    }

    let whereClause: any = {
      OR: whereConditions
    };

    // Apply type filter if specified
    if (type && (type === "PERSONAL" || type === "ORGANIZATION")) {
      if (type === "PERSONAL") {
        whereClause = {
          type: "PERSONAL",
          ownerId: userId
        };
      } else {
        if (userOrgIds.length === 0) {
          // User has no organization memberships, return empty result
          return res.status(200).json(new ApiResponse(200, {
            documents: [],
            pagination: {
              currentPage: page,
              totalPages: 0,
              totalDocuments: 0,
              hasNextPage: false,
              hasPreviousPage: false
            }
          }, "No organization documents found"));
        }
        whereClause = {
          type: "ORGANIZATION",
          organizationId: {
            in: userOrgIds
          }
        };
      }
    }

    // Apply search filter if specified
    if (search && search.trim()) {
      const searchTerm = search.trim();
      whereClause.AND = [
        whereClause.OR ? { OR: whereClause.OR } : whereClause,
        {
          OR: [
            { title: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } }
          ]
        }
      ];
      delete whereClause.OR;
    }

    // Get total count for pagination
    const totalDocuments = await client.document.count({
      where: whereClause
    });

    // Fetch documents with pagination
    const documents = await client.document.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        contentType: true,
        textContent: true,
        url: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        organizationId: true,
        ownerId: true,
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: limit
    });

    const totalPages = Math.ceil(totalDocuments / limit);

    const pagination = {
      currentPage: page,
      totalPages,
      totalDocuments,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      limit
    };

    return res.status(200).json(new ApiResponse(200, {
      documents,
      pagination
    }, "User documents retrieved successfully"));

  } catch (err) {
    console.error(err);
    next(new ApiError(500, "Failed to fetch user documents"));
  }
};

export const downloadDocumentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documentId = req.params.id;
    const userId = req.userId;

    const document = await client.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new ApiError(404, "Document not found");
    }

    // Check personal doc ownership
    if (document.type === "PERSONAL" && document.ownerId !== userId) {
      throw new ApiError(403, "You do not have access to this document");
    }

    // Return based on content type
    if (document.contentType === "FILE") {
      if (!document.fileKey) throw new ApiError(400, "File key missing for FILE document");
      const presignedUrl = await generatePresignedUrlForDownload(document.fileKey);
      return res.status(200).json(new ApiResponse(200, { url: presignedUrl, title: document.title }, "File download URL generated"));
    }

    if (document.contentType === "TEXT") {
      return res.status(200).json(new ApiResponse(200, { text: document.textContent, title: document.title }, "Text document retrieved"));
    }

    if (document.contentType === "URL") {
      return res.status(200).json(new ApiResponse(200, { url: document.url, title: document.title }, "URL document retrieved"));
    }

    throw new ApiError(400, "Invalid document content type");
  } catch (error) {
    next(error);
  }
};

export const downloadOrganizationDocument = async (req: Request, res: Response, next: NextFunction) => {
  const documentId = req.params.id;
  const userId = req.userId;

  try {
    const document = await client.document.findUnique({
      where: { id: documentId },
      include: { organization: true },
    });

    if (!document || !document.organizationId) {
      return next(new ApiError(404, "Document not found or invalid"));
    }

    // Check membership
    const isMember = await client.organizationMember.findFirst({
      where: {
        userId,
        organizationId: document.organizationId,
        status: "ACCEPTED",
      },
    });

    if (!isMember) {
      return next(new ApiError(403, "Access denied"));
    }

    // Return based on content type
    if (document.contentType === "FILE") {
      if (!document.fileKey) throw new ApiError(400, "File key missing for FILE document");
      const presignedUrl = await generatePresignedUrlForDownload(document.fileKey);
      return res.status(200).json(new ApiResponse(200, { url: presignedUrl, title: document.title }, "File download URL generated"));
    }

    if (document.contentType === "TEXT") {
      return res.status(200).json(new ApiResponse(200, { text: document.textContent, title: document.title }, "Text document retrieved"));
    }

    if (document.contentType === "URL") {
      return res.status(200).json(new ApiResponse(200, { url: document.url, title: document.title }, "URL document retrieved"));
    }

    throw new ApiError(400, "Invalid document content type");
  } catch (err) {
    console.error(err);
    next(new ApiError(500, "Failed to retrieve document"));
  }
};