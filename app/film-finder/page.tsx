'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import FilmFinderForm, { FilmFinderFormData } from '@/components/FilmFinderForm';
import FilmFinderResults, { FilmFinderResultItem } from '@/components/FilmFinderResults';
import FilmFinderCD from '@/components/FilmFinderCD';
import { useCompareStore } from '@/store/compareStore';

interface FilmFinderResponse {
  results: FilmFinderResultItem[];
  totalCandidates: number;
  aiNote: string | null;
}

export default function FilmFinderPage() {
  const router = useRouter();
  const addItem = useCompareStore((state) => state.addItem);

  const [results, setResults] = useState<FilmFinderResultItem[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);

  const handleFormSubmit = async (formData: FilmFinderFormData) => {
    setIsLoading(true);
    setShowResults(true);

    try {
      const res = await fetch('/api/film-finder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        signal: AbortSignal.timeout(6000), // Hard 6s client safety timeout
      });

      if (!res.ok) {
        throw new Error(`Film finder request failed: ${res.status}`);
      }

      const data: FilmFinderResponse = await res.json();
      setResults(data.results || []);
      setAiNote(data.aiNote || null);
    } catch (err) {
      console.error('Film finder error:', err);
      setResults([]);
      setAiNote('Unable to generate recommendations right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setShowResults(false);
    setResults(null);
    setAiNote(null);
    setIsLoading(false);
  };

  return (
    <PageTransition className="w-full pb-20">
      <AnimatePresence mode="wait">
        {!showResults ? (
          <motion.div
            key="finder-form"
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <FilmFinderForm onSubmit={handleFormSubmit} isLoading={isLoading} />
          </motion.div>
        ) : isLoading ? (
          <motion.div
            key="finder-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <FilmFinderResults
              results={[]}
              isLoading={true}
              aiNote={null}
              onReset={handleReset}
            />
          </motion.div>
        ) : (
          <motion.div
            key="finder-results-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex flex-col"
          >
            {/* Top Toolbar: Edit Criteria Button */}
            <div className="w-full flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div>
                <h1
                  className="text-2xl md:text-3xl font-bold text-[#f4f4f5] tracking-tight"
                  style={{ fontFamily: 'var(--font-display), serif' }}
                >
                  Curated Platter
                </h1>
                <p className="text-xs text-[#a1a1aa] mt-0.5">
                  AI-ranked recommendations tailored to your taste
                </p>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 hover:border-[#f5a524]/60 text-xs font-semibold text-[#f4f4f5] hover:text-[#f5a524] transition-colors shadow-sm"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#f5a524]" />
                <span>Edit Criteria</span>
              </button>
            </div>

            {/* Rotating CD View (Viewport Height ~90vh) */}
            {results && results.length > 0 && (
              <section className="min-h-[85vh] flex flex-col items-center justify-center">
                <FilmFinderCD
                  results={results}
                  onAddToCompare={addItem}
                  onViewDetails={(id, type) => router.push(`/${type}/${id}`)}
                />
                <div className="mt-8 text-center">
                  <p className="text-xs tracking-wider uppercase text-[#71717a] animate-pulse">
                    ↓ Scroll for full list &amp; details
                  </p>
                </div>
              </section>
            )}

            {/* Full List Section Below CD */}
            <section className="mt-16">
              <FilmFinderResults
                results={results || []}
                isLoading={false}
                aiNote={aiNote}
                onReset={handleReset}
              />
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
