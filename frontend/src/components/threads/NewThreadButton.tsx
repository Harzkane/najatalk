// frontend/src/components/threads/NewThreadButton.tsx
import { useEffect, useMemo, useState, type RefObject } from "react";
import { PenSquare, X } from "lucide-react";
import RichTextEditor from "./RichTextEditor";
import { escapeHtml, richHtmlToPlainText, sanitizeRichHtml } from "./richText";

interface NewThreadButtonProps {
  isLoggedIn: boolean;
  onSubmit: (
    title: string,
    body: string,
    category: string
  ) => Promise<{ _id?: string; title?: string } | void>;
  buttonRef?: RefObject<HTMLButtonElement | null>;
  initialOpen?: boolean;
  initialTitle?: string;
  initialBody?: string;
  initialCategory?: string;
}

const NewThreadButton = ({
  isLoggedIn,
  onSubmit,
  buttonRef,
  initialOpen = false,
  initialTitle = "",
  initialBody = "",
  initialCategory = "General",
}: NewThreadButtonProps) => {
  const toEditorContent = (raw: string) => {
    const trimmed = (raw || "").trim();
    if (!trimmed) return "<p></p>";
    if (/<[^>]+>/.test(trimmed)) return trimmed;
    return `<p>${escapeHtml(trimmed)}</p>`;
  };

  const [isExpanded, setIsExpanded] = useState(initialOpen);
  const [title, setTitle] = useState(initialTitle);
  const [bodyHtml, setBodyHtml] = useState(toEditorContent(initialBody));
  const [category, setCategory] = useState(initialCategory);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  const titleError = useMemo(() => {
    const value = title.trim();
    if (!value) return "Title is required.";
    if (value.length < 6) return "Title should be at least 6 characters.";
    if (value.length > 100) return "Title must be 100 characters or less.";
    return "";
  }, [title]);
  const bodyText = useMemo(() => richHtmlToPlainText(bodyHtml), [bodyHtml]);
  const bodyError = useMemo(() => {
    const value = bodyText;
    if (!value) return "Body is required.";
    if (value.length < 20) return "Body should be at least 20 characters.";
    if (value.length > 2000) return "Body must be 2000 characters or less.";
    return "";
  }, [bodyText]);
  const canSubmit = !titleError && !bodyError && !isSubmitting;

  useEffect(() => {
    if (!initialOpen) return;
    setIsExpanded(true);
    setTitle(initialTitle);
    setBodyHtml(toEditorContent(initialBody));
    setCategory(initialCategory);
  }, [initialOpen, initialTitle, initialBody, initialCategory]);

  useEffect(() => {
    if (!isExpanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        setIsExpanded(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isExpanded, isSubmitting]);

  if (!isLoggedIn) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTouched(true);
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const sanitizedHtml = sanitizeRichHtml(bodyHtml);
      await onSubmit(title, sanitizedHtml || bodyText, category);
      setTitle("");
      setBodyHtml("<p></p>");
      setCategory("General");
      setIsTouched(false);
      setIsExpanded(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleExpand = () => {
    if (isSubmitting) return;
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isExpanded ? (
        <button
          ref={buttonRef}
          onClick={toggleExpand}
          className="new-thread-button inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-green-700"
          aria-label="Create New Thread"
        >
          <PenSquare className="h-5 w-5" />
        </button>
      ) : (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-6">
          <div
            className="absolute inset-0"
            onClick={() => {
              if (!isSubmitting) setIsExpanded(false);
            }}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-green-800">Create New Thread</h3>
              <button
                onClick={toggleExpand}
                className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close Create New Thread form"
                disabled={isSubmitting}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-3 text-xs text-slate-500">
              Keep it clear and specific so people can jump in quickly.
            </p>
            <form onSubmit={handleSubmit} noValidate>
              <input
                type="text"
                placeholder="Thread Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full rounded-lg border p-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-600 ${
                  isTouched && titleError ? "border-red-300" : "border-slate-300"
                }`}
                maxLength={100}
                required
              />
              <div className="mb-2 mt-1 flex items-center justify-between text-[11px]">
                <span className={isTouched && titleError ? "text-red-600" : "text-slate-500"}>
                  {isTouched && titleError ? titleError : "6-100 characters"}
                </span>
                <span className="text-slate-500">{title.trim().length}/100</span>
              </div>
              <RichTextEditor
                value={bodyHtml}
                onChange={setBodyHtml}
                placeholder="Wetin dey your mind?"
                minHeightClassName="min-h-[120px]"
                disabled={isSubmitting}
              />
              <div className="mb-2 mt-1 flex items-center justify-between text-[11px]">
                <span className={isTouched && bodyError ? "text-red-600" : "text-slate-500"}>
                  {isTouched && bodyError ? bodyError : "20-2000 characters"}
                </span>
                <span className="text-slate-500">{bodyText.length}/2000</span>
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mb-3 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                <option value="General">General</option>
                <option value="Gist">Gist</option>
                <option value="Politics">Politics</option>
                <option value="Romance">Romance</option>
              </select>
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex w-full items-center justify-center rounded-lg bg-green-600 p-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400"
              >
                {isSubmitting ? "Posting..." : "Post am!"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewThreadButton;
