'use client';

import { motion } from 'framer-motion';
import { PropsWithChildren } from 'react';

export function AnimatedSection({ children }: PropsWithChildren) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {children}
    </motion.section>
  );
}
