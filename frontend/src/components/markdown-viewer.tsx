"use client";

import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import { markdownEmbedComponents } from "@/components/markdown-embed-components";
import { useTheme } from "@/components/theme-toggle";

export function MarkdownViewer({ body }: { body: string }) {
  const { theme } = useTheme();
  return (
    <div data-color-mode={theme} className="dark:scheme-dark">
      <MDEditor.Markdown
        source={body}
        className="bg-transparent!"
        components={markdownEmbedComponents}
      />
    </div>
  );
}
