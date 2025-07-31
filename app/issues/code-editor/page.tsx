import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import CodeEditor from "@/components/CodeEditor";

export default async function CodeEditorPage({
  searchParams,
}: {
  searchParams: { projectId?: string; issueId?: string };
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const issueId = searchParams.issueId;
  const projectId = searchParams?.projectId || "";

  console.log("CodeEditorPage: projectId =", projectId);
  console.log("CodeEditorPage: issueId =", issueId);
  console.log("CodeEditorPage: session =", session);

  if (!session) {
    return (
      <div className="text-center mt-10 text-red-500">
        Please sign in to access code editor.
      </div>
    );
  }

  if (!projectId || !issueId) {
    return (
      <div className="text-center mt-10 text-red-500">
        Project or issue not selected. Redirecting to home...
      </div>
    );
  }

  const codeSnippet = await prisma.codeSnippet.findFirst({
    where: { issueId },
    orderBy: { createdAt: "desc" }, // Get the most recent snippet
    select: { content: true },
  });

  const code = codeSnippet?.content || "// No code snippet available";

  return (
    <main>
      <CodeEditor
        code={code}
        session={session}
        projectId={projectId}
        issueId={issueId}
      />
    </main>
  );
}
