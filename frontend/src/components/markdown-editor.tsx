"use client";

import * as React from "react";
import {
  MDXEditor,
  type MDXEditorMethods,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  markdownShortcutPlugin,
  diffSourcePlugin,
  toolbarPlugin,
  UndoRedo,
  Separator,
  BoldItalicUnderlineToggles,
  CodeToggle,
  BlockTypeSelect,
  ListsToggle,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  InsertCodeBlock,
  DiffSourceToggleWrapper,
  ButtonWithTooltip,
  insertCodeBlock$,
  usePublisher,
  useCodeBlockEditorContext,
  type CodeBlockEditorDescriptor,
  type CodeBlockEditorProps,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { Clapperboard } from "lucide-react";
import { parseEmbedUrl } from "@/lib/embeds";
import { EmbedBlock, EmbedFallback } from "@/components/embed-block";
import "./markdown-editor.css";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  // Called for each image the user adds; returns the URL the editor shows
  // (a local blob: preview -- see usePendingImages). Omit to disable images.
  onImageAdd?: (file: File) => string;
  placeholder?: string;
}

// Renders/edits a ```embed fenced block as a URL field + live iframe
// preview instead of raw code. Same fenced-code format read by
// markdown-embed-components.tsx, so content stays compatible either way
// it's viewed or edited.
function EmbedCodeEditor({ code }: CodeBlockEditorProps) {
  const { setCode } = useCodeBlockEditorContext();
  const [draft, setDraft] = React.useState(code);
  const embed = React.useMemo(() => parseEmbedUrl(draft.trim()), [draft]);

  return (
    <div
      className="my-2 rounded-lg border bg-muted/40 p-3"
      onKeyDown={(event) => event.stopPropagation()}
    >
      <label className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Clapperboard className="size-3.5" />
        Embed link — YouTube, Vimeo, Loom, or Google Drive
      </label>
      <input
        type="text"
        value={draft}
        placeholder="https://..."
        className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-teal/40"
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          setCode(next);
        }}
      />
      {draft.trim() ? (
        embed ? (
          <EmbedBlock embed={embed} />
        ) : (
          <EmbedFallback url={draft.trim()} />
        )
      ) : null}
    </div>
  );
}

const embedCodeBlockDescriptor: CodeBlockEditorDescriptor = {
  priority: 10,
  match: (language) => language === "embed",
  Editor: EmbedCodeEditor,
};

function InsertEmbedButton() {
  const insertCodeBlock = usePublisher(insertCodeBlock$);
  return (
    <ButtonWithTooltip
      title="Insert embed (YouTube, Vimeo, Loom, Drive)"
      onClick={() =>
        insertCodeBlock({ code: "https://", language: "embed", meta: "" })
      }
    >
      <Clapperboard className="size-4" />
    </ButtonWithTooltip>
  );
}

const CODE_BLOCK_LANGUAGES: Record<string, string> = {
  text: "Plain text",
  js: "JavaScript",
  jsx: "JSX",
  ts: "TypeScript",
  tsx: "TSX",
  python: "Python",
  cpp: "C++",
  c: "C",
  arduino: "Arduino / C++",
  json: "JSON",
  bash: "Shell",
  yaml: "YAML",
  css: "CSS",
  html: "HTML",
};

export function MarkdownEditor({
  value,
  onChange,
  onImageAdd,
  placeholder,
}: MarkdownEditorProps) {
  const canUploadImages = onImageAdd !== undefined;
  const editorRef = React.useRef<MDXEditorMethods>(null);

  const handleImageUpload = React.useCallback(
    async (file: File) => {
      try {
        return onImageAdd!(file);
      } catch (err) {
        window.alert(err instanceof Error ? err.message : "Couldn't add that image");
        throw err;
      }
    },
    [onImageAdd],
  );

  return (
    <div className="markdown-editor-shell overflow-hidden rounded-lg border">
      <MDXEditor
        ref={editorRef}
        markdown={value}
        onChange={onChange}
        placeholder={placeholder}
        contentEditableClassName="markdown-editor-content"
        plugins={[
          toolbarPlugin({
            toolbarContents: () => (
              <DiffSourceToggleWrapper>
                <UndoRedo />
                <Separator />
                <BoldItalicUnderlineToggles />
                <CodeToggle />
                <Separator />
                <BlockTypeSelect />
                <Separator />
                <ListsToggle />
                <Separator />
                <CreateLink />
                {canUploadImages ? <InsertImage /> : null}
                <Separator />
                <InsertTable />
                <InsertThematicBreak />
                <InsertCodeBlock />
                <InsertEmbedButton />
              </DiffSourceToggleWrapper>
            ),
          }),
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          imagePlugin({
            imageUploadHandler: canUploadImages ? handleImageUpload : undefined,
          }),
          tablePlugin(),
          codeBlockPlugin({
            defaultCodeBlockLanguage: "text",
            codeBlockEditorDescriptors: [embedCodeBlockDescriptor],
          }),
          codeMirrorPlugin({ codeBlockLanguages: CODE_BLOCK_LANGUAGES }),
          markdownShortcutPlugin(),
          diffSourcePlugin({ viewMode: "rich-text" }),
        ]}
      />
      <div className="border-t px-3 py-2 text-xs text-muted-foreground">
        {canUploadImages
          ? "Type ** for bold, ## for a heading, or use the toolbar. Drag, paste, or use the image button to add pictures — they upload when you save."
          : "Markdown supported."}
      </div>
    </div>
  );
}
