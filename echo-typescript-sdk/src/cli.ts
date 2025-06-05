#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import {
  displayEchoBanner,
  loginToEcho,
  logoutFromEcho,
  listEchoApps,
  getEchoBalance,
  createEchoPaymentLink,
} from './cli-helpers';

const program = new Command();

displayEchoBanner();

program
  .name('echo-cli')
  .description('CLI tool for managing Echo applications')
  .version('1.0.0');

// Login command
program
  .command('login')
  .description('Authenticate with your Echo API key')
  .action(async () => {
    try {
      await loginToEcho();
    } catch (error) {
      console.error(chalk.red('Login failed:'), error);
      process.exit(1);
    }
  });

// Logout command
program
  .command('logout')
  .description('Remove stored credentials')
  .action(async () => {
    try {
      await logoutFromEcho();
    } catch (error) {
      console.error(chalk.red('Logout failed:'), error);
      process.exit(1);
    }
  });

// List apps command
program
  .command('apps')
  .alias('ls')
  .description('List your Echo applications')
  .action(async () => {
    try {
      await listEchoApps();
    } catch (error) {
      console.error(chalk.red('Failed to fetch Echo apps:'), error);
      process.exit(1);
    }
  });

// Balance command
program
  .command('balance')
  .description('Check your account balance')
  .action(async () => {
    try {
      await getEchoBalance();
    } catch (error) {
      console.error(chalk.red('Failed to fetch balance:'), error);
      process.exit(1);
    }
  });

// Generate payment link command
program
  .command('payment')
  .description('Generate a payment link to add credits')
  .option('-a, --amount <amount>', 'Amount in USD')
  .option('-d, --description <description>', 'Payment description')
  .action(async (options) => {
    try {
      const { amount, description } = options;
      await createEchoPaymentLink({
        amount: amount ? parseFloat(amount) : undefined,
        description,
        interactive: true,
      });
    } catch (error) {
      console.error(chalk.red('Failed to generate payment link:'), error);
      process.exit(1);
    }
  });

program.parse(); 