'use client';

import { motion } from 'framer-motion';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="flex flex-col items-center max-w-2xl"
      >
        <h1
          className="font-bold text-[#f4f4f5] tracking-tight mb-4"
          style={{
            fontFamily: 'var(--font-display), serif',
            fontSize: '64px',
            lineHeight: 1.1,
          }}
        >
          Cinema Paradiso
        </h1>
        <p
          className="text-[#a1a1aa] font-medium"
          style={{
            fontFamily: 'var(--font-inter), sans-serif',
            fontSize: '20px',
          }}
        >
          Your cinematic discovery shelf
        </p>
      </motion.div>
    </div>
  );
}
