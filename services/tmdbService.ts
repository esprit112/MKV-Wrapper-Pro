
import { MediaMetadata, EpisodeInfo } from "../types";

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export const tmdbService = {
  search: async (query: string, apiKey: string): Promise<MediaMetadata[]> => {
    if (!apiKey) return [];
    try {
      const response = await fetch(
        `${BASE_URL}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US&page=1&include_adult=false`
      );
      const data = await response.json();
      return (data.results || []).map((result: any) => ({
        tmdbId: result.id,
        title: result.title || result.name,
        year: (result.release_date || result.first_air_date || '').split('-')[0],
        posterUrl: result.poster_path ? `${IMAGE_BASE_URL}${result.poster_path}` : `https://picsum.photos/seed/${result.id}/600/900`,
        overview: result.overview,
        type: result.media_type === 'tv' ? 'tv' : 'movie',
        seasonsCount: result.season_count
      }));
    } catch (error) {
      console.error("TMDB search error:", error);
      return [];
    }
  },

  fetchMetadata: async (query: string, apiKey: string): Promise<MediaMetadata> => {
    const results = await tmdbService.search(query, apiKey);
    if (results.length > 0) return results[0];
    
    return {
      title: query,
      year: new Date().getFullYear().toString(),
      posterUrl: `https://picsum.photos/seed/${query}/600/900`,
      overview: "No metadata found automatically. Please use manual search.",
      type: 'movie'
    };
  },

  fetchSeasonEpisodes: async (tvId: number, seasonNumber: number, apiKey: string): Promise<EpisodeInfo[]> => {
    if (!apiKey) return [];
    try {
      const response = await fetch(
        `${BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${apiKey}&language=en-US`
      );
      if (!response.ok) throw new Error('Failed to fetch season details');
      const data = await response.json();
      
      return data.episodes.map((ep: any) => ({
        id: ep.id,
        name: ep.name,
        episodeNumber: ep.episode_number,
        seasonNumber: ep.season_number,
        overview: ep.overview,
        airDate: ep.air_date,
        stillPath: ep.still_path ? `${IMAGE_BASE_URL}${ep.still_path}` : undefined
      }));
    } catch (error) {
      console.error("Failed to fetch episodes:", error);
      return [];
    }
  }
};
