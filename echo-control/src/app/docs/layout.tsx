import { source } from '@/lib/source';
import { CollapsibleControl, DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { Navbar } from '@/app/_components/navbar';
import { MobileSidebarTrigger } from './mobile-sidebar-trigger';

const baseOptions: BaseLayoutProps = {
  nav: {
    component: <Navbar />,
  },
  links: [
    {
      text: 'Terminal',
      url: 'https://terminal.merit.systems',
      external: true,
    },
  ],
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      {...baseOptions}
      sidebar={{
        collapsible: true,
      }}
    >
      {/* Hack: move collapsible control below the default layout navbar. */}
      <div
        style={
          {
            '--fd-banner-height': '4rem',
          } as React.CSSProperties
        }
      >
        <CollapsibleControl />
        <MobileSidebarTrigger />
      </div>
      {children}
    </DocsLayout>
  );
}
