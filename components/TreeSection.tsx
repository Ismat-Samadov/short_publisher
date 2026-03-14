'use client';

import { useEffect, useRef, useState } from 'react';
import { TreeSegment, Side, GameStatus } from '@/lib/types';
import { CHOP_ANIM_DURATION } from '@/lib/constants';

interface Props {
  segments: TreeSegment[];      // index 0 = bottom segment
  playerSide: Side;
  chopAnimation: { side: Side; timestamp: number } | null;
  isDeathAnimating: boolean;
  gameStatus: GameStatus;
}

// ─── Branch SVG ──────────────────────────────────────────────────────────────
function Branch({ side }: { side: 'LEFT' | 'RIGHT' }) {
  const isLeft = side === 'LEFT';
  return (
    <div
      className={`
        absolute top-1/2 -translate-y-1/2 flex items-center
        ${isLeft ? 'right-full pr-0' : 'left-full pl-0'}
      `}
    >
      {/* Main branch log */}
      <div
        className={`
          relative flex items-center
          ${isLeft ? 'flex-row-reverse' : 'flex-row'}
        `}
      >
        {/* Wood part */}
        <div
          className="h-5 rounded-sm shadow-md"
          style={{
            width: 90,
            background: 'linear-gradient(to bottom, #7c4a1e, #5c3311, #7c4a1e)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 6px rgba(0,0,0,0.4)',
          }}
        />
        {/* Leaf cluster */}
        <div
          className={`
            relative z-10 flex items-center justify-center
            w-10 h-10 rounded-full
          `}
          style={{
            background: 'radial-gradient(circle, #22c55e, #15803d)',
            boxShadow: '0 0 10px rgba(34,197,94,0.4)',
            marginLeft: isLeft ? 0 : -6,
            marginRight: isLeft ? -6 : 0,
          }}
        >
          <span className="text-xs">🍃</span>
        </div>
      </div>
    </div>
  );
}

