# ModeratedVideoUpload

Advanced video upload component with frame-by-frame content analysis and thumbnail generation.

## Overview

The `ModeratedVideoUpload` component provides comprehensive video moderation by extracting and analyzing multiple frames from uploaded videos. This ensures thorough content screening beyond just the thumbnail.

## Features

- ✅ **Frame extraction** - Analyzes multiple frames from the video
- ✅ **Thumbnail generation** - Creates preview from video
- ✅ **Progress tracking** - Shows analysis progress
- ✅ **Per-frame results** - Detailed feedback for each frame
- ✅ **Duration limits** - Configurable max video length
- ✅ **File validation** - Size and format checking
- ✅ **Visual feedback** - Clear status indicators

## Quick Start

```tsx
import { ModeratedVideoUpload } from '@nextauralabs/vettly-react'
import '@nextauralabs/vettly-react/styles.css'

function VideoUploader() {
  return (
    <ModeratedVideoUpload
      apiKey="your-api-key"
      policyId="balanced"
      onUpload={(file, results) => {
        if (results.every(r => r.safe)) {
          console.log('All frames safe!')
        }
      }}
    />
  )
}
```

## Props

### Required

| Prop | Type | Description |
|------|------|-------------|
| `apiKey` | `string` | Your Vettly API key |
| `policyId` | `string` | Moderation policy ID |

### Optional

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onUpload` | `(file: File, results: ModerationResult[]) => void` | - | Callback with results |
| `extractFrames` | `number` | `5` | Number of frames to extract |
| `maxDurationSeconds` | `number` | `60` | Maximum video length |
| `maxSizeMB` | `number` | `50` | Maximum file size |
| `acceptedFormats` | `string[]` | `['video/mp4', 'video/webm']` | Allowed formats |
| `showProgress` | `boolean` | `true` | Show progress indicator |
| `blockUnsafe` | `boolean` | `true` | Block videos with flagged frames |

## Examples

### Basic Usage

```tsx
<ModeratedVideoUpload
  apiKey="vettly_xxxxx"
  policyId="balanced"
  onUpload={(file, results) => {
    console.log(`Checked ${results.length} frames`)
    const allSafe = results.every(r => r.safe)
    console.log('Video is safe:', allSafe)
  }}
/>
```

### Custom Frame Count

```tsx
<ModeratedVideoUpload
  apiKey="vettly_xxxxx"
  policyId="strict"
  extractFrames={10} // Analyze 10 frames for thorough checking
  maxDurationSeconds={120} // Allow 2-minute videos
/>
```

### Upload to Server

```tsx
function VideoPost() {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (file: File, results: ModerationResult[]) => {
    const unsafe = results.filter(r => !r.safe)

    if (unsafe.length > 0) {
      alert(`${unsafe.length} frames contain inappropriate content`)
      return
    }

    setUploading(true)
    try {
      await uploadVideo(file)
    } finally {
      setUploading(false)
    }
  }

  return (
    <ModeratedVideoUpload
      apiKey="vettly_xxxxx"
      policyId="balanced"
      onUpload={handleUpload}
    />
  )
}
```

## How It Works

1. **Video Upload** - User selects or drops video file
2. **Validation** - Check duration, size, and format
3. **Frame Extraction** - Extract N frames at intervals
4. **Thumbnail** - Generate preview image
5. **Analysis** - Each frame checked for content
6. **Progress** - Real-time feedback during analysis
7. **Results** - Callback with per-frame results

## Per-Frame Results

Each frame returns a `ModerationResult`:

```tsx
onUpload={(file, results) => {
  results.forEach((result, i) => {
    console.log(`Frame ${i + 1}:`, {
      safe: result.safe,
      flagged: result.flagged,
      categories: result.categories
    })
  })
}}
```

## Performance Tips

- **Fewer frames** = faster + cheaper
- **More frames** = more thorough
- **Recommended**: 5-10 frames for most use cases
- **Short videos** (<30s): 5 frames
- **Long videos** (>1min): 10-15 frames

## See Also

- [ModeratedTextarea](/components/textarea)
- [ModeratedImageUpload](/components/image-upload)
- [useModeration Hook](/components/use-moderation)
