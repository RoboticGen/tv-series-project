import * as React from "react";
import type { Components } from "react-markdown";
import { parseEmbedUrl } from "@/features/editor/embeds";
import { EmbedBlock, EmbedFallback } from "@/features/editor/components/embed-block";

function getPlainText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getPlainText).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return getPlainText(node.props.children);
  }
  return "";
}

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
