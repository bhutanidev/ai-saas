-- CreateEnum
CREATE TYPE "public"."InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- DropIndex
DROP INDEX "public"."OrganizationMember_userId_organizationId_key";

-- AlterTable
ALTER TABLE "public"."OrganizationMember" ADD COLUMN     "invitedById" TEXT,
ADD COLUMN     "status" "public"."InviteStatus" NOT NULL DEFAULT 'PENDING';
