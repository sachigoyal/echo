# Development Guide

This guide covers the development setup and best practices for the Echo monorepo.

## TypeScript & Linting Setup

This monorepo has been configured with strict TypeScript and ESLint rules to ensure code quality and consistency across all packages.

### Pre-commit Hooks

We use Husky and lint-staged to automatically format and lint code on commit:

- **Automatic formatting**: Prettier runs on all modified files
- **Linting**: ESLint runs with auto-fix on TypeScript files
- **Type checking**: TypeScript compiler checks for type errors

### Available Scripts

Run these scripts from the root directory to operate across all packages:

```bash
# Lint all packages
npm run lint

# Lint and auto-fix issues
npm run lint:fix

# Type check all packages
npm run type-check

# Format all files
npm run format

# Check formatting without modifying files
npm run format:check

# Build all packages
npm run build

# Run tests in all packages
npm run test
```

### Package-specific Scripts

Each package supports the following scripts:

```bash
cd echo-server  # or echo-control, echo-typescript-sdk, create-echo-app
npm run lint
npm run lint:fix
npm run type-check
npm run format
npm run format:check
```

### TypeScript Configuration

- **Base config**: `tsconfig.base.json` contains shared TypeScript settings
- **Package configs**: Each package extends the base config with package-specific settings
- **Strict mode**: All packages use strict TypeScript settings including:
  - `noImplicitAny`
  - `strictNullChecks`
  - `noUncheckedIndexedAccess`
  - `exactOptionalPropertyTypes`

### ESLint Rules

The shared ESLint configuration includes:

- **TypeScript rules**: Strict type checking and best practices
- **Import organization**: Automatic import sorting and unused import removal
- **Code style**: Consistent formatting and style enforcement
- **Error prevention**: Rules to catch common bugs and anti-patterns

### Key Rules Enforced

- No unused variables or imports
- Consistent import ordering
- Prefer arrow functions
- No floating promises
- Strict boolean expressions
- Consistent type imports/exports
- No `any` types (warns)

### IDE Setup

For the best development experience:

1. **VS Code Extensions**:
   - ESLint
   - Prettier
   - TypeScript Importer

2. **Settings**: Configure your editor to:
   - Format on save
   - Show ESLint errors inline
   - Auto-organize imports

### Before You Commit

The pre-commit hooks will automatically:

1. Format your code with Prettier
2. Fix auto-fixable ESLint issues
3. Fail the commit if there are unfixable linting errors

To manually run what the pre-commit hook does:

```bash
npx lint-staged
```

### Troubleshooting

**ESLint errors not auto-fixing?**

- Some errors require manual fixes
- Check the specific rule documentation
- Use `npm run lint:fix` to see what can be auto-fixed

**Type errors?**

- Run `npm run type-check` to see detailed errors
- The base `tsconfig.base.json` uses strict settings
- Consider the type safety benefits before loosening rules

**Pre-commit hook failing?**

- Fix linting and type errors before committing
- Use `git commit --no-verify` only as a last resort
- Better to fix the issues to maintain code quality

### Adding New Packages

When adding a new package to the monorepo:

1. Add it to the `workspaces` array in the root `package.json`
2. Create a `tsconfig.json` that extends `../tsconfig.base.json`
3. Add the standard scripts to the package's `package.json`
4. Follow the existing package structure patterns
