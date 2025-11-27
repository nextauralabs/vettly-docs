# @vettly/sdk

> **Production-ready content moderation in 5 minutes**

Official TypeScript SDK for the Vettly content moderation API.

## Installation

```bash
npm install @vettly/sdk
# or
bun add @vettly/sdk
# or
yarn add @vettly/sdk
```

## Quick Start

```typescript
import { ModerationClient } from '@vettly/sdk'

const client = new ModerationClient({
  apiKey: process.env.VETTLY_API_KEY
})

// Check content
const result = await client.check({
  content: 'Hello world!',
  policyId: 'balanced' // or 'strict', 'permissive'
})

console.log(result.safe)    // true or false
console.log(result.action)  // 'block', 'flag', 'warn', or 'allow'
console.log(result.categories) // Detailed category scores
```

## Features

- ✅ **TypeScript**: Full type safety and intellisense
- ✅ **Built-in Policies**: No YAML configuration required
- ✅ **Batch Processing**: Moderate multiple items efficiently
- ✅ **Webhooks**: Real-time event notifications
- ✅ **Idempotency**: Safe retries with request IDs
- ✅ **Multiple Providers**: OpenAI, Hive, Perspective, Azure

## Usage

### Basic Moderation

```typescript
const result = await client.check({
  content: 'Some text to moderate',
  policyId: 'balanced'
})

if (result.action === 'block') {
  console.log('Content blocked:', result.categories)
} else if (result.action === 'flag') {
  console.log('Content flagged for review')
}
```

### Batch Processing

```typescript
const results = await client.batchCheck({
  items: [
    { id: '1', content: 'First message', policyId: 'balanced' },
    { id: '2', content: 'Second message', policyId: 'strict' }
  ]
})

results.forEach(result => {
  console.log(`${result.id}: ${result.safe ? 'Safe' : 'Unsafe'}`)
})
```

### Custom Policies

```typescript
// Create a policy from YAML
await client.createPolicy('my-policy', `
policy:
  name: "custom-policy"
  version: "1.0.0"
  rules:
    - category: hate_speech
      threshold: 0.7
      action: block
      provider: openai
`)

// Use your custom policy
const result = await client.check({
  content: 'Some content',
  policyId: 'my-policy'
})
```

### Webhooks

```typescript
// Register a webhook
await client.registerWebhook({
  url: 'https://your-app.com/webhooks/moderation',
  events: ['decision.created', 'decision.flagged'],
  secret: 'your-webhook-secret'
})
```

### Error Handling

```typescript
try {
  const result = await client.check({
    content: 'Some content',
    policyId: 'balanced'
  })
} catch (error) {
  if (error.code === 'POLICY_NOT_FOUND') {
    console.error('Policy does not exist')
  } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
    console.error('Rate limit exceeded')
  } else {
    console.error('Unexpected error:', error.message)
  }
}
```

## API Reference

### `ModerationClient`

#### Constructor

```typescript
new ModerationClient(options: {
  apiKey: string
  baseURL?: string  // Optional, defaults to production API
})
```

#### Methods

##### `check(request: CheckRequest): Promise<CheckResponse>`

Moderate a single piece of content.

##### `batchCheck(request: BatchCheckRequest): Promise<BatchCheckResponse>`

Moderate multiple items in a single request.

##### `batchCheckAsync(request: BatchCheckRequest): Promise<{ batchId: string }>`

Queue a batch job for async processing.

##### `createPolicy(policyId: string, yamlContent: string): Promise<Policy>`

Create or update a moderation policy.

##### `getDecision(decisionId: string): Promise<Decision>`

Retrieve a past moderation decision.

##### `replayDecision(decisionId: string, policyId: string): Promise<CheckResponse>`

Re-evaluate content with a different policy.

##### `registerWebhook(request: WebhookRequest): Promise<Webhook>`

Register a webhook endpoint for events.

## Built-in Policies

Three policies are automatically available:

### `strict`
- Zero tolerance for harmful content
- Low thresholds (0.3-0.5)
- Best for: Schools, children's apps, professional environments

### `moderate` (Recommended)
- Balanced approach
- Medium thresholds (0.7-0.8)
- Best for: General social apps, forums, comment sections

### `permissive`
- Creative content friendly
- High thresholds (0.85-0.95)
- Best for: Gaming communities, fiction writing, creative platforms

## Environment Variables

```bash
VETTLY_API_KEY=mod_live_...  # Required: Your API key
```

## Links

- [Dashboard](https://dashboard.vettly.dev)
- [Documentation](https://docs.vettly.dev)
- [GitHub](https://github.com/vettly-dev/api)
- [Examples](https://github.com/vettly-dev/api/tree/main/examples)

