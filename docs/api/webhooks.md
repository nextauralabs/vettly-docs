# Webhooks

Receive real-time notifications about moderation events.

## Overview

Webhooks allow Vettly to push events to your server in real-time, rather than polling for updates. This is useful for:

- **Async batch processing** - Get notified when batch jobs complete
- **Audit logging** - Track all moderation decisions
- **Analytics** - Build dashboards with moderation data
- **Alerting** - Get notified of concerning patterns

## Quick Start

### 1. Create an Endpoint

```typescript
// app/api/webhooks/vettly/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const event = await request.json()

  console.log('Received event:', event.type)

  if (event.type === 'moderation.completed') {
    // Handle completed moderation
  }

  return NextResponse.json({ received: true })
}
```

### 2. Register the Webhook

```typescript
import { ModerationClient } from '@nextauralabs/vettly-sdk'

const client = new ModerationClient({ apiKey: 'vettly_xxxxx' })

const webhook = await client.registerWebhook({
  url: 'https://myapp.com/api/webhooks/vettly',
  events: ['moderation.completed', 'batch.completed'],
  description: 'Production webhook'
})

console.log('Webhook ID:', webhook.id)
console.log('Secret:', webhook.secret) // Save this!
```

### 3. Verify Signatures

```typescript
import crypto from 'crypto'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-vettly-signature')

  const expectedSignature = crypto
    .createHmac('sha256', process.env.VETTLY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')

  if (signature !== expectedSignature) {
    return new Response('Invalid signature', { status: 401 })
  }

  const event = JSON.parse(body)
  // Process event...
}
```

## Event Types

### moderation.completed

Fired when a single moderation check completes.

```json
{
  "type": "moderation.completed",
  "id": "evt_abc123",
  "timestamp": "2025-01-18T10:30:00Z",
  "data": {
    "decisionId": "dec_abc123",
    "content": "Original content",
    "safe": true,
    "action": "allow",
    "flagged": false,
    "categories": [
      {
        "category": "violence",
        "score": 0.05,
        "threshold": 0.7,
        "triggered": false
      }
    ],
    "policyId": "balanced",
    "provider": "openai",
    "latency": 234,
    "cost": 0.001
  }
}
```

### moderation.failed

Fired when a moderation check fails.

```json
{
  "type": "moderation.failed",
  "id": "evt_def456",
  "timestamp": "2025-01-18T10:31:00Z",
  "data": {
    "content": "Content that failed",
    "policyId": "balanced",
    "error": "Provider timeout",
    "errorCode": "PROVIDER_TIMEOUT"
  }
}
```

### batch.completed

Fired when a batch moderation job completes.

```json
{
  "type": "batch.completed",
  "id": "evt_ghi789",
  "timestamp": "2025-01-18T10:35:00Z",
  "data": {
    "batchId": "batch_abc123",
    "totalItems": 100,
    "safeItems": 95,
    "flaggedItems": 5,
    "items": [
      {
        "id": "item_1",
        "safe": true,
        "action": "allow",
        "decisionId": "dec_item1"
      },
      {
        "id": "item_2",
        "safe": false,
        "action": "block",
        "decisionId": "dec_item2"
      }
    ]
  }
}
```

### batch.failed

Fired when a batch job fails.

```json
{
  "type": "batch.failed",
  "id": "evt_jkl012",
  "timestamp": "2025-01-18T10:40:00Z",
  "data": {
    "batchId": "batch_def456",
    "error": "Rate limit exceeded",
    "errorCode": "RATE_LIMIT"
  }
}
```

### policy.updated

Fired when a policy is created or updated.

```json
{
  "type": "policy.updated",
  "id": "evt_mno345",
  "timestamp": "2025-01-18T11:00:00Z",
  "data": {
    "policyId": "my_policy",
    "name": "My Custom Policy",
    "version": 2
  }
}
```

### decision.appealed

Fired when a user appeals a moderation decision.

```json
{
  "type": "decision.appealed",
  "id": "evt_pqr678",
  "timestamp": "2025-01-18T12:00:00Z",
  "data": {
    "decisionId": "dec_abc123",
    "appealReason": "This was incorrectly flagged",
    "userId": "user_123"
  }
}
```

## Signature Verification

### Why Verify Signatures?

Signature verification ensures:
- Events are from Vettly, not malicious actors
- Events haven't been tampered with
- Your endpoint is secure

### How It Works

1. Vettly signs each webhook with your webhook secret
2. Signature is sent in `x-vettly-signature` header
3. You verify the signature using the same secret

### Implementation

#### Node.js / Next.js

