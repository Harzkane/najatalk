"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Code2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";
import {
  escapeHtml,
  htmlToMarkdown,
  markdownToSanitizedHtml,
} from "./richText";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeightClassName?: string;
  disabled?: boolean;
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write here...",
  minHeightClassName = "min-h-[120px]",
  disabled = false,
}: RichTextEditorProps) {
  const [inputMode, setInputMode] = useState<"visual" | "markdown">("visual");
  const [markdownValue, setMarkdownValue] = useState("");

  const toEditorContent = (raw: string) => {
    const trimmed = (raw || "").trim();
    if (!trimmed) return "<p></p>";
    if (/<[^>]+>/.test(trimmed)) return trimmed;
    return `<p>${escapeHtml(trimmed)}</p>`;
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({
        autolink: true,
        openOnClick: false,
        protocols: ["http", "https", "mailto"],
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: toEditorContent(value),
    editorProps: {
      attributes: {
        class: `${minHeightClassName} w-full rounded-lg border border-slate-300 p-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-600 [&_h2]:mt-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-2 [&_h3]:text-base [&_h3]:font-semibold [&_p]:my-1 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:text-slate-600 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-slate-900 [&_pre]:p-2 [&_pre]:text-slate-100 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_a]:text-blue-700 [&_a]:underline`,
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getHTML());
    },
    editable: !disabled,
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const nextContent = toEditorContent(value);
    if (current !== nextContent) {
      editor.commands.setContent(nextContent, false);
    }

    if (inputMode === "visual") {
      setMarkdownValue(htmlToMarkdown(nextContent));
      return;
    }

    if (!String(value || "").trim()) {
      setMarkdownValue("");
    }
  }, [value, editor, inputMode]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  const setEditorLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href || "";
    const url = window.prompt("Enter link URL:", previousUrl);
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const switchToMarkdown = () => {
    if (!editor) return;
    setMarkdownValue(htmlToMarkdown(editor.getHTML()));
    setInputMode("markdown");
  };

  const switchToVisual = () => {
    if (!editor) return;
    if (inputMode === "visual") return;
    const nextHtml = markdownToSanitizedHtml(markdownValue);
    const normalizedHtml = nextHtml || "<p></p>";
    editor.commands.setContent(normalizedHtml, false);
    onChange(normalizedHtml);
    setInputMode("visual");
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="inline-flex rounded-md border border-slate-300 bg-white p-0.5 text-xs">
          <button
            type="button"
            className={`rounded px-2 py-1 font-medium ${
              inputMode === "visual"
                ? "bg-green-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            onClick={switchToVisual}
            disabled={disabled}
          >
            Visual
          </button>
          <button
            type="button"
            className={`rounded px-2 py-1 font-medium ${
              inputMode === "markdown"
                ? "bg-green-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            onClick={switchToMarkdown}
            disabled={disabled}
          >
            Markdown
          </button>
        </div>
        <span className="text-[11px] text-slate-500">
          {"Supports markdown: `**bold**`, `- list`, `> quote`, `[link](url)`"}
        </span>
      </div>

      {inputMode === "visual" ? (
        <>
          <div className="mb-2 flex flex-wrap items-center gap-1">
            {[
              {
                label: "Bold",
                icon: Bold,
                onClick: () => editor?.chain().focus().toggleBold().run(),
                active: editor?.isActive("bold"),
              },
              {
                label: "Italic",
                icon: Italic,
                onClick: () => editor?.chain().focus().toggleItalic().run(),
                active: editor?.isActive("italic"),
              },
              {
                label: "Bullet List",
                icon: List,
                onClick: () => editor?.chain().focus().toggleBulletList().run(),
                active: editor?.isActive("bulletList"),
              },
              {
                label: "Ordered List",
                icon: ListOrdered,
                onClick: () => editor?.chain().focus().toggleOrderedList().run(),
                active: editor?.isActive("orderedList"),
              },
              {
                label: "Quote",
                icon: Quote,
                onClick: () => editor?.chain().focus().toggleBlockquote().run(),
                active: editor?.isActive("blockquote"),
              },
              {
                label: "Code Block",
                icon: Code2,
                onClick: () => editor?.chain().focus().toggleCodeBlock().run(),
                active: editor?.isActive("codeBlock"),
              },
              {
                label: "Link",
                icon: Link2,
                onClick: setEditorLink,
                active: editor?.isActive("link"),
              },
              {
                label: "Undo",
                icon: Undo2,
                onClick: () => editor?.chain().focus().undo().run(),
                active: false,
              },
              {
                label: "Redo",
                icon: Redo2,
                onClick: () => editor?.chain().focus().redo().run(),
                active: false,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded border text-slate-700 transition-colors ${
                    item.active
                      ? "border-green-500 bg-green-100 text-green-700"
                      : "border-slate-300 bg-white hover:bg-slate-100"
                  }`}
                  title={item.label}
                  disabled={disabled}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
          <EditorContent editor={editor} />
        </>
      ) : (
        <div>
          <textarea
            value={markdownValue}
            onChange={(event) => {
              const nextMarkdown = event.target.value;
              setMarkdownValue(nextMarkdown);
              onChange(markdownToSanitizedHtml(nextMarkdown));
            }}
            placeholder={placeholder}
            className={`${minHeightClassName} w-full rounded-lg border border-slate-300 p-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-600`}
            disabled={disabled}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={switchToVisual}
              className="rounded-md border border-green-600 bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400"
              disabled={disabled}
            >
              Parse Markdown
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
