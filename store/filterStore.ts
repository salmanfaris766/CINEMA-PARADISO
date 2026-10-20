import { create } from 'zustand';

export interface FilterState {
  mediaType: 'movie' | 'tv';
  genres: number[];
  mode: 'and' | 'or';
  yearFrom: number;
  yearTo: number;
  minRating: number;
  language: 'en' | 'ta' | 'both';
  sortBy: string;
  page: number;

  toggleGenre: (id: number) => void;
  toggleMode: () => void;
  setYearRange: (from: number, to: number) => void;
  setMinRating: (value: number) => void;
  setLanguage: (value: 'en' | 'ta' | 'both') => void;
  setSort: (value: string) => void;
  setPage: (value: number) => void;
  setMediaType: (value: 'movie' | 'tv') => void;
  clearAll: () => void;
  syncFromUrl: (searchParams: URLSearchParams) => void;
  toQueryString: () => string;
}

const DEFAULT_STATE = {
  genres: [],
  mode: 'and' as const,
  yearFrom: 1990,
  yearTo: 2026,
  minRating: 0,
  language: 'both' as const,
  sortBy: 'popularity.desc',
  page: 1,
};

export const useFilterStore = create<FilterState>((set, get) => ({
  mediaType: 'movie',
  ...DEFAULT_STATE,

  toggleGenre: (id: number) =>
    set((state) => {
      const exists = state.genres.includes(id);
      const nextGenres = exists
        ? state.genres.filter((g) => g !== id)
        : [...state.genres, id];
      return { genres: nextGenres, page: 1 };
    }),

  toggleMode: () =>
    set((state) => ({
      mode: state.mode === 'and' ? 'or' : 'and',
      page: 1,
    })),

  setYearRange: (from: number, to: number) =>
    set({
      yearFrom: from,
      yearTo: to,
      page: 1,
    }),

  setMinRating: (value: number) =>
    set({
      minRating: value,
      page: 1,
    }),

  setLanguage: (value: 'en' | 'ta' | 'both') =>
    set({
      language: value,
      page: 1,
    }),

  setSort: (value: string) =>
    set({
      sortBy: value,
      page: 1,
    }),

  setPage: (value: number) =>
    set({
      page: value,
    }),

  setMediaType: (value: 'movie' | 'tv') =>
    set({
      mediaType: value,
      page: 1,
    }),

  clearAll: () =>
    set((state) => ({
      ...DEFAULT_STATE,
      mediaType: state.mediaType,
    })),

  syncFromUrl: (searchParams: URLSearchParams) => {
    const genresStr = searchParams.get('genres');
    const mode = (searchParams.get('mode') || 'and') as 'and' | 'or';
    const yearFrom = searchParams.get('year_from');
    const yearTo = searchParams.get('year_to');
    const minRating = searchParams.get('min_rating');
    const language = (searchParams.get('language') || 'both') as 'en' | 'ta' | 'both';
    const sortBy = searchParams.get('sort_by') || 'popularity.desc';
    const page = searchParams.get('page');

    let parsedGenres: number[] = [];
    if (genresStr) {
      const delimiter = genresStr.includes('|') ? '|' : ',';
      parsedGenres = genresStr
        .split(delimiter)
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && n > 0);
    }

    set({
      genres: parsedGenres,
      mode: mode === 'or' ? 'or' : 'and',
      yearFrom: yearFrom ? Number(yearFrom) : 1990,
      yearTo: yearTo ? Number(yearTo) : 2026,
      minRating: minRating ? Number(minRating) : 0,
      language: ['en', 'ta', 'both'].includes(language) ? language : 'both',
      sortBy,
      page: page ? Math.max(1, Number(page)) : 1,
    });
  },

  toQueryString: () => {
    const state = get();
    const params = new URLSearchParams();

    if (state.genres.length > 0) {
      const separator = state.mode === 'or' ? '|' : ',';
      params.set('genres', state.genres.join(separator));
      params.set('mode', state.mode);
    }

    if (state.yearFrom !== 1990) {
      params.set('year_from', String(state.yearFrom));
    }
    if (state.yearTo !== 2026) {
      params.set('year_to', String(state.yearTo));
    }

    if (state.minRating > 0) {
      params.set('min_rating', String(state.minRating));
    }

    if (state.language !== 'both') {
      params.set('language', state.language);
    }

    if (state.sortBy !== 'popularity.desc') {
      params.set('sort_by', state.sortBy);
    }

    if (state.page > 1) {
      params.set('page', String(state.page));
    }

    return params.toString();
  },
}));
