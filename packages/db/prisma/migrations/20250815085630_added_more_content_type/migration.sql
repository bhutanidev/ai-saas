-- CreateEnum
CREATE TYPE "public"."DocumentContentType" AS ENUM ('FILE', 'TEXT', 'URL');

-- AlterTable
ALTER TABLE "public"."Document" ADD COLUMN     "contentType" "public"."DocumentContentType" NOT NULL DEFAULT 'FILE',
ADD COLUMN     "textContent" TEXT,
ADD COLUMN     "url" TEXT,
ALTER COLUMN "fileKey" DROP NOT NULL;
