'use client';

import { useState } from 'react';

type FaqAccordionProps = {
  items: Array<{ question: string; answer: string }>;
  className?: string;
};

export default function FaqAccordion({ items, className }: FaqAccordionProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (items.length === 0) return null;

  return (
    <div className={className}>
      <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {items.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={`${item.question}-${idx}`}>
              <button
                type="button"
                onClick={() => setOpenIdx((prev) => (prev === idx ? null : idx))}
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-slate-50"
                aria-expanded={isOpen}
              >
                <span className="text-sm font-semibold text-slate-800 leading-snug">{item.question}</span>
                <span
                  className="shrink-0 text-slate-400 transition-transform duration-300"
                  style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
                >
                  <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden>
                    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                  </svg>
                </span>
              </button>
              {/* CSS grid trick for smooth height animation — no JS layout thrashing */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateRows: isOpen ? '1fr' : '0fr',
                  transition: 'grid-template-rows 0.32s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <div className="overflow-hidden">
                  <p className="px-4 pb-4 pt-1 text-sm leading-relaxed text-slate-600">{item.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
