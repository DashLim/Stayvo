'use client';

import type { ReactNode } from 'react';
import type { PropertyFormSectionId } from '@/lib/property-form-sections';

type CollapsibleFormSectionProps = {
  id: PropertyFormSectionId;
  title: string;
  description?: ReactNode;
  open: boolean;
  onToggle: (id: PropertyFormSectionId) => void;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export default function CollapsibleFormSection({
  id,
  title,
  description,
  open,
  onToggle,
  children,
  className = '',
  titleClassName = 'text-base font-semibold text-slate-900 dark:text-slate-100',
  descriptionClassName = 'mt-1 text-sm text-slate-600 dark:text-slate-400',
}: CollapsibleFormSectionProps) {
  const panelId = `property-section-panel-${id}`;
  const headerId = `property-section-header-${id}`;

  return (
    <section id={`section-${id}`} className={className} aria-labelledby={headerId}>
      <button
        type="button"
        id={headerId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onToggle(id)}
        className="flex w-full items-start justify-between gap-3 rounded-xl text-left transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <div className="min-w-0 flex-1">
          <h2 className={titleClassName}>{title}</h2>
          {description ? <div className={descriptionClassName}>{description}</div> : null}
        </div>
        <span
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-white/60 text-slate-500 transition-transform duration-200 dark:border-white/15 dark:bg-white/10 dark:text-slate-400 ${
            open ? 'rotate-180' : 'rotate-0'
          }`}
          aria-hidden
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        hidden={!open}
        className={open ? 'mt-4' : undefined}
      >
        {open ? children : null}
      </div>
    </section>
  );
}
