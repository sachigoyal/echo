'use client';

import { EchoTestSuite } from '@/components/EchoTestSuite';

export default function Home() {
  return (
    <main className="container">
      <h1>Echo NextJS Provider Test Suite</h1>
      <p>
        This page tests various scenarios for EchoProvider rendering in NextJS
      </p>
      <EchoTestSuite />
    </main>
  );
}
