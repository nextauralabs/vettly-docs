# @vettly/react

> **Real-time content moderation for React**

React components for Vettly content moderation with instant user feedback.

## Installation

```bash
npm install @vettly/react
# or
yarn add @vettly/react
# or
pnpm add @vettly/react
```

## Quick Start

```tsx
import { ModeratedTextarea } from '@vettly/react';
import '@vettly/react/styles.css';

function MyForm() {
  return (
    <ModeratedTextarea
      apiKey="your-api-key"
      policyId="moderate"
      placeholder="Enter your comment..."
      onChange={(value, result) => {
        console.log('Content:', value);
        console.log('Safe:', result.safe);
      }}
    />
  );
}
```

## Components

### ModeratedTextarea

A textarea component with real-time content moderation.

#### Props

```typescript
interface ModeratedTextareaProps {
  // Required
  apiKey: string;
  policyId: string;

  // Optional
  value?: string;
  onChange?: (value: string, result: ModerationResult) => void;
  debounceMs?: number; // Default: 500
  showFeedback?: boolean; // Default: true
  blockUnsafe?: boolean; // Default: false
  customFeedback?: (result: ModerationResult) => React.ReactNode;
  onModerationResult?: (result: CheckResponse) => void;
  onModerationError?: (error: Error) => void;

  // Standard textarea props
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
  // ... all other textarea HTML attributes
}
```

#### Example

```tsx
import { ModeratedTextarea } from '@vettly/react';

function CommentForm() {
  const [comment, setComment] = useState('');

  return (
    <ModeratedTextarea
      apiKey={process.env.VETTLY_API_KEY}
      policyId="social_media"
      value={comment}
      onChange={(value, result) => {
        setComment(value);
        console.log('Moderation:', result);
      }}
      placeholder="Write a comment..."
      rows={4}
      showFeedback={true}
      blockUnsafe={false}
    />
  );
}
```

#### Custom Feedback

```tsx
<ModeratedTextarea
  apiKey={apiKey}
  policyId="balanced"
  customFeedback={(result) => {
    if (result.isChecking) return <div>Analyzing...</div>;
    if (result.action === 'block') return <div>⛔ Not allowed!</div>;
    return <div>✅ Looks good!</div>;
  }}
/>
```

---

### ModeratedImageUpload

Image upload component with automatic moderation.

#### Props

```typescript
interface ModeratedImageUploadProps {
  // Required
  apiKey: string;
  policyId: string;

  // Optional
  onUpload?: (file: File, result: ModerationResult) => void;
  onReject?: (file: File, reason: string) => void;
  maxSizeMB?: number; // Default: 10
  acceptedFormats?: string[]; // Default: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  showPreview?: boolean; // Default: true
  blockUnsafe?: boolean; // Default: true
  customPreview?: (props: PreviewProps) => React.ReactNode;
  className?: string;
  disabled?: boolean;
  onModerationResult?: (result: CheckResponse) => void;
  onModerationError?: (error: Error) => void;
}
```

#### Example

```tsx
import { ModeratedImageUpload } from '@vettly/react';

function ProfilePictureUpload() {
  const handleUpload = (file, result) => {
    console.log('Uploading:', file.name);
    console.log('Moderation:', result);

    // Upload to your server
    const formData = new FormData();
    formData.append('image', file);
    fetch('/api/upload', { method: 'POST', body: formData });
  };

  const handleReject = (file, reason) => {
    console.error('Rejected:', reason);
    alert(`Image rejected: ${reason}`);
  };

  return (
    <ModeratedImageUpload
      apiKey={process.env.VETTLY_API_KEY}
      policyId="strict"
      onUpload={handleUpload}
      onReject={handleReject}
      maxSizeMB={5}
      blockUnsafe={true}
      acceptedFormats={['image/jpeg', 'image/png']}
    />
  );
}
```

---

### ModeratedVideoUpload

Video upload component with frame extraction and moderation.

#### Props

```typescript
interface ModeratedVideoUploadProps {
  // Required
  apiKey: string;
  policyId: string;

  // Optional
  onUpload?: (file: File, result: ModerationResult) => void;
  onReject?: (file: File, reason: string) => void;
  maxSizeMB?: number; // Default: 100
  maxDurationSeconds?: number; // Default: 300
  acceptedFormats?: string[]; // Default: ['video/mp4', 'video/webm', 'video/quicktime']
  showPreview?: boolean; // Default: true
  blockUnsafe?: boolean; // Default: true
  extractFramesCount?: number; // Default: 3
  customPreview?: (props: PreviewProps) => React.ReactNode;
  className?: string;
  disabled?: boolean;
  onModerationResult?: (result: CheckResponse) => void;
  onModerationError?: (error: Error) => void;
}
```

