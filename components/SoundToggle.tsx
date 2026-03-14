'use client';

interface Props {
  enabled: boolean;
  onToggle: () => void;
}

/** Sound on/off toggle button */
export default function SoundToggle({ enabled, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      title={enabled ? 'Mute sounds' : 'Enable sounds'}
      className="
        w-10 h-10 flex items-center justify-center rounded-xl
        bg-white/10 hover:bg-white/20 active:scale-95
        border border-white/20 text-white text-xl
        transition-all duration-150 select-none
      "
    >
      {enabled ? '🔊' : '🔇'}
    </button>
  );
}
