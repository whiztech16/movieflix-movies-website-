import React, { useEffect, useState } from 'react';
import Search from './components/search.jsx';
import MovieCard from './components/moviecard.jsx';
import { updateSearchCount, getTrendingMovies } from './appwrite.js';

const API_BASE_URL = "https://api.themoviedb.org/3";

const App = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [movieList, setMovieList] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedMovie, setSelectedMovie] = useState(null);

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (error) {
      console.error('Error fetching trending movies:', error);
    }
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchMovies = async (query = "") => {
    setIsLoading(true);
    setErrorMessage('');
    const apiKey = import.meta.env.VITE_TMDB_API_KEY;
    if (!apiKey) {
      setErrorMessage('API key is missing.');
      setIsLoading(false);
      return;
    }

    const API_OPTIONS = {
      method: 'GET',
      headers: { 
        accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      }
    };

    try { 
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
 
      const response = await fetch(endpoint, API_OPTIONS);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setMovieList(data.results || []);

      if(query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }
    } catch (error) {
      setErrorMessage('Error fetching movies.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadTrendingMovies();
  }, []);

  return (
    <main>
      <div className="pattern" />
      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="hero banner" />
          <h1>Discover <span className="text-gradient">Movies</span> You'll Love, Effortlessly.</h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {/* --- MOBILE OPTIMIZED MODAL --- */}
        {selectedMovie && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-0 md:p-8 backdrop-blur-md" 
            onClick={() => setSelectedMovie(null)}
          >
            {/* Desktop X: Only visible on md screens and up */}
           {/* High-visibility Floating X Button */}
<button 
  className="absolute right-6 top-6 z-[120] flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-2xl text-white backdrop-blur-lg border border-white/30 active:scale-90 transition-all touch-none"
  onClick={(e) => {
    e.stopPropagation(); // Prevents the click from "falling through" to elements behind it
    setSelectedMovie(null);
  }}
>
  ✕
</button>
            
            <div 
              className="relative h-full w-full max-w-4xl overflow-y-auto bg-[#0f0d23] shadow-2xl md:h-auto md:max-h-[90vh] md:rounded-3xl border-t md:border border-white/10" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col md:flex-row">
                {/* Movie Poster / Backdrop */}
                <div className="relative w-full md:w-2/5">
                  <img 
                    src={selectedMovie.poster_path ? `https://image.tmdb.org/t/p/w780${selectedMovie.poster_path}` : `/no-movie.png`} 
                    className="h-[50vh] md:h-full w-full object-cover"
                    alt={selectedMovie.title}
                  />
                  {/* Mobile X: Only visible on small screens */}
                  <button 
                    className="absolute right-4 top-4 md:hidden h-10 w-10 flex items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md"
                    onClick={() => setSelectedMovie(null)}
                  >
                    ✕
                  </button>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0d23] via-transparent to-transparent md:hidden" />
                </div>
                
                <div className="px-6 py-8 md:p-12 text-white flex-1 overflow-y-auto">
                  <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">{selectedMovie.title}</h2>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-8">
                    <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 text-white font-medium">
                      ⭐ {selectedMovie.vote_average.toFixed(1)}
                    </span>
                    <span className="bg-white/5 px-4 py-2 rounded-full border border-white/10">
                      📅 {selectedMovie.release_date?.split('-')[0]}
                    </span>
                    <span className="bg-white/5 px-4 py-2 rounded-full border border-white/10 uppercase">
                      {selectedMovie.original_language}
                    </span>
                  </div>

                  <h4 className="text-xl font-semibold text-gray-200 mb-4">Overview</h4>
                  <p className="leading-relaxed text-gray-400 text-lg mb-12">
                    {selectedMovie.overview || "No description available for this title."}
                  </p>

                  {/* BOTTOM BUTTON: Only visible on mobile (md:hidden) */}
                  <button 
                    className="w-full py-4 bg-white text-black font-bold rounded-2xl active:scale-95 transition-transform md:hidden"
                    onClick={() => setSelectedMovie(null)}
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>
            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.searchTerm} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="all-movies">
          <h2 className='mt-[40px]'>All Movies</h2>
          {isLoading ? (
            <p className="text-white text-center">Loading movies...</p>
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul className='text-white'>
              {movieList.map((movie) => (
                <MovieCard 
                  key={movie.id} 
                  movie={movie} 
                  onShowDetails={() => setSelectedMovie(movie)} 
                />
              ))}
            </ul>
          )} 
        </section>
      </div> 
    </main>
  );
};

export default App;