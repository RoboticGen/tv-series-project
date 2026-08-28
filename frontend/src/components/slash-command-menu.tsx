import * as React from "react";
import type { LucideIcon } from "lucide-react";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Code2,
  Minus,
  Table2,
  Image as ImageIcon,
  Link2,
  Clapperboard,
} from "lucide-react";

export interface SlashCommand {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  icon: LucideIcon;
  isImage?: boolean;
  /** Markdown snippet to drop in, and where to land the cursor within it. */
  snippet: string;
  cursorOffset: number;
  /** If set, selects this many characters after cursorOffset (e.g. a placeholder to type/paste over). */
  selectionLength?: number;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: "h1",
    label: "Heading 1",
    description: "Big section heading",
    keywords: ["h1", "heading", "title"],
    icon: Heading1,
    snippet: "# ",
    cursorOffset: 2,
  },
  {
    id: "h2",
    label: "Heading 2",
    description: "Medium section heading",
    keywords: ["h2", "heading", "subtitle"],
    icon: Heading2,
    snippet: "## ",
    cursorOffset: 3,
  },
  {
    id: "h3",
    label: "Heading 3",
    description: "Small section heading",
    keywords: ["h3", "heading"],
    icon: Heading3,
    snippet: "### ",
    cursorOffset: 4,
  },
  {
    id: "bullet",
    label: "Bulleted list",
    description: "Simple unordered list",
    keywords: ["bullet", "list", "ul"],
    icon: List,
    snippet: "- ",
    cursorOffset: 2,
  },
  {
    id: "numbered",
    label: "Numbered list",
    description: "Ordered list with numbers",
    keywords: ["numbered", "ordered", "list", "ol"],
    icon: ListOrdered,
    snippet: "1. ",
    cursorOffset: 3,
  },
  {
    id: "todo",
    label: "To-do list",
    description: "Checklist with checkboxes",
    keywords: ["todo", "checklist", "task", "checkbox"],
    icon: ListTodo,
    snippet: "- [ ] ",
    cursorOffset: 6,
  },
  {
    id: "quote",
    label: "Quote",
    description: "Blockquote callout",
    keywords: ["quote", "blockquote"],
    icon: Quote,
    snippet: "> ",
    cursorOffset: 2,
  },
  {
    id: "code",
    label: "Code block",
    description: "Fenced code block",
    keywords: ["code", "codeblock", "snippet"],
    icon: Code2,
    snippet: "```\n\n```",
    cursorOffset: 4,
  },
  {
    id: "divider",
    label: "Divider",
    description: "Horizontal rule",
    keywords: ["divider", "hr", "rule", "separator"],
    icon: Minus,
    snippet: "---\n",
    cursorOffset: 4,
  },
  {
    id: "table",
    label: "Table",
    description: "2-column table",
    keywords: ["table", "grid"],
    icon: Table2,
    snippet: "| Column 1 | Column 2 |\n| --- | --- |\n|  |  |\n",
    cursorOffset: 26,
  },
  {
    id: "image",
    label: "Image",
    description: "Upload and embed an image",
    keywords: ["image", "picture", "photo", "upload"],
    icon: ImageIcon,
    isImage: true,
    snippet: "",
    cursorOffset: 0,
  },
  {
    id: "link",
    label: "Link",
    description: "Inline link",
    keywords: ["link", "url", "href"],
    icon: Link2,
    snippet: "[text](url)",
    cursorOffset: 1,
  },
  {
    id: "embed",
    label: "Embed",
    description: "YouTube, Vimeo, Loom, or Drive link",
    keywords: ["embed", "video", "youtube", "vimeo", "loom", "drive"],
    icon: Clapperboard,
    snippet: "```embed\npaste-link-here\n```\n",
    cursorOffset: 9,
    selectionLength: 15,
  },
];

interface SlashCommandMenuProps {
  items: SlashCommand[];
  selectedIndex: number;
  position: { top: number; left: number };
  onSelect: (command: SlashCommand) => void;
  onHover: (index: number) => void;
}

export function SlashCommandMenu({
  items,
  selectedIndex,
  position,
  onSelect,
  onHover,
}: SlashCommandMenuProps) {
  const listRef = React.useRef<HTMLUListElement>(null);

  React.useEffect(() => {
    const item = listRef.current?.children[selectedIndex];
    if (item instanceof HTMLElement) {
      item.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (items.length === 0) return null;

  return (
    <div
      className="fixed z-50 w-64 overflow-hidden rounded-lg border bg-popover py-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10"
      style={{ top: position.top, left: position.left }}
    >
      <ul ref={listRef} className="max-h-72 overflow-y-auto">
        {items.map((command, index) => (
          <li key={command.id}>
            <button
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                onSelect(command);
              }}
              onMouseEnter={() => onHover(index)}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm ${
                index === selectedIndex
                  ? "bg-brand-teal/10 text-brand-teal"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <command.icon className="size-4 shrink-0" />
              <span className="flex-1">
                <span className="block font-medium">{command.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {command.description}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
