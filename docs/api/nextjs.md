# Next.js Integration

Integrate Vettly moderation into your Next.js applications.

## Installation

```bash
npm install @nextauralabs/vettly-react @nextauralabs/vettly-sdk
```

## Environment Variables

Create `.env.local`:

```bash
# Client-side (public)
NEXT_PUBLIC_VETTLY_API_KEY=vettly_xxxxxxxxxxxxx

# Server-side only
VETTLY_API_KEY=vettly_xxxxxxxxxxxxx
```

::: warning
Use `NEXT_PUBLIC_` prefix only for client-side components. For API routes, use the non-public variable.
:::

## App Router

### Client Components

Use React components with `'use client'` directive:

```tsx
// app/comments/page.tsx
'use client'

import { ModeratedTextarea } from '@nextauralabs/vettly-react'
import '@nextauralabs/vettly-react/styles.css'

export default function CommentsPage() {
  return (
    <ModeratedTextarea
      apiKey={process.env.NEXT_PUBLIC_VETTLY_API_KEY!}
      policyId="balanced"
      placeholder="Write a comment..."
    />
  )
}
```

### Server Actions

Check content in server actions:

```tsx
// app/posts/actions.ts
'use server'

import { ModerationClient } from '@nextauralabs/vettly-sdk'

const client = new ModerationClient({
  apiKey: process.env.VETTLY_API_KEY!
})

export async function createPost(formData: FormData) {
  const content = formData.get('content') as string

  const result = await client.check({
    content,
    policyId: 'balanced',
    contentType: 'text'
  })

  if (!result.safe) {
    return {
      error: 'Content contains inappropriate material',
      categories: result.categories.filter(c => c.triggered)
    }
  }

  // Save to database
  const post = await db.posts.create({ content })

  return { success: true, post }
}
```

```tsx
// app/posts/page.tsx
'use client'

import { createPost } from './actions'

export default function PostsPage() {
  async function handleSubmit(formData: FormData) {
    const result = await createPost(formData)

    if (result.error) {
      alert(result.error)
    } else {
      alert('Post created!')
    }
  }

  return (
    <form action={handleSubmit}>
      <textarea name="content" />
      <button type="submit">Post</button>
    </form>
  )
}
```

### API Routes

Create moderation API routes:

```typescript
// app/api/moderate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ModerationClient } from '@nextauralabs/vettly-sdk'

const client = new ModerationClient({
  apiKey: process.env.VETTLY_API_KEY!
})

export async function POST(request: NextRequest) {
  try {
    const { content, policyId } = await request.json()

    const result = await client.check({
      content,
      policyId: policyId || 'balanced',
      contentType: 'text'
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: 'Moderation failed' },
      { status: 500 }
    )
  }
}
```

Use from client:

```tsx
'use client'

async function checkContent(text: string) {
  const response = await fetch('/api/moderate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: text,
      policyId: 'balanced'
    })
  })

  return response.json()
}
```

### Route Handlers with Middleware

```typescript
// app/api/comments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ModerationClient } from '@nextauralabs/vettly-sdk'

const client = new ModerationClient({
  apiKey: process.env.VETTLY_API_KEY!
})

async function moderateRequest(request: NextRequest) {
  const body = await request.json()

  const result = await client.check({
    content: body.content,
    policyId: 'balanced',
    contentType: 'text'
  })

  if (result.action === 'block') {
    return NextResponse.json(
      {
        error: 'Content blocked',
        categories: result.categories.filter(c => c.triggered)
      },
      { status: 403 }
    )
  }

  return null
}

export async function POST(request: NextRequest) {
  // Check content
  const moderationError = await moderateRequest(request)
  if (moderationError) return moderationError

  // Save comment
  const body = await request.json()
  const comment = await db.comments.create(body)

  return NextResponse.json(comment)
}
```

## Pages Router

### Client-Side Components

```tsx
// pages/comments.tsx
import { ModeratedTextarea } from '@nextauralabs/vettly-react'
import '@nextauralabs/vettly-react/styles.css'

export default function CommentsPage() {
  return (
    <ModeratedTextarea
      apiKey={process.env.NEXT_PUBLIC_VETTLY_API_KEY!}
      policyId="balanced"
    />
  )
}
```

