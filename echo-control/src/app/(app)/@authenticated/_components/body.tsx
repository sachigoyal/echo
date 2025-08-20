import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export const Body = ({ children }: Props) => {
  return (
    <div className="flex flex-col gap-4 max-w-4xl w-full mx-auto py-8 px-2">
      {children}
    </div>
  );
};
