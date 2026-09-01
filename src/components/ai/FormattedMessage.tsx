"use client";

import React from "react";

interface FormattedMessageProps {
  content: string;
  isUser?: boolean;
}

/**
 * Render Markdown content (bold, italics, lists, paragraphs) cleanly without raw asterisks
 */
export function FormattedMessage({ content, isUser }: FormattedMessageProps) {
  if (isUser) {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  // Split content by paragraphs / double newlines
  const paragraphs = content.split(/\n\n+/);

  return (
    <div className="space-y-2 leading-relaxed">
      {paragraphs.map((para, pIdx) => {
        const lines = para.split("\n");

        return (
          <div key={pIdx} className="space-y-1">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();

              // Bullet points (* or -)
              if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
                const bulletText = trimmed.replace(/^(\*|\-|•)\s+/, "");
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7C5CFA] dark:bg-[#7FE3C0] mt-1.5 shrink-0" />
                    <span className="flex-1">{renderInlineMarkdown(bulletText)}</span>
                  </div>
                );
              }

              // Numbered lists (1. , 2. )
              const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
              if (numMatch) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-1">
                    <span className="font-bold text-[#7C5CFA] dark:text-[#7FE3C0] text-[11px] shrink-0">
                      {numMatch[1]}.
                    </span>
                    <span className="flex-1">{renderInlineMarkdown(numMatch[2])}</span>
                  </div>
                );
              }

              // Regular text line
              return (
                <p key={lIdx} className={lIdx > 0 ? "pt-0.5" : ""}>
                  {renderInlineMarkdown(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Parses inline formatting: **bold**, *italic*, `code`
 */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  // Regex splitting by bold (**text**), italic (*text*), or inline code (`code`)
  const parts = text.split(/(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      const boldText = part.slice(2, -2);
      return (
        <strong
          key={index}
          className="font-bold text-foreground"
        >
          {boldText}
        </strong>
      );
    }

    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      const italicText = part.slice(1, -1);
      return (
        <em key={index} className="italic text-foreground/90">
          {italicText}
        </em>
      );
    }

    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      const codeText = part.slice(1, -1);
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded-md bg-black/10 dark:bg-white/10 font-mono text-[11px]"
        >
          {codeText}
        </code>
      );
    }

    return part;
  });
}
