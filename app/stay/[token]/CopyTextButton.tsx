'use client';

import { useState } from 'react';
import PressButton from '@/app/_components/PressButton';

type CopyTextButtonProps = {
  text: string;
  className?: string;
  idleLabel?: string;
  copiedLabel?: string;
};

export default function CopyTextButton({
  text,
  className,
  idleLabel,
  copiedLabel = 'Copied!',
}: CopyTextButtonProps) {
  const [copied, setCopied] = useState(false);

  const label = copied ? copiedLabel : (idleLabel ?? text);
  const classes = className ?? 'font-semibold text-slate-900 underline';

  return (
    <PressButton
      type="button"
      className={classes}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          setCopied(false);
        }
      }}
    >
      {label}
    </PressButton>
  );
}
