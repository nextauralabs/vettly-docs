# What is Vettly?

Vettly is an AI-powered content moderation platform that helps you keep your application safe from harmful content.

## The Problem

User-generated content can contain:

- 🚫 Hate speech and harassment
- 🚫 Spam and scams
- 🚫 NSFW/inappropriate images
- 🚫 Violence and graphic content
- 🚫 Personal information (PII)
- 🚫 Bot-generated spam

Manually moderating content doesn't scale, and building your own AI moderation system is complex and expensive.

## The Solution

Vettly provides:

1. **Production-ready React components** with built-in moderation
2. **TypeScript SDK** for custom implementations
3. **Multi-modal AI** that understands text, images, and videos
4. **Real-time feedback** for better user experience
5. **Framework integrations** for Next.js, Express, and more

## How It Works

### 1. Simple Integration

```tsx
<ModeratedTextarea
  apiKey="your-key"
  placeholder="Type something..."
/>
```

### 2. Real-Time Checking

As users type, Vettly:
- Debounces API calls (configurable)
- Sends content to AI moderation
- Returns instant results

### 3. Visual Feedback

Components provide automatic feedback:
- 🟢 Green border = Safe content
- 🟡 Yellow border = Warning
- 🔴 Red border = Blocked

### 4. Take Action

```tsx
onModerationResult={(result) => {
  if (result.decision === 'reject') {
    showWarning('Content violates our guidelines')
  }
}}
```

## Multi-Modal Support

### Text Moderation

- Toxicity & hate speech
- Spam detection
- PII detection
- Bot activity

### Image Moderation

- NSFW content
- Violence & gore
- Inappropriate imagery
- Visual spam

### Video Moderation

- Frame-by-frame analysis
- Thumbnail generation
- Comprehensive scanning
- Progress tracking

## Key Features

### For Developers

- ✅ **TypeScript-first** - Full type safety
- ✅ **Zero config** - Works out of the box
- ✅ **Customizable** - Override any behavior
- ✅ **Framework agnostic** - Use anywhere
- ✅ **Comprehensive docs** - Learn quickly

### For Users

- ✅ **Real-time feedback** - Know immediately
- ✅ **Clear messaging** - Understand why
- ✅ **Fast responses** - Sub-second latency
- ✅ **Accessible** - WCAG compliant
- ✅ **Mobile-friendly** - Touch optimized

## Use Cases

### Social Platforms

Moderate posts, comments, and messages in real-time.

```tsx
<ModeratedTextarea
  policy="balanced"
  onModerationResult={handleComment}
/>
```

### Marketplaces

Check product listings for prohibited items.

```tsx
<ModeratedImageUpload
  policy="strict"
  blockUnsafe
/>
```

### Forums & Communities

Keep discussions safe and on-topic.

```tsx
const client = new VettlyClient({ apiKey })
await client.check({ content: post.body, type: 'text' })
```

### Dating Apps

Protect users from harassment and NSFW content.

```tsx
<ModeratedVideoUpload
  policy="strict"
  maxDuration={30}
/>
```

## Pricing Philosophy

**Pay only for what you use:**

- Text moderation: FREE (unlimited)
- Image moderation: $0.0003 per image
- Video moderation: $0.001 per video

No monthly fees, no minimums, no surprises.

## Next Steps

Ready to get started?

- [Installation & Setup →](/guide/getting-started)
- [Browse Components →](/components/overview)
- [View Examples →](/examples/social-feed)
