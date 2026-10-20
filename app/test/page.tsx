'use client';

import { useEffect, useState } from 'react';

interface MovieItem {
  id: number;
  title: string;
  year: string;
  poster_path: string;
  vote_average: number;
  vote_count: number;
}

export default function TestPage() {
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/trending')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data: MovieItem[]) => {
        setMovies(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div
      id="test-page-container"
      style={{
        backgroundColor: '#07070b',
        minHeight: '100vh',
        padding: '2rem',
        color: '#ffffff',
      }}
    >
      <h1
        id="test-heading"
        style={{
          color: '#ffffff',
          marginBottom: '1.5rem',
          fontSize: '1.75rem',
          fontWeight: 600,
        }}
      >
        Trending Movies Checkpoint
      </h1>

      {loading && <p id="test-loading" style={{ color: '#9ca3af' }}>Loading trending movies...</p>}
      {error && <p id="test-error" style={{ color: '#ef4444' }}>Error: {error}</p>}

      <div
        id="test-movies-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {movies.map((movie) => (
          <div
            key={movie.id}
            id={`movie-card-${movie.id}`}
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            <img
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
              alt={movie.title}
              style={{
                width: '100%',
                aspectRatio: '2/3',
                objectFit: 'cover',
                borderRadius: '8px',
                backgroundColor: '#181824',
              }}
            />
            <p
              style={{
                color: '#ffffff',
                marginTop: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: 500,
                lineHeight: '1.3',
              }}
            >
              {movie.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
