#!/usr/bin/env node

import { intro, outro, select, text, spinner, log, isCancel, cancel } from '@clack/prompts';
import chalk from 'chalk';
import { Command } from 'commander';
import degit from 'degit';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const program = new Command();

// Available templates - add new ones here
const DEFAULT_TEMPLATES = {
  next: {
    title: 'Next.js',
    description: 'Minimal Next.js application with Echo integration',
  },
  vite: {
    repo: 'Merit-Systems/echo/templates/react',
    title: 'React (Vite)',
    description: 'Minimal Vite React application with Echo integration',
  },
  'assistant-ui': {
    title: 'Assistant UI',
    description: 'Full-featured chat UI with @assistant-ui/react and AI SDK v5',
  },
  'next-chat': {
    title: 'Next.js Chat',
    description:
      'Full-stack Next.js application with Echo and the Vercel AI SDK',
  },
  'next-image': {
    title: 'Next.js Image Gen',
    description:
      'Full-stack Next.js application with Echo and the Vercel AI SDK for image generation',
  },
  'next-video-template': {
    title: 'Next.js Video Gen',
    description:
      'Full-stack Next.js application with Echo and the Vercel AI SDK for video generation',
  },
  'nextjs-api-key-template': {
    title: 'Next.js API Key',
    description:
      'Next.js application with server-side API key management and database',
  },
  'react-chat': {
    title: 'React Chat',
    description: 'Vite React application with Echo and the Vercel AI SDK',
  },
  'react-image': {
    title: 'React Image Gen',
    description:
      'Vite React application with Echo and the Vercel AI SDK for image generation',
  },
} as const;

type TemplateName = keyof typeof DEFAULT_TEMPLATES;
type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

function detectPackageManager(): PackageManager {
  const userAgent = process.env.npm_config_user_agent || '';

  if (userAgent.includes('pnpm')) return 'pnpm';
  if (userAgent.includes('yarn')) return 'yarn';
  if (userAgent.includes('bun')) return 'bun';
  if (userAgent.includes('npm')) return 'npm';

  // Default to pnpm (Echo's preference)
  return 'pnpm';
}

function getPackageManagerCommands(pm: PackageManager) {
  switch (pm) {
    case 'pnpm':
      return { install: 'pnpm install', dev: 'pnpm dev' };
    case 'yarn':
      return { install: 'yarn install', dev: 'yarn dev' };
    case 'bun':
      return { install: 'bun install', dev: 'bun dev' };
    case 'npm':
    default:
      return { install: 'npm install', dev: 'npm run dev' };
  }
}

