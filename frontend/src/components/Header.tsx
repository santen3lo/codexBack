import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';

interface HeaderProps {
  onNewComparison: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNewComparison }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-dark-800 bg-dark-950/85 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between">
      {/* Brand logo & title */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1 text-white">
          <span className="w-1.5 h-4 bg-white rounded-full inline-block" />
          <span className="w-1.5 h-4 bg-white rounded-full inline-block" />
          <span className="w-1.5 h-4 bg-white rounded-full inline-block" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-white select-none">
          LLM Compare
        </span>
      </div>

      {/* Top right actions */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-dark-300 hover:text-white bg-dark-850 hover:bg-dark-800 border border-dark-750 rounded-lg transition-colors duration-150"
          title="Скопировать ссылку на это сравнение"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Ссылка скопирована</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Скопировать ссылку</span>
            </>
          )}
        </button>

        <button
          onClick={onNewComparison}
          className="px-3.5 py-1.5 text-xs font-semibold text-black bg-white hover:bg-dark-100 rounded-full transition-colors duration-150 shadow-sm"
        >
          Новое сравнение
        </button>
      </div>
    </header>
  );
};
