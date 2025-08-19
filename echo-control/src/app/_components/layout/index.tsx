import { ReactNode } from 'react';
import { Navbar } from '../navbar';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <>
      <Navbar />
      <main className="w-screen overflow-x-hidden flex-1">{children}</main>
    </>
  );
};
