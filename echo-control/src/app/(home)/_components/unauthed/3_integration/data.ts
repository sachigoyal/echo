interface Integration {
  name: string;
  content: string;
}

export const integrations: Integration[] = [
  {
    name: 'Next.js',
    content: `// app/api/echo/[...path].ts
    
import { Echo } from '@merit-systems/echo-next';

export const { GET, POST } = Echo({
    appId: process.env.ECHO_APP_ID,
    getToken: (req: NextRequest) => ""
});`,
  },
  {
    name: 'React',
    content: `// app.tsx
import { EchoProvider } from '@merit-systems/echo-react';

<EchoProvider appId={appId}>
    // your app
</EchoProvider>

// chat.tsx

import { streamText } from '@merit-systems/echo-react';

const response = await streamText({
    model: "gpt-4o-mini",
    prompt: "Hello, how are you?",
})`,
  },
];
