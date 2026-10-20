'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Film, Search, X } from 'lucide-react';
import { useCompareStore } from '@/store/compareStore';

interface NavItem {
  name: string;
  href: string;
  badge?: number;
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
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const compareCount = useCompareStore((state) => state.items.length);

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

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <nav
        className={`glass rounded-full flex items-center transition-all duration-300 ease-out ${
          scrolled ? 'py-1.5 px-4 gap-4 text-xs' : 'py-2 px-6 gap-6 text-sm'
        }`}
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Left: Brand Logo & Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2 group whitespace-nowrap text-[#f4f4f5] hover:opacity-90 transition-opacity"
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

        {/* Center: Navigation Links */}
        <div className="flex items-center gap-1">
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

        {/* Right: Search expanding input */}
        <div className="flex items-center pl-1 border-l border-white/10">
          <div
            className={`flex items-center overflow-hidden transition-all duration-300 ease-out ${
              searchOpen ? 'w-48 opacity-100 mr-2' : 'w-0 opacity-0 mr-0'
            }`}
          >
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search titles..."
              className="w-full bg-white/10 text-[#f4f4f5] text-xs placeholder-[#71717a] px-3 py-1 rounded-full outline-none border border-white/15 focus:border-[#f5a524]/60 transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={() => setSearchOpen((prev) => !prev)}
            aria-label={searchOpen ? 'Close search' : 'Open search'}
            className="p-1.5 rounded-full text-[#a1a1aa] hover:text-[#f5a524] hover:bg-white/5 transition-colors focus:outline-none"
          >
            {searchOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>
        </div>
      </nav>
    </header>
  );
}
