import React, { useState } from 'react';
import { ChevronDown, Clock } from 'lucide-react';

interface ThinkingBlockProps {
  thinking: string;
  durationSeconds?: number;
}

export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({
  thinking,
  durationSeconds = 4,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!thinking || !thinking.trim()) {
    return null;
  }

  const roundedDuration = Math.max(1, Math.round(durationSeconds));
  const pluralSeconds = (sec: number) => {
    if (sec % 10 === 1 && sec % 100 !== 11) return 'секунду';
    if ([2, 3, 4].includes(sec % 10) && ![12, 13, 14].includes(sec % 100)) return 'секунды';
    return 'секунд';
  };

  return (
    <div className="mb-3 border-b border-dark-800 pb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs text-dark-400 hover:text-dark-200 transition-colors select-none group"
      >
        <Clock className="w-3.5 h-3.5 text-dark-500 group-hover:text-dark-300" />
        <span>Думала {roundedDuration} {pluralSeconds(roundedDuration)}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="mt-2.5 p-3 rounded-lg bg-dark-900/60 border border-dark-800/80 text-xs text-dark-400 font-mono leading-relaxed whitespace-pre-wrap">
          {thinking}
        </div>
      )}
    </div>
  );
};