// ─── Player Character ─────────────────────────────────────────────────────────
function Player({
  side,
  isChopping,
  chopSide,
  isDead,
}: {
  side: Side;
  isChopping: boolean;
  chopSide: Side | null;
  isDead: boolean;
}) {
  const isLeft = side === 'LEFT';

  return (
    <div
      className={`
        absolute bottom-0 flex flex-col items-center
        transition-all duration-100
        ${isLeft ? 'right-full mr-1' : 'left-full ml-1'}
        ${isDead ? 'animate-death' : ''}
      `}
    >
      {/* Character body */}
      <div
        className={`
          relative flex flex-col items-center
          transition-transform duration-100
          ${isChopping && chopSide === side ? 'scale-x-110 -translate-y-1' : ''}
          ${isDead ? 'rotate-90 opacity-60' : ''}
        `}
        style={{ transform: isLeft ? 'scaleX(-1)' : undefined }}
      >
        {/* Head */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-lg z-10"
          style={{
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          {isDead ? '😵' : '😤'}
        </div>

        {/* Body */}
        <div
          className="w-9 h-11 rounded-lg -mt-1 flex items-center justify-center relative"
          style={{
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          {/* Axe arm */}
          <div
            className={`
              absolute -right-3 top-2 w-8 h-2 rounded-full
              transition-transform duration-100
              ${isChopping ? '-rotate-45' : 'rotate-12'}
            `}
            style={{ background: '#78350f', transformOrigin: 'left center' }}
          >
            {/* Axe head */}
            <div
              className="absolute right-0 -top-2 w-4 h-5 rounded"
              style={{
                background: 'linear-gradient(135deg, #9ca3af, #6b7280)',
                clipPath: 'polygon(0 20%, 100% 0, 100% 100%, 0 80%)',
              }}
            />
          </div>
        </div>

        {/* Legs */}
        <div className="flex gap-0.5 -mt-0.5">
          <div className="w-3 h-5 rounded-b" style={{ background: '#1e40af' }} />
          <div className="w-3 h-5 rounded-b" style={{ background: '#1e40af' }} />
        </div>
        {/* Boots */}
        <div className="flex gap-0.5">
          <div className="w-4 h-2 rounded-b" style={{ background: '#292524' }} />
          <div className="w-4 h-2 rounded-b" style={{ background: '#292524' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Score Pop ───────────────────────────────────────────────────────────────
function ScorePop() {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 -top-4 text-amber-400 font-black text-sm pointer-events-none animate-score-pop z-20">
      +1
    </div>
  );
}

// ─── Main Tree Component ──────────────────────────────────────────────────────
export default function TreeSection({
  segments,
  playerSide,
  chopAnimation,
  isDeathAnimating,
  gameStatus,
}: Props) {
  const [isChopping, setIsChopping] = useState(false);
  const [treeShake, setTreeShake] = useState(false);
  const [scorePopKey, setScorePopKey] = useState<number | null>(null);
  const chopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trigger chop animation whenever chopAnimation changes
  useEffect(() => {
    if (!chopAnimation) return;

    setIsChopping(true);
    setTreeShake(true);
    setScorePopKey(chopAnimation.timestamp);

    if (chopTimerRef.current) clearTimeout(chopTimerRef.current);
    chopTimerRef.current = setTimeout(() => setIsChopping(false), CHOP_ANIM_DURATION);

    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = setTimeout(() => setTreeShake(false), CHOP_ANIM_DURATION);

    const popTimer = setTimeout(() => setScorePopKey(null), 400);
    return () => clearTimeout(popTimer);
  }, [chopAnimation]);

  const TRUNK_W = 56; // px — Tailwind w-14

  return (
    <div className="relative flex flex-col items-center w-full" style={{ minHeight: 460 }}>
      {/* Tree + player wrapper — shakes on chop */}
      <div
        className={`relative flex flex-col items-center ${treeShake && !isDeathAnimating ? 'animate-tree-shake' : ''} ${isDeathAnimating ? 'animate-death-shake' : ''}`}
        style={{ width: TRUNK_W + 200 }} // trunk + branch space each side
      >
        {/* Score pop */}
        {scorePopKey !== null && gameStatus === 'PLAYING' && (
          <ScorePop key={scorePopKey} />
        )}

        {/* Segments rendered top → bottom (array reversed) */}
        {[...segments].reverse().map((seg, idx) => {
          const isBottom = idx === segments.length - 1;
          return (
            <div
              key={seg.id}
              className="relative flex items-center justify-center"
              style={{ width: TRUNK_W + 200, height: 52 }}
            >
              {/* Left branch zone */}
              <div className="absolute right-1/2" style={{ marginRight: TRUNK_W / 2 }}>
                {seg.branch === 'LEFT' && <Branch side="LEFT" />}
              </div>

              {/* Trunk segment */}
              <div
                className="h-full z-10"
                style={{
                  width: TRUNK_W,
                  background: isBottom
                    ? 'linear-gradient(to right, #3b1e08, #7c4a1e, #a0592b, #7c4a1e, #3b1e08)'
                    : 'linear-gradient(to right, #4a2510, #8b4513, #a0522d, #8b4513, #4a2510)',
                  boxShadow: 'inset 0 0 8px rgba(0,0,0,0.3), 2px 0 4px rgba(0,0,0,0.2)',
                  borderTop: isBottom ? '2px solid rgba(0,0,0,0.3)' : undefined,
                }}
              >
                {/* Wood grain lines */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(0,0,0,0.3) 6px, rgba(0,0,0,0.3) 7px)',
                  }}
                />
              </div>

              {/* Right branch zone */}
              <div className="absolute left-1/2" style={{ marginLeft: TRUNK_W / 2 }}>
                {seg.branch === 'RIGHT' && <Branch side="RIGHT" />}
              </div>

              {/* Player at bottom segment */}
              {isBottom && gameStatus !== 'IDLE' && (
                <Player
                  side={playerSide}
                  isChopping={isChopping}
                  chopSide={chopAnimation?.side ?? null}
                  isDead={isDeathAnimating}
                />
              )}
            </div>
          );
        })}

        {/* Stump base */}
        <div
          className="z-10 rounded-b-lg"
          style={{
            width: TRUNK_W + 16,
            height: 20,
            background: 'linear-gradient(to bottom, #5c3311, #3b1e08)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
        />
        <div
          className="rounded-b-xl"
          style={{
            width: TRUNK_W + 32,
            height: 12,
            background: 'linear-gradient(to bottom, #3b1e08, #1c0e04)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.6)',
          }}
        />
      </div>
    </div>
  );
}
