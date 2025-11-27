# How It Works

Understanding Vettly's content moderation architecture and flow.

## Overview

Vettly provides real-time content moderation by analyzing text, images, and videos against customizable policies. The system uses AI-powered providers to detect inappropriate content and returns actionable results.

```
User Input → Vettly Client → Vettly API → AI Providers → Moderation Decision → Your App
```

## Architecture

### Client Layer

Your application uses either:
- **React Components** - Pre-built UI components with moderation
- **TypeScript SDK** - Low-level API client for custom integrations

```tsx
// React Component
<ModeratedTextarea
  apiKey="vettly_xxxxx"
  policyId="balanced"
  onChange={(value, result) => {
    console.log('Safe:', result.safe)
  }}
/>

// Or SDK
const client = new ModerationClient({ apiKey: 'vettly_xxxxx' })
const result = await client.check({
  content: 'Text to check',
  policyId: 'balanced',
  contentType: 'text'
})
```

### API Layer

Vettly's API receives content and:
1. **Validates** the request (API key, policy, content type)
2. **Routes** to the appropriate AI provider
3. **Applies** your policy rules
4. **Returns** a structured decision

### Provider Layer

AI providers analyze content for:
- Violence, gore, self-harm
- Sexual content (explicit, suggestive)
- Hate speech, harassment
- Illegal activities
- Spam, scams
- Personal information (PII)

**Providers used**:
- OpenAI Moderation API
- Anthropic Claude (planned)
- Custom models (enterprise)

## Decision Flow

### 1. Content Submission

Your app sends content to Vettly:

```typescript
const result = await client.check({
  content: 'Check this text',
  policyId: 'balanced',
  contentType: 'text'
})
```

### 2. Policy Application

Vettly applies your policy's category thresholds:

```json
{
  "policyId": "balanced",
  "categories": {
    "violence": { "threshold": 0.7 },
    "sexual": { "threshold": 0.8 },
    "hate": { "threshold": 0.5 }
  }
}
```

### 3. Provider Analysis

The AI provider returns confidence scores:

```json
{
  "violence": 0.05,
  "sexual": 0.02,
  "hate": 0.85
}
```

### 4. Threshold Comparison

Vettly compares scores against thresholds:

| Category | Score | Threshold | Triggered? |
|----------|-------|-----------|------------|
| Violence | 0.05 | 0.7 | ❌ No |
| Sexual | 0.02 | 0.8 | ❌ No |
| Hate | 0.85 | 0.5 | ✅ Yes |

### 5. Action Determination

Based on triggered categories, Vettly returns an action:

| Action | Meaning | Use Case |
|--------|---------|----------|
| `allow` | Content is safe | Show content immediately |
| `warn` | Minor concerns | Show with warning label |
| `flag` | Review needed | Queue for manual review |
| `block` | Violates policy | Reject content |

### 6. Response

Vettly returns a detailed response:

```json
{
  "safe": false,
  "flagged": true,
  "action": "block",
  "categories": [
    {
      "category": "hate",
      "score": 0.85,
      "threshold": 0.5,
      "triggered": true
    }
  ],
  "decisionId": "dec_abc123",
  "provider": "openai",
  "latency": 234,
  "cost": 0.002
}
```

## Content Types

### Text Moderation

**How it works**:
1. Text sent to AI provider as plain text
2. Provider analyzes semantic meaning
3. Returns category scores
4. Vettly applies policy

**Supported formats**:
- Plain text
- Markdown (analyzed as text)
- HTML (tags stripped)

**Latency**: ~200-500ms

```typescript
const result = await client.check({
  content: 'Text to check',
  contentType: 'text',
  policyId: 'balanced'
})
```

### Image Moderation

**How it works**:
1. Image converted to base64
2. Sent to vision-capable AI provider
3. Provider analyzes visual content
4. Returns category scores

**Supported formats**:
- JPEG, PNG, WebP, GIF
- Max size: 10 MB (default)
- Analyzed as single frame

**Latency**: ~500-1500ms

```typescript
const result = await client.check({
  content: base64Image,
  contentType: 'image',
  policyId: 'strict'
})
```

### Video Moderation

**How it works**:
1. Extract N frames at intervals
2. Generate thumbnail
3. Analyze each frame as image
4. Aggregate results

**Process**:
```
Video (60s) → Extract 5 frames → Analyze each → Aggregate scores
```

**Frame extraction**:
- 5 frames = every 12 seconds
- 10 frames = every 6 seconds
- More frames = more thorough, higher cost

**Latency**: ~2-5 seconds (depends on frame count)

```typescript
const result = await client.checkVideo({
  videoFile: file,
  policyId: 'balanced',
  extractFrames: 5
})
```

## Policies

Policies define what content is acceptable. Each policy has:
- **Category thresholds** - Sensitivity per category
- **Actions** - What to do when triggered
- **Metadata** - Name, description, use case

### Pre-built Policies

| Policy ID | Use Case | Sensitivity |
|-----------|----------|-------------|
| `permissive` | Open platforms | Low |
| `balanced` | Social media | Medium |
| `strict` | Kids apps, education | High |
| `ecommerce` | E-commerce listings | Medium-High |

### Custom Policies

Create policies for your specific needs:

