import React from 'react';

import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { Route } from 'next';

type Link = {
  title: string;
} & (
  | {
      external: true;
      href: string;
    }
  | {
      external?: undefined;
      href: Route;
    }
);

const links: Link[] = [
  {
    title: 'About Merit',
    href: 'https://merit.systems',
    external: true,
  },
  {
    title: 'Terms of Service',
    href: '/terms',
  },
  {
    title: 'Privacy Policy',
    href: '/privacy',
  },
];

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t bg-card border-dashed p-2 md:p-4 text-sm flex flex-col md:flex-row items-center gap-4">
      <div className="flex min-w-[200px] flex-1 flex-col">
        <Link href="/" className="">
          <div className="flex h-full cursor-pointer items-center gap-2">
            <Logo className="size-8" />
            <h1 className="text-base font-bold">
              Echo <span className="font-light">by</span>{' '}
              <span className="font-medium">Merit</span>
              <span className="font-light">Systems</span>
            </h1>
          </div>
        </Link>
      </div>
      <div className="flex gap-4">
        {links.map(link =>
          link.external ? (
            <a key={link.title} href={link.href} target="_blank">
              {link.title}
            </a>
          ) : (
            <Link key={link.title} href={link.href}>
              {link.title}
            </Link>
          )
        )}
      </div>
    </footer>
  );
};

const linkClassName =
  'text-muted-foreground hover:text-foreground hover:underline cursor-pointer';
