# TypeScript SDK

Complete API reference for the Vettly TypeScript SDK.

## Installation

```bash
npm install @nextauralabs/vettly-sdk
```

## Quick Start

```typescript
import { ModerationClient } from '@nextauralabs/vettly-sdk'

const client = new ModerationClient({
  apiKey: process.env.VETTLY_API_KEY!
})

const result = await client.check({
  content: 'Text to moderate',
  policyId: 'balanced',
  contentType: 'text'
})

console.log('Safe:', result.safe)
```

## ModerationClient

### Constructor

```typescript
new ModerationClient(config: ModerationClientConfig)
```

#### Config Options

```typescript
interface ModerationClientConfig {
  apiKey: string          // Required: Your Vettly API key
  apiUrl?: string         // Optional: API base URL (default: production)
  mode?: 'test' | 'production'  // Optional: Mode (default: 'production')
  timeout?: number        // Optional: Request timeout in ms (default: 5000)
}
```

#### Example

```typescript
const client = new ModerationClient({
  apiKey: 'vettly_xxxxx',
  apiUrl: 'https://api.vettly.dev',
  mode: 'production',
  timeout: 10000  // 10 seconds
})
```

## Content Moderation

### check()

Check content for moderation violations.

```typescript
async check(request: CheckRequest): Promise<CheckResponse>
```

#### Request

```typescript
interface CheckRequest {
  content: string         // Content to check (text, base64 image)
  policyId: string        // Policy ID to use
  contentType: 'text' | 'image' | 'video'
  metadata?: {            // Optional metadata
    userId?: string
    ip?: string
    userAgent?: string
    [key: string]: any
  }
}
```

#### Response

```typescript
interface CheckResponse {
  safe: boolean           // True if content is safe
  flagged: boolean        // True if any category triggered
  action: 'allow' | 'warn' | 'flag' | 'block'
  categories: Category[]  // Category results
  decisionId: string      // Unique decision ID
  provider: string        // AI provider used
  latency: number         // Response time in ms
  cost: number           // Cost in USD
}

interface Category {
  category: string        // Category name
  score: number          // Confidence score (0-1)
  threshold: number      // Policy threshold
  triggered: boolean     // True if score >= threshold
}
```

#### Example

```typescript
const result = await client.check({
  content: 'Hello, world!',
  policyId: 'balanced',
  contentType: 'text',
  metadata: {
    userId: 'user_123',
    ip: '192.168.1.1'
  }
})

if (result.safe) {
  console.log('Content is safe!')
} else {
  console.log('Flagged categories:', result.categories.filter(c => c.triggered))
}
```

### dryRun()

Test a policy without making actual AI provider calls.

```typescript
async dryRun(
  policyId: string,
  mockScores?: Record<string, number>
): Promise<DryRunResponse>
```

#### Example

```typescript
const result = await client.dryRun('strict', {
  violence: 0.8,    // Mock: 80% violence score
  sexual: 0.3,      // Mock: 30% sexual score
  hate: 0.95        // Mock: 95% hate score
})

console.log('Would be blocked:', result.action === 'block')
console.log('Triggered categories:', result.categories.filter(c => c.triggered))
```

### batchCheck()

Check multiple items in a single synchronous request.

```typescript
async batchCheck(request: {
  policyId: string
  items: Array<{
    id: string
    content: string
    contentType?: 'text' | 'image' | 'video'
    metadata?: Record<string, unknown>
  }>
}): Promise<BatchCheckResponse>
```

#### Example

```typescript
const results = await client.batchCheck({
  policyId: 'balanced',
  items: [
    { id: 'comment_1', content: 'Great post!' },
    { id: 'comment_2', content: 'Inappropriate content...' },
    { id: 'comment_3', content: 'Thanks for sharing!' }
  ]
})

results.items.forEach(item => {
  console.log(`${item.id}: ${item.safe ? 'Safe' : 'Flagged'}`)
})
```

### batchCheckAsync()

Check multiple items asynchronously with webhook delivery.

```typescript
async batchCheckAsync(request: {
  policyId: string
  items: Array<{
    id: string
    content: string
    contentType?: 'text' | 'image' | 'video'
    metadata?: Record<string, unknown>
  }>
  webhookUrl: string
}): Promise<{ batchId: string }>
```

#### Example

```typescript
const batch = await client.batchCheckAsync({
  policyId: 'balanced',
  items: [
    { id: '1', content: 'Comment 1' },
    { id: '2', content: 'Comment 2' },
    // ... 1000 items
  ],
  webhookUrl: 'https://myapp.com/webhooks/moderation'
})

console.log('Batch ID:', batch.batchId)
// Results will be sent to webhook when ready
```

## Policy Management

### createPolicy()

Create or update a moderation policy.

```typescript
async createPolicy(
  policyId: string,
  yamlContent: string,
  userId?: string
): Promise<Policy>
```

#### Example

