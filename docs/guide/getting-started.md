# Getting Started

Get up and running with Vettly in under 5 minutes.

## Prerequisites

- Node.js 18+ or Bun
- React 18+ (for React components)
- A Vettly API key ([get one here](https://app.vettly.dev))

## Installation

Choose your package manager:

::: code-group

```bash [npm]
# Install React components
npm install @nextauralabs/vettly-react

# Or just the SDK
npm install @nextauralabs/vettly-sdk
```

```bash [bun]
# Install React components
bun add @nextauralabs/vettly-react

# Or just the SDK
bun add @nextauralabs/vettly-sdk
```

```bash [yarn]
# Install React components
yarn add @nextauralabs/vettly-react

# Or just the SDK
yarn add @nextauralabs/vettly-sdk
```

:::

## Quick Start: React Components

### 1. Import Styles

Add the CSS import to your app entry point:

```tsx
import '@nextauralabs/vettly-react/styles.css'
```

### 2. Use a Component

```tsx
import { ModeratedTextarea } from '@nextauralabs/vettly-react'

function CommentForm() {
  return (
    <ModeratedTextarea
      apiKey={import.meta.env.VITE_VETTLY_API_KEY}
      placeholder="Write a comment..."
      onModerationResult={(result) => {
        console.log('Moderation result:', result)
      }}
    />
  )
}
```

That's it! The textarea now has:
- ✅ Real-time content moderation
- ✅ Visual feedback (color-coded borders)
- ✅ Status messages
- ✅ Automatic debouncing

## Quick Start: SDK Only

If you prefer to build your own UI:

```typescript
import { VettlyClient } from '@nextauralabs/vettly-sdk'

const client = new VettlyClient({
  apiKey: 'your-api-key'
})

// Check text content
const result = await client.check({
  content: 'User-generated content here',
  type: 'text'
})

console.log(result)
// {
//   decision: 'approve',
//   score: 0.92,
//   categories: { toxicity: 0.05, ... }
// }
```

## Configuration

### Environment Variables

Create a `.env` file:

```bash
# Required
VITE_VETTLY_API_KEY=vettly_xxxxx

# Optional: Override API endpoint
VITE_VETTLY_API_URL=https://api.vettly.dev
```

### Component Props

All components accept these common props:

```typescript
interface CommonProps {
  apiKey: string                    // Your Vettly API key
  policy?: 'strict' | 'moderate' | 'permissive'  // Pre-built policy
  blockUnsafe?: boolean             // Prevent unsafe content submission
  debounceMs?: number               // API call delay (default: 500ms)
  onModerationResult?: (result) => void
}
```

## Next Steps

- [Learn how Vettly works](/guide/how-it-works)
- [Explore Components](/components/overview)
- [View Examples](/examples/social-feed)
- [API Reference](/api/sdk)

## Need Help?

- [GitHub Discussions](https://github.com/brian-nextaura/vettly-docs/discussions)
- [GitHub Issues](https://github.com/brian-nextaura/vettly-docs/issues)
- [Email Support](mailto:support@vettly.dev)
