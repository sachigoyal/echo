import { InstallStep } from '../install-step';
import { ScriptCopyBtn } from '@/components/ui/script-copy';
import { Code } from './code';

export const NextStep1 = () => {
  return (
    <InstallStep
      index={0}
      title="Install SDKs"
      description="Utilities for authentication and LLM generation"
      body={
        <ScriptCopyBtn
          commandMap={{
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
export const { handlers, isSignedIn, openai, anthropic } = Echo({
    appId: "${appId}"
});

// api/echo/[...echo].ts
export const { GET, POST } = handlers;`;

export const NextStep2 = ({ appId }: { appId: string }) => {
  return (
    <InstallStep
      index={1}
      title="Configure Provider"
      description="Set up the Echo provider with your app ID"
      body={<Code value={step2Code(appId)} lang="typescript" />}
    />
  );
};

const step3Code = `import { signIn } from "@merit-systems/echo-next-sdk/client";
export default Home() {
    return <button onClick={() => signIn()}>Sign In</button>
}`;

export const NextStep3 = () => {
  return (
    <InstallStep
      index={2}
      title="Add to your app"
      description="Add the Echo SDK to your app"
      body={<Code value={step3Code} lang="typescript" />}
    />
  );
};