```typescript
const policy = {
  name: 'My Custom Policy',
  categories: {
    violence: { threshold: 0.6, action: 'warn' },
    sexual: { threshold: 0.9, action: 'block' },
    hate: { threshold: 0.4, action: 'block' }
  }
}
```

See [Policies Guide](/guide/policies) for details.

## Performance

### Latency

Typical response times:

| Content Type | Latency | Notes |
|--------------|---------|-------|
| Text | 200-500ms | Single API call |
| Image | 500-1500ms | Vision model |
| Video (5 frames) | 2-5s | Parallel frame analysis |

### Optimization

**Debouncing** - Wait for user to stop typing:
```tsx
<ModeratedTextarea
  debounceMs={500} // Wait 500ms after typing stops
/>
```

**Request Cancellation** - Cancel outdated requests:
```tsx
// Automatic in React components and hooks
// Manual in SDK:
const controller = new AbortController()
await client.check(content, { signal: controller.signal })
```

**Caching** - Same content returns cached result:
- Cache duration: 1 hour
- Cache key: hash of content + policy
- Reduces cost and latency

### Scaling

Vettly handles:
- **100k+ requests/day** on standard plan
- **Parallel requests** - No rate limits (fair use)
- **Global CDN** - Low latency worldwide

## Security

### API Key Security

- Never expose API keys in client-side code
- Use environment variables
- Rotate keys regularly
- Monitor usage for anomalies

### Content Privacy

- Content is **not stored** after moderation
- Processed in-memory only
- Encrypted in transit (TLS 1.3)
- Compliant with GDPR, CCPA

### Provider Privacy

AI providers (OpenAI, etc.):
- Do **not** use content for training
- Process and discard immediately
- Subject to their privacy policies

## Cost Structure

Vettly pricing is based on:

| Content Type | Cost per Check |
|--------------|----------------|
| Text | $0.001 |
| Image | $0.003 |
| Video (per frame) | $0.003 |

**Example costs**:
- 1000 text checks = $1.00
- 100 image uploads = $0.30
- 10 videos (5 frames each) = $0.15

**Cost optimization**:
- Use debouncing to reduce checks
- Adjust video frame count
- Cache results when possible
- Use appropriate policies (stricter = fewer false positives)

## Monitoring

### Decision IDs

Every moderation check returns a `decisionId`:

```json
{
  "decisionId": "dec_abc123"
}
```

Use this to:
- Track moderation decisions
- Audit content decisions
- Debug false positives/negatives
- Link to user reports

### Analytics

Track in `onCheck` callback:

```tsx
<ModeratedTextarea
  onModerationResult={(result) => {
    analytics.track('content_moderated', {
      safe: result.safe,
      action: result.action,
      latency: result.latency,
      cost: result.cost
    })
  }}
/>
```

## Error Handling

### Network Errors

**Retry logic** (automatic in SDK):
```typescript
const client = new ModerationClient({
  apiKey: 'vettly_xxxxx',
  retries: 3,
  timeout: 10000
})
```

### Fallback Strategy

When moderation fails:

```tsx
const { result, check } = useModeration({
  apiKey: 'vettly_xxxxx',
  policyId: 'balanced',
  onError: (error) => {
    // Option 1: Allow content (risky)
    setFallbackSafe(true)

    // Option 2: Block everything (conservative)
    setFallbackSafe(false)

    // Option 3: Queue for manual review
    queueForReview(content)
  }
})
```

## Best Practices

### Client-Side

✅ **Do**:
- Debounce text input (500ms+)
- Show loading states
- Handle errors gracefully
- Cancel outdated requests

❌ **Don't**:
- Check empty content
- Check every keystroke
- Expose API keys
- Ignore errors

### Server-Side

✅ **Do**:
- Verify client-side results
- Log decision IDs
- Rate limit users
- Monitor costs

❌ **Don't**:
- Trust client-only checks
- Skip error handling
- Hardcode API keys
- Ignore anomalies

## Integration Patterns

### Real-time (Forms)

```tsx
<ModeratedTextarea
  apiKey="vettly_xxxxx"
  policyId="balanced"
  onChange={(value, result) => {
    setCanSubmit(result.safe)
  }}
/>
```

### Post-submission (API)

```typescript
app.post('/api/posts', async (req, res) => {
  const result = await client.check({
    content: req.body.content,
    policyId: 'balanced',
    contentType: 'text'
  })

  if (!result.safe) {
    return res.status(400).json({ error: 'Content flagged' })
  }

  await savePost(req.body)
  res.json({ success: true })
})
```

### Batch Processing

```typescript
const results = await Promise.all(
  comments.map(comment =>
    client.check({
      content: comment.text,
      policyId: 'balanced',
      contentType: 'text'
    })
  )
)

const flaggedComments = comments.filter((_, i) => !results[i].safe)
```

### Manual Review Queue

```typescript
const result = await client.check(content)

if (result.action === 'flag') {
  await addToReviewQueue({
    content,
    decisionId: result.decisionId,
    categories: result.categories.filter(c => c.triggered)
  })
}
```

## See Also

- [Policies Guide](/guide/policies) - Configure moderation policies
- [API Reference](/api/sdk) - Full SDK documentation
- [React Components](/components/textarea) - Pre-built components
- [Examples](/examples/social-feed) - Working code samples
