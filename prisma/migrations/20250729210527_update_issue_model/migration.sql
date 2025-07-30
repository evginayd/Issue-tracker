/*
  Warnings:

  - Made the column `priority` on table `issue` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."issue" ADD COLUMN     "originalCode" TEXT,
ALTER COLUMN "priority" SET NOT NULL,
ALTER COLUMN "projectId" DROP DEFAULT;
