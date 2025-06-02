"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
async function createApp(config) {
    const { projectName, template } = config;
    const projectPath = path.resolve(process.cwd(), projectName);
    // Check if directory already exists
    if (await fs.pathExists(projectPath)) {
        throw new Error(`Directory ${projectName} already exists`);
    }
    console.log(chalk_1.default.blue(`📁 Creating ${projectName}...`));
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
    console.log(chalk_1.default.green(`✅ Created ${projectName}`));
    // Determine package manager
    const packageManager = getPackageManager(config);
    console.log(chalk_1.default.blue(`📦 Installing dependencies with ${packageManager}...`));
    try {
        (0, child_process_1.execSync)(`cd ${projectPath} && ${packageManager} install`, {
            stdio: 'inherit',
            cwd: projectPath
        });
        console.log(chalk_1.default.green('✅ Dependencies installed successfully'));
    }
    catch (error) {
        console.log(chalk_1.default.yellow('⚠️  Failed to install dependencies automatically'));
        console.log(chalk_1.default.gray(`You can install them manually by running: cd ${projectName} && ${packageManager} install`));
    }
    // Print success message
    console.log(chalk_1.default.green('\n🎉 Your Echo app is ready!'));
    console.log('\nTo get started:');
    console.log(chalk_1.default.cyan(`  cd ${projectName}`));
    console.log(chalk_1.default.cyan(`  ${packageManager === 'npm' ? 'npm run dev' : `${packageManager} dev`}`));
    console.log('\nHappy coding! 🚀');
}
function getPackageManager(config) {
    if (config.useNpm)
        return 'npm';
    if (config.useYarn)
        return 'yarn';
    if (config.usePnpm)
        return 'pnpm';
    // Auto-detect based on what's available
    try {
        (0, child_process_1.execSync)('pnpm --version', { stdio: 'ignore' });
        return 'pnpm';
    }
    catch { }
    try {
        (0, child_process_1.execSync)('yarn --version', { stdio: 'ignore' });
        return 'yarn';
    }
    catch { }
    return 'npm';
}
//# sourceMappingURL=create-app.js.map