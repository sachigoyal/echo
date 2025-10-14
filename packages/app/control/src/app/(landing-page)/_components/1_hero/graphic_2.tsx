'use client';

import Image from 'next/image';
import React, { useEffect } from 'react';

import { Users } from 'lucide-react';
import { motion, useAnimate } from 'motion/react';

import { CardStack } from '@/components/ui/card-stack';

import { formatCurrency } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';

export const Login = () => {
    return (
        <div className="size-full flex items-end justify-center">
            <div className="h-36 w-full">
                <CardStack
                    items={cards.map(card => ({
                        key: card.title,
                        content: <Card {...card} />,
                    }))}
                />
            </div>
        </div>
    );
};

const cards: CardProps[] = [
    {
        image: '/images/toolkit.svg',
        title: 'Toolkit.dev',
        description: 'Configurable tool-calling chatbot with generative UI',
        author: 'Jason Hedman',
        earnings: 156.78,
        users: 561,
    },
    {
        image: '/images/shirtslop.png',
        title: 'Shirtslop',
        description: 'Generate and print custom shirts from AI images',
        author: 'Ryan Sproule',
        earnings: 212.91,
        users: 123,
    },
    {
        image: '/images/vibes.png',
        title: 'EchoVibes',
        description: "An improved fork of Vercel's OSS vibe coding app.",
        author: 'Sam Ragsdale',
        earnings: 348.63,
        users: 488,
    },
];

interface CardProps {
    image: string;
    title: string;
    author: string;
    description: string;
    earnings: number;
    users: number;
}

const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
    const [displayValue, setDisplayValue] = React.useState(0);

    useEffect(() => {
        // Start animation after flip completes (500ms delay + 600ms flip = 1100ms)
        const timeout = setTimeout(() => {
            const duration = 1000; // 1 second to count up
            const startTime = Date.now();
            const startValue = 0;

            const animate = () => {
                const now = Date.now();
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = startValue + (value - startValue) * eased;

                setDisplayValue(current);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            requestAnimationFrame(animate);
        }, 1100);

        return () => clearTimeout(timeout);
    }, [value]);

    return (
        <span className="tabular-nums">
            {formatCurrency(displayValue)}
        </span>
    );
};

const Card: React.FC<CardProps> = ({
    image,
    title,
    description,
    author,
    earnings,
    users,
}) => {
    const [flipped, setFlipped] = React.useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setFlipped(true);
        }, 500);

        return () => clearTimeout(timeout);
    }, []);

    return (
        <div className="flex flex-col gap-2 p-2 size-full">

            <div className="flex items-center gap-2 border-b pb-2 justify-between">
                <div className="flex gap-2">
                    <Image
                        src={image}
                        alt={title}
                        width={20}
                        height={20}
                        className="size-6"
                    />
                    <div>
                        <h3 className="font-bold">{title}</h3>
                    </div>
                </div>
                <div style={{ perspective: '1000px' }}>
                    <motion.div
                        className="relative w-[96px] h-8 md:h-9"
                        style={{ transformStyle: 'preserve-3d' }}
                        animate={{
                            rotateY: flipped ? 180 : 0,
                        }}
                        transition={{
                            duration: 0.6,
                            ease: 'easeInOut',
                        }}
                    >
                        {/* Front side */}
                        <div
                            className="absolute inset-0"
                            style={{
                                backfaceVisibility: 'hidden',
                            }}
                        >
                            <button className="w-full h-full inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md text-xs md:text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed gap-2 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 px-2">
                                <Logo className="size-4" />
                                <span className="text-xs">Connect</span>
                            </button>
                        </div>

                        {/* Back side */}
                        <div
                            className="absolute inset-0"
                            style={{
                                backfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)',
                            }}
                        >
                            <button className="w-full h-full inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md text-xs md:text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed gap-2 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 px-2">
                                <Logo className="size-4" />
                                <span className="text-xs font-bold text-primary">
                                    <AnimatedNumber value={84.29} />
                                </span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>

            <p className="text-xs text-muted-foreground">{description}</p>
            <div className="flex items-center justify-between gap-2 mt-auto">
                <p className="text-xs text-primary font-bold">
                    {formatCurrency(earnings)}
                </p>
                <div className="flex items-center gap-1 text-muted-foreground">
                    <p className="text-xs">{users.toLocaleString()}</p>
                    <Users className="size-3" />
                </div>
            </div>
        </div>
    );
};



export const HeroGraphic2 = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
      <div>
        <Login />
      </div>
      <div>
        stuff
      </div>
    </div>
  );
};