"use client";

import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import { markdownEmbedComponents } from "@/features/editor/components/markdown-embed-components";
import { useTheme } from "@wrksz/themes/client";

export function MarkdownViewer({ body }: { body: string }) {
  const { resolvedTheme } = useTheme();
  return (
    <div data-color-mode={resolvedTheme ?? "light"} className="dark:scheme-dark">
      <MDEditor.Markdown
        source={body}
        className="bg-transparent!"
        components={markdownEmbedComponents}
      />
    </div>
  );
}
