# ModeratedImageUpload

An image upload component with drag-and-drop support and automatic content moderation.

## Overview

The `ModeratedImageUpload` component provides a polished image upload experience with built-in moderation. It supports drag-and-drop, shows image previews, and automatically checks uploaded images for inappropriate content.

## Features

- ✅ **Drag & drop** - Intuitive file upload
- ✅ **Image preview** - See the image before submission
- ✅ **Automatic moderation** - Images checked on upload
- ✅ **File validation** - Type and size limits
- ✅ **Visual feedback** - Clear moderation status
- ✅ **Customizable** - Override UI and behavior
- ✅ **TypeScript** - Full type safety

## Quick Start

```tsx
import { ModeratedImageUpload } from '@nextauralabs/vettly-react'
import '@nextauralabs/vettly-react/styles.css'

function ProfilePictureUpload() {
  return (
    <ModeratedImageUpload
      apiKey="your-api-key"
      policyId="balanced"
      onUpload={(file, result) => {
        if (result.safe) {
          // Upload to your server
          console.log('Safe to upload:', file)
        }
      }}
    />
  )
}
```

## Props

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `apiKey` | `string` | Your Vettly API key |
| `policyId` | `string` | Policy ID for moderation |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onUpload` | `(file: File, result: ModerationResult) => void` | `undefined` | Callback when image is uploaded and checked |
| `maxSizeMB` | `number` | `10` | Maximum file size in megabytes |
| `acceptedFormats` | `string[]` | `['image/jpeg', 'image/png', 'image/webp', 'image/gif']` | Allowed MIME types |
| `showPreview` | `boolean` | `true` | Show image preview |
| `blockUnsafe` | `boolean` | `true` | Prevent unsafe images from being submitted |
| `customFeedback` | `(result: ModerationResult) => ReactNode` | `undefined` | Custom feedback UI |
| `onModerationError` | `(error: Error) => void` | `undefined` | Error handler |
| `className` | `string` | `undefined` | Additional CSS classes |

## Examples

### Basic Usage

```tsx
import { ModeratedImageUpload } from '@nextauralabs/vettly-react'

function App() {
  return (
    <ModeratedImageUpload
      apiKey="vettly_xxxxx"
      policyId="balanced"
      onUpload={(file, result) => {
        console.log('File:', file.name)
        console.log('Safe:', result.safe)
      }}
    />
  )
}
```

### Upload to Server

```tsx
import { useState } from 'react'
import { ModeratedImageUpload } from '@nextauralabs/vettly-react'

