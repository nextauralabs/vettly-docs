# Forum Example

Build a Reddit-style discussion forum with moderation queue and appeals.

## Overview

This example demonstrates:
- Topic categories and threads
- Threaded discussions with replies
- Moderation queue for flagged content
- User reporting system
- Moderator dashboard
- Appeal process

## Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Prisma)
- **Moderation**: Vettly SDK
- **Authentication**: Clerk

## Database Schema

```prisma
// prisma/schema.prisma
model Topic {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String
  threads     Thread[]
  createdAt   DateTime @default(now())
}

model Thread {
  id                String    @id @default(cuid())
  title             String
  content           String    @db.Text
  topicId           String
  topic             Topic     @relation(fields: [topicId], references: [id])
  authorId          String
  locked            Boolean   @default(false)
  pinned            Boolean   @default(false)
  posts             Post[]
  moderationSafe    Boolean   @default(true)
  moderationAction  String    @default("allow")
  moderationDecisionId String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([topicId])
  @@index([authorId])
  @@index([createdAt])
}

model Post {
  id                String    @id @default(cuid())
  content           String    @db.Text
  threadId          String
  thread            Thread    @relation(fields: [threadId], references: [id], onDelete: Cascade)
  authorId          String
  parentId          String?   // For threaded replies
  parent            Post?     @relation("PostReplies", fields: [parentId], references: [id])
  replies           Post[]    @relation("PostReplies")
  moderationSafe    Boolean   @default(true)
  moderationAction  String    @default("allow")
  moderationDecisionId String?
  flaggedAt         DateTime?
  reports           Report[]
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([threadId])
  @@index([authorId])
  @@index([parentId])
}

model Report {
  id        String   @id @default(cuid())
  postId    String
  post      Post     @relation(fields: [postId], references: [id])
  reportedBy String
  reason    String
  resolved  Boolean  @default(false)
  resolvedBy String?
  resolvedAt DateTime?
  createdAt DateTime @default(now())

  @@index([postId])
  @@index([resolved])
}

model ModerationQueue {
  id          String   @id @default(cuid())
  contentType String   // 'thread' or 'post'
  contentId   String
  content     String   @db.Text
  authorId    String
  decisionId  String
  action      String
  categories  Json
  status      String   @default("pending") // pending, approved, removed, appealed
  reviewedBy  String?
  reviewedAt  DateTime?
  createdAt   DateTime @default(now())

  @@index([status])
  @@index([contentType])
}
```

## Create Thread Component

```tsx
// components/CreateThread.tsx
'use client'

import { useState } from 'react'
import { ModeratedTextarea } from '@nextauralabs/vettly-react'
import { useRouter } from 'next/navigation'

export default function CreateThread({ topicId }: { topicId: string }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [titleSafe, setTitleSafe] = useState(true)
  const [contentSafe, setContentSafe] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = titleSafe && contentSafe && title.trim() && content.trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId,
          title,
          content
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.action === 'flag') {
          alert('Your thread has been flagged for review. It will be visible once approved by moderators.')
        } else {
          alert(data.message || 'Failed to create thread')
        }
        return
      }

      router.push(`/threads/${data.thread.id}`)
    } catch (error) {
      console.error('Error creating thread:', error)
      alert('Failed to create thread')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Create New Thread</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Title</label>
        <ModeratedTextarea
          apiKey={process.env.NEXT_PUBLIC_VETTLY_API_KEY!}
          policyId="moderate"
          value={title}
          onChange={(value, result) => {
            setTitle(value)
            setTitleSafe(result.safe)
          }}
          placeholder="Thread title..."
          rows={1}
          className="w-full"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Content</label>
        <ModeratedTextarea
          apiKey={process.env.NEXT_PUBLIC_VETTLY_API_KEY!}
          policyId="moderate"
          value={content}
          onChange={(value, result) => {
            setContent(value)
            setContentSafe(result.safe)
          }}
          placeholder="Start your discussion..."
          rows={10}
          className="w-full"
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {submitting ? 'Creating...' : 'Create Thread'}
      </button>
    </form>
  )
}
```

## Thread View Component

