import { SiNextdotjs, SiReact } from '@icons-pack/react-simple-icons';
import { AppWindow, BotMessageSquare, Image } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import type { TemplateGroup } from './types';

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
          id: 'next-chat',
          title: 'Chatbot',
          description:
            'A full-stack chatbot application using Next.js and the Vercel AI SDK.',
          Icon: BotMessageSquare,
          url: 'https://echo-next-chat.vercel.app/',
        },
        {
          id: 'next-image',
          title: 'Image Generation',
          description:
            'A full-stack image generation application using Next.js and the Vercel AI SDK.',
          Icon: Image,
          url: 'https://echo-next-image.vercel.app/',
        },
        {
          id: 'next',
          title: 'Boilerplate',
          description:
            'A minimal Next.js application configured with Echo - a blank canvas to build your app.',
          Icon: AppWindow,
          url: 'https://echo-next-boilerplate.vercel.app/',
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
          id: 'react-chat',
          title: 'Chatbot',
          description:
            'A client-side chatbot application using React and the Vercel AI SDK.',
          Icon: BotMessageSquare,
          url: 'https://echo-react-chat.vercel.app/',
        },
        {
          id: 'react-image',
          title: 'Image Generation',
          description:
            'A client-side image generation application using React and the Vercel AI SDK.',
          Icon: Image,
          url: 'https://echo-react-image.vercel.app/',
        },
        {
          id: 'react',
          title: 'Boilerplate',
          description:
            'A minimal React application configured with Echo - a blank canvas to build your app.',
          Icon: AppWindow,
          url: 'https://echo-react-boilerplate.vercel.app/',
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
