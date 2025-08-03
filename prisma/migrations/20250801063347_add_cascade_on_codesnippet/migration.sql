-- DropForeignKey
ALTER TABLE "public"."issue" DROP CONSTRAINT "issue_codeSnippetId_fkey";

-- AddForeignKey
ALTER TABLE "public"."issue" ADD CONSTRAINT "issue_codeSnippetId_fkey" FOREIGN KEY ("codeSnippetId") REFERENCES "public"."CodeSnippet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
