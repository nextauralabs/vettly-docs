# Social Feed Example

Build a Twitter/X-style social feed with real-time content moderation.

## Overview

This example shows how to build a complete social media feed with:
- Post creation with text and images
- Real-time moderation feedback
- Comment system
- User profiles
- Reporting and appeals

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (via Prisma)
- **Moderation**: Vettly React components + SDK

## Project Structure

```
social-feed/
├── app/
│   ├── api/
│   │   ├── posts/
│   │   │   ├── route.ts          # Create/list posts
│   │   │   └── [id]/
│   │   │       ├── route.ts      # Get/delete post
│   │   │       └── comments/
│   │   │           └── route.ts  # Post comments
│   │   └── moderate/
│   │       └── route.ts          # Moderation endpoint
│   ├── feed/
│   │   └── page.tsx              # Main feed page
│   └── profile/
│       └── [userId]/
│           └── page.tsx          # User profile
├── components/
│   ├── CreatePost.tsx            # Post creation form
│   ├── PostCard.tsx              # Individual post
│   ├── CommentSection.tsx        # Comments
│   └── ModerationBadge.tsx       # Moderation status
├── lib/
│   ├── db.ts                     # Database client
│   └── moderation.ts             # Moderation utilities
└── prisma/
    └── schema.prisma             # Database schema
```

## Database Schema

```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  avatar    String?
  posts     Post[]
  comments  Comment[]
  createdAt DateTime @default(now())
}

model Post {
  id                String    @id @default(cuid())
  content           String
  imageUrl          String?
  authorId          String
  author            User      @relation(fields: [authorId], references: [id])
  comments          Comment[]
  moderationSafe    Boolean   @default(true)
  moderationAction  String?   @default("allow")
  moderationDecisionId String?
  flaggedAt         DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([authorId])
  @@index([createdAt])
}

model Comment {
  id                String    @id @default(cuid())
  content           String
  postId            String
  post              Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  authorId          String
  author            User      @relation(fields: [authorId], references: [id])
  moderationSafe    Boolean   @default(true)
  moderationDecisionId String?
  createdAt         DateTime  @default(now())

  @@index([postId])
  @@index([authorId])
}
```

## Post Creation Component

```tsx
// components/CreatePost.tsx
'use client'

import { useState } from 'react'
import { ModeratedTextarea, ModeratedImageUpload } from '@nextauralabs/vettly-react'
import '@nextauralabs/vettly-react/styles.css'

export default function CreatePost({ userId }: { userId: string }) {
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [contentSafe, setContentSafe] = useState(true)
  const [imageSafe, setImageSafe] = useState(true)
  const [posting, setPosting] = useState(false)

  const canPost = contentSafe && imageSafe && content.trim().length > 0

  const handlePost = async () => {
    if (!canPost) return

    setPosting(true)
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          imageUrl
        })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.message || 'Failed to create post')
        return
      }

      // Reset form
      setContent('')
      setImageUrl(null)

      // Refresh feed (or use optimistic updates)
      window.location.reload()
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Failed to create post')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h2 className="text-lg font-semibold mb-4">Create Post</h2>

      <ModeratedTextarea
        apiKey={process.env.NEXT_PUBLIC_VETTLY_API_KEY!}
        policyId="social_media"
        value={content}
        onChange={(value, result) => {
          setContent(value)
          setContentSafe(result.safe)
        }}
        placeholder="What's happening?"
        rows={4}
        className="w-full"
      />

      <div className="mt-4">
        <ModeratedImageUpload
          apiKey={process.env.NEXT_PUBLIC_VETTLY_API_KEY!}
          policyId="social_media"
          onUpload={async (file, result) => {
            if (!result.safe) {
              alert('Image contains inappropriate content')
              setImageSafe(false)
              return
            }

            setImageSafe(true)

            // Upload to your storage
            const formData = new FormData()
            formData.append('image', file)

            const response = await fetch('/api/upload', {
              method: 'POST',
              body: formData
            })

            const { url } = await response.json()
            setImageUrl(url)
          }}
        />
      </div>

      {imageUrl && (
        <div className="mt-2 relative">
          <img
            src={imageUrl}
            alt="Upload preview"
            className="rounded-lg max-h-60"
          />
          <button
            onClick={() => setImageUrl(null)}
            className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-500">
          {content.length}/280 characters
        </div>

        <button
          onClick={handlePost}
          disabled={!canPost || posting}
          className={`px-6 py-2 rounded-full font-semibold ${
            canPost && !posting
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {posting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  )
}
```

## Feed Display Component

```tsx
// components/PostCard.tsx
'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface Post {
  id: string
  content: string
  imageUrl?: string
  author: {
    name: string
    avatar?: string
  }
  moderationSafe: boolean
  moderationAction?: string
  createdAt: string
  _count: {
    comments: number
  }
}

