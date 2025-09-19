import React from 'react';

interface EmailCellProps {
  emails: string[];
  label?: string;
  bgColor?: string;
  emptyText?: string;
  className?: string;
}

export function EmailCell({
  emails,
  label = 'email',
  bgColor = 'bg-gray-50',
  emptyText = 'No emails',
  className = '',
}: EmailCellProps) {
  const count = emails.length;
  const tooltipContent = emails.length > 0 ? emails.join(', ') : emptyText;
  const displayText =
    count > 0 ? `${count} ${label}${count === 1 ? '' : 's'}` : emptyText;

  return (
    <div className="relative group">
      <span
        className={`font-mono text-sm ${bgColor} px-2 py-1 rounded cursor-help ${className}`}
      >
        {displayText}
      </span>
      <div className="absolute z-50 invisible group-hover:visible bg-gray-900 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap max-w-xs">
        {tooltipContent}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
}
