import chalk from 'chalk';
import inquirer from 'inquirer';
import open from 'open';
import { EchoClient } from './client';
import { getStoredApiKey, storeApiKey, removeStoredApiKey, validateApiKey } from './auth';
import type { EchoApp, Balance, CreatePaymentLinkResponse } from './types';

// Re-export the Balance type from types.ts as EchoBalance for backwards compatibility
export type EchoBalance = Balance;

export interface LoginOptions {
  baseUrl?: string;
  silent?: boolean;
}

export interface PaymentOptions {
  amount?: number;
  description?: string;
  interactive?: boolean;
}

/**
 * Get an authenticated Echo client
 * @throws {Error} If no valid authentication is found
 */
export async function getAuthenticatedEchoClient(): Promise<EchoClient> {
  const apiKey = await getStoredApiKey();
  if (apiKey && validateApiKey(apiKey)) {
    return new EchoClient({ apiKey });
  }
  throw new Error('No valid authentication found. Please authenticate first.');
}

/**
 * Authenticate with Echo and store API key
 * @param options - Login configuration options
 * @returns Promise that resolves when login is complete
 */
export async function loginToEcho(options: LoginOptions = {}): Promise<void> {
  const { baseUrl = process.env.ECHO_BASE_URL || 'http://localhost:3000', silent = false } = options;
  
  if (!silent) {
    console.log(chalk.blue('🔐 Echo Authentication'));
    console.log();
  }

  const authUrl = `${baseUrl}/cli-auth`;

  if (!silent) {
    console.log(chalk.yellow('Opening Echo CLI authentication page in your browser...'));
    console.log(chalk.gray(`URL: ${authUrl}`));
    console.log();
  }

  // Open the browser
  try {
    await open(authUrl);
  } catch (error) {
    if (!silent) {
      console.log(chalk.yellow('Could not open browser automatically. Please visit:'));
      console.log(chalk.cyan(authUrl));
      console.log();
    }
  }

  if (!silent) {
    console.log(chalk.cyan('In the browser:'));
    console.log(chalk.cyan('1. Sign in to your Echo account if needed'));
    console.log(chalk.cyan('2. Select the Echo app you want to use with the CLI'));
    console.log(chalk.cyan('3. Generate a new app-scoped API key'));
    console.log(chalk.cyan('4. Copy the API key and paste it below'));
    console.log();
  }

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

  if (!silent) {
    console.log(chalk.blue('🔍 Verifying API key...'));
  }
  
  // Test the API key by making a request
  const client = new EchoClient({ apiKey: cleanApiKey });
  
  try {
    const echoApps = await client.listEchoApps();
    if (!silent) {
      console.log(chalk.green('✅ API key verified successfully!'));
      console.log(chalk.gray(`Found ${echoApps.length} Echo app(s) accessible with this key`));
    }
  } catch (error) {
    const errorMessage = `API key verification failed: ${error}`;
    if (!silent) {
      console.log(chalk.red('❌ API key verification failed'));
      console.log(chalk.red(`Error: ${error}`));
    }
    throw new Error(errorMessage);
  }

  // Store the API key
  await storeApiKey(cleanApiKey);
  if (!silent) {
    console.log(chalk.green('🔑 API key stored securely'));
    console.log();
    console.log(chalk.green('🎉 Authentication complete! You can now use Echo features.'));
  }
}

/**
 * Remove stored Echo credentials
 * @param silent - Whether to suppress console output
 */
export async function logoutFromEcho(silent: boolean = false): Promise<void> {
  await removeStoredApiKey();
  if (!silent) {
    console.log(chalk.green('✅ Successfully logged out from Echo!'));
  }
}

/**
 * Get list of Echo applications
 * @param silent - Whether to suppress console output
 * @returns Promise that resolves to array of Echo apps
 */
export async function listEchoApps(silent: boolean = false): Promise<EchoApp[]> {
  const client = await getAuthenticatedEchoClient();
  
  if (!silent) {
    console.log(chalk.blue('📱 Fetching your Echo apps...'));
  }
  
  const echoApps = await client.listEchoApps();
  
  if (!silent) {
    if (echoApps.length === 0) {
      console.log(chalk.yellow('No Echo apps found. Create one first!'));
      return echoApps;
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
  }
  
  return echoApps;
}

/**
 * Get Echo account balance
 * @param silent - Whether to suppress console output
 * @returns Promise that resolves to balance information
 */
export async function getEchoBalance(silent: boolean = false): Promise<EchoBalance> {
  const client = await getAuthenticatedEchoClient();
  
  if (!silent) {
    console.log(chalk.blue('💰 Fetching your balance...'));
  }
  
  const balance = await client.getBalance();
  
  if (!silent) {
    console.log(chalk.green(`Balance: $${balance.balance.toFixed(2)}`));
    console.log(chalk.gray(`Total Credits: $${balance.totalCredits.toFixed(2)}`));
    console.log(chalk.gray(`Total Spent: $${balance.totalSpent.toFixed(2)}`));
  }
  
  return balance;
}

/**
 * Create an Echo payment link
 * @param options - Payment configuration options
 * @returns Promise that resolves to payment link response
 */
export async function createEchoPaymentLink(options: PaymentOptions = {}): Promise<CreatePaymentLinkResponse> {
  const client = await getAuthenticatedEchoClient();
  
  let { amount, description, interactive = true } = options;
  
  if (!amount && interactive) {
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

  if (!amount) {
    throw new Error('Amount is required for payment link creation');
  }

  if (!description) {
    description = 'Echo credits';
  }

  if (interactive) {
    console.log(chalk.blue('💳 Generating payment link...'));
  }
  
  const response = await client.createPaymentLink({
    amount: parseFloat(amount.toString()),
    description,
  });
  
  if (interactive) {
    console.log(chalk.green('✅ Payment link generated successfully!'));
    console.log(chalk.blue(`🔗 Link: ${response.paymentLink.url}`));
  }
  
  return response;
}

/**
 * Display the Echo CLI banner
 */
export function displayEchoBanner(): void {
  console.log(
    chalk.cyan(
      '███████╗ ██████╗██╗  ██╗ ██████╗ \n' +
      '██╔════╝██╔════╝██║  ██║██╔═══██╗\n' +
      '█████╗  ██║     ███████║██║   ██║\n' +
      '██╔══╝  ██║     ██╔══██║██║   ██║\n' +
      '███████╗╚██████╗██║  ██║╚██████╔╝\n' +
      '╚══════╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝'
    )
  );
  console.log(chalk.gray('Manage your Echo applications from the command line\n'));
} 