```tsx
// components/ThreadView.tsx
'use client'

import { useState } from 'react'
import { ModeratedTextarea } from '@nextauralabs/vettly-react'
import { formatDistanceToNow } from 'date-fns'

interface Thread {
  id: string
  title: string
  content: string
  author: { name: string; id: string }
  createdAt: string
  locked: boolean
  posts: Post[]
}

interface Post {
  id: string
  content: string
  author: { name: string; id: string }
  moderationAction?: string
  replies: Post[]
  createdAt: string
}

export default function ThreadView({ thread }: { thread: Thread }) {
  const [replyContent, setReplyContent] = useState('')
  const [replySafe, setReplySafe] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  const handleReply = async (parentId?: string) => {
    if (!replySafe || !replyContent.trim()) return

    const response = await fetch(`/api/threads/${thread.id}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: replyContent,
        parentId
      })
    })

    const data = await response.json()

    if (!response.ok) {
      if (data.action === 'flag') {
        alert('Your reply has been flagged for review.')
      } else {
        alert(data.message || 'Failed to post reply')
      }
      return
    }

    setReplyContent('')
    setReplyingTo(null)
    window.location.reload()
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Thread Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h1 className="text-2xl font-bold mb-2">{thread.title}</h1>
        <div className="text-sm text-gray-600 mb-4">
          Posted by {thread.author.name} •{' '}
          {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
        </div>
        <div className="prose max-w-none">
          <p className="whitespace-pre-wrap">{thread.content}</p>
        </div>

        {thread.locked && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3">
            🔒 This thread is locked. No new replies can be posted.
          </div>
        )}
      </div>

      {/* Reply Form */}
      {!thread.locked && (
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h3 className="font-semibold mb-3">Reply to Thread</h3>
          <ModeratedTextarea
            apiKey={process.env.NEXT_PUBLIC_VETTLY_API_KEY!}
            policyId="moderate"
            value={replyContent}
            onChange={(value, result) => {
              setReplyContent(value)
              setReplySafe(result.safe)
            }}
            placeholder="Write your reply..."
            rows={5}
          />
          <button
            onClick={() => handleReply()}
            disabled={!replySafe || !replyContent.trim()}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            Post Reply
          </button>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-4">
        {thread.posts
          .filter(p => !p.parentId) // Top-level posts only
          .map(post => (
            <PostCard
              key={post.id}
              post={post}
              onReply={(id) => setReplyingTo(id)}
              locked={thread.locked}
            />
          ))}
      </div>
    </div>
  )
}

