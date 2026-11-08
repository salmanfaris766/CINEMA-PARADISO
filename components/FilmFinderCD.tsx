'use client';

import React, { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import Image from 'next/image';
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
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
  Sparkles,
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

export default function FilmFinderCD({
  results,
  onAddToCompare,
  onViewDetails,
}: FilmFinderCDProps) {
  // Use up to 8 items for the 8 radial poster slots on the disc (45° intervals)
  const displayMovies = React.useMemo(() => {
    return results && results.length > 0 ? results.slice(0, 8) : [];
  }, [results]);

  const totalSlots = Math.max(displayMovies.length, 1);
  const step = 360 / totalSlots;

  const reduced = useReducedMotion() ?? false;
  const angle = useMotionValue(0);
  const [playing, setPlaying] = useState(!reduced);
  const [isHovered, setIsHovered] = useState(false);
  const [speed, setSpeed] = useState(1); // 0.25× to 3×
  const [spinningIdx, setSpinningIdx] = useState(0);

  const playingRef = useRef(playing && !reduced);
  playingRef.current = playing && !reduced;
  const isHoveredRef = useRef(isHovered);
  isHoveredRef.current = isHovered;
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const idxRef = useRef(0);

  // Speed dial pointer handling
  const MIN_SPEED = 0.25;
  const MAX_SPEED = 3;
  const clampSpeed = (s: number) => Math.min(MAX_SPEED, Math.max(MIN_SPEED, s));
  const knobRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startAngle: number; startSpeed: number } | null>(null);

  const pointerAngle = (clientX: number, clientY: number) => {
    const rect = knobRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return (
      (Math.atan2(
        clientY - (rect.top + rect.height / 2),
        clientX - (rect.left + rect.width / 2)
      ) *
        180) /
      Math.PI
    );
  };

  const onKnobPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startAngle: pointerAngle(e.clientX, e.clientY), startSpeed: speed };
  };

  const onKnobPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const delta =
      ((pointerAngle(e.clientX, e.clientY) - dragRef.current.startAngle + 540) % 360) - 180;
    setSpeed(clampSpeed(dragRef.current.startSpeed + (delta / 180) * 1.5));
  };

  const releaseKnob = () => {
    dragRef.current = null;
  };

  const dialAngle = -135 + ((speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)) * 270;

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

    // Track index currently positioned at the 12 o'clock marker (angle = 0)
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

  if (displayMovies.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-[#a1a1aa]">
        No recommendations to spin.
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-10 py-6 lg:flex-row lg:items-center lg:justify-center lg:gap-14">
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

        {/* Action Controls */}
        <div className="mt-5 flex items-center gap-2">
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

      {/* Right: Giant Physical Media CD Turntable with Embedded Radial Posters */}
      <div
        className="relative order-1 aspect-square w-[min(580px,94vw)] lg:order-2 shrink-0 select-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 12 o'clock Triangle Pointer (Matching the reference design) */}
        <div className="absolute left-1/2 top-[-20px] z-30 flex -translate-x-1/2 flex-col items-center pointer-events-none">
          <svg
            width="20"
            height="18"
            viewBox="0 0 20 18"
            fill="none"
            className="drop-shadow-[0_0_10px_rgba(255,255,255,0.85)] filter"
          >
            <path d="M10 18L0.47372 1.5L19.5263 1.5L10 18Z" fill="#f4f4f5" />
          </svg>
          <span className="h-5 w-[2px] bg-gradient-to-b from-white/90 to-transparent" />
        </div>

        {/* Ambient radial amber glow around the platter */}
        <div
          aria-hidden
          className="absolute -inset-8 rounded-full pointer-events-none bg-[radial-gradient(closest-side,rgba(245,165,36,0.15),transparent)]"
        />

        {/* Rotating Dark Graphite CD Disc */}
        <motion.div
          data-testid="rotating-cd-disc"
          style={{ rotate: angle }}
          className="absolute inset-0 overflow-hidden rounded-full bg-[#0a0a10] shadow-[0_30px_90px_rgba(0,0,0,0.98)] ring-1 ring-white/20 border-4 border-[#181822]"
        >
          {/* Subtle Concentric Vinyl Micro-Grooves */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background:
                'repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 3px, rgba(255,255,255,0.025) 4px, transparent 5px)',
            }}
          />

          {/* Holographic Prismatic Reflection Sheen */}
          <div
            aria-hidden
            className="animate-sheen absolute inset-0 rounded-full opacity-35 mix-blend-screen pointer-events-none"
            style={{
              background:
                'conic-gradient(from 0deg at 50% 50%, rgba(245,165,36,0.2) 0deg, rgba(56,189,248,0.18) 60deg, rgba(236,72,153,0.16) 120deg, rgba(168,85,247,0.18) 180deg, rgba(245,165,36,0.2) 240deg, rgba(45,212,191,0.18) 300deg, rgba(245,165,36,0.2) 360deg)',
            }}
          />

          {/* Outer Ring Channel Bed (recessed groove track underneath the posters) */}
          <div className="absolute inset-[8%] rounded-full border border-white/10 pointer-events-none shadow-[inset_0_2px_12px_rgba(0,0,0,0.8)]" />

          {/* 8 Radial Embedded Poster Slots */}
          {displayMovies.map((item, i) => (
            <EmbeddedCdSlot
              key={item.id}
              item={item}
              index={i}
              step={step}
              angle={angle}
              isSelected={spinningIdx === i}
              onSelect={() => selectItem(i)}
            />
          ))}

          {/* Inner Ring Separator between posters and spindle */}
          <div className="absolute inset-[33%] rounded-full border border-white/15 bg-gradient-to-b from-[#101018] to-[#07070b] pointer-events-none shadow-inner" />
          <div className="absolute inset-[36%] rounded-full border border-white/10 pointer-events-none" />
        </motion.div>

        {/* Central Spindle Hole & Center Hub (Non-rotating) */}
        <div className="absolute left-1/2 top-1/2 z-20 flex h-[28%] w-[28%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-full border-2 border-white/20 bg-[#07070b] shadow-[inset_0_3px_15px_rgba(0,0,0,0.98),0_0_25px_rgba(0,0,0,0.8)]">
          {/* Subtle concentric spindle rings */}
          <div className="absolute inset-2 rounded-full border border-white/10 pointer-events-none" />

          {/* Center Glowing Yellow/Amber Play/Pause Button */}
          <button
            type="button"
            data-testid="cd-play-toggle-btn"
            onClick={togglePlay}
            aria-label={playing ? 'Stop rotation' : 'Start rotation'}
            className="relative z-10 flex aspect-square h-[42%] cursor-pointer items-center justify-center rounded-full bg-[#f5a524] text-[#07070b] shadow-[0_0_22px_rgba(245,165,36,0.7)] transition-all hover:scale-110 active:scale-95 focus-visible:outline-none"
            title={playing ? 'Pause disc' : 'Spin disc'}
          >
            {playing ? (
              <Square className="h-1/3 w-1/3 fill-current" />
            ) : (
              <Play className="h-1/3 w-1/3 fill-current translate-x-[7%]" />
            )}
          </button>

          {/* Grooved Speed Dial Knob */}
          <div
            ref={knobRef}
            role="slider"
            tabIndex={0}
            data-testid="cd-speed-toggle-btn"
            aria-label={`Rotation speed ${speed.toFixed(2)}x`}
            aria-valuemin={MIN_SPEED}
            aria-valuemax={MAX_SPEED}
            aria-valuenow={Number(speed.toFixed(2))}
            onPointerDown={onKnobPointerDown}
            onPointerMove={onKnobPointerMove}
            onPointerUp={releaseKnob}
            onPointerCancel={releaseKnob}
            onKeyDown={(event) => {
              if (event.key === 'ArrowUp' || event.key === 'ArrowRight')
                setSpeed((s) => clampSpeed(s + 0.25));
              if (event.key === 'ArrowDown' || event.key === 'ArrowLeft')
                setSpeed((s) => clampSpeed(s - 0.25));
            }}
            style={{ touchAction: 'none' }}
            className="relative aspect-square h-[24%] cursor-grab touch-none rounded-full border border-white/25 bg-[#12121a] shadow-[inset_0_1px_4px_rgba(0,0,0,0.9)] outline-none active:cursor-grabbing hover:border-[#f5a524]/60 transition-colors"
          >
            <span
              aria-hidden
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  'repeating-conic-gradient(from 0deg, rgba(255,255,255,0.15) 0deg 2deg, transparent 2deg 10deg)',
              }}
            />
            <span
              aria-hidden
              className="absolute inset-0"
              style={{ transform: `rotate(${dialAngle}deg)` }}
            >
              <span className="absolute left-1/2 top-[8%] h-[38%] w-[2px] -translate-x-1/2 rounded-full bg-[#f5a524] shadow-[0_0_6px_rgba(245,165,36,0.9)]" />
            </span>
          </div>

          {/* Speed readout */}
          <span
            data-testid="cd-speed-readout"
            className="font-mono text-[9px] leading-none text-[#a1a1aa] font-medium"
          >
            {speed.toFixed(2)}×
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Embedded poster slot integrated into the vinyl surface.
 * - Sits precisely along the circular outer ring.
 * - Uses exact 82px by 124px (2:3 portrait aspect ratio).
 * - Counter-rotates so artwork always remains upright while orbiting.
 * - Thin silver border + subtle dark gradient edge blend gives the look of artwork pressed into physical media.
 * - Selected poster scales up slightly with an amber glow.
 */
