# Installation

Get started with Vettly in your React or Node.js project.

## Prerequisites

Before installing Vettly, make sure you have:

- **Node.js** 16.x or higher
- **npm**, **yarn**, **pnpm**, or **bun** package manager
- A **Vettly API key** ([Sign up](https://vettly.dev))

## Choose Your Package

Vettly offers different packages depending on your needs:

| Package | Use Case | Framework |
|---------|----------|-----------|
| `@nextauralabs/vettly-react` | Pre-built React components | React |
| `@nextauralabs/vettly-sdk` | SDK for any framework | Node.js / TypeScript |
| `@nextauralabs/vettly-shared` | TypeScript types only | TypeScript |

## React Components

### Installation

Install the React components package:

::: code-group

```bash [npm]
npm install @nextauralabs/vettly-react
```

```bash [yarn]
yarn add @nextauralabs/vettly-react
```

```bash [pnpm]
pnpm add @nextauralabs/vettly-react
```

```bash [bun]
bun add @nextauralabs/vettly-react
```

:::

### Import Styles

Import the CSS styles in your app entry point:

```tsx
// App.tsx or index.tsx
import '@nextauralabs/vettly-react/styles.css'
```

### Basic Usage

```tsx
import { ModeratedTextarea } from '@nextauralabs/vettly-react'
import '@nextauralabs/vettly-react/styles.css'

function App() {
  return (
    <ModeratedTextarea
      apiKey="your-api-key"
      policyId="balanced"
      placeholder="Type something..."
    />
  )
}
```

## TypeScript SDK

### Installation

Install the TypeScript SDK for backend or custom frontend implementations:

::: code-group

```bash [npm]
npm install @nextauralabs/vettly-sdk
```

```bash [yarn]
yarn add @nextauralabs/vettly-sdk
```

```bash [pnpm]
pnpm add @nextauralabs/vettly-sdk
```

```bash [bun]
bun add @nextauralabs/vettly-sdk
```

:::

### Basic Usage

```typescript
import { ModerationClient } from '@nextauralabs/vettly-sdk'

const client = new ModerationClient({
  apiKey: 'your-api-key'
})

const result = await client.check({
  content: 'Text to moderate',
  policyId: 'balanced',
  contentType: 'text'
})

console.log('Safe:', result.safe)
```

## Get Your API Key

1. **Sign up** at [vettly.dev](https://vettly.dev)
2. Navigate to **Settings → API Keys**
3. Click **Create API Key**
4. Copy your key (starts with `vettly_`)

::: warning
Never commit API keys to version control. Use environment variables instead.
:::

## Environment Variables

### React (Vite)

Create a `.env` file:

```bash
VITE_VETTLY_API_KEY=vettly_xxxxxxxxxxxxx
```

Use in your code:

```tsx
<ModeratedTextarea
  apiKey={import.meta.env.VITE_VETTLY_API_KEY}
  policyId="balanced"
/>
```

### React (Create React App)

Create a `.env` file:

```bash
REACT_APP_VETTLY_API_KEY=vettly_xxxxxxxxxxxxx
```

Use in your code:

```tsx
<ModeratedTextarea
  apiKey={process.env.REACT_APP_VETTLY_API_KEY}
  policyId="balanced"
/>
```

### Next.js

Create a `.env.local` file:

```bash
NEXT_PUBLIC_VETTLY_API_KEY=vettly_xxxxxxxxxxxxx
```

Use in your code:

```tsx
<ModeratedTextarea
  apiKey={process.env.NEXT_PUBLIC_VETTLY_API_KEY}
  policyId="balanced"
/>
```

### Node.js / Backend

Create a `.env` file:

```bash
VETTLY_API_KEY=vettly_xxxxxxxxxxxxx
```

Install dotenv:

```bash
npm install dotenv
```

Load in your code:

```typescript
import 'dotenv/config'
import { ModerationClient } from '@nextauralabs/vettly-sdk'

const client = new ModerationClient({
  apiKey: process.env.VETTLY_API_KEY!
})
```

## Framework-Specific Setup

### Next.js (App Router)

Install the React package:

```bash
npm install @nextauralabs/vettly-react
```

Import styles in `app/layout.tsx`:

```tsx
import '@nextauralabs/vettly-react/styles.css'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

Use in client components:

```tsx
'use client'

import { ModeratedTextarea } from '@nextauralabs/vettly-react'

export default function CommentForm() {
  return (
    <ModeratedTextarea
      apiKey={process.env.NEXT_PUBLIC_VETTLY_API_KEY!}
      policyId="balanced"
    />
  )
}
```

### Next.js (Pages Router)

Import styles in `pages/_app.tsx`:

```tsx
import '@nextauralabs/vettly-react/styles.css'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
```

### Remix

Install the React package:

```bash
npm install @nextauralabs/vettly-react
```

Import styles in `app/root.tsx`:

```tsx
import styles from '@nextauralabs/vettly-react/styles.css'

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: styles }
]
```

### Express.js

Install the SDK:

```bash
npm install @nextauralabs/vettly-sdk
```

Use as middleware:

```typescript
import express from 'express'
import { ModerationClient } from '@nextauralabs/vettly-sdk'

const app = express()
const moderationClient = new ModerationClient({
  apiKey: process.env.VETTLY_API_KEY!
})

app.post('/api/comments', async (req, res) => {
  const { content } = req.body

  const result = await moderationClient.check({
    content,
    policyId: 'balanced',
    contentType: 'text'
  })

  if (!result.safe) {
    return res.status(400).json({
      error: 'Content contains inappropriate material',
      categories: result.categories
    })
  }

  // Save comment to database
  res.json({ success: true })
})
```

## Verify Installation

Create a test file to verify everything is working:

```tsx
// test-vettly.tsx
import { ModeratedTextarea } from '@nextauralabs/vettly-react'
import '@nextauralabs/vettly-react/styles.css'

export default function TestVettly() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Vettly Test</h1>
      <ModeratedTextarea
        apiKey={process.env.NEXT_PUBLIC_VETTLY_API_KEY!}
        policyId="balanced"
        placeholder="Type something to test moderation..."
        onChange={(value, result) => {
          console.log('Moderation result:', result)
        }}
      />
    </div>
  )
}
```

Run your app and type some text. You should see:
- ✅ Green border for safe content
- ⚠️ Yellow/orange border for warnings
- ❌ Red border for blocked content

## Troubleshooting

### Module not found

**Error**: `Cannot find module '@nextauralabs/vettly-react'`

**Fix**: Make sure you installed the package:

```bash
npm install @nextauralabs/vettly-react
```

### Styles not loading

**Error**: Components have no styling

**Fix**: Import the CSS file:

```tsx
import '@nextauralabs/vettly-react/styles.css'
```

### API Key errors

**Error**: `Invalid API key` or `Authentication failed`

**Fix**:
1. Check your API key is correct
2. Make sure the environment variable is loaded
3. Verify the variable name matches your framework's convention
4. Restart your dev server after adding environment variables

### TypeScript errors

**Error**: Type errors in your IDE

**Fix**: Make sure you have TypeScript installed:

```bash
npm install -D typescript @types/react @types/react-dom
```

### Build errors (Vite)

**Error**: `require is not defined` or module resolution errors

**Fix**: Vettly packages use ESM. Make sure your `vite.config.ts` has:

```typescript
export default defineConfig({
  optimizeDeps: {
    include: ['@nextauralabs/vettly-react', '@nextauralabs/vettly-sdk']
  }
})
```

### Build errors (Next.js)

**Error**: Module not found in server components

**Fix**: Use client components for Vettly components:

```tsx
'use client'

