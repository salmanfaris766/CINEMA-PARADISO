'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Search, X, Loader2, Menu } from 'lucide-react';
import { useCompareStore } from '@/store/compareStore';
import { IMG_BASE } from '@/lib/tmdb';

interface NavItem {
  name: string;
  href: string;
  badge?: number;
}

interface SearchResult {
  id: number;
  media_type: 'movie' | 'tv';
  title: string;
  year: string;
  poster_path: string;
  vote_average: number;
}

const navItems: NavItem[] = [
  { name: 'Home', href: '/' },
  { name: 'Movies', href: '/movies' },
  { name: 'Series', href: '/series' },
  { name: 'In Theatres', href: '/theatres' },
  { name: 'Compare', href: '/compare' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const compareCount = useCompareStore((state) => state.items.length);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Click outside to close search dropdown & mobile menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce search query
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setSelectedIndex(0);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
          setSelectedIndex(0);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle keyboard navigation in search input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (searchResults.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % searchResults.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (searchResults.length > 0) {
        setSelectedIndex((prev) =>
          prev === 0 ? searchResults.length - 1 : prev - 1
        );
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0 && searchResults[selectedIndex]) {
        const item = searchResults[selectedIndex];
        handleSelectResult(item);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setSearchOpen(false);
      setSearchQuery('');
      setSearchResults([]);
      searchInputRef.current?.blur();
    }
  };

  const handleSelectResult = (item: SearchResult) => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    router.push(`/${item.media_type}/${item.id}`);
  };

  const showDropdown =
    searchOpen &&
    (searchResults.length > 0 ||
      isSearching ||
      (searchQuery.trim().length >= 2 && searchResults.length === 0));

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-[1200px]">
      <nav
        className={`glass rounded-full flex items-center justify-between transition-all duration-300 ease-out mx-auto ${
          scrolled ? 'py-1.5 px-4 gap-3 text-xs' : 'py-2 px-6 gap-6 text-sm'
        }`}
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Left: Brand Logo & Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2 group whitespace-nowrap text-[#f4f4f5] hover:opacity-90 transition-opacity shrink-0"
        >
          <Film className="w-4 h-4 text-[#f5a524] transition-transform group-hover:rotate-12 duration-200" />
          <span
            className="font-display font-bold tracking-wide"
            style={{
              fontFamily: 'var(--font-display), serif',
              fontSize: scrolled ? '0.95rem' : '1.05rem',
            }}
          >
            Cinema Paradiso
          </span>
        </Link>

        {/* Center: Desktop Navigation Links (hidden on mobile < 768px) */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            const dynamicBadge =
              item.href === '/compare'
                ? mounted
                  ? compareCount
                  : 0
                : item.badge || 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3 py-1.5 rounded-full font-medium transition-colors duration-200 whitespace-nowrap flex items-center ${
                  isActive ? 'text-[#f4f4f5]' : 'text-[#a1a1aa] hover:text-[#f4f4f5]'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-[#f5a524]/15 border border-[#f5a524]/30 rounded-full -z-10 shadow-[0_0_12px_rgba(245,165,36,0.2)]"
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}
                <span>{item.name}</span>
                {dynamicBadge > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f5a524] text-[#07070b] leading-none">
                    {dynamicBadge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Right: Search + Mobile Hamburger */}
        <div className="flex items-center gap-1">
          {/* Search container */}
          <div ref={searchContainerRef} className="relative flex items-center">
            <div
              className={`flex items-center overflow-hidden transition-all duration-300 ease-out ${
                searchOpen
                  ? 'w-44 sm:w-60 md:w-72 opacity-100 mr-2'
                  : 'w-0 opacity-0 mr-0'
              }`}
            >
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search movies, series..."
                className="w-full bg-white/10 text-[#f4f4f5] text-xs placeholder-[#71717a] px-3.5 py-1.5 rounded-full outline-none border border-white/15 focus:border-[#f5a524]/60 transition-colors"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setSearchOpen((prev) => !prev);
                if (searchOpen) {
                  setSearchQuery('');
                  setSearchResults([]);
                }
              }}
              aria-label={searchOpen ? 'Close search' : 'Open search'}
              className="p-1.5 rounded-full text-[#a1a1aa] hover:text-[#f5a524] hover:bg-white/5 transition-colors focus:outline-none"
            >
              {searchOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>

            {/* Results Dropdown */}
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute top-full right-0 mt-3 w-[340px] sm:w-[400px] max-h-[400px] overflow-y-auto glass rounded-2xl z-50 border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.6)] p-2"
                >
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8 text-[#f5a524]">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="ml-2 text-xs text-[#a1a1aa]">Searching...</span>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#71717a]">
                      No results found for "{searchQuery}"
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {searchResults.map((item, idx) => {
                        const isSelected = idx === selectedIndex;
                        const posterSrc = item.poster_path
                          ? `${IMG_BASE}/w92${item.poster_path}`
                          : null;

                        return (
                          <div
                            key={`${item.media_type}-${item.id}`}
                            onClick={() => handleSelectResult(item)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#f5a524]/15 border border-[#f5a524]/30'
                                : 'hover:bg-white/5 border border-transparent'
                            }`}
                          >
                            {/* Thumbnail */}
                            <div className="relative w-10 h-[60px] rounded-lg overflow-hidden shrink-0 bg-[#0d0d14] border border-white/10 flex items-center justify-center">
                              {posterSrc ? (
                                <Image
                                  src={posterSrc}
                                  alt={item.title}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              ) : (
                                <span className="text-xs font-bold text-[#71717a]">
                                  {item.title.charAt(0)}
                                </span>
                              )}
                            </div>

                            {/* Middle info */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-[#f4f4f5] truncate">
                                {item.title}
                              </h4>
                              <p className="text-xs text-[#71717a] mt-0.5">
                                {item.year || 'N/A'}
                              </p>
                            </div>

                            {/* Right badge */}
                            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-white/5 text-[#a1a1aa] shrink-0 border border-white/10">
                              {item.media_type === 'movie' ? 'Movie' : 'TV'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile hamburger toggle (hidden on md: and above) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle mobile menu"
            className="md:hidden p-1.5 rounded-full text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-white/5 transition-colors focus:outline-none"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown (screens < 768px) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mt-2 glass rounded-2xl p-4 border border-white/10 shadow-2xl flex flex-col gap-2"
          >
            {navItems.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);

              const dynamicBadge =
                item.href === '/compare'
                  ? mounted
                    ? compareCount
                    : 0
                  : item.badge || 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                    isActive
                      ? 'bg-[#f5a524]/15 text-[#f4f4f5] border border-[#f5a524]/30'
                      : 'text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-white/5'
                  }`}
                >
                  <span>{item.name}</span>
                  {dynamicBadge > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#f5a524] text-[#07070b]">
                      {dynamicBadge}
                    </span>
                  )}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
