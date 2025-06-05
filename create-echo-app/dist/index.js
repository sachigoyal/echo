#!/usr/bin/env node
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
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = require("commander");
const inquirer_1 = __importDefault(require("inquirer"));
const packageJson = __importStar(require("../package.json"));
const create_app_1 = require("./create-app");
const program = new commander_1.Command();
program
    .name('create-echo-merit-app')
    .description('Create a new LLM chatbot app using Vercel AI SDK')
    .version(packageJson.version)
    .argument('[project-name]', 'Name of the project')
    .option('-t, --template <template>', 'Template to use (nextjs)', 'nextjs')
    .option('--use-npm', 'Use npm instead of yarn/pnpm')
    .option('--use-yarn', 'Use yarn instead of npm/pnpm')
    .option('--use-pnpm', 'Use pnpm instead of npm/yarn')
    .action(async (projectName, options) => {
    try {
        console.log(chalk_1.default.blue('🤖 Welcome to Create Echo Merit App!'));
        console.log(chalk_1.default.gray('Create LLM chatbot applications using Vercel AI SDK\n'));
        let finalProjectName = projectName;
        let finalTemplate = options.template;
        // If no project name provided, ask for it
        if (finalProjectName === undefined || finalProjectName.trim() === '') {
            const answers = await inquirer_1.default.prompt([
                {
                    type: 'input',
                    name: 'projectName',
                    message: 'What would you like to name your project?',
                    default: 'my-echo-app',
                    validate: (input) => {
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
        if (finalProjectName === undefined || finalProjectName.trim() === '') {
            throw new Error('Project name is required');
        }
        await (0, create_app_1.createApp)({
            projectName: finalProjectName,
            template: finalTemplate,
            useNpm: options.useNpm ?? false,
            useYarn: options.useYarn ?? false,
            usePnpm: options.usePnpm ?? false
        });
    }
    catch (error) {
        console.error(chalk_1.default.red('Error creating app:'), error);
        process.exit(1);
    }
});
program.parse();
//# sourceMappingURL=index.js.map