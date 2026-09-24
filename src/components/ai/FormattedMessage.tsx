"use client";

import React from "react";
import { Sparkles, Lightbulb, ArrowRight, Play, Plus, Wallet, Clock, CheckCircle2 } from "lucide-react";
import { FioActionDispatcher, FioActionButton } from "@/lib/fio-action-dispatcher";

interface FormattedMessageProps {
  content: string;
  isUser?: boolean;
}

/**
 * Render Markdown content dengan visual cards, highlighted metric chips (uang & %),
 * callout blocks, dan in-chat actionable buttons.
 */
export function FormattedMessage({ content, isUser }: FormattedMessageProps) {
  if (isUser) {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  // Deteksi direct action buttons yang relevan
  const actionButtons = FioActionDispatcher.detectActions(content);

  // Split content by paragraphs / double newlines
  const paragraphs = content.split(/\n\n+/);

  return (
    <div className="space-y-3 leading-relaxed">
      {paragraphs.map((para, pIdx) => {
        const trimmedPara = para.trim();

        // 1. Deteksi Callout Card: "Saran Fio:", "Tips:", "Catatan:", "Rekomendasi:"
        const isCallout =
          trimmedPara.toLowerCase().startsWith("saran fio:") ||
          trimmedPara.toLowerCase().startsWith("tips:") ||
          trimmedPara.toLowerCase().startsWith("catatan:") ||
          trimmedPara.toLowerCase().startsWith("rekomendasi:");

        if (isCallout) {
          const colonIdx = trimmedPara.indexOf(":");
          const title = trimmedPara.substring(0, colonIdx + 1);
          const body = trimmedPara.substring(colonIdx + 1).trim();

          return (
            <div
              key={pIdx}
              className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-[#7C5CFA]/10 via-[#B69CFF]/10 to-[#7FE3C0]/10 border border-[#7C5CFA]/30 space-y-1.5 shadow-2xs my-1"
            >
              <div className="flex items-center gap-1.5 text-[#7C5CFA] dark:text-[#B69CFF] font-extrabold text-[11px] uppercase tracking-wider">
                <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                <span>{title}</span>
              </div>
              <div className="text-xs text-foreground/90 pl-5">
                {renderInlineMarkdown(body)}
              </div>
            </div>
          );
        }

        const lines = para.split("\n");

        return (
          <div key={pIdx} className="space-y-1.5">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();

              // Bullet points (* or - or •)
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

      {/* Direct In-Chat Action Buttons (Prioritas 7) */}
      {actionButtons.length > 0 && (
        <div className="pt-2 flex flex-wrap gap-2 border-t border-border/50 mt-2">
          {actionButtons.map((btn, idx) => (
            <button
              key={idx}
              onClick={() => FioActionDispatcher.execute(btn.action, btn.param)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#7C5CFA] to-[#6A4BE8] text-white font-bold text-[11px] shadow-xs hover:shadow-soft hover:scale-[1.02] active:scale-95 transition-all"
            >
              {btn.icon === "timer" && <Clock className="w-3.5 h-3.5" />}
              {btn.icon === "wallet" && <Wallet className="w-3.5 h-3.5" />}
              {btn.icon === "plus" && <Plus className="w-3.5 h-3.5" />}
              <span>{btn.label}</span>
              <ArrowRight className="w-3 h-3 opacity-80" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Parses inline formatting: **bold**, *italic*, `code`, nominal Rp, dan persentase %
 */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  // Regex splitting by bold (**text**), italic (*text*), code (`code`), currency (Rp 50.000), percentage (50%)
  const parts = text.split(
    /(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`|-?Rp\s?[\d.,]+|\b\d+%\b)/g
  );

  return parts.map((part, index) => {
    // 1. Bold text
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={index} className="font-bold text-foreground">
          {boldText}
        </strong>
      );
    }

    // 2. Italic text
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      const italicText = part.slice(1, -1);
      return (
        <em key={index} className="italic text-foreground/90">
          {italicText}
        </em>
      );
    }

    // 3. Inline code
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

    // 4. Highlight Currency: Rp 750.000 / -Rp 3.256.000
    if (/^-?Rp\s?[\d.,]+$/i.test(part)) {
      const isDeficit = part.startsWith("-");
      return (
        <span
          key={index}
          className={`inline-flex items-center px-1.5 py-0.5 rounded-md font-bold text-[11px] tracking-tight mx-0.5 ${
            isDeficit
              ? "bg-[#FFE8EA] dark:bg-[#3D1E22] text-[#D93D4A] dark:text-[#FFA8B0]"
              : "bg-[#7FE3C0]/15 dark:bg-[#7FE3C0]/25 text-[#136C52] dark:text-[#7FE3C0]"
          }`}
        >
          {part}
        </span>
      );
    }

    // 5. Highlight Percentage: 50%, 30%
    if (/^\b\d+%\b$/.test(part)) {
      return (
        <span
          key={index}
          className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#7C5CFA]/15 dark:bg-[#7C5CFA]/25 text-[#7C5CFA] dark:text-[#B69CFF] font-bold text-[11px] mx-0.5"
        >
          {part}
        </span>
      );
    }

    return part;
  });
}
