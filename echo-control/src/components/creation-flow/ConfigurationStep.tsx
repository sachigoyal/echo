'use client';

import React from 'react';
import { Copy, ChevronRight } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../ui/card';
import { Button } from '../ui/button';
import { BaseStepProps } from './types';
import { useCopyCode } from '@/hooks/useCopyCode';

interface ConfigurationStepProps extends BaseStepProps {
  createdAppId: string;
}

const ConfigurationStep = ({
  isTransitioning,
  createdAppId,
}: ConfigurationStepProps) => {
  const { handleCopyCode } = useCopyCode();

  // Always can proceed from configuration step (it's informational)
  if (!createdAppId) {
    return (
      <div
        className={`transition-all duration-300 ${isTransitioning ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'}`}
      >
        <div className="flex items-center space-x-3 mb-4 sm:mb-6">
          <ChevronRight className="h-5 w-5 text-secondary" />
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
            Review your configuration
          </h2>
        </div>

        <div className="relative mb-6 sm:mb-8">
          <Card className="text-center">
            <CardContent className="p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-secondary border-t-transparent mx-auto mb-4"></div>
              <CardTitle className="text-lg mb-2">
                Creating your Echo app...
              </CardTitle>
              <CardDescription>
                Please wait while we generate your configuration
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const createReactAppCommand =
    'npx create-react-app . --template typescript --yes';

  const installCommand = 'npm install @zdql/echo-react-sdk openai';

  const importsCode = `import { EchoProvider, useEcho } from '@zdql/echo-react-sdk';
import OpenAI from 'openai';
import { useState } from 'react';`;

  const configCode = `const echoConfig = {
  appId: '${createdAppId}',
  apiUrl: 'https://echo.merit.systems',
  redirectUri: window.location.origin,
};`;

  const chatInterfaceCode = `function ChatInterface() {
  const { user, token, signIn, isAuthenticated } = useEcho();
  const openai = new OpenAI({
    apiKey: token || '',
    baseURL: 'https://echo.router.merit.systems',
    dangerouslyAllowBrowser: true,
  });
  const [response, setResponse] = useState('');
  const [input, setInput] = useState('');

  const getMessage = async () => {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: input }],
    });
    setResponse(response.choices[0].message.content || '');
  };
  
  return (
    <div>
      {!isAuthenticated ? (
        <button onClick={signIn}>Sign In</button>
      ) : (
        <div>
          <p>Welcome, {user?.email}!</p>
        </div>
      )}
      <input 
        type="text" 
        value={input} 
        onChange={(e) => setInput(e.target.value)} 
        placeholder="Type your message..."
      />
      <button onClick={getMessage}>Get Message</button>
      <p>{response}</p>
    </div>
  );
}`;

  const rootComponentCode = `function Root() {
  return (
    <EchoProvider config={echoConfig}>
      <ChatInterface />
    </EchoProvider>
  );
}

export default Root;`;

  const completeExampleCode = `import { EchoProvider, useEcho } from '@zdql/echo-react-sdk';
import OpenAI from 'openai';
import { useState } from 'react';

const echoConfig = {
  appId: '${createdAppId}',
  apiUrl: 'https://echo.merit.systems',
  redirectUri: window.location.origin,
};

function ChatInterface() {
  const { user, token, signIn, isAuthenticated } = useEcho();
  const openai = new OpenAI({
    apiKey: token || '',
    baseURL: 'https://echo.router.merit.systems',
    dangerouslyAllowBrowser: true,
  });
  const [response, setResponse] = useState('');
  const [input, setInput] = useState('');

  const getMessage = async () => {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: input }],
    });
    setResponse(response.choices[0].message.content || '');
  };
  
  return (
    <div>
      {!isAuthenticated ? (
        <button onClick={signIn}>Sign In</button>
      ) : (
        <div>
          <p>Welcome, {user?.email}!</p>
        </div>
      )}
      <input 
        type="text" 
        value={input} 
        onChange={(e) => setInput(e.target.value)} 
        placeholder="Type your message..."
      />
      <button onClick={getMessage}>Get Message</button>
      <p>{response}</p>
    </div>
  );
}

function Root() {
  return (
    <EchoProvider config={echoConfig}>
      <ChatInterface />
    </EchoProvider>
  );
}

export default Root;`;

  return (
    <div
      className={`transition-all duration-300 ${isTransitioning ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'}`}
    >
      <div className="flex items-center space-x-3 mb-4 sm:mb-6">
        <ChevronRight className="h-5 w-5 text-secondary" />
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          Review your configuration
        </h2>
      </div>

      {/* Configuration Content */}
      <div className="relative mb-6 sm:mb-8">
        <div className="space-y-6 w-full">
          {/* Section 0: Create React App */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-lg">
                0. Create a new React app
              </CardTitle>
              <CardDescription>
                We&apos;ll create a new React app to host our Echo app. This
                will be the root of your application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-foreground font-mono whitespace-pre-wrap break-words">
                  <code>{createReactAppCommand}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Section 1: Install Dependencies */}
          <Card className="w-full">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <CardTitle className="text-lg">
                  1. Install Dependencies
                </CardTitle>
                <Button
                  variant="secondaryOutline"
                  size="sm"
                  onClick={() => handleCopyCode(installCommand)}
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
              <CardDescription>
                Install the Echo React SDK and OpenAI packages in your React
                app.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-foreground font-mono whitespace-pre-wrap break-words">
                  <code>{installCommand}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Import Libraries */}
          <Card className="w-full">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <CardTitle className="text-lg">2. Import Libraries</CardTitle>
                <Button
                  variant="secondaryOutline"
                  size="sm"
                  onClick={() => handleCopyCode(importsCode)}
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
              <CardDescription>
                Import the necessary libraries at the top of your React
                component file.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-foreground font-mono whitespace-pre-wrap break-words">
                  <code>{importsCode}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Configure Echo */}
          <Card className="w-full">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <CardTitle className="text-lg">3. Configure Echo</CardTitle>
                <Button
                  variant="secondaryOutline"
                  size="sm"
                  onClick={() => handleCopyCode(configCode)}
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
              <CardDescription>
                Set up the Echo configuration with your app ID and settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-foreground font-mono whitespace-pre-wrap break-words">
                  <code>{configCode}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Create Chat Interface */}
          <Card className="w-full">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <CardTitle className="text-lg">
                  4. Create Chat Interface
                </CardTitle>
                <Button
                  variant="secondaryOutline"
                  size="sm"
                  onClick={() => handleCopyCode(chatInterfaceCode)}
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
              <CardDescription>
                Build a simple chat interface that uses Echo authentication and
                OpenAI.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-foreground font-mono whitespace-pre-wrap break-words">
                  <code>{chatInterfaceCode}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Root Component */}
          <Card className="w-full">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <CardTitle className="text-lg">
                  5. Set Up Root Component
                </CardTitle>
                <Button
                  variant="secondaryOutline"
                  size="sm"
                  onClick={() => handleCopyCode(rootComponentCode)}
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
              <CardDescription>
                Wrap your app with the EchoProvider to enable Echo
                functionality.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-foreground font-mono whitespace-pre-wrap break-words">
                  <code>{rootComponentCode}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Section 6: Complete Example */}
          <Card className="w-full border-secondary/30 bg-secondary/5">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <CardTitle className="text-lg text-secondary">
                  Complete Example
                </CardTitle>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopyCode(completeExampleCode)}
                >
                  <Copy className="h-4 w-4" />
                  Copy All
                </Button>
              </div>
              <CardDescription>
                Here&apos;s the complete code combining all the pieces above.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto max-h-96">
                <pre className="text-sm text-foreground font-mono whitespace-pre-wrap break-words">
                  <code>{completeExampleCode}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationStep;
