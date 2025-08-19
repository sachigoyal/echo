'use client';

import { useSidebar } from 'fumadocs-ui/provider';
import { Menu } from 'lucide-react';

export const MobileSidebarTrigger = () => {
  const { setOpen } = useSidebar();

  return (
    <button
      className="md:hidden fixed bottom-4 right-4 z-50 p-3 bg-fd-card border rounded-full shadow-lg hover:bg-fd-accent transition-colors"
      onClick={() => setOpen(true)}
      aria-label="Open sidebar"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
};
