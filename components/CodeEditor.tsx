"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import hljs from "highlight.js";
import "highlight.js/styles/github.css"; // Use github style for light theme
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

interface CodeEditorProps {
  code: string;
  session: { user: { id: string } } | null;
  projectId: string;
  issueId: string;
  readOnly?: boolean;
}

// Dynamically import Monaco Editor to avoid SSR issues
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const CodeEditor = ({
  code: defaultCode,
  session,
  projectId,
  issueId,
  readOnly = false,
}: CodeEditorProps) => {
  const router = useRouter();
  const [code, setCode] = useState(defaultCode.trim());
  const [language] = useState("javascript"); // Fixed for simplicity, can add Select later

  useEffect(() => {
    if (!readOnly) {
      if (!projectId) {
        toast.error("No project selected. Redirecting to home...");
        router.push("/home");
        return;
      }
      if (!session || !session.user?.id) {
        toast.error("Please sign in to access code editor");
        router.push("/home");
        return;
      }
      if (!issueId) {
        toast.error("No issue selected. Redirecting to issue creation...");
        router.push(`/issues/new?projectId=${projectId}`);
        return;
      }
    }
  }, [projectId, session, router, issueId, readOnly]);

  const handleOnChange = (value?: string) => {
    if (!readOnly) {
      console.log("Code changed:", value);
      setCode(value || "");
    }
  };

  const handleSave = async () => {
    if (readOnly) return;
    if (!code.trim()) {
      toast.error("Code cannot be empty");
      return;
    }
    if (!session?.user?.id) {
      toast.error("User not authenticated");
      return;
    }
    if (!issueId) {
      toast.error("No issue selected");
      return;
    }

    console.log("handleSave: session =", session);
    console.log("handleSave: userId =", session.user.id);
    console.log("handleSave: projectId =", projectId);
    console.log("handleSave: issueId =", issueId);
    console.log("handleSave: code =", code);
    console.log("handleSave: language =", language);

    try {
      const response = await fetch("/api/code-snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: code,
          language,
          userId: session.user.id,
          projectId,
          issueId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log("handleSave: error response =", errorData);
        throw new Error(errorData.error || "Failed to save code snippet");
      }

      const { id: codeSnippetId } = await response.json();
      toast.success("Code snippet saved! Returning to issue creation...");

      const markdownCode = `\`\`\`${language}\n${code}\n\`\`\``;
      sessionStorage.setItem("codeSnippet", markdownCode);
      sessionStorage.setItem("codeSnippetId", codeSnippetId);

      router.push(`/issues?projectId=${projectId}`);
    } catch (error) {
      console.error("Error saving code snippet:", error);
      toast.error(`Failed to save code snippet: ${error}`);
    }
  };

  if (!readOnly && !projectId) {
    return (
      <div className="text-center text-red-500">
        No project selected. Redirecting to home...
      </div>
    );
  }
  if (!readOnly && (!session || !session.user?.id)) {
    return (
      <div className="text-center text-red-500">
        Please sign in to access code editor.
      </div>
    );
  }
  if (!readOnly && !issueId) {
    return (
      <div className="text-center text-red-500">
        No issue selected. Redirecting to issue creation...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto mt-12 p-6 rounded-2xl shadow-md border border-gray-200">
      <div>
        <h2 className="text-lg font-semibold mb-2">
          {readOnly ? "Code Snippet" : "Edit Code"}
        </h2>
        <Editor
          height="400px"
          width="100%"
          defaultLanguage={language}
          value={code}
          theme="vs-dark"
          options={{
            fontSize: 16,
            minimap: { enabled: false },
            contextmenu: false,
            scrollBeyondLastLine: false,
            readOnly,
          }}
          onChange={handleOnChange}
        />
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Preview</h2>
        <pre className="border p-4 rounded-md bg-gray-50 dark:bg-gray-800">
          <code
            className={`language-${language}`}
            dangerouslySetInnerHTML={{
              __html: hljs.highlight(code, { language }).value,
            }}
          />
        </pre>
      </div>
      {!readOnly && (
        <div className="col-span-2 flex gap-2 mt-4">
          <Button onClick={handleSave}>Save Snippet</Button>
          <Button
            variant="secondary"
            onClick={() => router.push(`/issues/new?projectId=${projectId}`)}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
