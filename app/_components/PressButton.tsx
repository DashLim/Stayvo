'use client';

import { motion } from 'framer-motion';
import type { ComponentProps } from 'react';

type Props = ComponentProps<'button'>;

/**
 * Drop-in replacement for <button> with Framer Motion press scale.
 * Use this for primary CTAs that need JS-driven animation beyond the global CSS baseline.
 */
export default function PressButton({ children, className = '', ...props }: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.1, ease: 'easeOut' }}
      className={className}
      {...(props as object)}
    >
      {children}
    </motion.button>
  );
}
