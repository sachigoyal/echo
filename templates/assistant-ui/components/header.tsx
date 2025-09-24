'use client';

import { EchoTokens } from '@merit-systems/echo-next-sdk/client';
import Image from 'next/image';

export const Header = () => {
  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-3">
        <Image
          src="/manifest/192x192.png"
          alt="Echo logo"
          width={32}
          height={32}
        />
        <span className="font-semibold">Echo Chat</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Balance and User Info */}
        <EchoTokens />
      </div>
    </header>
  );
};
