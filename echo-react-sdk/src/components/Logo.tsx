import React from 'react';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  variant?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  width = 16,
  height = 16,
  variant = 'light',
}) => {
  const logoSrc = variant === 'dark' ? '/logo/dark.svg' : '/logo/light.svg';

  return (
    <img
      src={logoSrc}
      alt="Echo Logo"
      className={className}
      width={width}
      height={height}
    />
  );
};
