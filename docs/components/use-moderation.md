# useModeration Hook

Build custom moderated components with real-time content checking.

## Overview

The `useModeration` hook provides low-level access to Vettly's moderation API, allowing you to build completely custom UI components with content moderation. It handles debouncing, request cancellation, error handling, and state management.

## Features

- ✅ **Debounced checking** - Reduces API calls while typing
- ✅ **Request cancellation** - Cancels outdated requests
- ✅ **State management** - Tracks checking, results, and errors
- ✅ **Flexible input** - Accept string or structured content
- ✅ **TypeScript** - Fully typed with proper inference
- ✅ **Cleanup handling** - Automatic cleanup on unmount
- ✅ **Error handling** - Built-in error state management

## Quick Start

```tsx
import { useModeration } from '@nextauralabs/vettly-react'

function CustomModeratedInput() {
  const { result, check } = useModeration({
    apiKey: 'vettly_xxxxx',
    policyId: 'balanced'
  })

  return (
    <div>
      <input
        type="text"
        onChange={(e) => check(e.target.value)}
        style={{ borderColor: result.safe ? 'green' : 'red' }}
      />
      {result.flagged && <p>Content flagged!</p>}
    </div>
  )
}
```

## API Reference

### Parameters

```tsx
interface UseModerationOptions {
  apiKey: string
  policyId: string
  debounceMs?: number
  enabled?: boolean
  onCheck?: (result: CheckResponse) => void
  onError?: (error: Error) => void
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | **required** | Your Vettly API key |
| `policyId` | `string` | **required** | Policy ID for moderation |
| `debounceMs` | `number` | `500` | Delay before checking (ms) |
| `enabled` | `boolean` | `true` | Enable/disable checking |
| `onCheck` | `(result: CheckResponse) => void` | - | Callback with full API response |
| `onError` | `(error: Error) => void` | - | Error handler |

### Return Value

```tsx
{
  result: ModerationResult
  check: (content: string | CheckRequest) => Promise<void>
}
```

#### ModerationResult

```tsx
interface ModerationResult {
  safe: boolean          // True if content is safe
  flagged: boolean       // True if any category triggered
  action: 'allow' | 'warn' | 'flag' | 'block'
  categories: Category[] // Detailed category results
  isChecking: boolean    // True while checking
  error: string | null   // Error message if failed
}
```

#### check() Function

The `check` function accepts either:
- **String**: Simple text content
- **CheckRequest**: Structured content with type and metadata

```tsx
// String input
check('Hello world')

// Structured input
check({
  content: 'base64-encoded-image',
  contentType: 'image',
  policyId: 'strict'
})
```

## Examples

### Basic Text Input

```tsx
import { useModeration } from '@nextauralabs/vettly-react'

function ModeratedInput() {
  const { result, check } = useModeration({
    apiKey: process.env.VITE_VETTLY_API_KEY!,
    policyId: 'balanced'
  })

  return (
    <div>
      <input
        type="text"
        onChange={(e) => check(e.target.value)}
        placeholder="Type something..."
      />

      {result.isChecking && <p>Checking...</p>}

      {result.safe && !result.isChecking && (
        <p style={{ color: 'green' }}>✓ Safe</p>
      )}

      {result.flagged && (
        <p style={{ color: 'red' }}>
          ✗ Flagged: {result.categories
            .filter(c => c.triggered)
            .map(c => c.category)
            .join(', ')}
        </p>
      )}
    </div>
  )
}
```

### Custom Debounce

```tsx
const { result, check } = useModeration({
  apiKey: 'vettly_xxxxx',
  policyId: 'balanced',
  debounceMs: 1000 // Wait 1 second after typing stops
})
```

### Disabled State

```tsx
function ConditionalModeration({ enabled }: { enabled: boolean }) {
  const { result, check } = useModeration({
    apiKey: 'vettly_xxxxx',
    policyId: 'balanced',
    enabled // Only check when enabled
  })

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        Enable moderation
      </label>

      <textarea onChange={(e) => check(e.target.value)} />
    </div>
  )
}
```

### Full Response Handler

```tsx
const { result, check } = useModeration({
  apiKey: 'vettly_xxxxx',
  policyId: 'balanced',
  onCheck: (response) => {
    console.log('Decision ID:', response.decisionId)
    console.log('Provider:', response.provider)
    console.log('Latency:', response.latency)
    console.log('Cost:', response.cost)

    // Log to analytics
    analytics.track('content_moderated', {
      safe: response.safe,
      action: response.action
    })
  }
})
```

### Error Handling

```tsx
import { useState } from 'react'

