import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';

const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <>
        <Image
          src="/logo/light.svg"
          alt="Echo"
          width={80}
          height={24}
          className="dark:hidden"
        />
        <Image
          src="/logo/dark.svg"
          alt="Echo"
          width={80}
          height={24}
          className="hidden dark:block"
        />
        <span className="sr-only">Echo</span>
      </>
    ),
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
    <DocsLayout tree={source.pageTree} {...baseOptions}>
      {children}
    </DocsLayout>
  );
}