#### Example

```tsx
import { ModeratedVideoUpload } from '@vettly/react';

function VideoUploadForm() {
  return (
    <ModeratedVideoUpload
      apiKey={process.env.VETTLY_API_KEY}
      policyId="moderate"
      onUpload={(file, result) => {
        console.log('Video uploaded:', file.name);
        console.log('Safe:', result.safe);
      }}
      maxSizeMB={50}
      maxDurationSeconds={120}
      extractFramesCount={5}
      blockUnsafe={true}
    />
  );
}
```

---

## Hooks

### useModeration

Low-level hook for custom moderation implementations.

#### Usage

```tsx
import { useModeration } from '@vettly/react';

function CustomComponent() {
  const { result, check } = useModeration({
    apiKey: process.env.VETTLY_API_KEY,
    policyId: 'balanced',
    debounceMs: 500,
  });

  const handleChange = (e) => {
    check(e.target.value);
  };

  return (
    <div>
      <input onChange={handleChange} />
      {result.isChecking && <span>Checking...</span>}
      {result.safe ? <span>✅ Safe</span> : <span>⚠️ Unsafe</span>}
    </div>
  );
}
```

---

## Styling

### Default Styles

Import the default stylesheet:

```tsx
import '@vettly/react/styles.css';
```

### Custom Styles

Override CSS classes or use `className` prop:

```css
.moderated-textarea {
  border-radius: 8px;
  padding: 16px;
}

.feedback-block {
  background-color: #ff0000;
  color: white;
}
```

### Headless UI

Pass `showFeedback={false}` and use `customFeedback` or `customPreview` for complete control:

```tsx
<ModeratedTextarea
  showFeedback={false}
  customFeedback={(result) => <YourCustomFeedback {...result} />}
/>
```

---

## TypeScript

Fully typed with TypeScript. Import types:

```typescript
import type {
  ModerationResult,
  UseModerationOptions,
  ModeratedTextareaProps,
  ModeratedImageUploadProps,
  ModeratedVideoUploadProps,
} from '@vettly/react';
```

---

## Features

- ✅ **Real-time moderation** - Instant feedback as users type or upload
- ✅ **Debounced checking** - Optimized API calls with configurable debounce
- ✅ **Visual feedback** - Color-coded borders and status messages
- ✅ **Block unsafe content** - Optionally prevent unsafe submissions
- ✅ **Customizable** - Override styles and feedback components
- ✅ **TypeScript** - Full type safety and IntelliSense
- ✅ **Lightweight** - Tree-shakeable, ~15KB gzipped
- ✅ **Framework agnostic** - Works with any React setup (Next.js, Vite, CRA)

---

## Advanced Examples

### Form Integration with React Hook Form

```tsx
import { useForm, Controller } from 'react-hook-form';
import { ModeratedTextarea } from '@vettly/react';

function CommentForm() {
  const { control, handleSubmit } = useForm();

  const onSubmit = (data) => {
    console.log('Submitting:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="comment"
        control={control}
        render={({ field }) => (
          <ModeratedTextarea
            {...field}
            apiKey={process.env.VETTLY_API_KEY}
            policyId="moderate"
            onChange={(value, result) => {
              field.onChange(value);
            }}
          />
        )}
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Multi-step Form with Validation

```tsx
function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [isSafe, setIsSafe] = useState(true);

  return (
    <div>
      {step === 1 && (
        <ModeratedTextarea
          apiKey={apiKey}
          policyId="moderate"
          onChange={(value, result) => {
            setIsSafe(result.safe);
          }}
        />
      )}
      <button
        disabled={!isSafe}
        onClick={() => setStep(2)}
      >
        Next Step
      </button>
    </div>
  );
}
```

### Custom Loading State

```tsx
<ModeratedTextarea
  apiKey={apiKey}
  policyId="balanced"
  customFeedback={(result) => {
    if (result.isChecking) {
      return (
        <div className="flex items-center gap-2">
          <Spinner />
          <span>Analyzing content with AI...</span>
        </div>
      );
    }
    return <DefaultFeedback {...result} />;
  }}
/>
```

---

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile: iOS Safari 12+, Chrome Android Latest

---

## License

MIT

---

## Links

- [Documentation](https://docs.vettly.dev/react)
- [API Reference](https://docs.vettly.dev/api)
- [GitHub](https://github.com/vettly-dev/api)
- [Issues](https://github.com/vettly-dev/api/issues)