function ProfilePicture() {
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const handleUpload = async (file: File, result: ModerationResult) => {
    if (!result.safe) {
      alert('Image contains inappropriate content')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      setImageUrl(data.url)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <ModeratedImageUpload
        apiKey="vettly_xxxxx"
        policyId="balanced"
        onUpload={handleUpload}
      />

      {uploading && <p>Uploading...</p>}
      {imageUrl && <img src={imageUrl} alt="Uploaded" />}
    </div>
  )
}
```

### Custom File Size Limit

```tsx
<ModeratedImageUpload
  apiKey="vettly_xxxxx"
  policyId="balanced"
  maxSizeMB={5} // 5MB limit
  onUpload={(file, result) => {
    console.log('File size:', file.size / 1024 / 1024, 'MB')
  }}
/>
```

### Specific Image Formats

```tsx
<ModeratedImageUpload
  apiKey="vettly_xxxxx"
  policyId="balanced"
  acceptedFormats={['image/jpeg', 'image/png']} // Only JPEG and PNG
/>
```

### Allow Flagged Images

By default, flagged images are blocked. To allow them:

```tsx
<ModeratedImageUpload
  apiKey="vettly_xxxxx"
  policyId="balanced"
  blockUnsafe={false} // Allow flagged images
  onUpload={(file, result) => {
    if (!result.safe) {
      console.warn('Image flagged but allowed:', result.categories)
    }
    // Still upload the image
  }}
/>
```

### Custom Feedback

Customize the moderation feedback:

```tsx
<ModeratedImageUpload
  apiKey="vettly_xxxxx"
  policyId="balanced"
  customFeedback={(result) => {
    if (result.isChecking) {
      return (
        <div className="checking">
          🔍 Analyzing image...
        </div>
      )
    }

    if (result.error) {
      return (
        <div className="error">
          ❌ Failed to check image: {result.error}
        </div>
      )
    }

    if (result.flagged) {
      return (
        <div className="warning">
          ⚠️ Image contains: {
            result.categories
              .filter(c => c.triggered)
              .map(c => c.category)
              .join(', ')
          }
        </div>
      )
    }

    if (result.safe) {
      return <div className="success">✅ Image is safe!</div>
    }

    return null
  }}
/>
```

### Multiple Images

To upload multiple images, use multiple instances or build your own with the `useModeration` hook:

```tsx
import { useState } from 'react'
import { ModeratedImageUpload } from '@nextauralabs/vettly-react'

function Gallery() {
  const [images, setImages] = useState<string[]>([])

  const handleUpload = async (file: File, result: ModerationResult) => {
    if (result.safe) {
      // Upload to server, get URL
      const url = await uploadToServer(file)
      setImages([...images, url])
    }
  }

  return (
    <div>
      <h3>Upload Images ({images.length}/10)</h3>

      {images.length < 10 && (
        <ModeratedImageUpload
          apiKey="vettly_xxxxx"
          policyId="balanced"
          onUpload={handleUpload}
        />
      )}

      <div className="gallery">
        {images.map((url, i) => (
          <img key={i} src={url} alt={`Image ${i + 1}`} />
        ))}
      </div>
    </div>
  )
}
```

### Error Handling

Handle moderation errors:

```tsx
import { useState } from 'react'

function App() {
  const [error, setError] = useState<string | null>(null)

  return (
    <div>
      <ModeratedImageUpload
        apiKey="vettly_xxxxx"
        policyId="balanced"
        onModerationError={(err) => {
          setError(err.message)
          console.error('Moderation failed:', err)
        }}
        onUpload={() => setError(null)} // Clear error on success
      />

      {error && (
        <div className="error">
          Moderation check failed: {error}
        </div>
      )}
    </div>
  )
}
```

### Hide Preview

Disable the image preview:

```tsx
<ModeratedImageUpload
  apiKey="vettly_xxxxx"
  policyId="balanced"
  showPreview={false}
/>
```

## Visual States

The component shows different states during the upload and moderation process:

| State | Description |
|-------|-------------|
| **Empty** | Waiting for file selection/drop |
| **Previewing** | Showing selected image |
| **Checking** | Analyzing image content |
| **Safe** | Image passed moderation |
| **Flagged** | Image contains inappropriate content |
| **Error** | Moderation or upload failed |

## File Validation

The component validates files before sending to moderation:

1. **File type** - Must match `acceptedFormats`
2. **File size** - Must be under `maxSizeMB`
3. **Is image** - Verified via MIME type

Invalid files show an error message without calling the moderation API.

## Default CSS Classes

- `.vettly-image-upload` - Main container
- `.vettly-dropzone` - Drag-and-drop area
- `.vettly-preview` - Image preview container
- `.vettly-preview-image` - The preview image
- `.vettly-upload-status` - Status message
- `.vettly-upload-button` - Upload button

## Drag & Drop

The component supports drag and drop:

1. Drag an image over the component
2. Drop zone highlights
3. Drop the image
4. Image is previewed and checked

## Performance

The component is optimized for performance:

- **Image preview** - Uses FileReader for client-side preview
- **Base64 encoding** - Automatically converts image for API
- **File size validation** - Prevents large uploads before API call
- **Debouncing** - Built-in for rapid file changes

## Accessibility

- Keyboard navigation for file input
- ARIA labels for screen readers
- Focus management
- Clear status announcements

## TypeScript

Full TypeScript support:

```tsx
import type {
  ModeratedImageUploadProps,
  ModerationResult
} from '@nextauralabs/vettly-react'

const props: ModeratedImageUploadProps = {
  apiKey: 'vettly_xxxxx',
  policyId: 'balanced',
  onUpload: (file: File, result: ModerationResult) => {
    // Fully typed!
  }
}
```

## Common Patterns

### Profile Picture Upload

```tsx
function ProfilePictureUpload({ userId }: { userId: string }) {
  const [avatar, setAvatar] = useState<string | null>(null)

  const handleUpload = async (file: File, result: ModerationResult) => {
    if (!result.safe) {
      alert('Please upload an appropriate profile picture')
      return
    }

    const url = await uploadAvatar(userId, file)
    setAvatar(url)
  }

  return (
    <div className="profile-upload">
      {avatar ? (
        <img src={avatar} alt="Profile" className="avatar" />
      ) : (
        <div className="placeholder">No avatar</div>
      )}

      <ModeratedImageUpload
        apiKey="vettly_xxxxx"
        policyId="strict"
        maxSizeMB={2}
        acceptedFormats={['image/jpeg', 'image/png']}
        onUpload={handleUpload}
      />
    </div>
  )
}
```

### Marketplace Listing

```tsx
function ProductImageUpload() {
  return (
    <ModeratedImageUpload
      apiKey="vettly_xxxxx"
      policyId="ecommerce"
      maxSizeMB={5}
      blockUnsafe={true}
      onUpload={async (file, result) => {
        // Upload to CDN
        const url = await uploadToCDN(file)

        // Save to database
        await saveProductImage(productId, url)
      }}
    />
  )
}
```

## See Also

- [ModeratedTextarea](/components/textarea) - Text moderation
- [ModeratedVideoUpload](/components/video-upload) - Video moderation
- [useModeration Hook](/components/use-moderation) - Build custom components
- [Getting Started](/guide/getting-started) - Setup guide
