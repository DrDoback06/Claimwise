import React from 'react';

/**
 * LoadingSkeleton - Better perceived performance with skeleton loaders
 * Replaces spinners for a more polished loading experience
 */

export const TextSkeleton = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-slate-800 rounded animate-pulse"
          style={{
            width: i === lines - 1 ? '60%' : '100%',
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );
};

export const CardSkeleton = ({ className = '' }) => {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-lg p-4 ${className}`}>
      <div className="h-6 bg-slate-800 rounded w-3/4 mb-3 animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 bg-slate-800 rounded w-full animate-pulse" style={{ animationDelay: '0.1s' }} />
        <div className="h-4 bg-slate-800 rounded w-5/6 animate-pulse" style={{ animationDelay: '0.2s' }} />
      </div>
    </div>
  );
};

export const ListSkeleton = ({ items = 5, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-lg animate-pulse"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <div className="w-10 h-10 bg-slate-800 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-800 rounded w-1/3" />
            <div className="h-3 bg-slate-800 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 4, className = '' }) => {
  return (
    <div className={`${className}`}>
      <div className="space-y-2">
        {/* Header */}
        <div className="flex gap-4 pb-2 border-b border-slate-800">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-4 bg-slate-800 rounded flex-1 animate-pulse" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-4 py-2">
            {Array.from({ length: cols }).map((_, colIdx) => (
              <div
                key={colIdx}
                className="h-4 bg-slate-800 rounded flex-1 animate-pulse"
                style={{ animationDelay: `${(rowIdx * cols + colIdx) * 0.05}s` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const ChapterSkeleton = ({ className = '' }) => {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-lg p-6 ${className}`}>
      <div className="h-8 bg-slate-800 rounded w-1/2 mb-4 animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-slate-800 rounded animate-pulse"
            style={{
              width: i % 3 === 0 ? '100%' : i % 3 === 1 ? '95%' : '85%',
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export const EntityCardSkeleton = ({ className = '' }) => {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-slate-800 rounded-full animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-slate-800 rounded w-1/2 animate-pulse" />
          <div className="h-4 bg-slate-800 rounded w-3/4 animate-pulse" style={{ animationDelay: '0.1s' }} />
          <div className="flex gap-2 mt-2">
            <div className="h-6 bg-slate-800 rounded w-16 animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="h-6 bg-slate-800 rounded w-20 animate-pulse" style={{ animationDelay: '0.3s' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default {
  Text: TextSkeleton,
  Card: CardSkeleton,
  List: ListSkeleton,
  Table: TableSkeleton,
  Chapter: ChapterSkeleton,
  EntityCard: EntityCardSkeleton
};