```typescript
import crypto from 'crypto'

function verifySignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-vettly-signature')

  if (!signature || !verifySignature(body, signature, process.env.VETTLY_WEBHOOK_SECRET!)) {
    return new Response('Invalid signature', { status: 401 })
  }

  const event = JSON.parse(body)
  // Process event...
  return new Response('OK')
}
```

#### Express

```javascript
const crypto = require('crypto')

app.post('/webhooks/vettly', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-vettly-signature']
  const body = req.body.toString()

  const expectedSignature = crypto
    .createHmac('sha256', process.env.VETTLY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex')

  if (signature !== expectedSignature) {
    return res.status(401).send('Invalid signature')
  }

  const event = JSON.parse(body)
  // Process event...
  res.send('OK')
})
```

#### Python

```python
import hmac
import hashlib

def verify_signature(body: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        body,
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected)

@app.route('/webhooks/vettly', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Vettly-Signature')
    body = request.get_data()

    if not verify_signature(body, signature, os.environ['VETTLY_WEBHOOK_SECRET']):
        return 'Invalid signature', 401

    event = request.json()
    # Process event...
    return 'OK'
```

## Event Handlers

### Process Events by Type

```typescript
export async function POST(request: Request) {
  const event = await request.json()

  switch (event.type) {
    case 'moderation.completed':
      await handleModerationCompleted(event.data)
      break

    case 'moderation.failed':
      await handleModerationFailed(event.data)
      break

    case 'batch.completed':
      await handleBatchCompleted(event.data)
      break

    case 'batch.failed':
      await handleBatchFailed(event.data)
      break

    case 'policy.updated':
      await handlePolicyUpdated(event.data)
      break

    default:
      console.log('Unknown event type:', event.type)
  }

  return new Response('OK')
}

async function handleModerationCompleted(data: any) {
  // Update database
  await db.posts.update(
    { decisionId: data.decisionId },
    {
      moderationStatus: data.safe ? 'approved' : 'rejected',
      moderationAction: data.action
    }
  )

  // Send notification if flagged
  if (data.flagged) {
    await sendAlert({
      title: 'Content Flagged',
      message: `Decision ${data.decisionId} was flagged`,
      categories: data.categories.filter(c => c.triggered)
    })
  }
}

async function handleBatchCompleted(data: any) {
  console.log(`Batch ${data.batchId} completed`)
  console.log(`Safe: ${data.safeItems}, Flagged: ${data.flaggedItems}`)

  // Update all items in database
  for (const item of data.items) {
    await db.comments.update(
      { id: item.id },
      { moderationStatus: item.safe ? 'approved' : 'rejected' }
    )
  }
}
```

### Async Processing

```typescript
// Queue events for processing
import { Queue } from 'bullmq'

const webhookQueue = new Queue('webhooks')

export async function POST(request: Request) {
  const event = await request.json()

  // Acknowledge immediately
  await webhookQueue.add('process-event', event)

  return new Response('Queued', { status: 202 })
}

// Process in background worker
const worker = new Worker('webhooks', async (job) => {
  const event = job.data

  switch (event.type) {
    case 'moderation.completed':
      await handleModerationCompleted(event.data)
      break
    // ... other handlers
  }
})
```

## Managing Webhooks

### Create Webhook

```typescript
const webhook = await client.registerWebhook({
  url: 'https://myapp.com/api/webhooks/vettly',
  events: ['moderation.completed'],
  description: 'Production webhook'
})

// Save the secret!
process.env.VETTLY_WEBHOOK_SECRET = webhook.secret
```

### List Webhooks

```typescript
const { webhooks } = await client.listWebhooks()

webhooks.forEach(hook => {
  console.log(`${hook.id}: ${hook.url}`)
  console.log(`Events: ${hook.events.join(', ')}`)
  console.log(`Enabled: ${hook.enabled}`)
})
```

### Update Webhook

```typescript
const updated = await client.updateWebhook('wh_abc123', {
  events: ['moderation.completed', 'batch.completed'],
  enabled: true
})
```

### Delete Webhook

```typescript
await client.deleteWebhook('wh_abc123')
```

### Test Webhook

```typescript
const result = await client.testWebhook(
  'wh_abc123',
  'moderation.completed'
)

console.log('Test successful:', result.success)
```

### Get Delivery Logs

```typescript
const { deliveries } = await client.getWebhookDeliveries('wh_abc123', {
  limit: 50
})

deliveries.forEach(d => {
  console.log(`${d.timestamp}: ${d.status} (HTTP ${d.responseCode})`)
})
```

## Retries and Failure Handling

### Retry Logic

Vettly automatically retries failed webhook deliveries:

| Attempt | Delay |
|---------|-------|
| 1 | Immediate |
| 2 | 1 minute |
| 3 | 5 minutes |
| 4 | 30 minutes |
| 5 | 2 hours |

