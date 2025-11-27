# Express.js Integration

Integrate Vettly moderation into your Express applications.

## Installation

```bash
npm install @nextauralabs/vettly-sdk express
```

## Quick Start

```javascript
const express = require('express')
const { ModerationClient, moderateContent } = require('@nextauralabs/vettly-sdk')

const app = express()
const client = new ModerationClient({ apiKey: process.env.VETTLY_API_KEY })

app.use(express.json())

app.post('/api/comments',
  moderateContent({
    client,
    policyId: 'balanced'
  }),
  (req, res) => {
    // Content is safe, save comment
    res.json({ success: true })
  }
)

app.listen(3000)
```

## Middleware

### moderateContent()

Built-in middleware for automatic content moderation.

```javascript
const { moderateContent } = require('@nextauralabs/vettly-sdk')

app.post('/api/posts',
  moderateContent({
    client,                    // ModerationClient instance
    policyId: 'balanced',      // Policy to use
    field: 'body.content',     // Field to check (default: 'body.content')
    onFlagged: (req, res, result) => {  // Optional custom handler
      res.status(400).json({
        error: 'Content flagged',
        categories: result.categories.filter(c => c.triggered)
      })
    }
  }),
  handler
)
```

### Default Behavior

If content is blocked (`action: 'block'`):

```json
HTTP 403 Forbidden
{
  "error": "Content blocked by moderation",
  "categories": [
    {
      "category": "hate",
      "score": 0.85,
      "threshold": 0.5,
      "triggered": true
    }
  ]
}
```

## Examples

### Comment Moderation

```javascript
const express = require('express')
const { ModerationClient, moderateContent } = require('@nextauralabs/vettly-sdk')

const app = express()
const client = new ModerationClient({ apiKey: process.env.VETTLY_API_KEY })

app.use(express.json())

app.post('/api/comments',
  moderateContent({
    client,
    policyId: 'social_media',
    field: 'body.text'
  }),
  async (req, res) => {
    const comment = await db.comments.create({
      text: req.body.text,
      userId: req.user.id
    })

    res.json(comment)
  }
)
```

### Custom Error Handling

```javascript
app.post('/api/posts',
  moderateContent({
    client,
    policyId: 'balanced',
    onFlagged: (req, res, result) => {
      // Log for review
      logger.warn('Content flagged', {
        userId: req.user.id,
        action: result.action,
        categories: result.categories.filter(c => c.triggered)
      })

      // Custom response
      if (result.action === 'block') {
        return res.status(400).json({
          error: 'Your post contains inappropriate content',
          canAppeal: true
        })
      }

      // Allow but warn
      if (result.action === 'warn') {
        req.moderationWarning = true
        // Continue to next middleware
      }
    }
  }),
  async (req, res) => {
    const post = await db.posts.create({
      content: req.body.content,
      flagged: req.moderationWarning || false
    })

    res.json(post)
  }
)
```

### Multiple Fields

Check multiple fields in a request:

```javascript
const checkTitle = moderateContent({
  client,
  policyId: 'strict',
  field: 'body.title'
})

const checkContent = moderateContent({
  client,
  policyId: 'balanced',
  field: 'body.content'
})

app.post('/api/articles',
  checkTitle,
  checkContent,
  async (req, res) => {
    // Both title and content are safe
    const article = await db.articles.create(req.body)
    res.json(article)
  }
)
```

### User-Based Policies

Different policies for different user types:

```javascript
function getUserPolicy(user) {
  if (user.role === 'admin') return 'permissive'
  if (user.verified) return 'balanced'
  return 'strict'
}

app.post('/api/posts', (req, res, next) => {
  moderateContent({
    client,
    policyId: getUserPolicy(req.user)
  })(req, res, next)
})
```

## Manual Checking

For more control, check content manually:

```javascript
app.post('/api/comments', async (req, res) => {
  try {
    const result = await client.check({
      content: req.body.text,
      policyId: 'balanced',
      contentType: 'text',
      metadata: {
        userId: req.user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    })

    if (result.action === 'block') {
      return res.status(400).json({
        error: 'Content blocked',
        categories: result.categories.filter(c => c.triggered)
      })
    }

    // Save with moderation metadata
    const comment = await db.comments.create({
      text: req.body.text,
      userId: req.user.id,
      moderationSafe: result.safe,
      moderationDecisionId: result.decisionId
    })

    res.json(comment)
  } catch (error) {
    console.error('Moderation failed:', error)
    // Fail open or closed based on your needs
    res.status(500).json({ error: 'Failed to check content' })
  }
})
```

## Image Uploads

Check uploaded images:

```javascript
const multer = require('multer')
const upload = multer({ storage: multer.memoryStorage() })

app.post('/api/images',
  upload.single('image'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' })
    }

    // Convert to base64
    const base64 = req.file.buffer.toString('base64')

    // Check image
    const result = await client.check({
      content: base64,
      policyId: 'ecommerce',
      contentType: 'image'
    })

    if (!result.safe) {
      return res.status(400).json({
        error: 'Image contains inappropriate content',
        categories: result.categories.filter(c => c.triggered)
      })
    }

    // Upload to storage
    const url = await uploadToS3(req.file)

    res.json({ url, safe: true })
  }
)
```

## Batch Processing

Check multiple items:

