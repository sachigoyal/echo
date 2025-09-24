import React from 'react';

interface DateCellProps {
  date: Date | null | undefined;
  className?: string;
  emptyText?: string;
}

export function DateCell({
  date,
  className = '',
  emptyText = 'No date',
}: DateCellProps) {
  if (!date) {
    return <span className="text-gray-400 italic">{emptyText}</span>;
  }

  const fullDate = new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const shortDate = new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="relative group">
      <span
        className={`font-mono text-sm text-gray-600 block truncate max-w-[144px] cursor-help ${className}`}
      >
        {shortDate}
      </span>
      <div className="absolute z-50 invisible group-hover:visible bg-gray-900 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
        {fullDate}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
}
