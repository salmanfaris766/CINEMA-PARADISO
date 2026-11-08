'use client';

import React, { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
} from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Square,
  Volume2,
  VolumeX,
  Star,
  Plus,
} from 'lucide-react';
import { VinylCrackle } from '@/lib/audio';
import { IMG_BASE } from '@/lib/tmdb';

export interface CDResultItem {
  id: number;
  media_type: 'movie' | 'tv';
  title: string;
  year: string;
  poster_path: string;
  vote_average: number;
  matchScore: number;
  reason: string;
  runtime?: string | number | null;
  genres?: Array<{ id: number; name: string }>;
  overview?: string;
}

export interface FilmFinderCDProps {
  results: CDResultItem[];
  onAddToCompare: (item: { id: number; media_type: 'movie' | 'tv'; title: string; poster_path: string }) => void;
  onViewDetails: (id: number, media_type: string) => void;
}

const mod = (n: number, m: number) => ((n % m) + m) % m;
const DEGREES_PER_MS = 0.016; // One smooth revolution ≈ 22s at 1×

function truncateTitle(title: string, max = 15): string {
  if (!title) return '';
  return title.length > max ? title.slice(0, max - 1) + '…' : title;
}

export default function FilmFinderCD({
  results,
  onAddToCompare,
  onViewDetails,
}: FilmFinderCDProps) {
  // Use up to 10 recommended titles to create the exact radial sectors as in the reference image
  const displayMovies = React.useMemo(() => {
    return results && results.length > 0 ? results.slice(0, 10) : [];
  }, [results]);

  const totalSlots = Math.max(displayMovies.length, 1);
  const step = 360 / totalSlots;

  const reduced = useReducedMotion() ?? false;
  const angle = useMotionValue(0);
  const [playing, setPlaying] = useState(!reduced);
  const [isHovered, setIsHovered] = useState(false);
  const [speed, setSpeed] = useState(1); // 0.5× | 1× | 1.5× | 2×
  const [spinningIdx, setSpinningIdx] = useState(0);

  const playingRef = useRef(playing && !reduced);
  playingRef.current = playing && !reduced;
  const isHoveredRef = useRef(isHovered);
  isHoveredRef.current = isHovered;
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const idxRef = useRef(0);

  // Vinyl crackle sound effect
  const crackleRef = useRef<VinylCrackle | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [audioOn, setAudioOn] = useState(false);

  const togglePlay = () => {
    crackleRef.current ??= new VinylCrackle();
    setAudioUnlocked(true);
    setPlaying((p) => !p);
  };

  const toggleSound = () => {
    crackleRef.current ??= new VinylCrackle();
    setAudioUnlocked(true);
    setAudioOn((s) => !s);
  };

  useEffect(() => {
    const crackle = crackleRef.current;
    if (!crackle || !audioUnlocked) return;
    if (playing && audioOn && !isHovered) {
      void crackle.unlockAndStart();
    } else {
      crackle.stop();
    }
  }, [playing, audioOn, audioUnlocked, isHovered]);

  useEffect(() => () => crackleRef.current?.dispose(), []);

  // Frame animation: continuous slow rotation unless paused or hovered
  useAnimationFrame((_, delta) => {
    if (!playingRef.current || isHoveredRef.current || displayMovies.length === 0) return;
    const next = mod(angle.get() + delta * DEGREES_PER_MS * speedRef.current, 360);
    angle.set(next);

    // Track index currently positioned under the 12 o'clock marker
    const idx = mod(Math.round(-next / step), displayMovies.length);
    if (idx !== idxRef.current) {
      idxRef.current = idx;
      setSpinningIdx(idx);
    }
  });

  const stepTo = (deltaSteps: number) => {
    if (displayMovies.length === 0) return;
    const next = mod(angle.get() + deltaSteps * step, 360);
    angle.set(next);
    const idx = mod(Math.round(-next / step), displayMovies.length);
    idxRef.current = idx;
    setSpinningIdx(idx);
  };

  const selectItem = (index: number) => {
    if (displayMovies.length === 0) return;
    const targetAngle = mod(-index * step, 360);
    angle.set(targetAngle);
    idxRef.current = index;
    setSpinningIdx(index);
  };

  const spinning = displayMovies[spinningIdx] ?? displayMovies[0];
  const upcoming =
    displayMovies.length > 0
      ? [...displayMovies.slice(spinningIdx + 1), ...displayMovies.slice(0, spinningIdx + 1)]
      : [];

  // SVG Geometry Calculation: Small finger-sized hole (rIn = 46) so posters expand to fill the disc
  const cx = 300;
  const cy = 300;
  const rOut = 288;
  const rIn = 46; // Small realistic CD finger hole
  const deltaDeg = step / 2; // half-angle of the slice in degrees
  const startRad = ((-90 - deltaDeg) * Math.PI) / 180;
  const endRad = ((-90 + deltaDeg) * Math.PI) / 180;

  const pOut1 = { x: cx + rOut * Math.cos(startRad), y: cy + rOut * Math.sin(startRad) };
  const pOut2 = { x: cx + rOut * Math.cos(endRad), y: cy + rOut * Math.sin(endRad) };
  const pIn2 = { x: cx + rIn * Math.cos(endRad), y: cy + rIn * Math.sin(endRad) };
  const pIn1 = { x: cx + rIn * Math.cos(startRad), y: cy + rIn * Math.sin(startRad) };

  const topWedgePath = `M ${pIn1.x.toFixed(2)} ${pIn1.y.toFixed(2)} L ${pOut1.x.toFixed(2)} ${pOut1.y.toFixed(2)} A ${rOut} ${rOut} 0 0 1 ${pOut2.x.toFixed(2)} ${pOut2.y.toFixed(2)} L ${pIn2.x.toFixed(2)} ${pIn2.y.toFixed(2)} A ${rIn} ${rIn} 0 0 0 ${pIn1.x.toFixed(2)} ${pIn1.y.toFixed(2)} Z`;

  if (displayMovies.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-[#a1a1aa]">
        No recommendations to spin.
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-10 py-4 lg:flex-row lg:items-center lg:justify-center lg:gap-14">
      {/* Left/Sidebar: Now-spinning HUD Card */}
      <div
        data-testid="cd-now-spinning-card"
        className="order-2 w-full max-w-sm rounded-2xl glass p-6 border border-white/10 shadow-2xl lg:order-1 flex flex-col"
      >
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] font-semibold text-[#f5a524]">
          <span
            className={`inline-block h-2 w-2 rounded-full bg-[#f5a524] ${
              playing && !isHovered ? 'animate-pulse' : 'opacity-40'
            }`}
          />
          {isHovered ? 'Paused on hover' : playing ? 'Now spinning' : 'Paused · laser parked'}
        </p>

        <h3
          className="mt-3 font-bold text-2xl text-[#f4f4f5] leading-tight line-clamp-2"
          style={{ fontFamily: 'var(--font-display), serif' }}
        >
          {spinning?.title}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#a1a1aa]">
          <span>{spinning?.year || 'N/A'}</span>
          <span>•</span>
          <span className="flex items-center gap-1 text-[#f5a524] font-semibold">
            <Star className="w-3.5 h-3.5 fill-[#f5a524]" />
            {spinning?.vote_average ? spinning.vote_average.toFixed(1) : 'NR'}
          </span>
          <span>•</span>
          <span className="px-2 py-0.5 rounded-full bg-[#f5a524]/15 border border-[#f5a524]/30 text-[#f5a524] text-[10px] font-bold">
            {spinning?.matchScore || 90}% Match
          </span>
          {spinning?.runtime && (
            <>
              <span>•</span>
              <span>{spinning.runtime}</span>
            </>
          )}
        </div>

        {/* AI reason quote */}
        <p className="mt-3 text-xs italic text-[#f4f4f5]/85 bg-white/5 border border-white/5 rounded-xl p-3 leading-relaxed">
          "{spinning?.reason || 'Recommended match based on your preferences.'}"
        </p>

        {/* Up-next ticker */}
        <div data-testid="cd-upcoming-ticker" className="mt-4 border-t border-white/10 pt-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#71717a] font-medium">
            Up next on the platter
          </p>
          <div className="mt-2 overflow-hidden w-full">
            <div
              className="animate-marquee flex w-max gap-6"
              style={{ animationPlayState: playing && !isHovered ? 'running' : 'paused' }}
            >
              {[...upcoming, ...upcoming].map((m, i) => (
                <span
                  key={`${m.id}-${i}`}
                  className="flex items-center gap-2 whitespace-nowrap text-xs text-[#a1a1aa]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f5a524]" />
                  {m.title}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Speed adjustment controls */}
        <div className="mt-4 flex items-center justify-between text-xs text-[#a1a1aa] border-t border-white/10 pt-3">
          <span className="text-[10px] uppercase tracking-wider text-[#71717a] font-medium">
            Speed
          </span>
          <div className="flex items-center gap-1.5">
            {[0.5, 1, 1.5, 2].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono transition-all ${
                  speed === s
                    ? 'bg-[#f5a524] text-[#07070b] font-bold shadow-[0_0_8px_rgba(245,165,36,0.4)]'
                    : 'glass hover:text-[#f4f4f5] text-[#a1a1aa] border border-white/10'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-4 flex items-center gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            aria-label="Previous film"
            data-testid="cd-prev-btn"
            onClick={() => stepTo(-1)}
            className="p-2 rounded-full glass border border-white/10 hover:border-[#f5a524]/60 text-[#f4f4f5] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Next film"
            data-testid="cd-next-btn"
            onClick={() => stepTo(1)}
            className="p-2 rounded-full glass border border-white/10 hover:border-[#f5a524]/60 text-[#f4f4f5] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            data-testid="cd-details-btn"
            onClick={() => spinning && onViewDetails(spinning.id, spinning.media_type)}
            className="px-4 py-1.5 rounded-full bg-[#f5a524] text-[#07070b] font-semibold text-xs hover:bg-[#e0961f] transition-all shadow-[0_0_15px_rgba(245,165,36,0.3)] ml-auto"
          >
            View Details
          </button>

          <button
            type="button"
            aria-label="Add to compare"
            onClick={() => {
              if (spinning) {
                onAddToCompare({
                  id: spinning.id,
                  media_type: spinning.media_type,
                  title: spinning.title,
                  poster_path: spinning.poster_path,
                });
              }
            }}
            className="p-2 rounded-full glass border border-white/10 hover:border-[#f5a524]/60 text-[#f5a524] transition-colors"
            title="+ Compare"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            type="button"
            data-testid="cd-sound-toggle-btn"
            aria-label={audioOn ? 'Mute vinyl ambience' : 'Unmute vinyl ambience'}
            aria-pressed={audioOn}
            onClick={toggleSound}
            className={`p-2 rounded-full glass border transition-colors ${
              audioOn
                ? 'border-[#f5a524] text-[#f5a524] bg-[#f5a524]/10'
                : 'border-white/10 text-[#71717a] hover:text-[#f4f4f5]'
            }`}
            title={audioOn ? 'Mute crackle' : 'Enable vinyl crackle'}
          >
            {audioOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Right Column: Rotating Picture-Disc CD (Exact Match to Reference Image with Small Finger Hole) */}
      <div className="order-1 flex flex-col items-center lg:order-2">
        <div
          className="relative aspect-square w-[min(580px,94vw)] shrink-0 select-none cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* 12 o'clock Triangle Pointer (Matching the Reference Image) */}
          <div className="absolute left-1/2 top-[-22px] z-30 flex -translate-x-1/2 flex-col items-center pointer-events-none">
            <svg
              width="24"
              height="20"
              viewBox="0 0 24 20"
              fill="none"
              className="drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] filter"
            >
              <path d="M12 20L0.5 0.5H23.5L12 20Z" fill="#ffffff" />
            </svg>
            <span className="h-4 w-[2px] bg-gradient-to-b from-white/90 to-transparent" />
          </div>

          {/* Ambient radial amber glow around the disc */}
          <div
            aria-hidden
            className="absolute -inset-8 rounded-full pointer-events-none bg-[radial-gradient(closest-side,rgba(245,165,36,0.14),transparent)]"
          />

          {/* Outer Chamfer Rim */}
          <div className="absolute inset-0 rounded-full border-[6px] border-[#161622] shadow-[0_25px_80px_rgba(0,0,0,0.95)] pointer-events-none z-10" />

          {/* Rotating Vinyl Picture Disc with Wedged Poster Artwork */}
          <motion.div
            data-testid="rotating-cd-disc"
            style={{ rotate: angle }}
            className="relative w-full h-full rounded-full overflow-hidden bg-[#07070b]"
          >
            <svg
              viewBox="0 0 600 600"
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Standard top wedge clip path: extends from rIn = 46 to rOut = 288 */}
                <clipPath id="top-wedge-clip">
                  <path d={topWedgePath} />
                </clipPath>

                {/* Shading gradient for each wedge: subtle edge shading, vivid poster center */}
                <linearGradient id="slice-shading" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(0,0,0,0.6)" />
                  <stop offset="18%" stopColor="rgba(0,0,0,0.05)" />
                  <stop offset="78%" stopColor="rgba(0,0,0,0.05)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.7)" />
                </linearGradient>

                {/* Subtle radial sheen filter */}
                <radialGradient id="disc-sheen" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                  <stop offset="70%" stopColor="rgba(255,255,255,0.03)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
                </radialGradient>
              </defs>

              {/* Disc base */}
              <circle cx="300" cy="300" r="290" fill="#0c0d14" />

              {/* Slices: 10 Radial Poster Wedges Fitting the Disc */}
              {displayMovies.map((item, i) => {
                const isSelected = spinningIdx === i;
                const posterUrl = item.poster_path ? `${IMG_BASE}/w500${item.poster_path}` : null;

                return (
                  <g
                    key={item.id}
                    transform={`rotate(${i * step}, 300, 300)`}
                    onClick={() => selectItem(i)}
                    className="cursor-pointer"
                  >
                    {/* Clipped Poster Section (Now spanning 242px height across the disc face!) */}
                    <g clipPath="url(#top-wedge-clip)">
                      {posterUrl ? (
                        <image
                          href={posterUrl}
                          x="180"
                          y="10"
                          width="240"
                          height="248"
                          preserveAspectRatio="xMidYMid slice"
                          className="transition-transform duration-300"
                        />
                      ) : (
                        <rect x="180" y="10" width="240" height="248" fill="#151622" />
                      )}

                      {/* Dark edge blending gradient for printed vinyl look */}
                      <path d={topWedgePath} fill="url(#slice-shading)" />

                      {/* Selected slice golden illumination overlay */}
                      {isSelected && (
                        <path d={topWedgePath} fill="rgba(245, 165, 36, 0.22)" />
                      )}

                      {/* Radial Text 1: Movie Title along the Outer Rim */}
                      <text
                        x="300"
                        y="34"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="800"
                        letterSpacing="0.18em"
                        className="drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]"
                        style={{
                          textTransform: 'uppercase',
                          fontFamily: 'var(--font-inter), sans-serif',
                        }}
                      >
                        {truncateTitle(item.title, 14)}
                      </text>

                      {/* Radial Text 2: Year & Rating along the Inner Rim close to the finger hole */}
                      <text
                        x="300"
                        y="238"
                        textAnchor="middle"
                        fill={isSelected ? '#f5a524' : 'rgba(255,255,255,0.85)'}
                        fontSize="9"
                        fontWeight="700"
                        letterSpacing="0.22em"
                        className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]"
                        style={{ textTransform: 'uppercase' }}
                      >
                        {item.year || '2024'} • ★ {item.vote_average ? item.vote_average.toFixed(1) : 'NR'}
                      </text>
                    </g>

                    {/* Thin Slice Border / Seam between Sectors */}
                    <path
                      d={topWedgePath}
                      fill="none"
                      stroke={isSelected ? '#f5a524' : 'rgba(255, 255, 255, 0.22)'}
                      strokeWidth={isSelected ? 3 : 1}
                      className="transition-colors duration-200"
                    />

                    {/* Active Sector Accent Pip at the Outer Edge */}
                    {isSelected && (
                      <circle cx="300" cy="14" r="3" fill="#f5a524" filter="drop-shadow(0 0 4px #f5a524)" />
                    )}
                  </g>
                );
              })}

              {/* Concentric Vinyl Grooves Overlay across the posters */}
              <circle
                cx="300"
                cy="300"
                r="286"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
                pointerEvents="none"
              />
              <circle
                cx="300"
                cy="300"
                r="230"
                fill="none"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="1"
                pointerEvents="none"
              />
              <circle
                cx="300"
                cy="300"
                r="175"
                fill="none"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="1"
                pointerEvents="none"
              />
              <circle
                cx="300"
                cy="300"
                r="115"
                fill="none"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="1"
                pointerEvents="none"
              />
              <circle
                cx="300"
                cy="300"
                r="60"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
                pointerEvents="none"
              />

              {/* Surface Sheen */}
              <circle cx="300" cy="300" r="286" fill="url(#disc-sheen)" pointerEvents="none" />

              {/* Clear polycarbonate inner clamping ring around finger hole */}
              <circle
                cx="300"
                cy="300"
                r="54"
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1.5"
              />
              {/* The CD finger spindle hole edge */}
              <circle
                cx="300"
                cy="300"
                r="46"
                fill="#07070b"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="2"
              />
            </svg>
          </motion.div>

          {/* Small Finger-sized CD Spindle Hole with Play/Pause Button */}
          <div className="absolute left-1/2 top-1/2 z-20 flex h-[15.5%] w-[15.5%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/25 bg-[#07070b]/95 shadow-[inset_0_2px_10px_rgba(0,0,0,0.98),0_0_20px_rgba(0,0,0,0.85)]">
            {/* Play/Pause Button occupying the small finger hole */}
            <button
              type="button"
              data-testid="cd-play-toggle-btn"
              onClick={togglePlay}
              aria-label={playing ? 'Stop rotation' : 'Start rotation'}
              className="flex aspect-square h-[76%] w-[76%] cursor-pointer items-center justify-center rounded-full bg-[#f5a524] text-[#07070b] shadow-[0_0_18px_rgba(245,165,36,0.7)] transition-all hover:scale-105 active:scale-95 focus-visible:outline-none"
              title={playing ? 'Pause rotation' : 'Start rotation'}
            >
              {playing ? (
                <Square className="h-2/5 w-2/5 fill-current" />
              ) : (
                <Play className="h-2/5 w-2/5 fill-current translate-x-[7%]" />
              )}
            </button>
          </div>
        </div>

        {/* Featured Movie Typography Below the Disc (Matching Reference Image Album Art Layout) */}
        <div className="mt-8 text-center max-w-md">
          <h2
            className="text-2xl md:text-3xl font-bold tracking-tight text-[#f4f4f5] leading-snug"
            style={{ fontFamily: 'var(--font-display), serif' }}
          >
            {spinning?.title}
          </h2>
          <p className="text-xs font-mono tracking-[0.25em] text-[#f5a524] mt-1.5 uppercase font-semibold">
            {spinning?.year || '2024'} • ★ {spinning?.vote_average ? spinning.vote_average.toFixed(1) : 'NR'} • {spinning?.matchScore || 90}% Match
          </p>
        </div>
      </div>
    </div>
  );
}
