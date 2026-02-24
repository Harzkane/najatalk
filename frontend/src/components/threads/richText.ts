"use client";

import { marked } from "marked";
import TurndownService from "turndown";

const ALLOWED_TAGS = new Set([
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
  "h4",
  "h5",
  "h6",
  "a",
  "h2",
  "h3",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel"]),
};

const SAFE_PROTOCOLS = ["http:", "https:", "mailto:"];
const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

export const sanitizeRichHtml = (value: string) => {
  if (!value?.trim()) return "";
  if (typeof window === "undefined") return value;

  const parser = new DOMParser();
  const doc = parser.parseFromString(value, "text/html");

  const cleanNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) return;
    if (node.nodeType !== Node.ELEMENT_NODE) {
      node.parentNode?.removeChild(node);
      return;
    }

    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tagName)) {
      const parent = el.parentNode;
      if (!parent) return;
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el);
      }
      parent.removeChild(el);
      return;
    }

    const allowedAttrs = ALLOWED_ATTRS[tagName] || new Set<string>();
    for (const attr of [...el.attributes]) {
      if (!allowedAttrs.has(attr.name)) {
        el.removeAttribute(attr.name);
      }
    }

    if (tagName === "a") {
      const href = el.getAttribute("href") || "";
      try {
        const parsed = new URL(href, window.location.origin);
        if (!SAFE_PROTOCOLS.includes(parsed.protocol)) {
          el.removeAttribute("href");
        }
      } catch {
        el.removeAttribute("href");
      }
      if (el.getAttribute("href")) {
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer nofollow");
      }
    }
  };

  const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_ALL);
  const nodes: Node[] = [];
  let current = walker.nextNode();
  while (current) {
    nodes.push(current);
    current = walker.nextNode();
  }
  nodes.forEach(cleanNode);

  return doc.body.innerHTML.trim();
};

export const richHtmlToPlainText = (value: string) =>
  value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|blockquote|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const normalizeContentForRender = (value: string) => {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  const looksLikeHtml = /<[^>]+>/.test(trimmed);
  if (looksLikeHtml) {
    return sanitizeRichHtml(trimmed);
  }
  return sanitizeRichHtml(
    `<p>${escapeHtml(trimmed).replace(/\n/g, "<br />")}</p>`,
  );
};

export const markdownToSanitizedHtml = (value: string) => {
  const markdown = String(value || "").trim();
  if (!markdown) return "";

  const referenceLinks = new Map<string, string>();
  const normalizedMarkdown = markdown
    // Repair bold-wrapped escaped headings: "**\### Title**" -> "### Title"
    .replace(
      /^\s*\*\*\\(#{1,6})\s+(.+?)\*\*\s*$/gm,
      (_full, hashes, title) => `${hashes} ${String(title).trim()}`,
    )
    // Repair bold-wrapped headings: "**### Title**" -> "### Title"
    .replace(
      /^\s*\*\*(#{1,6})\s+(.+?)\*\*\s*$/gm,
      (_full, hashes, title) => `${hashes} ${String(title).trim()}`,
    )
    // Round-trip cleanup: "### **\### Title**" -> "### Title"
    .replace(
      /^(#{1,6})\s+\*\*\\#{1,6}\s+(.+?)\*\*\s*$/gm,
      (_full, hashes, title) => `${hashes} ${String(title).trim()}`,
    )
    // Accept bullet-dot lines as markdown list items.
    .replace(/^\s*•\s+/gm, "- ")
    // Accept escaped reference syntax from markdown round-trips.
    .replace(/\\\[/g, "[")
    .replace(/\\\]/g, "]")
    // If wrapped as "([label][1])", unwrap to reference-link form.
    .replace(/\(\[([^\]]+)\]\[([^\]]+)\]\)/g, "[$1][$2]")
    .replace(/^(#{1,6})([^\s#])/gm, "$1 $2")
    .replace(/^\s*\[([^\]]+)\]:\s*(https?:\/\/\S+)\s*$/gim, (_, id, url) => {
      referenceLinks.set(String(id).trim(), String(url).trim());
      return "";
    })
    .replace(/\[([^\]]+)\]\[([^\]]+)\]/g, (full, label, id) => {
      const href = referenceLinks.get(String(id).trim());
      if (!href) return full;
      return `[${label}](${href})`;
    })
    .replace(/\[(\d+)\](?!\()/g, "");

  const parsed = marked.parse(normalizedMarkdown, {
    async: false,
    breaks: true,
    gfm: true,
  });
  const html = typeof parsed === "string" ? parsed : "";
  return sanitizeRichHtml(html);
};

export const htmlToMarkdown = (value: string) => {
  const normalizedHtml = normalizeContentForRender(value);
  if (!normalizedHtml) return "";
  try {
    return turndownService
      .turndown(normalizedHtml)
      .replace(/^\s*•\s+/gm, "- ")
      .replace(
        /^\s*\*\*\\(#{1,6})\s+(.+?)\*\*\s*$/gm,
        (_full, hashes, title) => `${hashes} ${String(title).trim()}`,
      )
      .replace(
        /^\s*\*\*(#{1,6})\s+(.+?)\*\*\s*$/gm,
        (_full, hashes, title) => `${hashes} ${String(title).trim()}`,
      )
      .replace(
        /^(#{1,6})\s+\*\*\\#{1,6}\s+(.+?)\*\*\s*$/gm,
        (_full, hashes, title) => `${hashes} ${String(title).trim()}`,
      )
      .trim();
  } catch {
    return richHtmlToPlainText(normalizedHtml);
  }
};
