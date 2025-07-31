"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import "../app/globals.css";

interface CodeEditorProps {
  code: string;
  session: { user: { id: string } } | null;
  projectId: string;
  issueId: string;
  readOnly?: boolean;
}

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
  const [language] = useState("javascript");
  const editorRef = useRef<
    import("monaco-editor").editor.IStandaloneCodeEditor | null
  >(null);
  const decorationsRef = useRef<string[]>([]);
  const changedRangesRef = useRef<import("monaco-editor").Range[]>([]);

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

  const handleOnChange = (
    value: string | undefined,
    event: import("monaco-editor").editor.IModelContentChangedEvent
  ) => {
    if (!readOnly && value !== undefined && editorRef.current) {
      setCode(value);

      const changes = event.changes;
      const newDecorations: import("monaco-editor").editor.IModelDeltaDecoration[] =
        [];

      changes.forEach((change) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const range = new (window as any).monaco.Range(
          change.range.startLineNumber,
          change.range.startColumn,
          change.range.endLineNumber,
          change.range.endColumn + change.text.length
        );
        changedRangesRef.current.push(range);
        newDecorations.push({
          range,
          options: {
            inlineClassName: "my-highlight",
          },
        });
      });

      decorationsRef.current = editorRef.current.deltaDecorations(
        decorationsRef.current,
        newDecorations
      );
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

  const handleEditorDidMount = async (
    editor: import("monaco-editor").editor.IStandaloneCodeEditor
  ) => {
    editorRef.current = editor;

    const monaco = await import("monaco-editor");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).monaco = monaco; // Store for Range access
    monaco.editor.setTheme("vs-dark");

    const style = document.createElement("style");
    style.innerHTML = `
      .my-highlight {
        background-color: yellow !important;
      }
      pre.language-javascript code {
        color: #1f2937 !important;
      }
      pre.language-javascript {
        background-color: #f9fafb !important;
      }
      .dark pre.language-javascript {
        background-color: #1f2937 !important;
        color: #e5e7eb !important;
      }
    `;
    document.head.appendChild(style);
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

  const highlightedCode = hljs.highlight(code, { language }).value;

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
          onMount={handleEditorDidMount}
        />
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Preview</h2>
        <pre className="border p-4 rounded-md bg-gray-50 dark:bg-gray-800 max-h-[400px] overflow-y-auto">
          <code
            className={`language-${language}`}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </pre>
      </div>
      {!readOnly && (
        <div className="col-span-2 flex gap-2 mt-4">
          <Button onClick={handleSave}>Save Snippet</Button>
          <Button
            variant="secondary"
            onClick={() => router.push(`/issues/?projectId=${projectId}`)}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
