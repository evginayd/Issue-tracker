/*
  Warnings:

  - A unique constraint covering the columns `[codeSnippetId]` on the table `issue` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "issue" ADD COLUMN     "codeSnippetId" TEXT;

-- CreateTable
CREATE TABLE "CodeSnippet" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issueId" TEXT,

    CONSTRAINT "CodeSnippet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CodeSnippet_issueId_key" ON "CodeSnippet"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "issue_codeSnippetId_key" ON "issue"("codeSnippetId");

-- AddForeignKey
ALTER TABLE "issue" ADD CONSTRAINT "issue_codeSnippetId_fkey" FOREIGN KEY ("codeSnippetId") REFERENCES "CodeSnippet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeSnippet" ADD CONSTRAINT "CodeSnippet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeSnippet" ADD CONSTRAINT "CodeSnippet_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
