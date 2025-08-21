import { source } from '@/lib/source';
import { CollapsibleControl, DocsLayout } from 'fumadocs-ui/layouts/docs';
import { MobileSidebarTrigger } from './mobile-sidebar-trigger';

import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

const baseOptions: BaseLayoutProps = {
  links: [
    {
      text: 'Terminal',
      url: 'https://terminal.merit.systems',
      external: true,
    },
  ],
};

export default function Layout({ children }: LayoutProps<'/docs'>) {
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