function cleanProgressLine(line: string, maxLength: number): string {
  return line
    .replace(/\x1b\[[0-9;]*m/g, '') // Remove ANSI color codes
    .trim()
    .substring(0, maxLength);
}

async function runInstall(
  packageManager: PackageManager,
  projectPath: string,
  onProgress?: (line: string, maxLength: number) => void
): Promise<boolean> {
  return new Promise((resolve) => {
    const command = packageManager;
    const args = ['install'];

    const child = spawn(command, args, {
      cwd: projectPath,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let lastLine = '';

    child.stdout?.on('data', (data) => {
      const lines = data.toString().split('\n');
      const relevantLine = lines
        .filter((line: string) => line.trim().length > 0)
        .pop(); // Get the last non-empty line

      if (relevantLine && onProgress) {
        // Calculate available space: terminal width - spinner icon - main message - buffer
        const terminalWidth = process.stdout.columns || 80;
        const mainMessage = `Installing dependencies with ${packageManager}... `;
        const availableSpace = terminalWidth - mainMessage.length - 10; // 10 chars buffer for spinner + margins

        const cleanLine = cleanProgressLine(relevantLine, Math.max(20, availableSpace));
        if (cleanLine !== lastLine && cleanLine.length > 0) {
          onProgress(cleanLine, availableSpace);
          lastLine = cleanLine;
        }
      }
    });

    child.on('close', (code) => {
      resolve(code === 0);
    });

    child.on('error', () => {
      resolve(false);
    });
  });
}

interface CreateAppOptions {
  template?: TemplateName;
  appId?: string;
  skipInstall?: boolean;
}

async function createApp(projectDir: string, options: CreateAppOptions) {
  let { template, appId, skipInstall } = options;
  const packageManager = detectPackageManager();

  // Print header
  console.log();
  console.log(`${chalk.cyan('Echo Start')} ${chalk.gray('(0.1.6)')}`);
  console.log();

  intro('Creating your Echo application');

  // If no template specified, prompt for it
  if (!template) {
    const selectedTemplate = await select({
      message: 'Which template would you like to use?',
      options: Object.entries(DEFAULT_TEMPLATES).map(([key, template]) => ({
        label: template.title,
        hint: template.description,
        value: key,
      })),
    });

    if (isCancel(selectedTemplate)) {
      cancel('Operation cancelled.');
      process.exit(1);
    }

    template = selectedTemplate as TemplateName;
  }

  log.step(`Selected template: ${DEFAULT_TEMPLATES[template!].title}`);

  // If no app ID specified, prompt for it
  if (!appId) {
    const enteredAppId = await text({
      message: 'What is your Echo App ID?',
      placeholder: 'Enter your app ID...',
      validate: (value: string) => {
        if (!value.trim()) {
          return 'Please enter an App ID or create one at https://echo.merit.systems/new';
        }
        return;
      },
    });

    if (isCancel(enteredAppId)) {
      cancel('Operation cancelled.');
      process.exit(1);
    }

    appId = enteredAppId;
  }

  log.step(`Using App ID: ${appId}`);

  // Validate template exists
  if (!template) {
    cancel(`Template "${template}" does not exist.`);
    console.log(chalk.gray('Available templates:'));
    Object.keys(DEFAULT_TEMPLATES).forEach(t => {
      console.log(chalk.gray(`  - ${t}`));
    });
    process.exit(1);
  }

  const absoluteProjectPath = path.resolve(projectDir);

  // Check if directory already exists
  if (existsSync(absoluteProjectPath)) {
    cancel(`Directory "${projectDir}" already exists.`);
    process.exit(1);
  }

  try {
    const s = spinner();
    s.start('Downloading template files');

    // Use degit to download the template
    const templateConfig = DEFAULT_TEMPLATES[template];
    const repoPath =
      'repo' in templateConfig
        ? `${templateConfig.repo}#production`
        : `Merit-Systems/echo/templates/${template}#production`;

    const emitter = degit(repoPath);

    // Collect warnings to show after spinner
    const warnings: string[] = [];

    emitter.on('warn', warning => {
      warnings.push(warning.message);
    });

    try {
      await emitter.clone(absoluteProjectPath);
      s.stop('Template downloaded successfully');
    } catch (cloneError) {
      s.stop('Failed to download template');
      throw cloneError;
    }

    // Show any warnings that occurred
    if (warnings.length > 0) {
      warnings.forEach(msg => {
        log.warning(msg);
      });
    }

    // Verify that files were actually downloaded
    if (
      !existsSync(absoluteProjectPath) ||
      !existsSync(path.join(absoluteProjectPath, 'package.json'))
    ) {
      throw new Error(
        `Template download failed - no files found in ${absoluteProjectPath}`
      );
    }

    log.step('Configuring project files');

    // Update package.json with the name of the project
    const packageJsonPath = path.join(absoluteProjectPath, 'package.json');
    // Technically this is checked above, but good practice to check again
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      packageJson.name = toSafePackageName(projectDir);
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      log.message(`Updated package.json with project name: ${toSafePackageName(projectDir)}`);
    }

    // Update .env.local with the provided app ID
    const envPath = path.join(absoluteProjectPath, '.env.local');
    if (existsSync(envPath)) {
      try {
        const envContent = readFileSync(envPath, 'utf-8');

        // Replace the environment variable value - specifically targeting the *EHO_APP_ID placeholder
        // Find the line with *ECHO_APP_ID and replace the value after the = sign
        const updatedContent = envContent.replace(
          /^(.*ECHO_APP_ID\s*=\s*).+$/gm,
          `$1${appId!}`
        );

        // Check if the replacement actually occurred
        if (updatedContent === envContent) {
          log.warning('Could not find *ECHO_APP_ID placeholder in .env.local');
        } else {
          writeFileSync(envPath, updatedContent);
          log.message(`Updated ECHO_APP_ID in .env.local`);
        }
      } catch (envError) {
        log.warning('Could not update .env.local file');
      }
    }

    log.step('Project setup completed successfully');

    // Auto-install dependencies unless skipped
    if (!skipInstall) {
      const s = spinner();
      s.start(`Installing dependencies with ${packageManager}...`);

      const installSuccess = await runInstall(
        packageManager,
        absoluteProjectPath,
        (progressLine, maxLength) => {
          s.message(`Installing dependencies with ${packageManager}... ${chalk.gray(progressLine + '...')}`);
        }
      );

      if (installSuccess) {
        s.stop('Dependencies installed successfully');
      } else {
        s.stop('Failed to install dependencies');
        log.warning(`Could not install dependencies with ${packageManager}. Please run manually.`);
      }
    }

    const commands = getPackageManagerCommands(packageManager);
    const nextSteps = skipInstall
      ? `Get started:\n  ${chalk.cyan('└')} cd ${projectDir}\n  ${chalk.cyan('└')} ${commands.install}\n  ${chalk.cyan('└')} ${commands.dev}`
      : `Get started:\n  ${chalk.cyan('└')} cd ${projectDir}\n  ${chalk.cyan('└')} ${commands.dev}`;

    outro(`Success! Created ${projectDir}\n\n${nextSteps}`);

    process.exit(0);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('could not find commit hash')) {
        cancel(`Template "${template}" not found in repository.\n\nThe template might not exist yet. Please check:\nhttps://github.com/Merit-Systems/echo/tree/master/templates`);
      } else if (error.message.includes('Repository does not exist')) {
        cancel('Repository not accessible.\n\nMake sure you have access to the Merit-Systems/echo repository.');
      } else {
        cancel(`Failed to create app: ${error.message}`);
      }
    } else {
      cancel(`An unexpected error occurred: ${String(error)}`);
    }

    process.exit(1);
  }
}

