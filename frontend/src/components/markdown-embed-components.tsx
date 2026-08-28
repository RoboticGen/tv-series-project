import * as React from "react";
import type { Components } from "react-markdown";
import { parseEmbedUrl } from "@/lib/embeds";
import { EmbedBlock, EmbedFallback } from "@/components/embed-block";

// react-markdown (with syntax highlighting) can wrap code content in
// nested <span> elements per token, so `children` isn't always a plain
// string -- walk it to recover the raw text instead of `String(children)`
// (which stringifies a React element to "[object Object]").
function getPlainText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getPlainText).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return getPlainText(node.props.children);
  }
  return "";
}

// Passed as react-markdown `components` overrides (directly to
// MDEditor.Markdown, or via MDEditor's `previewOptions.components`) so a
// ```embed fenced code block renders as an actual iframe instead of a
// code block. See lib/embeds.ts for the provider allowlist/URL handling.
export const markdownEmbedComponents: Components = {
  code: ({ className, children, ...props }) => {
    const language = /language-(\w+)/.exec(className ?? "")?.[1];
    if (language === "embed") {
      const raw = getPlainText(children).replace(/\n$/, "").trim();
      const embed = parseEmbedUrl(raw);
      return embed ? <EmbedBlock embed={embed} /> : <EmbedFallback url={raw} />;
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => {
    const child = React.Children.toArray(children)[0];
    const childClassName =
      React.isValidElement<{ className?: string }>(child)
        ? child.props.className
        : undefined;
    if (childClassName?.includes("language-embed")) {
      return <>{children}</>;
    }
    return <pre {...props}>{children}</pre>;
  },
};
