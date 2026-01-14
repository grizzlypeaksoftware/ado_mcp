# Contributing to Azure DevOps MCP Server

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Style Guide](#style-guide)

## Code of Conduct

This project follows a standard code of conduct. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Git
- An Azure DevOps account (for integration testing)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/azure-devops-mcp.git
   cd azure-devops-mcp
   ```
3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/original-org/azure-devops-mcp.git
   ```

## Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your Azure DevOps credentials
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

5. **Start in development mode:**
   ```bash
   # STDIO mode
   npm run dev:stdio

   # HTTP mode
   npm run dev:http
   ```

## Project Structure

```
azure-devops-mcp/
├── src/
│   ├── index.ts              # STDIO entry point
│   ├── index-http.ts         # HTTP entry point
│   ├── ado-client.ts         # Azure DevOps API client
│   ├── types.ts              # Shared types
│   ├── tools/                # Tool implementations
│   │   ├── work-items/       # Work item tools
│   │   ├── git/              # Git repository tools
│   │   ├── pull-requests/    # PR tools
│   │   └── ...               # Other tool categories
│   ├── transports/           # Transport implementations
│   │   └── http-transport.ts # HTTP transport
│   └── middleware/           # HTTP middleware
│       ├── session.ts        # Session management
│       └── cors.ts           # CORS configuration
├── tests/
│   ├── unit/                 # Unit tests
│   └── *.test.ts             # Integration tests
├── docs/                     # Documentation
└── dist/                     # Compiled output
```

## Making Changes

### Branch Naming

Use descriptive branch names:
- `feature/add-new-tool` - New features
- `fix/work-item-query-bug` - Bug fixes
- `docs/update-readme` - Documentation changes
- `refactor/improve-error-handling` - Code refactoring

### Creating a Branch

```bash
# Update main
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
```

### Adding a New Tool

1. **Create tool file** in appropriate category under `src/tools/`:
   ```typescript
   // src/tools/category/my-tool.ts
   import { Tool } from "@modelcontextprotocol/sdk/types.js";

   export const myToolDefinition: Tool = {
     name: "my_tool",
     description: "Description of what the tool does",
     inputSchema: {
       type: "object",
       properties: {
         param1: { type: "string", description: "Parameter description" },
       },
       required: ["param1"],
     },
   };

   export async function handleMyTool(
     client: AdoClient,
     args: { param1: string }
   ) {
     // Implementation
   }
   ```

2. **Register the tool** in the category's index file

3. **Add to entry points** (`src/index.ts` and `src/index-http.ts`)

4. **Write tests** in `tests/unit/tools/category/`

5. **Update documentation** if needed

### Commit Messages

Use conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks

Examples:
```
feat(tools): add list_epics tool for work items
fix(http): handle session timeout correctly
docs(readme): add VS Code configuration example
test(git): add unit tests for create_branch
```

## Testing

### Running Tests

```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Specific test file
npm test -- tests/unit/tools/work-items/list-work-items.test.ts
```

### Writing Tests

- Place unit tests in `tests/unit/tools/<category>/`
- Use descriptive test names
- Mock external API calls
- Test both success and error cases

Example test structure:
```typescript
describe("myTool", () => {
  describe("happy path", () => {
    it("should do expected behavior", async () => {
      // Arrange
      // Act
      // Assert
    });
  });

  describe("parameter validation", () => {
    it("should throw error when required param missing", async () => {
      // Test validation
    });
  });

  describe("error handling", () => {
    it("should handle API errors gracefully", async () => {
      // Test error handling
    });
  });
});
```

### Coverage Requirements

- Minimum 80% overall coverage
- 100% coverage for validation and error handling
- All new tools must have corresponding tests

## Pull Request Process

1. **Ensure all tests pass:**
   ```bash
   npm test
   ```

2. **Build successfully:**
   ```bash
   npm run build
   ```

3. **Update documentation** if needed

4. **Create pull request:**
   - Use a clear, descriptive title
   - Reference any related issues
   - Describe what changes were made and why
   - Include testing instructions

5. **PR Template:**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation update
   - [ ] Refactoring

   ## Testing
   - [ ] Unit tests added/updated
   - [ ] Integration tests added/updated
   - [ ] Manual testing performed

   ## Checklist
   - [ ] Code follows project style guide
   - [ ] Tests pass locally
   - [ ] Documentation updated
   - [ ] Changelog updated (if applicable)
   ```

6. **Address review feedback** promptly

## Style Guide

### TypeScript

- Use TypeScript strict mode
- Prefer explicit types over inference for function parameters
- Use interfaces for object shapes
- Use `async/await` over raw promises

### Code Formatting

- 2-space indentation
- No trailing whitespace
- Semicolons required
- Single quotes for strings

### Naming Conventions

- `camelCase` for variables and functions
- `PascalCase` for classes and interfaces
- `UPPER_SNAKE_CASE` for constants
- `snake_case` for tool names (MCP convention)

### Error Handling

- Always validate input parameters
- Use descriptive error messages
- Include context in error messages
- Handle API errors gracefully

```typescript
if (!args.id) {
  throw new Error("Missing required parameter: id");
}

try {
  const result = await api.call();
} catch (error) {
  throw new Error(`Failed to fetch work item ${args.id}: ${error.message}`);
}
```

## Questions?

If you have questions about contributing, please:
1. Check existing documentation
2. Search existing issues
3. Open a new issue with the "question" label

Thank you for contributing!