```typescript
const yamlContent = `
name: My Custom Policy
categories:
  violence:
    threshold: 0.7
    action: block
  sexual:
    threshold: 0.8
    action: warn
`

const policy = await client.createPolicy(
  'my_custom_policy',
  yamlContent
)

console.log('Policy created:', policy.policyId)
```

### getPolicy()

Get details of a specific policy.

```typescript
async getPolicy(policyId: string): Promise<Policy>
```

#### Example

```typescript
const policy = await client.getPolicy('balanced')

console.log('Policy name:', policy.name)
console.log('Categories:', policy.categories)
```

### listPolicies()

List all available policies.

```typescript
async listPolicies(): Promise<{ policies: Policy[] }>
```

#### Example

```typescript
const { policies } = await client.listPolicies()

policies.forEach(policy => {
  console.log(`${policy.policyId}: ${policy.name}`)
})
```

## Decision Tracking

### getDecision()

Get details of a specific moderation decision.

```typescript
async getDecision(decisionId: string): Promise<Decision>
```

#### Example

```typescript
const decision = await client.getDecision('dec_abc123')

console.log('Content:', decision.content)
console.log('Safe:', decision.safe)
console.log('Timestamp:', decision.timestamp)
```

### listDecisions()

List recent moderation decisions.

```typescript
async listDecisions(options?: {
  limit?: number
  offset?: number
}): Promise<{ decisions: Decision[] }>
```

#### Example

```typescript
const { decisions } = await client.listDecisions({
  limit: 100,
  offset: 0
})

decisions.forEach(d => {
  console.log(`${d.decisionId}: ${d.safe ? 'Safe' : 'Flagged'}`)
})
```

### replayDecision()

Replay a past decision with a different policy.

```typescript
async replayDecision(
  decisionId: string,
  policyId: string
): Promise<CheckResponse>
```

#### Example

```typescript
// Original decision used 'balanced' policy
const original = await client.getDecision('dec_abc123')

// Replay with 'strict' policy
const replayed = await client.replayDecision('dec_abc123', 'strict')

console.log('Original action:', original.action)
console.log('Replayed action:', replayed.action)
```

### getCurlCommand()

Get a cURL command to reproduce a decision.

```typescript
async getCurlCommand(decisionId: string): Promise<string>
```

#### Example

```typescript
const curl = await client.getCurlCommand('dec_abc123')

console.log('To reproduce this decision, run:')
console.log(curl)
```

Output:
```bash
curl -X POST https://api.vettly.dev/v1/check \
  -H "Authorization: Bearer vettly_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"content":"...","policyId":"balanced","contentType":"text"}'
```

## Webhooks

### registerWebhook()

Register a webhook endpoint for events.

```typescript
async registerWebhook(request: {
  url: string
  events: string[]
  description?: string
}): Promise<Webhook>
```

#### Example

```typescript
const webhook = await client.registerWebhook({
  url: 'https://myapp.com/webhooks/vettly',
  events: ['moderation.completed', 'moderation.failed'],
  description: 'Production webhook'
})

console.log('Webhook ID:', webhook.id)
```

### listWebhooks()

List all registered webhooks.

```typescript
async listWebhooks(): Promise<{ webhooks: Webhook[] }>
```

#### Example

```typescript
const { webhooks } = await client.listWebhooks()

webhooks.forEach(hook => {
  console.log(`${hook.id}: ${hook.url}`)
})
```

### getWebhook()

Get details of a specific webhook.

```typescript
async getWebhook(webhookId: string): Promise<Webhook>
```

#### Example

```typescript
const webhook = await client.getWebhook('wh_abc123')

console.log('URL:', webhook.url)
console.log('Events:', webhook.events)
console.log('Enabled:', webhook.enabled)
```

### updateWebhook()

Update webhook configuration.

```typescript
async updateWebhook(
  webhookId: string,
  updates: {
    url?: string
    events?: string[]
    description?: string
    enabled?: boolean
  }
): Promise<Webhook>
```

#### Example

```typescript
const updated = await client.updateWebhook('wh_abc123', {
  events: ['moderation.completed'],  // Remove 'failed' event
  enabled: true
})
```

### deleteWebhook()

Delete a webhook endpoint.

```typescript
async deleteWebhook(webhookId: string): Promise<void>
```

#### Example

```typescript
await client.deleteWebhook('wh_abc123')
console.log('Webhook deleted')
```

### testWebhook()

Send a test event to a webhook.

```typescript
async testWebhook(
  webhookId: string,
  eventType: string
): Promise<{ success: boolean }>
```

#### Example

```typescript
const result = await client.testWebhook(
  'wh_abc123',
  'moderation.completed'
)

console.log('Test successful:', result.success)
```

### getWebhookDeliveries()

Get delivery logs for a webhook.

```typescript
async getWebhookDeliveries(
  webhookId: string,
  options?: { limit?: number }
): Promise<{ deliveries: Delivery[] }>
```

#### Example

