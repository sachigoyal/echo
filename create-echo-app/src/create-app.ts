import { execSync } from 'child_process';
import * as path from 'path';

import chalk from 'chalk';
import * as fs from 'fs-extra';

export interface CreateAppConfig {
  projectName: string;
  template: string;
  useNpm?: boolean;
  useYarn?: boolean;
  usePnpm?: boolean;
}

export const createApp = async (config: CreateAppConfig): Promise<void> => {
  const { projectName, template } = config;
  const projectPath = path.resolve(process.cwd(), projectName);

  // Check if directory already exists
  if (await fs.pathExists(projectPath)) {
    throw new Error(`Directory ${projectName} already exists`);
  }

  console.log(chalk.blue(`📁 Creating ${projectName}...`));

  // Create project directory
  await fs.ensureDir(projectPath);

  // Copy template files
  const templatePath = path.join(__dirname, '..', 'templates', template);

  if (!(await fs.pathExists(templatePath))) {
    throw new Error(`Template ${template} not found`);
  }

  await fs.copy(templatePath, projectPath);

  // Update package.json with project name
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = await fs.readJson(packageJsonPath);
    packageJson.name = projectName;
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  }

  console.log(chalk.green(`✅ Created ${projectName}`));

  // Determine package manager
  const packageManager = getPackageManager(config);

  console.log(
    chalk.blue(`📦 Installing dependencies with ${packageManager}...`)
  );

  try {
    execSync(`cd ${projectPath} && ${packageManager} install`, {
      stdio: 'inherit',
      cwd: projectPath,
    });
    console.log(chalk.green('✅ Dependencies installed successfully'));
  } catch {
    console.log(
      chalk.yellow('⚠️  Failed to install dependencies automatically')
    );
    console.log(
      chalk.gray(
        `You can install them manually by running: cd ${projectName} && ${packageManager} install`
      )
    );
  }

  // Print success message
  console.log(chalk.green('\n🎉 Your Echo app is ready!'));
  console.log('\nTo get started:');
  console.log(chalk.cyan(`  cd ${projectName}`));
  console.log(
    chalk.cyan(
      `  ${packageManager === 'npm' ? 'npm run dev' : `${packageManager} dev`}`
    )
  );
  console.log('\nHappy coding! 🚀');
};

const getPackageManager = (config: CreateAppConfig): string => {
  if (config.useNpm === true) return 'npm';
  if (config.useYarn === true) return 'yarn';
  if (config.usePnpm === true) return 'pnpm';

  // Auto-detect based on what's available
  try {
    execSync('pnpm --version', { stdio: 'ignore' });
    return 'pnpm';
  } catch {
    // pnpm not available, continue to next option
  }

  try {
    execSync('yarn --version', { stdio: 'ignore' });
    return 'yarn';
  } catch {
    // yarn not available, fall back to npm
  }

  return 'npm';
};