async function main() {
  program
    .name('echo-start')
    .description('Create a new Echo application')
    .version(require('../package.json').version)
    .argument('[directory]', 'Directory to create the app in')
    .option(
      '-t, --template <template>',
      `Template to use (${Object.keys(DEFAULT_TEMPLATES).join(', ')})`
    )
    .option('-a, --app-id <appId>', 'Echo App ID to use in the project')
    .option('--skip-install', 'Skip automatic dependency installation')
    .action(
      async (directory: string | undefined, options: CreateAppOptions) => {
        let projectDir = directory;

        // If no directory specified, prompt for it
        if (!projectDir) {
          let defaultName = 'my-echo-app';
          let counter = 1;

          while (
            existsSync(path.resolve(defaultName)) &&
            readdirSync(path.resolve(defaultName)).length > 0
          ) {
            defaultName = `${defaultName}-${counter}`;
            counter++;
          }

          // Print header if we need to prompt for project name
          console.log();
          console.log(`${chalk.cyan('Echo Start')} ${chalk.gray('(0.1.6)')}`);
          console.log();

          intro('Creating your Echo application');

          const enteredProjectDir = await text({
            message: 'What is your project named?',
            placeholder: defaultName,
            defaultValue: defaultName,
            validate: (value: string) => {
              if (!value.trim()) {
                return 'Please enter a project name';
              }
              if (existsSync(path.resolve(value))) {
                return `Directory "${value}" already exists`;
              }
              return;
            },
          });

          if (isCancel(enteredProjectDir)) {
            cancel('Operation cancelled.');
            process.exit(1);
          }

          projectDir = enteredProjectDir;
          log.step(`Creating project: ${projectDir}`);
        }

        await createApp(projectDir!, options);
      }
    );

  await program.parseAsync();
}

function toSafePackageName(dirname: string) {
  return dirname
    .toLowerCase()
    .replace(/[^a-z0-9-_.]/g, '-') // replace unsafe chars with dashes
    .replace(/^-+/, '') // remove leading dashes
    .replace(/^_+/, '') // remove leading underscores
    .replace(/\.+$/, ''); // remove trailing dots
}

main().catch(error => {
  console.error(chalk.red('An unexpected error occurred:'));
  console.error(error);
  process.exit(1);
});
