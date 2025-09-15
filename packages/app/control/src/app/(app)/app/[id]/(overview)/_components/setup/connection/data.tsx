import { SiNextdotjs, SiReact } from '@icons-pack/react-simple-icons';
import { TemplateGroup } from './types';
import { BotMessageSquare, Image } from 'lucide-react';
import Link from 'next/link';
import { Route } from 'next';

export const TEMPLATES: TemplateGroup[] = [
  {
    id: 'next',
    title: 'Next.js',
    description: 'Get started with a full-stack Next.js application.',
    Icon: SiNextdotjs,
    type: 'templates',
    templates: [
      {
        id: 'next-chatbot',
        title: 'Chatbot',
        description:
          'A full-stack chatbot application using Next.js and the Vercel AI SDK.',
        Icon: BotMessageSquare,
      },
      {
        id: 'next-imagegen',
        title: 'Image Generation',
        description:
          'A full-stack image generation application using Next.js and the Vercel AI SDK.',
        Icon: Image,
      },
    ],
    moreAdvanced: (
      <>
        Don't see the framework you're looking for? Check our{' '}
        <Link
          href={'/docs' as Route}
          className="text-primary underline font-medium"
        >
          docs
        </Link>{' '}
        for more advanced configurations.
      </>
    ),
  },
  {
    id: 'react',
    title: 'React',
    description: 'Get started with a simple React application.',
    Icon: SiReact,
    type: 'templates',
    templates: [
      {
        id: 'react-chatbot',
        title: 'Chatbot',
        description:
          'A client-side chatbot application using React and the Vercel AI SDK.',
        Icon: BotMessageSquare,
      },
      {
        id: 'react-imagegen',
        title: 'Image Generation',
        description:
          'A client-side image generation application using React and the Vercel AI SDK.',
        Icon: Image,
      },
    ],
    moreAdvanced: (
      <>
        Not exactly what you're looking for? See our full list of templates{' '}
        <Link
          href={'/docs/getting-started/templates'}
          className="text-primary underline font-medium"
        >
          here
        </Link>
        .
      </>
    ),
  },
];