```javascript
app.post('/api/comments/bulk', async (req, res) => {
  const { comments } = req.body

  const batchResult = await client.batchCheck({
    policyId: 'balanced',
    items: comments.map((comment, i) => ({
      id: i.toString(),
      content: comment.text,
      contentType: 'text'
    }))
  })

  const safeComments = comments.filter((_, i) => {
    const result = batchResult.items.find(item => item.id === i.toString())
    return result?.safe
  })

  const saved = await db.comments.insertMany(safeComments)

  res.json({
    saved: saved.length,
    blocked: comments.length - saved.length
  })
})
```

## Async Processing

For long-running moderation tasks:

```javascript
app.post('/api/videos/bulk', async (req, res) => {
  const { videos } = req.body

  // Start async batch check
  const batch = await client.batchCheckAsync({
    policyId: 'strict',
    items: videos.map(v => ({
      id: v.id,
      content: v.url,
      contentType: 'video'
    })),
    webhookUrl: 'https://myapp.com/webhooks/moderation'
  })

  res.json({
    batchId: batch.batchId,
    status: 'processing'
  })
})

// Webhook handler
app.post('/webhooks/moderation', async (req, res) => {
  const { batchId, items } = req.body

  for (const item of items) {
    await db.videos.update(
      { id: item.id },
      {
        moderationStatus: item.safe ? 'approved' : 'rejected',
        moderationDecisionId: item.decisionId
      }
    )
  }

  res.json({ received: true })
})
```

## Error Handling

### Global Error Handler

```javascript
app.use((error, req, res, next) => {
  if (error.message.includes('Moderation')) {
    // Log moderation errors
    logger.error('Moderation error', {
      path: req.path,
      error: error.message
    })

    // Fail open (allow content) or closed (block content)
    const failOpen = process.env.MODERATION_FAIL_OPEN === 'true'

    if (failOpen) {
      return next() // Continue processing
    } else {
      return res.status(503).json({
        error: 'Content moderation temporarily unavailable'
      })
    }
  }

  next(error)
})
```

### Timeout Handling

```javascript
const client = new ModerationClient({
  apiKey: process.env.VETTLY_API_KEY,
  timeout: 5000 // 5 second timeout
})

app.post('/api/comments', async (req, res) => {
  try {
    const result = await Promise.race([
      client.check({
        content: req.body.text,
        policyId: 'balanced',
        contentType: 'text'
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Moderation timeout')), 5000)
      )
    ])

    // Handle result...
  } catch (error) {
    if (error.message === 'Moderation timeout') {
      // Decide: fail open or closed
      logger.warn('Moderation timeout, failing open')
      // Continue...
    }
  }
})
```

## Testing

### Mock Client

```javascript
// test-utils.js
class MockModerationClient {
  async check(request) {
    return {
      safe: !request.content.includes('bad'),
      flagged: request.content.includes('bad'),
      action: request.content.includes('bad') ? 'block' : 'allow',
      categories: [],
      decisionId: 'test_decision',
      provider: 'mock',
      latency: 0,
      cost: 0
    }
  }
}

module.exports = { MockModerationClient }

// routes.test.js
const request = require('supertest')
const { MockModerationClient } = require('./test-utils')

describe('POST /api/comments', () => {
  it('blocks inappropriate content', async () => {
    const app = createApp(new MockModerationClient())

    const response = await request(app)
      .post('/api/comments')
      .send({ text: 'This is bad content' })

    expect(response.status).toBe(403)
  })
})
```

## Best Practices

### 1. Cache Results

```javascript
const cache = new Map()

async function checkWithCache(content, policyId) {
  const key = `${policyId}:${content}`

  if (cache.has(key)) {
    return cache.get(key)
  }

  const result = await client.check({
    content,
    policyId,
    contentType: 'text'
  })

  cache.set(key, result)
  return result
}
```

### 2. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit')

const moderationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each user to 100 requests per window
  message: 'Too many submissions, please try again later'
})

app.post('/api/comments', moderationLimiter, ...)
```

### 3. Logging

```javascript
app.use((req, res, next) => {
  const originalCheck = client.check.bind(client)

  client.check = async (request) => {
    const start = Date.now()
    const result = await originalCheck(request)

    logger.info('Moderation check', {
      safe: result.safe,
      action: result.action,
      latency: Date.now() - start,
      cost: result.cost
    })

    return result
  }

  next()
})
```

### 4. Monitoring

```javascript
const prometheus = require('prom-client')

const moderationCounter = new prometheus.Counter({
  name: 'moderation_checks_total',
  help: 'Total moderation checks',
  labelNames: ['action', 'safe']
})

// In middleware
moderationCounter.inc({
  action: result.action,
  safe: result.safe.toString()
})
```

## TypeScript

Full TypeScript support:

```typescript
import express, { Request, Response, NextFunction } from 'express'
import { ModerationClient, moderateContent } from '@nextauralabs/vettly-sdk'

const app = express()
const client = new ModerationClient({
  apiKey: process.env.VETTLY_API_KEY!
})

app.post('/api/comments',
  moderateContent({
    client,
    policyId: 'balanced'
  }),
  async (req: Request, res: Response) => {
    res.json({ success: true })
  }
)
```

## See Also

- [TypeScript SDK](/api/sdk) - Full SDK reference
- [Next.js Integration](/api/nextjs) - Next.js API routes
- [REST API](/api/rest) - Direct HTTP API
- [Webhooks](/api/webhooks) - Webhook events
