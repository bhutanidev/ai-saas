import { type NextFunction, type Request, type Response } from "express"
import client from "db/client";
import ApiError from "utils/ApiError";
import ApiResponse from "utils/ApiResponse";

export const createOrganization = async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.body)

  try {
    const { name } = req.body;
    const userId = req.userId;

    if (!name || name.trim() === "") {
      return next(new ApiError(400, "Organization name is required"));
    }

    const organization = await client.organization.create({
      data: {
        name,
        adminId: userId,
        members: {
          create: {
            userId: userId,
            role: "ADMIN",
            status: "ACCEPTED"
          }
        }
      },
      include: { members: true }
    });

    return res.status(201).json(new ApiResponse(201, organization, "Organization created"));
  } catch (err) {
    next(new ApiError(500, "Failed to create organization"));
  }
};

export const addMember = async (req: Request, res: Response, next: NextFunction) => {
//   try {
    console.log(req.body)
    console.log(req.body?.organizationId)
    const userId = req.userId;
    const { organizationId, memberEmail } = req.body;

    if (!organizationId || !memberEmail) {
      return next(new ApiError(400, "Organization ID and Member Email are required"));
    }

    const org = await client.organization.findUnique({
      where: { id: organizationId },
      include: { members: true }
    });
    

    if (!org) return next(new ApiError(404, "Organization not found"));

    const isAdmin = org.adminId === userId;
    if (!isAdmin) return next(new ApiError(403, "Only admins can add members"));

    // ✅ Find user by email
    const memberUser = await client.user.findUnique({
      where: { email: memberEmail }
    });

    if (!memberUser) {
      return next(new ApiError(404, "User with the given email not found"));
    }

    const newMember = await client.organizationMember.create({
      data: {
        organizationId,
        userId: memberUser.id,
        role: "MEMBER",
        status: "ACCEPTED"
      }
    });

    return res.status(201).json(new ApiResponse(201, newMember, "Member added"));
//   } catch (err) {
//     next(new ApiError(500, "Failed to add member"));
//   }
};


export const removeMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId, memberId } = req.body;
    const userId = req.userId;

    if (!organizationId || !memberId) {
      return next(new ApiError(400, "Organization ID and User ID are required"));
    }

    const org = await client.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) return next(new ApiError(404, "Organization not found"));

    const isAdmin = org.adminId === userId;
    if (!isAdmin) return next(new ApiError(403, "Only admins can remove members"));

    await client.organizationMember.deleteMany({
      where: {
        organizationId,
        userId:memberId
      }
    });

    return res.status(200).json(new ApiResponse(200, null, "Member removed"));
  } catch (err) {
    next(new ApiError(500, "Failed to remove member"));
  }
};

export const leaveOrganization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.body;
    const userId = req.userId;

    if (!organizationId) {
      return next(new ApiError(400, "Organization ID is required"));
    }

    const org = await client.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      return next(new ApiError(404, "Organization not found"));
    }

    // If the user is the admin, delete the organization (cascade deletes members too)
    if (org.adminId === userId) {
      await client.organization.delete({
        where: { id: organizationId },
      });

      return res.status(200).json(
        new ApiResponse(200, null, "Organization deleted as admin left")
      );
    }

    // If the user is a member (not admin), just remove them from organization
    await client.organizationMember.deleteMany({
      where: { organizationId, userId },
    });

    return res.status(200).json(
      new ApiResponse(200, null, "Left organization")
    );
  } catch (err) {
    console.error("Error in leaveOrganization:", err);
    next(new ApiError(500, "Failed to leave organization"));
  }
};


export const deleteOrganization = async (req: Request, res: Response, next: NextFunction) => {
    const { organizationId } = req.body;
    const userId = req.userId;

    const org = await client.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) return next(new ApiError(404, "Organization not found"));

    if (org.adminId !== userId) {
      return next(new ApiError(403, "Only admin can delete organization"));
    }

    await client.organization.delete({
      where: { id: organizationId }
    });

    return res.status(200).json(new ApiResponse(200, null, "Organization deleted"));

};