function RobustModeration() {
  const [error, setError] = useState<string | null>(null)

  const { result, check } = useModeration({
    apiKey: 'vettly_xxxxx',
    policyId: 'balanced',
    onError: (err) => {
      console.error('Moderation failed:', err)
      setError(err.message)

      // Fallback behavior
      if (err.message.includes('rate limit')) {
        alert('Too many requests. Please slow down.')
      }
    }
  })

  return (
    <div>
      <textarea onChange={(e) => check(e.target.value)} />

      {error && (
        <div className="error">
          ⚠️ Moderation error: {error}
        </div>
      )}
    </div>
  )
}
```

### Image Moderation

```tsx
function CustomImageUpload() {
  const { result, check } = useModeration({
    apiKey: 'vettly_xxxxx',
    policyId: 'balanced'
  })

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Convert to base64
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string

      check({
        content: base64.split(',')[1], // Remove data:image/... prefix
        contentType: 'image',
        policyId: 'balanced'
      })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageChange} />

      {result.isChecking && <p>Analyzing image...</p>}

      {result.flagged && (
        <div className="warning">
          Image contains inappropriate content
        </div>
      )}
    </div>
  )
}
```

### Form Validation

```tsx
import { useState } from 'react'

function ModeratedForm() {
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')

  const usernameModeration = useModeration({
    apiKey: 'vettly_xxxxx',
    policyId: 'strict'
  })

  const bioModeration = useModeration({
    apiKey: 'vettly_xxxxx',
    policyId: 'balanced',
    debounceMs: 1000 // Longer debounce for bio
  })

  const isFormValid =
    usernameModeration.result.safe &&
    bioModeration.result.safe &&
    !usernameModeration.result.isChecking &&
    !bioModeration.result.isChecking

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFormValid) {
      alert('Please fix flagged content')
      return
    }

    // Submit form
    console.log('Submitting:', { username, bio })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value)
            usernameModeration.check(e.target.value)
          }}
        />
        {usernameModeration.result.flagged && (
          <p className="error">Username contains inappropriate content</p>
        )}
      </div>

      <div>
        <label>Bio</label>
        <textarea
          value={bio}
          onChange={(e) => {
            setBio(e.target.value)
            bioModeration.check(e.target.value)
          }}
        />
        {bioModeration.result.flagged && (
          <p className="error">Bio contains inappropriate content</p>
        )}
      </div>

      <button type="submit" disabled={!isFormValid}>
        Submit
      </button>
    </form>
  )
}
```

### Rich Text Editor

```tsx
import ReactQuill from 'react-quill'