```typescript
const { deliveries } = await client.getWebhookDeliveries('wh_abc123', {
  limit: 50
})

deliveries.forEach(d => {
  console.log(`${d.timestamp}: ${d.status} (${d.responseCode})`)
})
```

## Express Middleware

### moderateContent()

Express.js middleware for automatic content moderation.

```typescript
function moderateContent(options: {
  client: ModerationClient
  policyId: string
  field?: string
  onFlagged?: (req, res, result: CheckResponse) => void
}): ExpressMiddleware
```

#### Example

```typescript
import express from 'express'
import { ModerationClient, moderateContent } from '@nextauralabs/vettly-sdk'

const app = express()
const client = new ModerationClient({ apiKey: 'vettly_xxxxx' })

app.post('/api/comments',
  moderateContent({
    client,
    policyId: 'balanced',
    field: 'body.content',  // Check req.body.content
    onFlagged: (req, res, result) => {
      // Custom handling
      res.status(400).json({
        error: 'Content flagged',
        categories: result.categories.filter(c => c.triggered)
      })
    }
  }),
  async (req, res) => {
    // Only reaches here if content is safe
    const comment = await saveComment(req.body)
    res.json(comment)
  }
)
```

#### Default Behavior

If `onFlagged` is not provided:
- `action: 'block'` → 403 response with error
- `action: 'warn'` or `'flag'` → Continue to next middleware
- `action: 'allow'` → Continue to next middleware

#### Nested Fields

```typescript
app.post('/api/posts',
  moderateContent({
    client,
    policyId: 'balanced',
    field: 'body.post.content'  // Checks req.body.post.content
  }),
  handler
)
```

## Error Handling

All SDK methods throw errors on failure:

```typescript
try {
  const result = await client.check({
    content: 'Text',
    policyId: 'balanced',
    contentType: 'text'
  })
} catch (error) {
  if (error.message.includes('rate limit')) {
    console.error('Rate limited, retry later')
  } else if (error.message.includes('Invalid API key')) {
    console.error('Check your API key')
  } else {
    console.error('Moderation failed:', error)
  }
}
```

### Common Errors

| Error Message | Cause | Solution |
|--------------|-------|----------|
| `Invalid API key` | Wrong or expired key | Check API key |
| `Policy not found` | Invalid policy ID | Use valid policy ID |
| `Rate limit exceeded` | Too many requests | Implement backoff |
| `Timeout` | Request took too long | Increase timeout |
| `Network error` | Connection failed | Check network/URL |

## TypeScript Types

All types are exported from the SDK:

```typescript
import type {
  CheckRequest,
  CheckResponse,
  Policy,
  Decision,
  Webhook,
  Category,
  ModerationClientConfig
} from '@nextauralabs/vettly-sdk'

const request: CheckRequest = {
  content: 'Text to check',
  policyId: 'balanced',
  contentType: 'text'
}

const handleResult = (response: CheckResponse) => {
  console.log('Safe:', response.safe)
}
```

## Advanced Usage

### Custom Retry Logic

```typescript
async function checkWithRetry(
  client: ModerationClient,
  request: CheckRequest,
  maxRetries = 3
): Promise<CheckResponse> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.check(request)
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
  throw new Error('Max retries exceeded')
}
```

### Rate Limiting

```typescript
import pLimit from 'p-limit'

const limit = pLimit(10) // Max 10 concurrent requests

const results = await Promise.all(
  comments.map(comment =>
    limit(() =>
      client.check({
        content: comment.text,
        policyId: 'balanced',
        contentType: 'text'
      })
    )
  )
)
```

### Caching Results

```typescript
const cache = new Map<string, CheckResponse>()

async function checkWithCache(
  client: ModerationClient,
  content: string,
  policyId: string
): Promise<CheckResponse> {
  const cacheKey = `${policyId}:${content}`

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!
  }

  const result = await client.check({
    content,
    policyId,
    contentType: 'text'
  })

  cache.set(cacheKey, result)
  return result
}
```

### Multi-Policy Check

```typescript
async function checkMultiplePolicies(
  client: ModerationClient,
  content: string,
  policyIds: string[]
): Promise<Map<string, CheckResponse>> {
  const results = await Promise.all(
    policyIds.map(policyId =>
      client.check({ content, policyId, contentType: 'text' })
    )
  )

  return new Map(
    policyIds.map((policyId, i) => [policyId, results[i]])
  )
}

const results = await checkMultiplePolicies(
  client,
  'Hello world',
  ['permissive', 'balanced', 'strict']
)

console.log('Permissive:', results.get('permissive')?.safe)
console.log('Moderate:', results.get('balanced')?.safe)
console.log('Strict:', results.get('strict')?.safe)
```

## See Also

- [REST API](/api/rest) - Direct HTTP API reference
- [Webhooks](/api/webhooks) - Webhook event reference
- [Express Integration](/api/express) - Express.js guide
- [Next.js Integration](/api/nextjs) - Next.js guide
