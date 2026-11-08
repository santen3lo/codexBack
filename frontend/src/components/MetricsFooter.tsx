import React, { useState } from 'react';
import { ModelMetrics } from '../types';
import { Zap, Tag, Info } from 'lucide-react';

interface MetricsFooterProps {
  metrics: ModelMetrics;
  isFastest?: boolean;
  isCheapest?: boolean;
}

export const MetricsFooter: React.FC<MetricsFooterProps> = ({
  metrics,
  isFastest = false,
  isCheapest = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Format Russian decimal separator: 1.4 -> 1,4 с
  const timeFormatted = metrics.total_seconds.toFixed(1).replace('.', ',');
  const costFormatted = `$${metrics.cost_usd.toFixed(4)}`;

  return (
    <div className="mt-4 pt-3 border-t border-dark-800/80 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Main metric line matching Figma: "1,4 с · $0,0009" */}
        <div className="flex items-center gap-2 text-dark-400 font-mono text-[12px]">
          <span>{timeFormatted} с</span>
          <span className="text-dark-600">·</span>
          <span>{costFormatted}</span>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-dark-500 hover:text-dark-300 ml-1 transition-colors"
            title="Подробные метрики токенов и TTFT"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Highlighting badges for Fastest / Cheapest */}
        <div className="flex items-center gap-1.5">
          {(metrics.is_fastest || isFastest) && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/70 text-emerald-400 border border-emerald-800/60"
              title="Самое быстрое время генерации среди моделей"
            >
              <Zap className="w-3 h-3" />
              Быстрее всех
            </span>
          )}

          {(metrics.is_cheapest || isCheapest) && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-950/70 text-indigo-300 border border-indigo-800/60"
              title="Самая низкая стоимость запроса"
            >
              <Tag className="w-3 h-3" />
              Дешевле всех
            </span>
          )}
        </div>
      </div>

      {/* Expanded detailed metrics drawer */}
      {showDetails && (
        <div className="mt-2.5 p-2.5 rounded-lg bg-dark-900 border border-dark-800 text-[11.5px] text-dark-300 grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono">
          <div>
            <span className="text-dark-500 font-sans">TTFT (1-й токен): </span>
            <span className="text-dark-200">{metrics.ttft_seconds.toFixed(2)} с</span>
          </div>
          <div>
            <span className="text-dark-500 font-sans">Общее время: </span>
            <span className="text-dark-200">{metrics.total_seconds.toFixed(2)} с</span>
          </div>
          <div>
            <span className="text-dark-500 font-sans">Входных токенов: </span>
            <span className="text-dark-200">{metrics.input_tokens}</span>
          </div>
          <div>
            <span className="text-dark-500 font-sans">Выходных токенов: </span>
            <span className="text-dark-200">{metrics.output_tokens}</span>
          </div>
        </div>
      )}
    </div>
  );
};

