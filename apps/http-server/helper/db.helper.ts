import client from "db/client";
import ApiError from "utils/ApiError";

const verifyOrgandUser = async(organizationId:string,userId:string)=>{
    const organization = await client.organization.findUnique({
      where: { id: organizationId },
      select: { adminId: true }
    });

    if (!organization || organization.adminId !== userId) {
      return (new ApiError(403, "Only organization admins can upload organization documents"));
    }
}
