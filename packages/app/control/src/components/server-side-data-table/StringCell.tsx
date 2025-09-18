import React from 'react';

interface StringCellProps {
  value: string | null | undefined;
  maxWidth?: string;
  emptyText?: string;
  className?: string;
}

export function StringCell({
  value,
  maxWidth = 'max-w-36',
  emptyText = 'No value',
  className = '',
}: StringCellProps) {
  if (!value) {
    return <span className="text-gray-400 italic">{emptyText}</span>;
  }

  const needsTooltip = value.length > 20; // Rough estimate for when truncation might occur

  if (needsTooltip) {
    return (
      <div className="relative group">
        <span
          className={`text-sm block truncate ${maxWidth} cursor-help ${className}`}
        >
          {value}
        </span>
        <div className="absolute z-50 invisible group-hover:visible bg-gray-900 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap max-w-xs">
          {value}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <span className={`text-sm block truncate ${maxWidth} ${className}`}>
      {value}
    </span>
  );
}