function ModeratedEditor() {
  const [content, setContent] = useState('')

  const { result, check } = useModeration({
    apiKey: 'vettly_xxxxx',
    policyId: 'balanced',
    debounceMs: 1500 // Longer debounce for rich text
  })

  const handleChange = (value: string) => {
    setContent(value)

    // Strip HTML tags for moderation
    const plainText = value.replace(/<[^>]*>/g, '')
    check(plainText)
  }

  return (
    <div>
      <ReactQuill value={content} onChange={handleChange} />

      {result.isChecking && (
        <div className="status">Checking content...</div>
      )}

      {result.flagged && (
        <div className="warning">
          Content contains: {result.categories
            .filter(c => c.triggered)
            .map(c => c.category)
            .join(', ')}
        </div>
      )}

      <button disabled={!result.safe || result.isChecking}>
        Publish
      </button>
    </div>
  )
}
```

### Multi-Step Form

```tsx
function MultiStepForm() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: ''
  })

  const titleMod = useModeration({ apiKey: 'vettly_xxxxx', policyId: 'strict' })
  const descMod = useModeration({ apiKey: 'vettly_xxxxx', policyId: 'balanced' })
  const contentMod = useModeration({ apiKey: 'vettly_xxxxx', policyId: 'balanced' })

  const canProceed = (currentStep: number) => {
    switch (currentStep) {
      case 1:
        return titleMod.result.safe && !titleMod.result.isChecking
      case 2:
        return descMod.result.safe && !descMod.result.isChecking
      case 3:
        return contentMod.result.safe && !contentMod.result.isChecking
      default:
        return false
    }
  }

  return (
    <div>
      {step === 1 && (
        <div>
          <h2>Step 1: Title</h2>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => {
              setFormData({ ...formData, title: e.target.value })
              titleMod.check(e.target.value)
            }}
          />
          {titleMod.result.flagged && <p className="error">Title flagged</p>}
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>Step 2: Description</h2>
          <textarea
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value })
              descMod.check(e.target.value)
            }}
          />
          {descMod.result.flagged && <p className="error">Description flagged</p>}
        </div>
      )}

      {step === 3 && (
        <div>
          <h2>Step 3: Content</h2>
          <textarea
            value={formData.content}
            onChange={(e) => {
              setFormData({ ...formData, content: e.target.value })
              contentMod.check(e.target.value)
            }}
          />
          {contentMod.result.flagged && <p className="error">Content flagged</p>}
        </div>
      )}

      <div>
        {step > 1 && <button onClick={() => setStep(step - 1)}>Back</button>}
        {step < 3 && (
          <button onClick={() => setStep(step + 1)} disabled={!canProceed(step)}>
            Next
          </button>
        )}
        {step === 3 && (
          <button disabled={!canProceed(3)}>Submit</button>
        )}
      </div>
    </div>
  )
}
```

### Real-time Feedback

```tsx
function LiveFeedback() {
  const [text, setText] = useState('')

  const { result, check } = useModeration({
    apiKey: 'vettly_xxxxx',
    policyId: 'balanced'
  })

  const getFeedbackColor = () => {
    if (result.isChecking) return '#3b82f6' // Blue
    if (result.error) return '#ef4444' // Red
    if (result.flagged) return '#f59e0b' // Orange
    if (result.safe && text.length > 0) return '#10b981' // Green
    return '#9ca3af' // Gray
  }

  const getFeedbackMessage = () => {
    if (result.isChecking) return '🔍 Checking...'
    if (result.error) return `❌ ${result.error}`
    if (result.flagged) {
      const triggered = result.categories.filter(c => c.triggered)
      return `⚠️ Flagged: ${triggered.map(c => c.category).join(', ')}`
    }
    if (result.safe && text.length > 0) return '✅ Looks good!'
    return 'Type something to check...'
  }

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          check(e.target.value)
        }}
        style={{ borderColor: getFeedbackColor() }}
      />

      <div style={{ color: getFeedbackColor() }}>
        {getFeedbackMessage()}
      </div>

      {result.safe && text.length > 0 && (
        <button>Submit</button>
      )}
    </div>
  )
}
```

### Comment System

```tsx
function CommentBox({ postId }: { postId: string }) {
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { result, check } = useModeration({
    apiKey: 'vettly_xxxxx',
    policyId: 'social_media',
    onCheck: (response) => {
      // Log moderation decision
      console.log('Comment checked:', response.decisionId)
    }
  })

  const handleSubmit = async () => {
    if (!result.safe) {
      alert('Please remove inappropriate content before posting')
      return
    }

    setSubmitting(true)
    try {
      await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          content: comment,
          decisionId: result.decisionId // Include for audit trail
        })
      })

      setComment('')
      alert('Comment posted!')
    } catch (err) {
      console.error('Failed to post comment:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <textarea
        value={comment}
        onChange={(e) => {
          setComment(e.target.value)
          check(e.target.value)
        }}
        placeholder="Write a comment..."
        disabled={submitting}
      />

      {result.flagged && (
        <div className="warning">
          Your comment contains inappropriate content. Please revise.
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!result.safe || result.isChecking || submitting || !comment.trim()}
      >
        {submitting ? 'Posting...' : 'Post Comment'}
      </button>
    </div>
  )
}
```

## Advanced Patterns

### Optimistic UI Updates

```tsx
function OptimisticComment() {
  const { result, check } = useModeration({
    apiKey: 'vettly_xxxxx',
    policyId: 'balanced'
  })

  // Allow UI to update immediately, check in background
  const handleChange = (value: string) => {
    // Update UI
    setText(value)

    // Check in background
    check(value)
  }

  // Only warn/block if flagged
  if (result.flagged) {
    // Show warning, maybe revert UI
  }
}
```

### Manual Triggering

```tsx
function ManualCheck() {
  const [text, setText] = useState('')

  const { result, check } = useModeration({
    apiKey: 'vettly_xxxxx',
    policyId: 'balanced',
    debounceMs: 0 // No debounce, manual only
  })

  return (
    <div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} />

      <button onClick={() => check(text)}>
        Check Content
      </button>

      {result.flagged && <p>Content flagged!</p>}
    </div>
  )
}
```

### Conditional Policies

```tsx
function DynamicPolicy({ userRole }: { userRole: 'admin' | 'user' }) {
  const policyId = userRole === 'admin' ? 'permissive' : 'strict'

  const { result, check } = useModeration({
    apiKey: 'vettly_xxxxx',
    policyId // Changes based on user role
  })

  // Admins get more permissive moderation
}
```

## TypeScript

Full type safety with exported types:

```tsx
import type {
  UseModerationOptions,
  ModerationResult,
  CheckRequest,
  CheckResponse
} from '@nextauralabs/vettly-react'

