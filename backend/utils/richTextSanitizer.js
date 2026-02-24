import sanitizeHtml from "sanitize-html";

const RICH_TEXT_ALLOWED_TAGS = [
  "h1",
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "code",
  "pre",
  "blockquote",
  "ul",
  "ol",
  "li",
  "a",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
];

const RICH_TEXT_ALLOWED_ATTRIBUTES = {
  a: ["href", "target", "rel"],
};

const RICH_TEXT_ALLOWED_SCHEMES = ["http", "https", "mailto"];

export const sanitizePlainText = (value, maxLength = 1000) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const cleaned = sanitizeHtml(raw, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
  if (!maxLength || maxLength <= 0) return cleaned;
  return cleaned.slice(0, maxLength).trim();
};

export const sanitizeRichTextHtml = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  return sanitizeHtml(raw, {
    allowedTags: RICH_TEXT_ALLOWED_TAGS,
    allowedAttributes: RICH_TEXT_ALLOWED_ATTRIBUTES,
    allowedSchemes: RICH_TEXT_ALLOWED_SCHEMES,
    disallowedTagsMode: "discard",
    transformTags: {
      a: (tagName, attribs) => {
        if (!attribs.href) {
          return { tagName: "a", attribs: {} };
        }
        return {
          tagName,
          attribs: {
            href: attribs.href,
            target: "_blank",
            rel: "noopener noreferrer nofollow",
          },
        };
      },
    },
  }).trim();
};

export const richTextHtmlToPlainText = (value) =>
  sanitizeHtml(String(value ?? ""), {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\s+/g, " ")
    .trim();
