import { InstallStep } from '../install-step';
import { ScriptCopyBtn } from '@/components/ui/script-copy';
import { Code } from './code';
import { CodeTabs } from '@/components/ui/shadcn-io/code-tabs';

export const NextStep1 = () => {
  return (
    <InstallStep
      index={0}
      title="Install SDKs"
      description="Utilities for authentication and LLM generation"
      body={
        <CodeTabs
          codes={{
            npm: 'npm install @merit-systems/echo-next-sdk ai',
            yarn: 'yarn add @merit-systems/echo-next-sdk ai',
            bun: 'bun add @merit-systems/echo-next-sdk ai',
            pnpm: 'pnpm add @merit-systems/echo-next-sdk ai',
          }}
        />
      }
    />
  );
};

const step2Code = (appId: string) => `// echo.ts
import { Echo } from '@merit-systems/echo-next-sdk';

export const { 
  handlers, isSignedIn, openai, anthropic,
} = Echo({
    appId: "${appId}"
});

// api/echo/[...echo].ts
export const { GET, POST } = handlers;`;

export const NextStep2 = ({ appId }: { appId: string }) => {
  return (
    <InstallStep
      index={1}
      title="Configure Provider and Handlers"
      description="Set up the Echo provider with your app ID"
      body={<Code value={step2Code(appId)} lang="tsx" />}
    />
  );
};

const step3Code = `import { signIn } from "@merit-systems/echo-next-sdk/client";

export default Home() {
    return (
      <button
        className="bg-primary text-primary-foreground px-4 py-2 rounded-md"
        onClick={signIn}
      >
        Sign In
      </button>
    );
}`;

export const NextStep3 = () => {
  return (
    <InstallStep
      index={2}
      title="Authenticate your Users"
      description="Use our sign in utilities to authenticate your users"
      body={<Code value={step3Code} lang="tsx" />}
    />
  );
};
