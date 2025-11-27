# ModeratedTextarea

A textarea component with real-time content moderation and visual feedback.

## Overview

The `ModeratedTextarea` component extends the standard HTML textarea with built-in content moderation. As users type, it automatically checks the content against your moderation policy and provides instant visual feedback.

## Features

- ✅ **Real-time moderation** - Content checked as users type
- ✅ **Visual feedback** - Color-coded borders (green/yellow/red)
- ✅ **Debounced API calls** - Configurable delay to reduce costs
- ✅ **Customizable** - Override feedback, styling, and behavior
- ✅ **Block unsafe content** - Optionally prevent submission of flagged content
- ✅ **Fully typed** - Complete TypeScript support

## Quick Start

```tsx
import { ModeratedTextarea } from '@nextauralabs/vettly-react'
import '@nextauralabs/vettly-react/styles.css'

function CommentForm() {
  return (
    <ModeratedTextarea
      apiKey="your-api-key"
      policyId="balanced"
      placeholder="Write a comment..."
    />
  )
}
```

## Props

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `apiKey` | `string` | Your Vettly API key |
| `policyId` | `string` | Policy ID to use for moderation |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | `undefined` | Controlled component value |
| `onChange` | `(value: string, result: ModerationResult) => void` | `undefined` | Callback when value changes |
| `debounceMs` | `number` | `500` | Delay before checking content (ms) |
| `showFeedback` | `boolean` | `true` | Show moderation status messages |
| `blockUnsafe` | `boolean` | `false` | Prevent typing when content is unsafe |
| `customFeedback` | `(result: ModerationResult) => ReactNode` | `undefined` | Custom feedback component |
| `onModerationResult` | `(result: CheckResponse) => void` | `undefined` | Callback with full moderation response |
| `onModerationError` | `(error: Error) => void` | `undefined` | Error handling callback |
| `className` | `string` | `undefined` | Additional CSS classes |
| `placeholder` | `string` | `undefined` | Textarea placeholder text |
| `rows` | `number` | `undefined` | Number of visible text rows |
| `disabled` | `boolean` | `false` | Disable the textarea |

All standard HTML textarea attributes are also supported.

## Examples

### Basic Usage

```tsx
import { ModeratedTextarea } from '@nextauralabs/vettly-react'
import '@nextauralabs/vettly-react/styles.css'

function App() {
  return (
    <ModeratedTextarea
      apiKey="vettly_xxxxx"
      policyId="balanced"
      placeholder="Type something..."
    />
  )
}
```

### Controlled Component

```tsx
import { useState } from 'react'
import { ModeratedTextarea } from '@nextauralabs/vettly-react'

function CommentForm() {
  const [comment, setComment] = useState('')
  const [isSafe, setIsSafe] = useState(true)

  return (
    <div>
      <ModeratedTextarea
        apiKey={import.meta.env.VITE_VETTLY_API_KEY}
        policyId="social_media"
        value={comment}
        onChange={(value, result) => {
          setComment(value)
          setIsSafe(result.safe)
        }}
        placeholder="Write a comment..."
        rows={4}
      />

      <button disabled={!isSafe}>
        Submit Comment
      </button>
    </div>
  )
}
```

### Block Unsafe Content

Prevent users from typing content that violates your policy:

```tsx
<ModeratedTextarea
  apiKey="vettly_xxxxx"
  policyId="strict"
  blockUnsafe={true}
  placeholder="Only safe content allowed..."
/>
```

When `blockUnsafe` is enabled, the textarea becomes read-only when unsafe content is detected.

### Custom Debounce

Adjust how quickly content is checked (reduce API calls):

```tsx
<ModeratedTextarea
  apiKey="vettly_xxxxx"
  policyId="balanced"
  debounceMs={1000} // Wait 1 second after user stops typing
/>
```

### Custom Feedback

Override the default feedback message:

```tsx
<ModeratedTextarea
  apiKey="vettly_xxxxx"
  policyId="balanced"
  customFeedback={(result) => {
    if (result.isChecking) {
      return <p>🔍 Checking your content...</p>
    }

    if (result.error) {
      return <p className="error">❌ {result.error}</p>
    }

    if (result.flagged) {
      const triggered = result.categories.filter(c => c.triggered)
      return (
        <div className="warning">
          ⚠️ Content flagged for: {triggered.map(c => c.category).join(', ')}
        </div>
      )
    }

    if (result.safe) {
      return <p className="success">✅ Content looks good!</p>
    }

    return null
  }}
/>
```

