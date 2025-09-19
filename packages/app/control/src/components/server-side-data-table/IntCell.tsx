import React from 'react';

interface IntCellProps {
  value: number | string | null | undefined;
  showCommas?: boolean;
  className?: string;
}

export function IntCell({
  value,
  showCommas = true,
  className = '',
}: IntCellProps) {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">No value</span>;
  }

  const numericValue =
    typeof value === 'string' ? parseInt(value) || 0 : Math.floor(value);
  const formattedValue = showCommas
    ? numericValue.toLocaleString()
    : numericValue.toString();

  return (
    <span className={`font-mono text-sm ${className}`}>{formattedValue}</span>
  );
}