const options: UseModerationOptions = {
  apiKey: 'vettly_xxxxx',
  policyId: 'balanced',
  debounceMs: 500,
  onCheck: (result: CheckResponse) => {
    console.log(result.safe)
  }
}

const { result, check } = useModeration(options)

// result is typed as ModerationResult
console.log(result.safe) // boolean
console.log(result.action) // 'allow' | 'warn' | 'flag' | 'block'
```

## Performance Tips

1. **Adjust debounce based on content type**:
   - Short text (username): 300-500ms
   - Medium text (comment): 500-1000ms
   - Long text (article): 1000-2000ms

2. **Use `enabled` to disable checking when not needed**:
   ```tsx
   const { result, check } = useModeration({
     apiKey: 'vettly_xxxxx',
     policyId: 'balanced',
     enabled: isFormVisible // Only check when form is visible
   })
   ```

3. **Cancel outdated requests** (automatic):
   - Hook automatically cancels previous requests
   - Safe to call `check()` rapidly

4. **Monitor API costs**:
   ```tsx
   onCheck: (response) => {
     console.log('Cost:', response.cost)
     // Track total costs
   }
   ```

## Cleanup

The hook automatically handles cleanup:
- Cancels pending requests on unmount
- Clears debounce timeouts
- Prevents memory leaks

No manual cleanup needed!

## See Also

- [ModeratedTextarea](/components/textarea) - Pre-built text component
- [ModeratedImageUpload](/components/image-upload) - Pre-built image component
- [ModeratedVideoUpload](/components/video-upload) - Pre-built video component
- [Getting Started](/guide/getting-started) - Setup guide