function EmbeddedCdSlot({
  item,
  index,
  step,
  angle,
  isSelected,
  onSelect,
}: {
  item: CDResultItem;
  index: number;
  step: number;
  angle: MotionValue<number>;
  isSelected: boolean;
  onSelect: () => void;
}) {
  // Counter-rotation keeps the poster upright at all times
  const counterRotate = useTransform(angle, (a: number) => -a);

  // Position evenly around the 34% radius circle
  const rad = ((index * step - 90) * Math.PI) / 180;
  const left = 50 + 34 * Math.cos(rad);
  const top = 50 + 34 * Math.sin(rad);

  const posterUrl = item.poster_path ? `${IMG_BASE}/w185${item.poster_path}` : null;

  return (
    <div
      className="absolute"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <motion.div style={{ rotate: counterRotate }}>
        <button
          type="button"
          onClick={onSelect}
          data-testid={`cd-slot-${item.id}`}
          aria-label={`${item.title} (${item.year})`}
          className={`group relative block cursor-pointer transition-all duration-300 rounded-[8px] outline-none ${
            isSelected
              ? 'scale-110 z-20'
              : 'scale-100 hover:scale-105 opacity-85 hover:opacity-100 z-10'
          }`}
        >
          {/* Embedded Recessed Pocket / Slot in the Vinyl */}
          <div
            className={`movie-poster relative bg-[#09090e] transition-all duration-300 ${
              isSelected
                ? 'border border-[#f5a524] ring-2 ring-[#f5a524]/60 shadow-[0_0_26px_rgba(245,165,36,0.85)]'
                : 'border border-white/25 hover:border-white/50 shadow-[0_6px_20px_rgba(0,0,0,0.9),inset_0_1px_3px_rgba(255,255,255,0.1)]'
            }`}
          >
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={item.title}
                fill
                sizes="82px"
                loading="lazy"
                className="movie-poster object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-1.5 text-center bg-[#101018]">
                <Sparkles className="w-4 h-4 text-[#f5a524] mb-1" />
                <span className="text-[9px] font-bold text-[#f4f4f5] line-clamp-3 leading-tight">
                  {item.title}
                </span>
              </div>
            )}

            {/* Subtle Gradient Blend Layer — makes artwork feel pressed into the CD lacquer */}
            <div
              className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
                isSelected
                  ? 'bg-gradient-to-t from-black/40 via-transparent to-transparent'
                  : 'bg-gradient-to-t from-black/60 via-transparent to-black/20 group-hover:opacity-40'
              }`}
            />

            {/* Selected Active Badge (Subtle amber accent dot) */}
            {isSelected && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#f5a524] shadow-[0_0_8px_#f5a524]" />
            )}
          </div>
        </button>
      </motion.div>
    </div>
  );
}
