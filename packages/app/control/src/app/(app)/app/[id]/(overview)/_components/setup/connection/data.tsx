import { SiNextdotjs, SiReact } from '@icons-pack/react-simple-icons';
import { TemplateGroup } from './types';
import { AppWindow, BotMessageSquare, Image, Presentation } from 'lucide-react';
import Link from 'next/link';
import { Route } from 'next';

export const TEMPLATES: TemplateGroup = {
  id: 'frameworks',
  title: 'Frameworks',
  type: 'subgroup',
  description: 'Get started with a framework.',
  Icon: () => null,
  moreAdvanced: (
    <>
      Don&apos;t see the framework you&apos;re looking for? Check our{' '}
      <Link
        href={'/docs' as Route}
        className="text-primary underline font-medium"
        target="_blank"
      >
        docs
      </Link>{' '}
      for more advanced configurations.
    </>
  ),
  subtitle: 'Choose a Framework',
  options: [
    {
      id: 'next',
      title: 'Next.js',
      description: 'Get started with a full-stack Next.js application.',
      Icon: SiNextdotjs,
      type: 'templates',
      subtitle: 'Choose a Next.js Template',
      options: [
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
        {
          id: 'next',
          title: 'Boilerplate',
          description:
            'A minimal Next.js application configured with Echo - a blank canvas to build your app.',
          Icon: AppWindow,
        },
      ],
      moreAdvanced: (
        <>
          Not exactly what you&apos;re looking for? See our full list of
          templates{' '}
          <Link
            href={'/docs/getting-started/templates'}
            className="text-primary underline font-medium"
            target="_blank"
          >
            here
          </Link>
          .
        </>
      ),
    },
    {
      id: 'react',
      title: 'React',
      description: 'Get started with a client-side React + Vite application.',
      Icon: SiReact,
      type: 'templates',
      subtitle: 'Choose a React Template',
      options: [
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
        {
          id: 'react',
          title: 'Boilerplate',
          description:
            'A minimal React application configured with Echo - a blank canvas to build your app.',
          Icon: AppWindow,
        },
      ],
      moreAdvanced: (
        <>
          Not exactly what you&apos;re looking for? See our full list of
          templates{' '}
          <Link
            href={'/docs/getting-started/templates'}
            className="text-primary underline font-medium"
            target="_blank"
          >
            here
          </Link>
          .
        </>
      ),
    },
  ],
};
