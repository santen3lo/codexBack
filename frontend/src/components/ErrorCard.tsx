import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorCardProps {
  message?: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({
  message = 'Модель не ответила за 60 секунд',
  onRetry,
  isRetrying = false,
}) => {
  return (
    <div className="p-4 rounded-2xl bg-dark-900 border border-dark-750 text-left my-2 shadow-sm">
      {/* Icon */}
      <div className="w-7 h-7 rounded-full bg-dark-800 flex items-center justify-center text-dark-300 mb-3">
        <AlertCircle className="w-4 h-4 text-dark-400" />
      </div>

      {/* Main error header */}
      <h4 className="text-sm font-semibold text-white mb-1.5 leading-snug">
        {message}
      </h4>

      {/* Explanatory text matching mockup */}
      <p className="text-xs text-dark-400 mb-4 leading-relaxed">
        Остальные ответы сохранены. Можно повторить запрос только к этой модели.
      </p>

      {/* Retry button */}
      <button
        onClick={onRetry}
        disabled={isRetrying}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-750 active:bg-dark-700 border border-dark-700 text-xs font-medium text-dark-200 hover:text-white transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RotateCcw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
        <span>{isRetrying ? 'Повторяем...' : 'Повторить'}</span>
      </button>
    </div>
  );
};