### Hide Feedback

Disable the feedback UI entirely:

```tsx
<ModeratedTextarea
  apiKey="vettly_xxxxx"
  policyId="balanced"
  showFeedback={false}
  onModerationResult={(result) => {
    // Handle moderation result yourself
    console.log('Moderation result:', result)
  }}
/>
```

### Custom Styling

Override the default styles:

```tsx
<ModeratedTextarea
  apiKey="vettly_xxxxx"
  policyId="balanced"
  className="my-custom-textarea"
  style={{
    minHeight: '200px',
    fontSize: '16px',
    padding: '12px'
  }}
/>
```

Custom CSS:
```css
.my-custom-textarea {
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
}

/* Override feedback colors */
.my-custom-textarea[data-moderation-status="safe"] {
  border-color: #10b981;
}

.my-custom-textarea[data-moderation-status="flagged"] {
  border-color: #f59e0b;
}

.my-custom-textarea[data-moderation-status="blocked"] {
  border-color: #ef4444;
}
```

### Error Handling

Handle moderation errors gracefully:

```tsx
import { useState } from 'react'

function App() {
  const [error, setError] = useState<string | null>(null)

  return (
    <div>
      <ModeratedTextarea
        apiKey="vettly_xxxxx"
        policyId="balanced"
        onModerationError={(err) => {
          console.error('Moderation failed:', err)
          setError(err.message)
        }}
      />

      {error && (
        <div className="error-banner">
          Failed to check content: {error}
        </div>
      )}
    </div>
  )
}
```

### Full Moderation Response

Access the complete moderation data:

```tsx
<ModeratedTextarea
  apiKey="vettly_xxxxx"
  policyId="balanced"
  onModerationResult={(result) => {
    console.log('Decision ID:', result.decisionId)
    console.log('Safe:', result.safe)
    console.log('Action:', result.action)
    console.log('Categories:', result.categories)
    console.log('Provider:', result.provider)
    console.log('Latency:', result.latency)
    console.log('Cost:', result.cost)
  }}
/>
```

## Visual States

The component automatically updates its appearance based on moderation results:

| State | Border Color | Description |
|-------|--------------|-------------|
| Default | Gray | No content or checking not started |
| Checking | Blue | Content is being checked |
| Safe | Green | Content passed moderation |
| Warning | Yellow | Content flagged but not blocked |
| Blocked | Red | Content violates policy |
| Error | Red | Moderation check failed |

## Default CSS Classes

The component uses these CSS classes which you can override:

- `.vettly-textarea` - Main textarea element
- `.vettly-textarea-wrapper` - Container div
- `.vettly-feedback` - Feedback message container
- `.vettly-feedback-safe` - Safe content message
- `.vettly-feedback-warning` - Warning message
- `.vettly-feedback-error` - Error message

## Performance Tips

1. **Increase debounce for long-form content**:
   ```tsx
   debounceMs={1500} // For blog posts, articles
   ```

2. **Use blockUnsafe sparingly**:
   - Can be frustrating for users
   - Better to show warnings and let them edit

3. **Monitor costs**:
   ```tsx
   onModerationResult={(result) => {
     // Log API costs in production
     console.log('API cost:', result.cost)
   }}
   ```

## Accessibility

The component includes:
- Proper ARIA attributes
- Keyboard navigation support
- Screen reader announcements for moderation status
- Focus management

## TypeScript

Full TypeScript support with exported types:

```tsx
import type {
  ModeratedTextareaProps,
  ModerationResult
} from '@nextauralabs/vettly-react'

const props: ModeratedTextareaProps = {
  apiKey: 'vettly_xxxxx',
  policyId: 'balanced',
  onChange: (value: string, result: ModerationResult) => {
    // Fully typed!
  }
}
```

## See Also

- [ModeratedImageUpload](/components/image-upload) - Image moderation
- [ModeratedVideoUpload](/components/video-upload) - Video moderation
- [useModeration Hook](/components/use-moderation) - Build custom components
- [Getting Started](/guide/getting-started) - Setup guide
