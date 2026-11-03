import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';

interface FilmFinderRequestBody {
  language?: 'en' | 'ta' | 'both';
  type?: 'movie' | 'tv' | 'sitcom';
  genres?: number[];
  minRuntime?: number | null;
  maxRuntime?: number | null;
  minEpisodes?: number | null;
  maxEpisodes?: number | null;
  yearFrom?: number;
  yearTo?: number;
  mood?: string | null;
}

interface RawTMDBItem {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  overview?: string;
}

interface TMDBDiscoverResponse {
  page: number;
  results: RawTMDBItem[];
  total_pages: number;
  total_results: number;
}

interface DetailedItem {
  runtime?: number;
  number_of_seasons?: number;
  episode_run_time?: number[];
  genres?: { id: number; name: string }[];
}

export async function POST(request: NextRequest) {
  try {
    let body: FilmFinderRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ results: [], totalCandidates: 0, aiNote: 'Invalid request body' });
    }

    const {
      language = 'both',
      type = 'movie',
      genres = [],
      minRuntime,
      maxRuntime,
      minEpisodes,
      maxEpisodes,
      yearFrom = 1980,
      yearTo = 2026,
      mood,
    } = body;

    const actualMediaType: 'movie' | 'tv' = type === 'sitcom' || type === 'tv' ? 'tv' : 'movie';

    // Build discover params
    const effectiveGenres = [...genres];
    if (type === 'sitcom' && !effectiveGenres.includes(35)) {
      effectiveGenres.push(35);
    }

    const baseParams: Record<string, string> = {
      language: 'en-US',
      'vote_count.gte': '20',
      sort_by: 'vote_average.desc',
      include_adult: 'false',
    };

    if (effectiveGenres.length > 0) {
      baseParams['with_genres'] = effectiveGenres.join(',');
    }

    if (language === 'en') {
      baseParams['with_original_language'] = 'en';
    } else if (language === 'ta') {
      baseParams['with_original_language'] = 'ta';
    }

    if (actualMediaType === 'movie') {
      if (yearFrom) baseParams['primary_release_date.gte'] = `${yearFrom}-01-01`;
      if (yearTo) baseParams['primary_release_date.lte'] = `${yearTo}-12-31`;
      if (minRuntime && Number(minRuntime) > 0) baseParams['with_runtime.gte'] = String(minRuntime);
      if (maxRuntime && Number(maxRuntime) > 0) baseParams['with_runtime.lte'] = String(maxRuntime);
    } else {
      if (yearFrom) baseParams['first_air_date.gte'] = `${yearFrom}-01-01`;
      if (yearTo) baseParams['first_air_date.lte'] = `${yearTo}-12-31`;
      if (minEpisodes && Number(minEpisodes) > 0) baseParams['with_episode_run_time.gte'] = String(minEpisodes);
      if (maxEpisodes && Number(maxEpisodes) > 0) baseParams['with_episode_run_time.lte'] = String(maxEpisodes);
    }

    // Step 1: Query TMDB page 1
    let results: RawTMDBItem[] = [];
    try {
      const page1 = await tmdbFetch<TMDBDiscoverResponse>(`/discover/${actualMediaType}`, {
        ...baseParams,
        page: '1',
      });
      results = (page1.results || []).filter((r) => Boolean(r.poster_path));

      // Step 2: If < 10, fetch page 2 and merge
      if (results.length < 10 && page1.total_pages > 1) {
        const page2 = await tmdbFetch<TMDBDiscoverResponse>(`/discover/${actualMediaType}`, {
          ...baseParams,
          page: '2',
        });
        const additional = (page2.results || []).filter((r) => Boolean(r.poster_path));
        results = [...results, ...additional];
      }
    } catch (err) {
      console.error('TMDB Discover error:', err);
    }

    // If still 0 results (e.g. strict AND genres or high vote count), fallback to OR genres
    if (results.length === 0 && effectiveGenres.length > 1) {
      try {
        const fallbackDiscover = await tmdbFetch<TMDBDiscoverResponse>(`/discover/${actualMediaType}`, {
          ...baseParams,
          with_genres: effectiveGenres.join('|'),
          'vote_count.gte': '10',
          page: '1',
        });
        results = (fallbackDiscover.results || []).filter((r) => Boolean(r.poster_path));
      } catch {}
    }

    // Slice to top 25 candidates
    const candidatePool = results.slice(0, 25);
    const candidateMap = new Map<number, RawTMDBItem>();
    candidatePool.forEach((item) => candidateMap.set(item.id, item));

    const totalCandidates = candidatePool.length;

    // Helper: Map TMDB item to full result
    const formatFullResult = async (item: RawTMDBItem, matchScore = 100, reason = 'Matches your criteria') => {
      let formattedRuntime: string | null = null;
      let genresList: { id: number; name: string }[] = [];

      try {
        const details = await tmdbFetch<DetailedItem>(`/${actualMediaType}/${item.id}`, { language: 'en-US' });
        genresList = details.genres || [];

        if (actualMediaType === 'movie' && details.runtime) {
          const hours = Math.floor(details.runtime / 60);
          const mins = details.runtime % 60;
          formattedRuntime = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
        } else if (actualMediaType === 'tv') {
          const seasons = details.number_of_seasons || 1;
          const epRuntime = details.episode_run_time?.[0] ? `${details.episode_run_time[0]}m/ep` : null;
          formattedRuntime = epRuntime
            ? `${seasons} ${seasons === 1 ? 'Season' : 'Seasons'} • ${epRuntime}`
            : `${seasons} ${seasons === 1 ? 'Season' : 'Seasons'}`;
        }
      } catch {
        // Fallback without details
      }

      const dateStr = item.release_date || item.first_air_date || '';
      return {
        id: item.id,
        media_type: actualMediaType,
        title: item.title || item.name || 'Untitled',
        year: dateStr ? dateStr.substring(0, 4) : '',
        poster_path: item.poster_path || '',
        vote_average: Number((item.vote_average || 0).toFixed(1)),
        genres: genresList,
        matchScore,
        reason,
        runtime: formattedRuntime,
        overview: item.overview || '',
      };
    };

    // If candidatePool is empty
    if (candidatePool.length === 0) {
      return NextResponse.json({
        results: [],
        totalCandidates: 0,
        aiNote: 'No titles match your criteria. Try broadening your filters.',
      });
    }

    // Check if AI_API_KEY is configured
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      // Fallback: Return top 10 from candidatePool sorted by rating
      const top10 = candidatePool.slice(0, 10);
      const formatted = await Promise.all(
        top10.map((item, idx) =>
          formatFullResult(
            item,
            Math.max(75, 100 - idx * 2),
            `Top rated ${item.title || item.name} matching your selected filters.`
          )
        )
      );
      return NextResponse.json({
        results: formatted,
        totalCandidates,
        aiNote: 'Matched using TMDB critically acclaimed ratings for your selected criteria.',
      });
    }

    // Step 4: Call LLM to rank and explain
    const titlesData = candidatePool.map((c) => ({
      tmdb_id: c.id,
      title: c.title || c.name || 'Untitled',
      year: (c.release_date || c.first_air_date || '').slice(0, 4),
      rating: c.vote_average,
      vote_count: c.vote_count,
      overview: c.overview?.slice(0, 200) || '',
    }));

    const systemPrompt = `You are a movie/series recommendation expert. The user wants recommendations matching specific criteria.
You are given a list of real titles from a movie database with their actual data.
Your job is to select the 10 best matches from this list and rank them.
Rules:
(1) ONLY select titles from the provided list — never invent titles or tmdb_ids.
(2) Use the actual ratings, genres, and year from the data — do not make up scores.
(3) For each pick, write one concise sentence explaining WHY it matches the user's criteria.
(4) If fewer than 10 titles match well, return fewer — do not pad with bad matches.
(5) Return ONLY valid JSON in this exact structure:
{
  "picks": [
    { "tmdb_id": 12345, "title": "Movie Name", "match_score": 95, "reason": "One concise sentence explaining why this fits." }
  ],
  "ai_note": "A 1-2 sentence overall note on how well these titles match the criteria."
}`;

    const userPrompt = `User criteria:
- Media Type: ${type}
- Language: ${language}
- Year Range: ${yearFrom} to ${yearTo}
- Min Runtime: ${minRuntime || 'any'} min, Max Runtime: ${maxRuntime || 'any'} min
- Mood/Vibe: ${mood || 'Not specified'}

Available titles from database:
${JSON.stringify(titlesData, null, 2)}

Select and rank the top 10 matches. Return only JSON.`;

    let llmText: string | null = null;

    try {
      if (apiKey.startsWith('AIza')) {
        // Google Gemini
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
              },
            ],
          }),
          signal: AbortSignal.timeout(14000),
        });

        if (res.ok) {
          const data = await res.json();
          llmText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
        }
      } else {
        // OpenAI
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            max_tokens: 1000,
          }),
          signal: AbortSignal.timeout(14000),
        });

        if (res.ok) {
          const data = await res.json();
          llmText = data?.choices?.[0]?.message?.content?.trim() || null;
        }
      }
    } catch (e) {
      console.error('LLM API call failed:', e);
    }

    // Step 5: Parse and verify LLM output
    let parsedPicks: Array<{ tmdb_id: number; match_score?: number; reason?: string }> = [];
    let aiNote = 'Here are the top picks tailored to your criteria.';

    if (llmText) {
      try {
        let cleanJson = llmText;
        if (cleanJson.includes('```')) {
          cleanJson = cleanJson.replace(/```(?:json)?([\s\S]*?)```/g, '$1').trim();
        }
        const parsed = JSON.parse(cleanJson);
        const rawPicks = Array.isArray(parsed) ? parsed : parsed.picks || parsed.results || [];
        if (parsed.ai_note) aiNote = parsed.ai_note;

        parsedPicks = rawPicks
          .filter((p: any) => p && (p.tmdb_id || p.id) && candidateMap.has(Number(p.tmdb_id || p.id)))
          .map((p: any) => ({
            tmdb_id: Number(p.tmdb_id || p.id),
            match_score: typeof p.match_score === 'number' ? Math.min(100, Math.max(1, p.match_score)) : 90,
            reason: p.reason || 'Strong match for your criteria',
          }));
      } catch (err) {
        console.error('Failed to parse LLM response JSON:', err);
      }
    }

    // If LLM returned no valid picks, fallback to top candidatePool
    if (parsedPicks.length === 0) {
      const top10 = candidatePool.slice(0, 10);
      const formatted = await Promise.all(
        top10.map((item, idx) =>
          formatFullResult(
            item,
            Math.max(75, 100 - idx * 2),
            `Matches your criteria with an average rating of ${item.vote_average.toFixed(1)}/10.`
          )
        )
      );
      return NextResponse.json({
        results: formatted,
        totalCandidates,
        aiNote: 'Selected based on your specified criteria and audience ratings.',
      });
    }

    // Step 6: Fetch details and format results
    const finalResults = await Promise.all(
      parsedPicks.slice(0, 10).map((pick) => {
        const item = candidateMap.get(pick.tmdb_id)!;
        return formatFullResult(item, pick.match_score, pick.reason);
      })
    );

    return NextResponse.json({
      results: finalResults,
      totalCandidates,
      aiNote,
    });
  } catch (error) {
    console.error('Error in /api/film-finder:', error);
    return NextResponse.json({
      results: [],
      totalCandidates: 0,
      aiNote: 'Unable to complete search at this time.',
    });
  }
}
