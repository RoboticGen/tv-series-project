"use client";

import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";

export function MarkdownViewer({ body }: { body: string }) {
  return (
    <div data-color-mode="light" className="dark:scheme-dark">
      <MDEditor.Markdown source={body} className="bg-transparent!" />
    </div>
  );
}