function PostCard({
  post,
  depth = 0,
  onReply,
  locked
}: {
  post: Post
  depth?: number
  onReply: (id: string) => void
  locked: boolean
}) {
  const [showReply, setShowReply] = useState(false)

  return (
    <div
      className="bg-white rounded-lg shadow p-4"
      style={{ marginLeft: `${depth * 2}rem` }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold">{post.author.name}</span>
            <span className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
            {post.moderationAction === 'warn' && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Flagged
              </span>
            )}
          </div>

          <p className="whitespace-pre-wrap mb-3">{post.content}</p>

          <div className="flex gap-4 text-sm">
            {!locked && (
              <button
                onClick={() => setShowReply(!showReply)}
                className="text-blue-600 hover:text-blue-800"
              >
                Reply
              </button>
            )}
            <button className="text-gray-600 hover:text-gray-800">
              Report
            </button>
          </div>

          {showReply && <ReplyForm postId={post.id} onCancel={() => setShowReply(false)} />}
        </div>
      </div>

      {/* Nested replies */}
      {post.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {post.replies.map(reply => (
            <PostCard
              key={reply.id}
              post={reply}
              depth={depth + 1}
              onReply={onReply}
              locked={locked}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ReplyForm({ postId, onCancel }: { postId: string; onCancel: () => void }) {
  const [content, setContent] = useState('')
  const [safe, setSafe] = useState(true)

  return (
    <div className="mt-3 border-l-2 border-blue-200 pl-4">
      <ModeratedTextarea
        apiKey={process.env.NEXT_PUBLIC_VETTLY_API_KEY!}
        policyId="moderate"
        value={content}
        onChange={(value, result) => {
          setContent(value)
          setSafe(result.safe)
        }}
        placeholder="Write a reply..."
        rows={3}
      />
      <div className="mt-2 flex gap-2">
        <button
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          disabled={!safe || !content.trim()}
        >
          Post
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
```

## Moderation Queue Component

```tsx
// app/admin/moderation/page.tsx
'use client'

import { useState, useEffect } from 'react'

export default function ModerationQueue() {
  const [queue, setQueue] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'appealed'>('pending')

  useEffect(() => {
    fetchQueue()
  }, [filter])

  const fetchQueue = async () => {
    const response = await fetch(`/api/admin/moderation?status=${filter}`)
    const data = await response.json()
    setQueue(data.items)
  }

  const handleReview = async (id: string, action: 'approve' | 'remove') => {
    await fetch(`/api/admin/moderation/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    })

    fetchQueue()
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Moderation Queue</h1>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded ${
            filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Pending ({queue.filter(i => i.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('appealed')}
          className={`px-4 py-2 rounded ${
            filter === 'appealed' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Appealed ({queue.filter(i => i.status === 'appealed').length})
        </button>
      </div>

      {/* Queue Items */}
      <div className="space-y-4">
        {queue.map(item => (
          <div key={item.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-sm font-medium text-gray-600">
                  {item.contentType.toUpperCase()}
                </span>
                <div className="text-sm text-gray-500 mt-1">
                  Decision ID: {item.decisionId}
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded text-sm font-medium ${
                  item.action === 'block'
                    ? 'bg-red-100 text-red-800'
                    : item.action === 'flag'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-orange-100 text-orange-800'
                }`}
              >
                {item.action.toUpperCase()}
              </span>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded">
              <p className="whitespace-pre-wrap">{item.content}</p>
            </div>

            {/* Flagged Categories */}
            <div className="mb-4">
              <div className="text-sm font-medium mb-2">Flagged Categories:</div>
              <div className="flex flex-wrap gap-2">
                {JSON.parse(item.categories)
                  .filter((c: any) => c.triggered)
                  .map((c: any) => (
                    <span
                      key={c.category}
                      className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded"
                    >
                      {c.category} ({(c.score * 100).toFixed(0)}%)
                    </span>
                  ))}
              </div>
            </div>

            {/* Actions */}
            {item.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleReview(item.id, 'approve')}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReview(item.id, 'remove')}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

## API Routes

### Create Thread with Moderation Queue

```typescript
// app/api/threads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ModerationClient } from '@nextauralabs/vettly-sdk'
import { db } from '@/lib/db'
import { auth } from '@clerk/nextjs'

const client = new ModerationClient({
  apiKey: process.env.VETTLY_API_KEY!
})

export async function POST(request: NextRequest) {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { topicId, title, content } = await request.json()

    // Check title and content
    const [titleResult, contentResult] = await Promise.all([
      client.check({
        content: title,
        policyId: 'moderate',
        contentType: 'text',
        metadata: { userId, type: 'thread_title' }
      }),
      client.check({
        content,
        policyId: 'moderate',
        contentType: 'text',
        metadata: { userId, type: 'thread_content' }
      })
    ])

    const action = titleResult.action === 'block' || contentResult.action === 'block'
      ? 'block'
      : titleResult.action === 'flag' || contentResult.action === 'flag'
      ? 'flag'
      : 'allow'

    // Block immediately
    if (action === 'block') {
      return NextResponse.json(
        {
          message: 'Thread contains inappropriate content',
          categories: [
            ...titleResult.categories.filter(c => c.triggered),
            ...contentResult.categories.filter(c => c.triggered)
          ]
        },
        { status: 400 }
      )
    }

    // Create thread
    const thread = await db.thread.create({
      data: {
        title,
        content,
        topicId,
        authorId: userId,
        moderationSafe: action === 'allow',
        moderationAction: action,
        moderationDecisionId: contentResult.decisionId
      }
    })

    // Add to moderation queue if flagged
    if (action === 'flag') {
      await db.moderationQueue.create({
        data: {
          contentType: 'thread',
          contentId: thread.id,
          content: `${title}\n\n${content}`,
          authorId: userId,
          decisionId: contentResult.decisionId,
          action,
          categories: JSON.stringify(contentResult.categories)
        }
      })

      return NextResponse.json(
        {
          thread,
          action: 'flag',
          message: 'Thread flagged for review'
        },
        { status: 202 }
      )
    }

    return NextResponse.json({ thread })
  } catch (error) {
    console.error('Error creating thread:', error)
    return NextResponse.json(
      { message: 'Failed to create thread' },
      { status: 500 }
    )
  }
}
```

## Best Practices

### 1. Moderation Queue
- Flag borderline content for manual review
- Don't block everything - use 3-tier system (allow/flag/block)
- Track appeal history

### 2. Threaded Replies
- Check each reply independently
- Consider parent context for nested moderation
- Allow users to report replies

### 3. Moderator Tools
- Batch operations for efficiency
- Decision history and audit trail
- User behavior tracking

## See Also

- [TypeScript SDK](/api/sdk)
- [Policies Guide](/guide/policies)
- [Social Feed Example](/examples/social-feed)
- [Chat Example](/examples/chat)
