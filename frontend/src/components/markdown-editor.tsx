"use client";

import * as React from "react";
import MDEditor, { type RefMDEditor } from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import { uploadMediaAsset } from "@/actions/media";
import { cn } from "@/lib/utils";
import { getCaretCoordinates } from "@/lib/caret-position";
import {
  SLASH_COMMANDS,
  SlashCommandMenu,
  type SlashCommand,
} from "@/components/slash-command-menu";
import { markdownEmbedComponents } from "@/components/markdown-embed-components";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  ownerType: "project" | "submission";
  ownerId: string | null;
  placeholder?: string;
}

interface SlashMenuState {
  triggerIndex: number;
  query: string;
  position: { top: number; left: number };
}

function getSlashContext(value: string, cursor: number) {
  let start = cursor;
  while (start > 0 && !/\s/.test(value[start - 1])) start--;
  const word = value.slice(start, cursor);
  if (word.startsWith("/")) {
    return { triggerIndex: start, query: word.slice(1) };
  }
  return null;
}

function matchesQuery(command: SlashCommand, query: string) {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    command.label.toLowerCase().includes(q) ||
    command.keywords.some((k) => k.includes(q))
  );
}

export function MarkdownEditor({
  value,
  onChange,
  ownerType,
  ownerId,
  placeholder,
}: MarkdownEditorProps) {
  const canUploadImages = ownerId !== null;
  const [colorMode, setColorMode] = React.useState<"light" | "dark">("light");
  const [mode, setMode] = React.useState<"edit" | "preview">("edit");
  const [slashMenu, setSlashMenu] = React.useState<SlashMenuState | null>(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const editorRef = React.useRef<RefMDEditor>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const valueRef = React.useRef(value);
  React.useEffect(() => {
    valueRef.current = value;
  }, [value]);

  React.useEffect(() => {
    const isDark =
      document.documentElement.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    // One-time read of the browser's current theme to sync the editor's
    // data-color-mode -- there's no toggle/store to subscribe to.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setColorMode(isDark ? "dark" : "light");
  }, []);

  const filteredCommands = React.useMemo(() => {
    if (!slashMenu) return [];
    return SLASH_COMMANDS.filter(
      (c) => (!c.isImage || canUploadImages) && matchesQuery(c, slashMenu.query),
    );
  }, [slashMenu, canUploadImages]);

  async function handleUploadImage(file: File) {
    if (!ownerId) return;
    const formData = new FormData();
    formData.set("file", file);
    formData.set("ownerType", ownerType);
    formData.set("ownerId", ownerId);
    const { url } = await uploadMediaAsset(formData);
    onChange(`${valueRef.current}\n\n![${file.name}](${url})\n`);
  }

  function closeSlashMenu() {
    setSlashMenu(null);
    setSelectedIndex(0);
  }

  function updateSlashContext(textarea: HTMLTextAreaElement) {
    const cursor = textarea.selectionStart;
    const context = getSlashContext(textarea.value, cursor);
    if (!context) {
      closeSlashMenu();
      return;
    }
    const caret = getCaretCoordinates(textarea, cursor);
    const rect = textarea.getBoundingClientRect();
    setSlashMenu({
      triggerIndex: context.triggerIndex,
      query: context.query,
      position: {
        top: rect.top + caret.top + caret.height - textarea.scrollTop + 6,
        left: Math.min(
          rect.left + caret.left - textarea.scrollLeft,
          window.innerWidth - 272,
        ),
      },
    });
    setSelectedIndex(0);
  }

  function applyCommand(command: SlashCommand) {
    const textarea = editorRef.current?.textarea;
    if (!textarea || !slashMenu) return;

    const cursor = textarea.selectionStart;
    const before = valueRef.current.slice(0, slashMenu.triggerIndex);
    const after = valueRef.current.slice(cursor);
    const nextValue = before + command.snippet + after;
    onChange(nextValue);
    closeSlashMenu();

    const nextCursor = slashMenu.triggerIndex + command.cursorOffset;
    const selectionEnd = nextCursor + (command.selectionLength ?? 0);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextCursor, selectionEnd);
    });

    if (command.isImage) {
      fileInputRef.current?.click();
    }
  }

  return (
    <div data-color-mode={colorMode} className="rounded-lg border">
      <div className="flex items-center gap-1 border-b bg-muted/40 p-1.5">
        <button
          type="button"
          onClick={() => {
            setMode("edit");
            closeSlashMenu();
          }}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            mode === "edit"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("preview");
            closeSlashMenu();
          }}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            mode === "preview"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Preview
        </button>
      </div>
      <MDEditor
        ref={editorRef}
        value={value}
        onChange={(v) => onChange(v ?? "")}
        height={640}
        preview={mode}
        hideToolbar={mode === "preview"}
        visibleDragbar={false}
        previewOptions={{ components: markdownEmbedComponents }}
        className={cn(
          "[&_.w-md-editor-toolbar_svg]:size-4.5",
          "[&_.w-md-editor-toolbar_li>button]:h-8",
          "[&_.w-md-editor-toolbar_li>button]:px-2",
          "[&_.w-md-editor-text]:text-base",
          "[&_.w-md-editor-text-input]:text-base",
        )}
        textareaProps={{
          placeholder,
          onKeyUp: (event) => {
            if (["ArrowUp", "ArrowDown", "Enter", "Escape", "Tab"].includes(event.key)) {
              return;
            }
            updateSlashContext(event.currentTarget);
          },
          onKeyDown: (event) => {
            if (!slashMenu) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setSelectedIndex((i) => (i + 1) % Math.max(filteredCommands.length, 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setSelectedIndex(
                (i) => (i - 1 + filteredCommands.length) % Math.max(filteredCommands.length, 1),
              );
            } else if (event.key === "Enter" || event.key === "Tab") {
              if (filteredCommands[selectedIndex]) {
                event.preventDefault();
                applyCommand(filteredCommands[selectedIndex]);
              }
            } else if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              closeSlashMenu();
            }
          },
          onClick: (event) => updateSlashContext(event.currentTarget),
          onBlur: () => {
            // Let a menu-item mousedown fire first before the menu unmounts.
            setTimeout(closeSlashMenu, 150);
          },
        }}
        onPaste={
          canUploadImages
            ? (event) => {
                const file = Array.from(event.clipboardData?.files ?? [])[0];
                if (file?.type.startsWith("image/")) {
                  event.preventDefault();
                  void handleUploadImage(file);
                }
              }
            : undefined
        }
        onDrop={
          canUploadImages
            ? (event) => {
                const file = Array.from(event.dataTransfer?.files ?? [])[0];
                if (file?.type.startsWith("image/")) {
                  event.preventDefault();
                  void handleUploadImage(file);
                }
              }
            : undefined
        }
      />
      {slashMenu ? (
        <SlashCommandMenu
          items={filteredCommands}
          selectedIndex={selectedIndex}
          position={slashMenu.position}
          onSelect={applyCommand}
          onHover={setSelectedIndex}
        />
      ) : null}
      <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
        <span>
          {canUploadImages
            ? "Markdown supported. Type / for commands, or drag & drop / paste an image."
            : "Markdown supported. Save once to enable image uploads."}
        </span>
        {canUploadImages ? (
          <label className="cursor-pointer text-primary hover:underline">
            Upload image
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleUploadImage(file);
                event.target.value = "";
              }}
            />
          </label>
        ) : null}
      </div>
    </div>
  );
}
