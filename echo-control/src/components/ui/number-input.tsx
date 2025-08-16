import React from 'react';

import { Input } from '@/components/ui/input';

import { cn } from '@/lib/utils';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  setValue: (value: string) => void;
  value?: string;
  initialValue?: string;
  placeholder?: string;
  prefixClassName?: string;
  className?: string;
  inputClassName?: string;
  hideHashSign?: boolean;
  icon?: React.ReactNode;
}

export const NumberInput: React.FC<Props> = ({
  setValue,
  value,
  initialValue,
  placeholder,
  className,
  inputClassName,
  prefixClassName,
  hideHashSign,
  icon,
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  return (
    <div
      className={cn(
        'border-border bg-card flex h-fit flex-row items-center overflow-hidden rounded-md border-2 pr-1 transition-colors duration-200',
        'focus-within:border-ring/80 focus-within:ring-ring/50 focus-within:ring-[3px]',
        className
      )}
    >
      <div
        className={cn(
          'bg-foreground/10 flex aspect-square size-12 h-full items-center justify-center text-lg opacity-60',
          prefixClassName,
          hideHashSign && 'hidden'
        )}
      >
        {icon || '#'}
      </div>
      <Input
        {...props}
        type="text"
        placeholder={placeholder}
        onChange={handleChange}
        value={value}
        className={cn(
          'h-fit w-full [appearance:textfield] border-none bg-transparent px-3 py-0 font-bold shadow-none dark:bg-transparent [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          'text-xl ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 md:text-xl',
          inputClassName
        )}
        defaultValue={initialValue}
      />
    </div>
  );
};
