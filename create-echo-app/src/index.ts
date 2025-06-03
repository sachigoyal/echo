#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { createApp } from './create-app';
import * as packageJson from '../package.json';

interface CreateAppOptions {
  template: string;
  useNpm?: boolean;
  useYarn?: boolean;
  usePnpm?: boolean;
}

const program = new Command();

program
  .name('create-echo-merit-app')
  .description('Create a new LLM chatbot app using Vercel AI SDK')
  .version(packageJson.version)
  .argument('[project-name]', 'Name of the project')
  .option('-t, --template <template>', 'Template to use (nextjs)', 'nextjs')
  .option('--use-npm', 'Use npm instead of yarn/pnpm')
  .option('--use-yarn', 'Use yarn instead of npm/pnpm')
  .option('--use-pnpm', 'Use pnpm instead of npm/yarn')
  .action(async (projectName: string | undefined, options: CreateAppOptions) => {
    try {
      console.log(chalk.blue('🤖 Welcome to Create Echo Merit App!'));
      console.log(chalk.gray('Create LLM chatbot applications using Vercel AI SDK\n'));

      let finalProjectName = projectName;
      let finalTemplate = options.template;

      // If no project name provided, ask for it
      if (!finalProjectName) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'projectName',
            message: 'What would you like to name your project?',
            default: 'my-echo-app',
            validate: (input: string) => {
              if (!input.trim()) {
                return 'Project name cannot be empty';
              }
              if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
                return 'Project name can only contain letters, numbers, hyphens, and underscores';
              }
              return true;
            }
          },
          {
            type: 'list',
            name: 'template',
            message: 'Which template would you like to use?',
            choices: [
              { name: 'Next.js (Recommended)', value: 'nextjs' },
            ],
            default: 'nextjs'
          }
        ]);

        finalProjectName = answers.projectName;
        finalTemplate = answers.template;
      }

      // Ensure we have a project name
      if (!finalProjectName) {
        throw new Error('Project name is required');
      }

      await createApp({
        projectName: finalProjectName,
        template: finalTemplate,
        useNpm: options.useNpm,
        useYarn: options.useYarn,
        usePnpm: options.usePnpm
      });

    } catch (error) {
      console.error(chalk.red('Error creating app:'), error);
      process.exit(1);
    }
  });

program.parse(); 