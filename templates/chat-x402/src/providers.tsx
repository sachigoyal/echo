"use client";

import { EchoProvider } from "@merit-systems/echo-next-sdk/client";
import { wagmiConfig } from "./lib/wagmi-config";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <EchoProvider
            config={{ appId: process.env.NEXT_PUBLIC_ECHO_APP_ID! }}
          >
            {children}
          </EchoProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
