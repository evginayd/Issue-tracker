/*
  Warnings:

  - You are about to drop the `CodeSnippet` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."CodeSnippet" DROP CONSTRAINT "CodeSnippet_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CodeSnippet" DROP CONSTRAINT "CodeSnippet_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."issue" DROP CONSTRAINT "issue_codeSnippetId_fkey";

-- AlterTable
ALTER TABLE "public"."issue" ALTER COLUMN "labels" SET DEFAULT ARRAY[]::TEXT[];

-- DropTable
DROP TABLE "public"."CodeSnippet";

-- CreateTable
CREATE TABLE "public"."code_snippet" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issueId" TEXT,

    CONSTRAINT "code_snippet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "code_snippet_issueId_key" ON "public"."code_snippet"("issueId");

-- AddForeignKey
ALTER TABLE "public"."issue" ADD CONSTRAINT "issue_codeSnippetId_fkey" FOREIGN KEY ("codeSnippetId") REFERENCES "public"."code_snippet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."code_snippet" ADD CONSTRAINT "code_snippet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."code_snippet" ADD CONSTRAINT "code_snippet_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