import { ModeratedTextarea } from '@nextauralabs/vettly-react'
```

## Package Versions

Vettly follows semantic versioning. Check npm for the latest versions:

- [vettly-react on npm](https://www.npmjs.com/package/@nextauralabs/vettly-react)
- [vettly-sdk on npm](https://www.npmjs.com/package/@nextauralabs/vettly-sdk)
- [vettly-shared on npm](https://www.npmjs.com/package/@nextauralabs/vettly-shared)

## Upgrading

To upgrade to the latest version:

```bash
npm install @nextauralabs/vettly-react@latest
```

Check the [CHANGELOG](https://github.com/brian-nextaura/vettly-docs/releases) for breaking changes.

## Bundle Size

Approximate bundle sizes (minified + gzipped):

| Package | Size |
|---------|------|
| `@nextauralabs/vettly-react` | ~15 KB |
| `@nextauralabs/vettly-sdk` | ~5 KB |
| `@nextauralabs/vettly-shared` | ~2 KB |

All packages are tree-shakeable - only import what you use!

## Next Steps

Now that you have Vettly installed:

1. **[Choose a Policy](/guide/policies)** - Learn about moderation policies
2. **[Try the Components](/components/textarea)** - Explore pre-built components
3. **[Use the SDK](/api/sdk)** - Build custom integrations
4. **[See Examples](/examples/social-feed)** - Learn from working code

## Need Help?

- **Documentation**: You're reading it!
- **GitHub Issues**: [Report a bug](https://github.com/brian-nextaura/vettly-docs/issues)
- **Email**: support@vettly.dev
- **Discord**: [Join our community](https://discord.gg/vettly)
