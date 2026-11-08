import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';

interface MarkdownContentProps {
  content: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content }) => {
  return (
    <div className="prose-dark text-[13.5px] leading-relaxed text-dark-100">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Code blocks & inline code
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 mx-0.5 rounded-md bg-dark-800 text-dark-200 font-mono text-[12.5px] border border-dark-750"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock
                language={match ? match[1] : 'text'}
                code={String(children)}
              />
            );
          },

          // Headings
          h1: ({ children }) => (
            <h1 className="text-lg font-bold text-white mt-4 mb-2 tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold text-white mt-3.5 mb-1.5 tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-white mt-3 mb-1 tracking-tight">
              {children}
            </h3>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className="mb-2.5 last:mb-0 text-dark-100/95 font-normal">
              {children}
            </p>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-4 mb-2.5 space-y-1 text-dark-200 marker:text-dark-400">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-4 mb-2.5 space-y-1 text-dark-200 marker:text-dark-400">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="pl-1">
              {children}
            </li>
          ),

          // Tables
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-dark-750">
              <table className="w-full text-left border-collapse text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-dark-850/80 text-dark-300 font-semibold border-b border-dark-750">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-dark-800 bg-dark-900/40">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-dark-800/40 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-dark-300 font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-dark-200">
              {children}
            </td>
          ),

          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-dark-600 pl-3 my-2 text-dark-400 italic">
              {children}
            </blockquote>
          ),

          // Strong / Bold
          strong: ({ children }) => (
            <strong className="font-semibold text-white">
              {children}
            </strong>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