After 5 failures, the webhook is marked as failed and disabled.

### Respond Quickly

Respond with `200 OK` within 5 seconds:

```typescript
export async function POST(request: Request) {
  const event = await request.json()

  // ✅ Queue for processing
  await queue.add(event)

  // Respond immediately
  return new Response('OK')
}

// ❌ Don't do this
export async function POST(request: Request) {
  const event = await request.json()

  // This might take too long!
  await processEvent(event)

  return new Response('OK')
}
```

### Handle Idempotency

Webhooks may be delivered more than once. Use the event ID to deduplicate:

```typescript
const processedEvents = new Set()

export async function POST(request: Request) {
  const event = await request.json()

  if (processedEvents.has(event.id)) {
    console.log('Duplicate event, skipping')
    return new Response('OK')
  }

  await handleEvent(event)
  processedEvents.add(event.id)

  return new Response('OK')
}
```

Or use a database:

```typescript
export async function POST(request: Request) {
  const event = await request.json()

  const existing = await db.webhookEvents.findOne({ eventId: event.id })

  if (existing) {
    return new Response('Already processed')
  }

  await db.webhookEvents.create({ eventId: event.id, processedAt: new Date() })
  await handleEvent(event)

  return new Response('OK')
}
```

## Security Best Practices

### 1. Always Verify Signatures

```typescript
// ❌ Don't trust without verification
export async function POST(request: Request) {
  const event = await request.json()
  await handleEvent(event) // Dangerous!
}

// ✅ Always verify
export async function POST(request: Request) {
  if (!verifySignature(...)) {
    return new Response('Unauthorized', { status: 401 })
  }
  await handleEvent(event)
}
```

### 2. Use HTTPS Only

Vettly only sends webhooks to HTTPS endpoints.

```typescript
// ✅ Good
url: 'https://myapp.com/webhooks/vettly'

// ❌ Bad - will be rejected
url: 'http://myapp.com/webhooks/vettly'
```

### 3. Keep Secrets Secret

```typescript
// ✅ Good
const secret = process.env.VETTLY_WEBHOOK_SECRET

// ❌ Bad
const secret = 'whsec_hardcoded_secret'
```

### 4. Rate Limit Your Endpoint

```typescript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100 // Max 100 requests per minute
})

app.post('/webhooks/vettly', limiter, handler)
```

### 5. Log Everything

```typescript
export async function POST(request: Request) {
  const event = await request.json()

  logger.info('Webhook received', {
    eventId: event.id,
    type: event.type,
    timestamp: event.timestamp
  })

  try {
    await handleEvent(event)
    logger.info('Webhook processed', { eventId: event.id })
  } catch (error) {
    logger.error('Webhook failed', {
      eventId: event.id,
      error: error.message
    })
    throw error
  }

  return new Response('OK')
}
```

## Testing

### Local Testing with ngrok

```bash
# Start ngrok
ngrok http 3000

# Register webhook with ngrok URL
https://abc123.ngrok.io/api/webhooks/vettly
```

### Mock Events

```typescript
// test/webhook-handler.test.ts
import { POST } from '@/app/api/webhooks/vettly/route'

describe('Webhook Handler', () => {
  it('processes moderation.completed events', async () => {
    const event = {
      type: 'moderation.completed',
      id: 'evt_test',
      timestamp: new Date().toISOString(),
      data: {
        decisionId: 'dec_test',
        safe: true,
        action: 'allow'
      }
    }

    const request = new Request('http://localhost/api/webhooks/vettly', {
      method: 'POST',
      body: JSON.stringify(event)
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
  })
})
```

### Send Test Events

```typescript
const client = new ModerationClient({ apiKey: 'vettly_xxxxx' })

await client.testWebhook('wh_abc123', 'moderation.completed')
```

## Monitoring

### Track Delivery Success Rate

```typescript
const successRate = deliveries.filter(d => d.status === 'success').length / deliveries.length

if (successRate < 0.95) {
  alert('Webhook delivery success rate below 95%')
}
```

### Alert on Failures

```typescript
async function handleWebhookDeliveryFailed(webhookId: string) {
  const { deliveries } = await client.getWebhookDeliveries(webhookId, {
    limit: 10
  })

  const recentFailures = deliveries.filter(d => d.status === 'failed')

  if (recentFailures.length >= 5) {
    await sendAlert({
      title: 'Webhook Failures',
      message: `Webhook ${webhookId} has ${recentFailures.length} recent failures`
    })
  }
}
```

## See Also

- [TypeScript SDK](/api/sdk) - Webhook management methods
- [REST API](/api/rest) - Webhook HTTP endpoints
- [Express Integration](/api/express) - Express webhook handlers
- [Next.js Integration](/api/nextjs) - Next.js webhook routes