export default function PostCard({ post }: { post: Post }) {
  const [showComments, setShowComments] = useState(false)

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      {/* Header */}
      <div className="flex items-center mb-3">
        <img
          src={post.author.avatar || '/default-avatar.png'}
          alt={post.author.name}
          className="w-10 h-10 rounded-full mr-3"
        />
        <div>
          <div className="font-semibold">{post.author.name}</div>
          <div className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </div>
        </div>

        {post.moderationAction === 'warn' && (
          <div className="ml-auto">
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              Flagged Content
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mb-3">
        <p className="whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Image */}
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt="Post image"
          className="rounded-lg w-full mb-3"
        />
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 text-gray-500">
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 hover:text-blue-500"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{post._count.comments}</span>
        </button>

        <button className="flex items-center gap-2 hover:text-green-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <button className="flex items-center gap-2 hover:text-red-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <CommentSection postId={post.id} />
      )}
    </div>
  )
}
```

## Comment Section Component

```tsx
// components/CommentSection.tsx
'use client'

import { useState, useEffect } from 'react'
import { ModeratedTextarea } from '@nextauralabs/vettly-react'

export default function CommentSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [commentSafe, setCommentSafe] = useState(true)
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    const response = await fetch(`/api/posts/${postId}/comments`)
    const data = await response.json()
    setComments(data.comments)
  }

  const handlePostComment = async () => {
    if (!commentSafe || !newComment.trim()) return

    setPosting(true)
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.message || 'Failed to post comment')
        return
      }

      setNewComment('')
      fetchComments()
    } catch (error) {
      console.error('Error posting comment:', error)
      alert('Failed to post comment')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="mt-4 border-t pt-4">
      {/* Comment Input */}
      <div className="mb-4">
        <ModeratedTextarea
          apiKey={process.env.NEXT_PUBLIC_VETTLY_API_KEY!}
          policyId="social_media"
          value={newComment}
          onChange={(value, result) => {
            setNewComment(value)
            setCommentSafe(result.safe)
          }}
          placeholder="Write a comment..."
          rows={2}
          className="w-full"
        />
        <button
          onClick={handlePostComment}
          disabled={!commentSafe || !newComment.trim() || posting}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          {posting ? 'Posting...' : 'Comment'}
        </button>
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <img
              src={comment.author.avatar || '/default-avatar.png'}
              alt={comment.author.name}
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1 bg-gray-50 rounded-lg p-3">
              <div className="font-semibold text-sm">{comment.author.name}</div>
              <p className="text-sm mt-1">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## API Routes

### Create Post

```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ModerationClient } from '@nextauralabs/vettly-sdk'
import { db } from '@/lib/db'

const client = new ModerationClient({
  apiKey: process.env.VETTLY_API_KEY!
})

export async function POST(request: NextRequest) {
  try {
    const { content, imageUrl, userId } = await request.json()

    // Check text content
    const textResult = await client.check({
      content,
      policyId: 'social_media',
      contentType: 'text',
      metadata: { userId }
    })

    // Check image if provided
    let imageResult = null
    if (imageUrl) {
      // Fetch image and convert to base64
      const imageResponse = await fetch(imageUrl)
      const imageBuffer = await imageResponse.arrayBuffer()
      const base64 = Buffer.from(imageBuffer).toString('base64')

      imageResult = await client.check({
        content: base64,
        policyId: 'social_media',
        contentType: 'image',
        metadata: { userId }
      })
    }

    // Block if either is unsafe
    const safe = textResult.safe && (!imageResult || imageResult.safe)
    const action = textResult.action === 'block' || imageResult?.action === 'block'
      ? 'block'
      : textResult.action

    if (action === 'block') {
      return NextResponse.json(
        {
          message: 'Post contains inappropriate content',
          categories: [
            ...textResult.categories.filter(c => c.triggered),
            ...(imageResult?.categories.filter(c => c.triggered) || [])
          ]
        },
        { status: 400 }
      )
    }

    // Create post
    const post = await db.post.create({
      data: {
        content,
        imageUrl,
        authorId: userId,
        moderationSafe: safe,
        moderationAction: action,
        moderationDecisionId: textResult.decisionId,
        flaggedAt: action === 'warn' || action === 'flag' ? new Date() : null
      },
      include: {
        author: true,
        _count: {
          select: { comments: true }
        }
      }
    })

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { message: 'Failed to create post' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  const posts = await db.post.findMany({
    take: limit,
    skip: offset,
    orderBy: { createdAt: 'desc' },
    include: {
      author: true,
      _count: {
        select: { comments: true }
      }
    }
  })

  return NextResponse.json({ posts })
}
```

### Add Comment

```typescript
// app/api/posts/[id]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ModerationClient } from '@nextauralabs/vettly-sdk'
import { db } from '@/lib/db'

const client = new ModerationClient({
  apiKey: process.env.VETTLY_API_KEY!
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { content, userId } = await request.json()

    // Check comment
    const result = await client.check({
      content,
      policyId: 'social_media',
      contentType: 'text',
      metadata: {
        userId,
        postId: params.id,
        type: 'comment'
      }
    })

    if (result.action === 'block') {
      return NextResponse.json(
        { message: 'Comment contains inappropriate content' },
        { status: 400 }
      )
    }

    // Create comment
    const comment = await db.comment.create({
      data: {
        content,
        postId: params.id,
        authorId: userId,
        moderationSafe: result.safe,
        moderationDecisionId: result.decisionId
      },
      include: {
        author: true
      }
    })

    return NextResponse.json({ comment })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { message: 'Failed to create comment' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const comments = await db.comment.findMany({
    where: { postId: params.id },
    orderBy: { createdAt: 'asc' },
    include: {
      author: true
    }
  })

  return NextResponse.json({ comments })
}
```

## Key Features

### 1. Real-time Moderation
- Posts and comments checked before saving
- Visual feedback while typing
- Prevents submission of unsafe content

### 2. Multi-modal Support
- Text content moderation
- Image content moderation
- Combined validation

### 3. User Experience
- Non-blocking for warnings
- Clear feedback on violations
- Smooth UX with loading states

### 4. Audit Trail
- Store `moderationDecisionId` for all content
- Track flagged content
- Enable appeals and review

## Best Practices

### 1. Server-Side Verification
Always verify moderation server-side, even if client-side check passed:

```typescript
// Don't trust client-only checks
const result = await client.check({
  content,
  policyId: 'social_media',
  contentType: 'text'
})

if (!result.safe) {
  return NextResponse.json({ error: 'Blocked' }, { status: 403 })
}
```

### 2. Store Decision IDs
```typescript
await db.post.create({
  data: {
    content,
    moderationDecisionId: result.decisionId // ✅ Important for audit
  }
})
```

### 3. Handle Errors Gracefully
```typescript
try {
  const result = await client.check(...)
} catch (error) {
  // Decide: fail open or closed?
  if (process.env.NODE_ENV === 'production') {
    // Fail open in production to avoid blocking legitimate users
    logger.error('Moderation failed', error)
  } else {
    throw error
  }
}
```

## See Also

- [ModeratedTextarea](/components/textarea)
- [ModeratedImageUpload](/components/image-upload)
- [Next.js Integration](/api/nextjs)
- [Forum Example](/examples/forum)