### API Routes

```typescript
// pages/api/moderate.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { ModerationClient } from '@nextauralabs/vettly-sdk'

const client = new ModerationClient({
  apiKey: process.env.VETTLY_API_KEY!
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { content, policyId } = req.body

    const result = await client.check({
      content,
      policyId: policyId || 'balanced',
      contentType: 'text',
      metadata: {
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      }
    })

    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Moderation failed' })
  }
}
```

### Middleware Pattern

```typescript
// lib/moderation.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { ModerationClient } from '@nextauralabs/vettly-sdk'

const client = new ModerationClient({
  apiKey: process.env.VETTLY_API_KEY!
})

type Handler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>

export function withModeration(handler: Handler, options: {
  policyId: string
  field?: string
}) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const content = options.field
      ? req.body[options.field]
      : req.body.content

    if (!content) {
      return handler(req, res)
    }

    const result = await client.check({
      content,
      policyId: options.policyId,
      contentType: 'text'
    })

    if (result.action === 'block') {
      return res.status(403).json({
        error: 'Content blocked',
        categories: result.categories.filter(c => c.triggered)
      })
    }

    return handler(req, res)
  }
}
```

Use the middleware:

```typescript
// pages/api/comments.ts
import { withModeration } from '@/lib/moderation'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const comment = await db.comments.create(req.body)
  res.json(comment)
}

export default withModeration(handler, {
  policyId: 'balanced',
  field: 'text'
})
```

## Image Uploads

### Client-Side Upload

```tsx
'use client'

import { ModeratedImageUpload } from '@nextauralabs/vettly-react'
import { useState } from 'react'

export default function ImageUploader() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const handleUpload = async (file: File, result: any) => {
    if (!result.safe) {
      alert('Image contains inappropriate content')
      return
    }

    // Upload to your API
    const formData = new FormData()
    formData.append('image', file)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    const { url } = await response.json()
    setImageUrl(url)
  }

  return (
    <ModeratedImageUpload
      apiKey={process.env.NEXT_PUBLIC_VETTLY_API_KEY!}
      policyId="ecommerce"
      onUpload={handleUpload}
    />
  )
}
```

### Server-Side Processing

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ModerationClient } from '@nextauralabs/vettly-sdk'
import { put } from '@vercel/blob'

const client = new ModerationClient({
  apiKey: process.env.VETTLY_API_KEY!
})

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('image') as File

  if (!file) {
    return NextResponse.json({ error: 'No file' }, { status: 400 })
  }

  // Convert to base64
  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')

  // Check image
  const result = await client.check({
    content: base64,
    policyId: 'strict',
    contentType: 'image'
  })

  if (!result.safe) {
    return NextResponse.json(
      { error: 'Image flagged', categories: result.categories },
      { status: 400 }
    )
  }

  // Upload to storage
  const blob = await put(file.name, file, { access: 'public' })

  return NextResponse.json({ url: blob.url })
}
```

## Form Handling

### With React Hook Form

```tsx
'use client'

import { useForm } from 'react-hook-form'
import { useModeration } from '@nextauralabs/vettly-react'

export default function PostForm() {
  const { register, handleSubmit, watch } = useForm()
  const content = watch('content')

  const { result, check } = useModeration({
    apiKey: process.env.NEXT_PUBLIC_VETTLY_API_KEY!,
    policyId: 'balanced'
  })

  const onSubmit = async (data: any) => {
    if (!result.safe) {
      alert('Content contains inappropriate material')
      return
    }

    await fetch('/api/posts', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <textarea
        {...register('content')}
        onChange={(e) => check(e.target.value)}
        style={{ borderColor: result.safe ? 'green' : 'red' }}
      />

      {result.flagged && <p>Content flagged!</p>}

      <button type="submit" disabled={!result.safe}>
        Submit
      </button>
    </form>
  )
}
```

## Batch Processing

```typescript
// app/api/batch-moderate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ModerationClient } from '@nextauralabs/vettly-sdk'

const client = new ModerationClient({
  apiKey: process.env.VETTLY_API_KEY!
})

export async function POST(request: NextRequest) {
  const { items } = await request.json()

  const results = await client.batchCheck({
    policyId: 'balanced',
    items: items.map((item: any) => ({
      id: item.id,
      content: item.text,
      contentType: 'text'
    }))
  })

  return NextResponse.json(results)
}
```

## Webhooks

```typescript
// app/api/webhooks/vettly/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-vettly-signature')

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.VETTLY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)

  if (event.type === 'moderation.completed') {
    await handleModerationComplete(event.data)
  }

  return NextResponse.json({ received: true })
}

