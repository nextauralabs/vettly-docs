# Component Overview

Vettly provides production-ready React components with built-in content moderation.

## Available Components

### ModeratedTextarea

Real-time text moderation as users type.

```tsx
import { ModeratedTextarea } from '@nextauralabs/vettly-react'

<ModeratedTextarea
  apiKey="your-key"
  placeholder="Type a comment..."
  policy="balanced"
/>
```

**Features:**
- ✅ Debounced API calls
- ✅ Visual feedback (color-coded borders)
- ✅ Status messages
- ✅ Block unsafe content
- ✅ Fully accessible

[View Details →](/components/textarea)

---

### ModeratedImageUpload

Image upload with drag-and-drop and automatic moderation.

```tsx
import { ModeratedImageUpload } from '@nextauralabs/vettly-react'

<ModeratedImageUpload
  apiKey="your-key"
  onUpload={(file, result) => {
    console.log('Image moderated:', result)
  }}
/>
```

**Features:**
- ✅ Drag & drop support
- ✅ Image preview
- ✅ Automatic moderation
- ✅ File validation
- ✅ Progress indicator

[View Details →](/components/image-upload)

---

### ModeratedVideoUpload

Advanced video upload with frame-by-frame analysis.

```tsx
import { ModeratedVideoUpload } from '@nextauralabs/vettly-react'

<ModeratedVideoUpload
  apiKey="your-key"
  maxDuration={60}
  extractFrames={5}
/>
```

**Features:**
- ✅ Video preview with thumbnail
- ✅ Frame extraction
- ✅ Progress tracking
- ✅ Per-frame moderation
- ✅ Comprehensive feedback

[View Details →](/components/video-upload)

---

### useModeration Hook

Low-level hook for custom implementations.

```tsx
import { useModeration } from '@nextauralabs/vettly-react'

const { check, result, loading } = useModeration({
  apiKey: 'your-key'
})

// Check any content
await check({
  content: 'User text',
  type: 'text'
})
```

**Features:**
- ✅ Full control over UI
- ✅ Loading states
- ✅ Error handling
- ✅ TypeScript types

[View Details →](/components/use-moderation)

---

## Common Props

All components share these common props:

```typescript
interface CommonProps {
  // Required
  apiKey: string

  // Optional
  policy?: 'strict' | 'balanced' | 'permissive'
  baseUrl?: string
  debounceMs?: number
  blockUnsafe?: boolean

  // Callbacks
  onModerationResult?: (result: ModerationResult) => void
  onError?: (error: Error) => void
}
```

## Styling

### Default Styles

Import the default stylesheet:

```tsx
import '@nextauralabs/vettly-react/styles.css'
```

### Custom Styles

Override CSS variables:

```css
:root {
  --vettly-safe-color: #22c55e;
  --vettly-warning-color: #eab308;
  --vettly-unsafe-color: #ef4444;
  --vettly-border-width: 2px;
  --vettly-transition: all 0.2s ease;
}
```

Or use custom class names:

```tsx
<ModeratedTextarea
  className="my-custom-textarea"
  apiKey="your-key"
/>
```

## TypeScript Support

All components are fully typed:

```typescript
import type {
  ModeratedTextareaProps,
  ModeratedImageUploadProps,
  ModeratedVideoUploadProps,
  ModerationResult,
  ModerationStatus
} from '@nextauralabs/vettly-react'
```

## Next Steps

Explore each component in detail:

- [ModeratedTextarea →](/components/textarea)
- [ModeratedImageUpload →](/components/image-upload)
- [ModeratedVideoUpload →](/components/video-upload)
- [useModeration Hook →](/components/use-moderation)
