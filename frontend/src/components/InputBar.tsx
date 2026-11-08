import React, { useState, useRef, useEffect } from 'react';
import { Send, CornerDownLeft } from 'lucide-react';

interface InputBarProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

export const InputBar: React.FC<InputBarProps> = ({ onSubmit, isLoading }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea to fit multiline content up to max-height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = text.trim();
    if (!clean || isLoading) return;
    onSubmit(clean);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pointer-events-none flex justify-center">
      <div className="w-full max-w-3xl pointer-events-auto">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center bg-dark-900/95 hover:bg-dark-900 border border-dark-750 focus-within:border-dark-600 rounded-3xl p-1.5 shadow-2xl backdrop-blur-xl transition-all duration-150"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Задайте вопрос всем моделям"
            disabled={isLoading}
            className="w-full resize-none bg-transparent px-4 py-2.5 text-sm text-white placeholder-dark-400 focus:outline-none max-h-44 scrollbar-none font-sans"
          />

          <button
            type="submit"
            disabled={!text.trim() || isLoading}
            className="flex-shrink-0 w-9 h-9 rounded-full bg-white hover:bg-dark-100 disabled:opacity-30 disabled:hover:bg-white text-black flex items-center justify-center transition-all duration-150 shadow-md ml-1.5"
            title="Отправить вопрос"
          >
            <Send className="w-4 h-4 ml-0.5 fill-current" />
          </button>
        </form>
      </div>
    </div>
  );
};

