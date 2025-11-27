---
layout: home

hero:
  name: Vettly
  text: AI-Powered Content Moderation
  tagline: Production-ready React components and SDK for moderating text, images, and videos
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Try Components
      link: /components/overview

features:
  - icon: ⚡
    title: Real-Time Moderation
    details: Check content as users type with debounced API calls and visual feedback

  - icon: 🎨
    title: Beautiful Components
    details: Production-ready React components with built-in moderation, styling, and error handling

  - icon: 🎬
    title: Multi-Modal Support
    details: Moderate text, images, and videos with frame-by-frame analysis

  - icon: 🛡️
    title: Type-Safe SDK
    details: Full TypeScript support with comprehensive type definitions

  - icon: 🎯
    title: Customizable Policies
    details: Pre-built strict, moderate, and permissive policies or create your own

  - icon: 🚀
    title: Framework Agnostic
    details: Works with React, Next.js, Express, or vanilla JavaScript
---

## Quick Start

### Install

::: code-group

```bash [npm]
npm install @nextauralabs/vettly-react
```

```bash [bun]
bun add @nextauralabs/vettly-react
```

```bash [yarn]
yarn add @nextauralabs/vettly-react
```

:::

### Use Components

```tsx
import { ModeratedTextarea } from '@nextauralabs/vettly-react'
import '@nextauralabs/vettly-react/styles.css'

function App() {
  return (
    <ModeratedTextarea
      apiKey="your-api-key"
      placeholder="Type something..."
      onModerationResult={(result) => console.log(result)}
    />
  )
}
```

## Features

### ModeratedTextarea

Real-time content checking with visual feedback:

- ✅ Debounced API calls (configurable delay)
- ✅ Color-coded borders (green/yellow/red)
- ✅ Status messages
- ✅ Block unsafe content option
- ✅ Fully customizable

[View Component →](/components/textarea)

### ModeratedImageUpload

Drag-and-drop image upload with moderation:

- ✅ Drag & drop support
- ✅ Image preview
- ✅ Automatic moderation on upload
- ✅ Visual feedback
- ✅ File size/type validation

[View Component →](/components/image-upload)

### ModeratedVideoUpload

Advanced video upload with frame extraction:

- ✅ Video preview with thumbnail
- ✅ Frame-by-frame analysis
- ✅ Progress tracking
- ✅ Visual feedback per frame
- ✅ Comprehensive error handling

[View Component →](/components/video-upload)

## Why Vettly?

| Feature | Vettly | Others |
|---------|--------|--------|
| **Multi-Modal** | ✅ Text, Images, Videos | ⚠️ Usually text-only |
| **React Components** | ✅ Production-ready | ❌ Build your own |
| **Video Frame Analysis** | ✅ Advanced | ❌ Not available |
| **TypeScript** | ✅ Full support | ⚠️ Partial |
| **Real-time Feedback** | ✅ Built-in | ❌ Manual |
| **Framework Integrations** | ✅ React, Next.js, Express | ❌ SDK only |

## Pricing

Transparent, usage-based pricing:

- **Text Moderation**: FREE (OpenAI + Perspective)
- **Image Moderation**: $0.0003 per image (~$3 per 10K)
- **Video Moderation**: $0.001 per video (~$1 per 1K)

[View Full Pricing →](https://vettly.dev/pricing)

## Examples

Check out complete working examples:

- [Social Feed](/examples/social-feed) - Social media with content moderation
- [Forum](/examples/forum) - Discussion board with moderation
- [Chat App](/examples/chat) - Real-time chat with safety

