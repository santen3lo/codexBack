import React, { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-markdown';

interface CodeBlockProps {
  language?: string;
  code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language = 'text', code }) => {
  const [copied, setCopied] = useState(false);

  const cleanCode = code.replace(/\n$/, '');

  useEffect(() => {
    Prism.highlightAll();
  }, [cleanCode, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  const displayLang = language.toLowerCase();

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-dark-750 bg-dark-900/90 font-mono text-xs">
      {/* Code Header */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-dark-800 bg-dark-850/60 text-dark-400 select-none">
        <span className="font-sans text-[11px] font-medium uppercase tracking-wider text-dark-400">
          {displayLang}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] font-medium text-dark-300 hover:text-white transition-colors"
          title="Скопировать код"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Скопировано</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <div className="p-3.5 overflow-x-auto text-[13px] leading-relaxed">
        <pre className={`language-${displayLang}`}>
          <code>{cleanCode}</code>
        </pre>
      </div>
    </div>
  );
};