async function handleModerationComplete(data: any) {
  // Update database with moderation result
  await db.posts.update(
    { id: data.itemId },
    { moderationStatus: data.safe ? 'approved' : 'rejected' }
  )
}
```

## Error Handling

```typescript
// lib/moderation-client.ts
import { ModerationClient } from '@nextauralabs/vettly-sdk'

const client = new ModerationClient({
  apiKey: process.env.VETTLY_API_KEY!,
  timeout: 5000
})

export async function checkContent(
  content: string,
  policyId: string
) {
  try {
    return await client.check({
      content,
      policyId,
      contentType: 'text'
    })
  } catch (error) {
    console.error('Moderation error:', error)

    // Fail open (allow content) in production
    if (process.env.NODE_ENV === 'production') {
      return {
        safe: true,
        flagged: false,
        action: 'allow' as const,
        categories: [],
        decisionId: 'error',
        provider: 'error',
        latency: 0,
        cost: 0
      }
    }

    throw error
  }
}
```

## TypeScript

Full type safety:

```typescript
import { ModerationClient } from '@nextauralabs/vettly-sdk'
import type { CheckResponse } from '@nextauralabs/vettly-shared'

const client = new ModerationClient({
  apiKey: process.env.VETTLY_API_KEY!
})

export async function POST(request: NextRequest): Promise<NextResponse<CheckResponse>> {
  const { content } = await request.json()

  const result = await client.check({
    content,
    policyId: 'balanced',
    contentType: 'text'
  })

  return NextResponse.json(result)
}
```

## Best Practices

### 1. Use Environment Variables

```typescript
// ✅ Good
apiKey: process.env.NEXT_PUBLIC_VETTLY_API_KEY

// ❌ Bad
apiKey: 'vettly_hardcoded_key'
```

### 2. Server-Side Verification

```typescript
// Client-side check (can be bypassed)
const result = await client.check(content)

// ✅ Always verify server-side
export async function POST(request: NextRequest) {
  const { content } = await request.json()

  const result = await serverSideClient.check({
    content,
    policyId: 'balanced',
    contentType: 'text'
  })

  if (!result.safe) {
    return NextResponse.json({ error: 'Blocked' }, { status: 403 })
  }
}
```

### 3. Cache API Responses

```typescript
import { unstable_cache } from 'next/cache'

const checkContent = unstable_cache(
  async (content: string, policyId: string) => {
    return client.check({ content, policyId, contentType: 'text' })
  },
  ['moderation-check'],
  { revalidate: 3600 } // Cache for 1 hour
)
```

### 4. Error Boundaries

```tsx
// app/error.tsx
'use client'

export default function Error({
  error,
  reset
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

## Testing

### Mock Client

```typescript
// __mocks__/@nextauralabs/vettly-sdk.ts
export class ModerationClient {
  async check() {
    return {
      safe: true,
      flagged: false,
      action: 'allow' as const,
      categories: [],
      decisionId: 'mock',
      provider: 'mock',
      latency: 0,
      cost: 0
    }
  }
}
```

### API Route Tests

```typescript
import { POST } from '@/app/api/moderate/route'

describe('/api/moderate', () => {
  it('blocks inappropriate content', async () => {
    const request = new Request('http://localhost/api/moderate', {
      method: 'POST',
      body: JSON.stringify({ content: 'bad content' })
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(data.safe).toBe(false)
  })
})
```

## See Also

- [TypeScript SDK](/api/sdk) - Full SDK reference
- [React Components](/components/textarea) - Pre-built components
- [Express Integration](/api/express) - Express middleware
- [REST API](/api/rest) - Direct HTTP API
