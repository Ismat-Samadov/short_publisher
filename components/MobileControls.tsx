'use client';

import { Side } from '@/lib/types';

interface Props {
  onChop: (side: Side) => void;
  disabled: boolean;
}

/** Full-width tap zones for mobile gameplay (below the tree) */
export default function MobileControls({ onChop, disabled }: Props) {
  const base = `
    flex-1 flex items-center justify-center gap-2
    py-5 rounded-2xl text-base font-bold text-white
    select-none active:scale-95 transition-all duration-100
    border
  `;

  return (
    <div className="w-full flex gap-3 mt-2">
      <button
        onPointerDown={e => {
          e.preventDefault();
          if (!disabled) onChop('LEFT');
        }}
        disabled={disabled}
        className={`${base} bg-blue-500/20 hover:bg-blue-500/30 border-blue-400/30 active:bg-blue-500/40`}
      >
        ⬅️ Chop Left
      </button>

      <button
        onPointerDown={e => {
          e.preventDefault();
          if (!disabled) onChop('RIGHT');
        }}
        disabled={disabled}
        className={`${base} bg-orange-500/20 hover:bg-orange-500/30 border-orange-400/30 active:bg-orange-500/40`}
      >
        Chop Right ➡️
      </button>
    </div>
  );
}
