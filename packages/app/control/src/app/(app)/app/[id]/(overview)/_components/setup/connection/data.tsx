import { SiNextdotjs, SiReact } from '@icons-pack/react-simple-icons';
import { TemplateGroup } from './types';
import { BotMessageSquare, Image } from 'lucide-react';

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
        command: (appId: string) =>
          `pnpm create next-app --template nextjs-chatbot ${appId}`,
      },
      {
        id: 'next-imagegen',
        title: 'Image Generation',
        description:
          'A full-stack image generation application using Next.js and the Vercel AI SDK.',
        Icon: Image,
        command: (appId: string) =>
          `pnpm create next-app --template nextjs-imagegen ${appId}`,
      },
    ],
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
        command: (appId: string) =>
          `pnpm create react-app --template react-chatbot ${appId}`,
      },
      {
        id: 'react-imagegen',
        title: 'Image Generation',
        description:
          'A client-side image generation application using React and the Vercel AI SDK.',
        Icon: Image,
        command: (appId: string) =>
          `pnpm create react-app --template react-imagegen ${appId}`,
      },
    ],
  },
];
