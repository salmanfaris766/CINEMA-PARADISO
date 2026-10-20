export interface OmdbRatings {
  imdbRating: string | null;
  imdbVotes: string | null;
  rottenTomatoes: string | null;
  metacritic: string | null;
}

export async function getOmdbRatings(imdbId?: string | null): Promise<OmdbRatings> {
  const emptyResult: OmdbRatings = {
    imdbRating: null,
    imdbVotes: null,
    rottenTomatoes: null,
    metacritic: null,
  };

  if (!imdbId || !imdbId.trim()) {
    return emptyResult;
  }

  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) {
    console.warn('OMDB_API_KEY is not defined in environment variables');
    return emptyResult;
  }

  try {
    const url = `https://www.omdbapi.com/?i=${encodeURIComponent(imdbId.trim())}&apikey=${apiKey}`;
    const res = await fetch(url, {
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return emptyResult;
    }

    const data = await res.json();
    if (!data || data.Response === 'False') {
      return emptyResult;
    }

    const imdbRating = data.imdbRating && data.imdbRating !== 'N/A' ? data.imdbRating : null;
    const imdbVotes = data.imdbVotes && data.imdbVotes !== 'N/A' ? data.imdbVotes : null;

    let rottenTomatoes: string | null = null;
    if (Array.isArray(data.Ratings)) {
      const rt = data.Ratings.find(
        (r: { Source: string; Value: string }) => r.Source === 'Rotten Tomatoes'
      );
      if (rt && rt.Value && rt.Value !== 'N/A') {
        rottenTomatoes = rt.Value;
      }
    }

    const metacritic = data.Metascore && data.Metascore !== 'N/A' ? data.Metascore : null;

    return {
      imdbRating,
      imdbVotes,
      rottenTomatoes,
      metacritic,
    };
  } catch (err) {
    console.error('Failed to fetch from OMDb:', err);
    return emptyResult;
  }
}
