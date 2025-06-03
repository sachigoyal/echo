#!/usr/bin/env node

import chalk from 'chalk';
import inquirer from 'inquirer';
import { Command } from 'commander';
import open from 'open';
import { EchoClient } from './client';
import { getStoredApiKey, storeApiKey, removeStoredApiKey, validateApiKey } from './auth';

const program = new Command();

console.log(
  chalk.cyan(
    '███████╗ ██████╗██╗  ██╗ ██████╗      ██████╗██╗     ██╗\n' +
    '██╔════╝██╔════╝██║  ██║██╔═══██╗    ██╔════╝██║     ██║\n' +
    '█████╗  ██║     ███████║██║   ██║    ██║     ██║     ██║\n' +
    '██╔══╝  ██║     ██╔══██║██║   ██║    ██║     ██║     ██║\n' +
    '███████╗╚██████╗██║  ██║╚██████╔╝    ╚██████╗███████╗██║\n' +
    '╚══════╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝      ╚═════╝╚══════╝╚═╝'
  )
);

console.log(chalk.gray('Manage your Echo applications from the command line\n'));

program
  .name('echo-cli')
  .description('CLI tool for managing Echo applications')
  .version('1.0.0');

// Helper function to get authenticated client
async function getAuthenticatedClient(): Promise<EchoClient> {
  const apiKey = await getStoredApiKey();
  if (apiKey && validateApiKey(apiKey)) {
    return new EchoClient({ apiKey });
  }

  console.log(chalk.red('No valid authentication found. Please run "echo-cli login" to authenticate.'));
  process.exit(1);
}

// Login command
program
  .command('login')
  .description('Authenticate with your Echo API key')
  .action(async () => {
    try {
      console.log(chalk.blue('🔐 Echo Authentication'));
      console.log();

      const baseUrl = process.env.ECHO_BASE_URL || 'http://localhost:3000';
      const authUrl = `${baseUrl}/cli-auth`;

      console.log(chalk.yellow('Opening Echo CLI authentication page in your browser...'));
      console.log(chalk.gray(`URL: ${authUrl}`));
      console.log();

      // Open the browser
      try {
        await open(authUrl);
      } catch (error) {
        console.log(chalk.yellow('Could not open browser automatically. Please visit:'));
        console.log(chalk.cyan(authUrl));
        console.log();
      }

      console.log(chalk.cyan('In the browser:'));
      console.log(chalk.cyan('1. Sign in to your Echo account if needed'));
      console.log(chalk.cyan('2. Select the Echo app you want to use with the CLI'));
      console.log(chalk.cyan('3. Generate a new app-scoped API key'));
      console.log(chalk.cyan('4. Copy the API key and paste it below'));
      console.log();

      const { apiKey } = await inquirer.prompt([
        {
          type: 'password',
          name: 'apiKey',
          message: 'Paste your Echo API key:',
          mask: '*',
          validate: (input: string) => {
            if (!input.trim()) {
              return 'API key is required';
            }
            if (!validateApiKey(input.trim())) {
              return 'Invalid API key format. Expected format: echo_...';
            }
            return true;
          },
        },
      ]);

      const cleanApiKey = apiKey.trim();

      console.log(chalk.blue('🔍 Verifying API key...'));
      
      // Test the API key by making a request
      const client = new EchoClient({ apiKey: cleanApiKey });
      
      try {
        const echoApps = await client.listEchoApps();
        console.log(chalk.green('✅ API key verified successfully!'));
        console.log(chalk.gray(`Found ${echoApps.length} Echo app(s) accessible with this key`));
      } catch (error) {
        console.log(chalk.red('❌ API key verification failed'));
        console.log(chalk.red(`Error: ${error}`));
        process.exit(1);
      }

      // Store the API key
      await storeApiKey(cleanApiKey);
      console.log(chalk.green('🔑 API key stored securely'));
      console.log();
      console.log(chalk.green('🎉 Authentication complete! You can now use the Echo CLI.'));
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
      await removeStoredApiKey();
      console.log(chalk.green('✅ Successfully logged out!'));
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
      const client = await getAuthenticatedClient();
      console.log(chalk.blue('📱 Fetching your Echo apps...'));
      
      const echoApps = await client.listEchoApps();
      
      if (echoApps.length === 0) {
        console.log(chalk.yellow('No Echo apps found. Create one first!'));
        return;
      }

      console.log(chalk.green(`\n✅ Found ${echoApps.length} Echo app(s):\n`));
      
      echoApps.forEach((app, index) => {
        console.log(`${chalk.bold(`${index + 1}. ${app.name}`)} ${chalk.gray(`(${app.id})`)}`);
        if (app.description) {
          console.log(`   ${chalk.gray(app.description)}`);
        }
        console.log(`   Status: ${app.isActive ? chalk.green('Active') : chalk.red('Inactive')}`);
        if (app.totalTokens !== undefined) {
          console.log(`   Tokens: ${chalk.blue(app.totalTokens.toLocaleString())}`);
        }
        if (app.totalCost !== undefined) {
          console.log(`   Cost: ${chalk.green(`$${app.totalCost.toFixed(4)}`)}`);
        }
        console.log();
      });
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
      const client = await getAuthenticatedClient();
      console.log(chalk.blue('💰 Fetching your balance...'));
      
      const balance = await client.getBalance();
      
      console.log(chalk.green(`Balance: $${balance.balance.toFixed(2)}`));
      console.log(chalk.gray(`Total Credits: $${balance.totalCredits.toFixed(2)}`));
      console.log(chalk.gray(`Total Spent: $${balance.totalSpent.toFixed(2)}`));
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
      const client = await getAuthenticatedClient();
      
      let { amount, description } = options;
      
      if (!amount) {
        const answers = await inquirer.prompt([
          {
            type: 'number',
            name: 'amount',
            message: 'Enter the amount in USD:',
            validate: (input) => input > 0 || 'Amount must be greater than 0',
          },
          {
            type: 'input',
            name: 'description',
            message: 'Enter payment description (optional):',
            default: 'Echo credits',
          },
        ]);
        amount = answers.amount;
        description = answers.description;
      }

      console.log(chalk.blue('💳 Generating payment link...'));
      
      const response = await client.createPaymentLink({
        amount: parseFloat(amount),
        description,
      });
      
      console.log(chalk.green('✅ Payment link generated successfully!'));
      console.log(chalk.blue(`🔗 Link: ${response.paymentLink.url}`));
      console.log(chalk.gray(`Amount: $${response.paymentLink.amount.toFixed(2)} ${response.paymentLink.currency.toUpperCase()}`));
    } catch (error) {
      console.error(chalk.red('Failed to generate payment link:'), error);
      process.exit(1);
    }
  });

program.parse(); 