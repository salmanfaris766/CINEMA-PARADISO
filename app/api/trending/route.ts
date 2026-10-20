import { NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import { TMDBMovie, TMDBPaginatedResponse } from '@/lib/types';

export interface TrendingMovieItem {
  id: number;
  title: string;
  year: string;
  poster_path: string;
  vote_average: number;
  vote_count: number;
}

// Verified fallback movies matching exact TMDB poster paths if TMDB_API_KEY is not yet populated
const FALLBACK_TRENDING: TrendingMovieItem[] = [
  {
    id: 157336,
    title: "Interstellar",
    year: "2014",
    poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    vote_average: 8.4,
    vote_count: 36000,
  },
  {
    id: 27205,
    title: "Inception",
    year: "2010",
    poster_path: "/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg",
    vote_average: 8.4,
    vote_count: 37000,
  },
  {
    id: 155,
    title: "The Dark Knight",
    year: "2008",
    poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    vote_average: 8.5,
    vote_count: 33000,
  },
  {
    id: 872585,
    title: "Oppenheimer",
    year: "2023",
    poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    vote_average: 8.1,
    vote_count: 9500,
  },
  {
    id: 693134,
    title: "Dune: Part Two",
    year: "2024",
    poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    vote_average: 8.2,
    vote_count: 6200,
  },
  {
    id: 533535,
    title: "Deadpool & Wolverine",
    year: "2024",
    poster_path: "/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    vote_average: 7.7,
    vote_count: 5800,
  },
  {
    id: 1022789,
    title: "Inside Out 2",
    year: "2024",
    poster_path: "/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg",
    vote_average: 7.6,
    vote_count: 5100,
  },
  {
    id: 519182,
    title: "Despicable Me 4",
    year: "2024",
    poster_path: "/wWba3TaojhK7NdycRhoQpsG0FaH.jpg",
    vote_average: 7.1,
    vote_count: 2400,
  },
  {
    id: 917496,
    title: "Beetlejuice Beetlejuice",
    year: "2024",
    poster_path: "/kKgQzkUCnQmeTPkyIwHly2t6ZFI.jpg",
    vote_average: 7.1,
    vote_count: 2100,
  },
  {
    id: 945961,
    title: "Alien: Romulus",
    year: "2024",
    poster_path: "/2uSWRTtCG336nuBiG8jOTEUKSy8.jpg",
    vote_average: 7.2,
    vote_count: 2700,
  },
  {
    id: 299536,
    title: "Avengers: Infinity War",
    year: "2018",
    poster_path: "/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg",
    vote_average: 8.3,
    vote_count: 29000,
  },
  {
    id: 299534,
    title: "Avengers: Endgame",
    year: "2019",
    poster_path: "/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
    vote_average: 8.3,
    vote_count: 25000,
  },
  {
    id: 238,
    title: "The Godfather",
    year: "1972",
    poster_path: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    vote_average: 8.7,
    vote_count: 20000,
  },
  {
    id: 424,
    title: "Schindler's List",
    year: "1993",
    poster_path: "/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg",
    vote_average: 8.6,
    vote_count: 16000,
  },
  {
    id: 129,
    title: "Spirited Away",
    year: "2001",
    poster_path: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
    vote_average: 8.5,
    vote_count: 16500,
  },
  {
    id: 496243,
    title: "Parasite",
    year: "2019",
    poster_path: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    vote_average: 8.5,
    vote_count: 18000,
  },
  {
    id: 569094,
    title: "Spider-Man: Across the Spider-Verse",
    year: "2023",
    poster_path: "/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
    vote_average: 8.4,
    vote_count: 6700,
  },
  {
    id: 324857,
    title: "Spider-Man: Into the Spider-Verse",
    year: "2018",
    poster_path: "/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg",
    vote_average: 8.4,
    vote_count: 15500,
  },
  {
    id: 497,
    title: "The Green Mile",
    year: "1999",
    poster_path: "/8VG8fDNiy50H4FedGwdSVUPoaJe.jpg",
    vote_average: 8.5,
    vote_count: 17500,
  },
  {
    id: 11216,
    title: "Cinema Paradiso",
    year: "1988",
    poster_path: "/zoVeIgKzGJzpdG6Gwnr7iOYfIMU.jpg",
    vote_average: 8.5,
    vote_count: 4300,
  },
];

export async function GET() {
  try {
    if (!process.env.TMDB_API_KEY && !process.env.TMDB_READ_ACCESS_TOKEN) {
      return NextResponse.json(FALLBACK_TRENDING);
    }

    const data = await tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>(
      '/trending/movie/week',
      { language: 'en-US' }
    );

    const mapped = (data.results || [])
      .filter((movie): movie is TMDBMovie & { poster_path: string } => Boolean(movie.poster_path))
      .slice(0, 20)
      .map((movie) => ({
        id: movie.id,
        title: movie.title,
        year: movie.release_date ? movie.release_date.substring(0, 4) : '',
        poster_path: movie.poster_path,
        vote_average: movie.vote_average,
        vote_count: movie.vote_count,
      }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error in /api/trending route:', error);
    return NextResponse.json(FALLBACK_TRENDING);
  }
}
