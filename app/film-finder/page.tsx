'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import FilmFinderForm, { FilmFinderFormData } from '@/components/FilmFinderForm';
import FilmFinderResults, { FilmFinderResultItem } from '@/components/FilmFinderResults';

interface FilmFinderResponse {
  results: FilmFinderResultItem[];
  totalCandidates: number;
  aiNote: string | null;
}

export default function FilmFinderPage() {
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
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            <FilmFinderForm onSubmit={handleFormSubmit} isLoading={isLoading} />
          </motion.div>
        ) : (
          <motion.div
            key="finder-results"
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 25 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            <FilmFinderResults
              results={results || []}
              isLoading={isLoading}
              aiNote={aiNote}
              onReset={handleReset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}

