/*
  Warnings:

  - You are about to drop the column `fileUrl` on the `Document` table. All the data in the column will be lost.
  - Added the required column `fileKey` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Document" DROP COLUMN "fileUrl",
ADD COLUMN     "fileKey" TEXT NOT NULL;
