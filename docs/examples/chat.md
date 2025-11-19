# Chat Application Example

Build a real-time chat app with live content moderation.

## Overview

This example demonstrates:
- Real-time messaging with Socket.io
- Live content moderation before message send
- Direct messages and group chats
- Message deletion and editing
- User blocking and reporting
- Optimistic UI updates

## Tech Stack

- **Frontend**: Next.js 14, React, Socket.io Client
- **Backend**: Next.js API Routes, Socket.io Server
- **Database**: PostgreSQL (Prisma)
- **Real-time**: Socket.io
- **Moderation**: Vettly SDK

## Database Schema

```prisma
// prisma/schema.prisma
model User {
  id          String    @id @default(cuid())
  email       String    @unique
  name        String
  avatar      String?
  status      String    @default("offline") // online, away, offline
  messagesSent Message[] @relation("SentMessages")
  messagesReceived Message[] @relation("ReceivedMessages")
  roomMembers RoomMember[]
  createdAt   DateTime  @default(now())
}

model Room {
  id        String       @id @default(cuid())
  name      String?
  type      String       // 'direct' or 'group'
  members   RoomMember[]
  messages  Message[]
  createdAt DateTime     @default(now())
}

model RoomMember {
  id        String   @id @default(cuid())
  roomId    String
  room      Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  role      String   @default("member") // member, admin
  joinedAt  DateTime @default(now())

  @@unique([roomId, userId])
  @@index([roomId])
  @@index([userId])
}

model Message {
  id                String    @id @default(cuid())
  content           String    @db.Text
  roomId            String
  room              Room      @relation(fields: [roomId], references: [id], onDelete: Cascade)
  senderId          String
  sender            User      @relation("SentMessages", fields: [senderId], references: [id])
  recipientId       String?   // For DMs
  recipient         User?     @relation("ReceivedMessages", fields: [recipientId], references: [id])
  edited            Boolean   @default(false)
  editedAt          DateTime?
  deleted           Boolean   @default(false)
  moderationSafe    Boolean   @default(true)
  moderationAction  String    @default("allow")
  moderationDecisionId String?
  createdAt         DateTime  @default(now())

  @@index([roomId])
  @@index([senderId])
  @@index([createdAt])
}
```

## Chat Component

```tsx
// components/ChatRoom.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useModeration } from '@nextauralabs/vettly-react'

interface Message {
  id: string
  content: string
  sender: {
    id: string
    name: string
    avatar?: string
  }
  moderationAction?: string
  createdAt: string
}

export default function ChatRoom({
  roomId,
  userId,
  userName
}: {
  roomId: string
  userId: string
  userName: string
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [socket, setSocket] = useState<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Real-time moderation
  const { result, check } = useModeration({
    apiKey: process.env.NEXT_PUBLIC_VETTLY_API_KEY!,
    policyId: 'strict', // Use strict policy for chat
    debounceMs: 300, // Fast feedback for chat
    onCheck: (response) => {
      console.log('Moderation result:', response)
    }
  })

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      query: { userId, userName }
    })

    socketInstance.on('connect', () => {
      console.log('Connected to chat server')
      socketInstance.emit('join_room', roomId)
    })

    socketInstance.on('message', (message: Message) => {
      setMessages(prev => [...prev, message])
    })

    socketInstance.on('message_deleted', (messageId: string) => {
      setMessages(prev => prev.filter(m => m.id !== messageId))
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [roomId, userId, userName])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Check message on input change
  useEffect(() => {
    if (inputValue.trim()) {
      check(inputValue)
    }
  }, [inputValue])

  const sendMessage = async () => {
    if (!inputValue.trim() || !result.safe || !socket) return

    const tempId = Date.now().toString()
    const tempMessage: Message = {
      id: tempId,
      content: inputValue,
      sender: {
        id: userId,
        name: userName
      },
      createdAt: new Date().toISOString()
    }

    // Optimistic update
    setMessages(prev => [...prev, tempMessage])
    setInputValue('')

    try {
      // Send to server with moderation result
      socket.emit('send_message', {
        roomId,
        content: inputValue,
        tempId,
        moderationDecisionId: result.decisionId
      })
    } catch (error) {
      console.error('Failed to send message:', error)
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== tempId))
      alert('Failed to send message')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Chat Header */}
      <div className="bg-white border-b px-6 py-4">
        <h2 className="text-xl font-semibold">Chat Room</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map(message => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwnMessage={message.sender.id === userId}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t px-6 py-4">
        {/* Moderation Feedback */}
        {inputValue && !result.safe && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800">
              ⚠️ This message contains inappropriate content and cannot be sent.
            </p>
            {result.categories
              .filter(c => c.triggered)
              .map(c => (
                <span
                  key={c.category}
                  className="inline-block mt-2 mr-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
                >
                  {c.category}
                </span>
              ))}
          </div>
        )}

        {result.isChecking && (
          <div className="mb-2 text-sm text-gray-500">
            🔍 Checking message...
          </div>
        )}

        <div className="flex gap-3">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={1}
            className={`flex-1 px-4 py-3 border rounded-lg resize-none focus:outline-none focus:ring-2 ${
              inputValue && !result.safe
                ? 'border-red-300 focus:ring-red-500'
                : inputValue && result.safe
                ? 'border-green-300 focus:ring-green-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            style={{ maxHeight: '120px' }}
          />

          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || !result.safe || result.isChecking}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              inputValue.trim() && result.safe && !result.isChecking
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  isOwnMessage
}: {
  message: Message
  isOwnMessage: boolean
}) {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] ${
          isOwnMessage
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-900'
        } rounded-lg px-4 py-2 shadow`}
      >
        {!isOwnMessage && (
          <div className="text-xs font-semibold mb-1">
            {message.sender.name}
          </div>
        )}

        <p className="whitespace-pre-wrap break-words">{message.content}</p>

        <div
          className={`text-xs mt-1 ${
            isOwnMessage ? 'text-blue-100' : 'text-gray-500'
          }`}
        >
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
          {message.moderationAction === 'warn' && ' • Flagged'}
        </div>
      </div>
    </div>
  )
}
```

## Socket.io Server

```typescript
// lib/socket.ts
import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { ModerationClient } from '@nextauralabs/vettly-sdk'
import { db } from './db'

const moderationClient = new ModerationClient({
  apiKey: process.env.VETTLY_API_KEY!
})

export function initializeSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL,
      methods: ['GET', 'POST']
    }
  })

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    const userId = socket.handshake.query.userId as string
    const userName = socket.handshake.query.userName as string

    // Join room
    socket.on('join_room', (roomId: string) => {
      socket.join(roomId)
      console.log(`${userName} joined room ${roomId}`)

      // Notify others
      socket.to(roomId).emit('user_joined', {
        userId,
        userName
      })
    })

    // Send message
    socket.on('send_message', async (data: {
      roomId: string
      content: string
      tempId: string
      moderationDecisionId?: string
    }) => {
      try {
        // Server-side moderation verification
        const result = await moderationClient.check({
          content: data.content,
          policyId: 'strict',
          contentType: 'text',
          metadata: {
            userId,
            roomId: data.roomId,
            type: 'chat_message'
          }
        })

        // Block if unsafe
        if (result.action === 'block') {
          socket.emit('message_blocked', {
            tempId: data.tempId,
            reason: 'Content violated our community guidelines',
            categories: result.categories.filter(c => c.triggered)
          })
          return
        }

        // Save to database
        const message = await db.message.create({
          data: {
            content: data.content,
            roomId: data.roomId,
            senderId: userId,
            moderationSafe: result.safe,
            moderationAction: result.action,
            moderationDecisionId: result.decisionId
          },
          include: {
            sender: true
          }
        })

        // Broadcast to room
        io.to(data.roomId).emit('message', {
          id: message.id,
          content: message.content,
          sender: {
            id: message.sender.id,
            name: message.sender.name,
            avatar: message.sender.avatar
          },
          moderationAction: message.moderationAction,
          createdAt: message.createdAt.toISOString()
        })

        // Log flagged messages
        if (result.action === 'warn' || result.action === 'flag') {
          console.warn('Flagged message:', {
            messageId: message.id,
            userId,
            decisionId: result.decisionId,
            categories: result.categories.filter(c => c.triggered)
          })
        }
      } catch (error) {
        console.error('Error sending message:', error)
        socket.emit('message_error', {
          tempId: data.tempId,
          error: 'Failed to send message'
        })
      }
    })

    // Delete message
    socket.on('delete_message', async (data: {
      messageId: string
      roomId: string
    }) => {
      try {
        const message = await db.message.findUnique({
          where: { id: data.messageId }
        })

        // Only allow sender or room admin to delete
        if (message?.senderId === userId) {
          await db.message.update({
            where: { id: data.messageId },
            data: { deleted: true }
          })

          io.to(data.roomId).emit('message_deleted', data.messageId)
        }
      } catch (error) {
        console.error('Error deleting message:', error)
      }
    })

    // Typing indicator
    socket.on('typing', (roomId: string) => {
      socket.to(roomId).emit('user_typing', {
        userId,
        userName
      })
    })

    socket.on('stop_typing', (roomId: string) => {
      socket.to(roomId).emit('user_stop_typing', {
        userId,
        userName
      })
    })

    // Disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
    })
  })

  return io
}
```

## Next.js Server Setup

```typescript
// server.ts (Custom server for Socket.io)
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { initializeSocket } from './lib/socket'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.io
  initializeSocket(httpServer)

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
```

## Direct Messages Component

```tsx
// components/DirectMessage.tsx
'use client'

import { useState } from 'react'
import ChatRoom from './ChatRoom'

export default function DirectMessages({ currentUserId }: { currentUserId: string }) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [users, setUsers] = useState([
    { id: '1', name: 'Alice', status: 'online' },
    { id: '2', name: 'Bob', status: 'away' },
    { id: '3', name: 'Charlie', status: 'offline' }
  ])

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-4">Direct Messages</h2>

        <div className="space-y-2">
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user.id)}
              className={`w-full text-left px-3 py-2 rounded hover:bg-gray-700 flex items-center gap-2 ${
                selectedUser === user.id ? 'bg-gray-700' : ''
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  user.status === 'online'
                    ? 'bg-green-500'
                    : user.status === 'away'
                    ? 'bg-yellow-500'
                    : 'bg-gray-500'
                }`}
              />
              {user.name}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1">
        {selectedUser ? (
          <ChatRoom
            roomId={`dm_${currentUserId}_${selectedUser}`}
            userId={currentUserId}
            userName="You"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a user to start chatting
          </div>
        )}
      </div>
    </div>
  )
}
```

## Key Features

### 1. Real-time Moderation
- Check messages before sending
- Block unsafe content immediately
- Visual feedback during typing

### 2. Optimistic Updates
- Show message immediately
- Confirm with server
- Rollback if blocked

### 3. Socket.io Events
```typescript
// Client-side events
socket.emit('send_message', { content, roomId })
socket.emit('typing', roomId)
socket.emit('delete_message', { messageId, roomId })

// Server-side events
socket.on('message', (message) => { })
socket.on('message_blocked', ({ reason }) => { })
socket.on('user_typing', ({ userName }) => { })
```

### 4. Moderation Policies

Use strict policies for chat:
```typescript
const { result } = useModeration({
  policyId: 'strict', // Stricter for real-time chat
  debounceMs: 300     // Faster feedback (300ms vs 500ms)
})
```

## Best Practices

### 1. Server-Side Verification
Always verify moderation server-side:

```typescript
// ❌ Don't trust only client-side
socket.emit('send_message', { content })

// ✅ Verify server-side
const result = await moderationClient.check({ content })
if (result.action === 'block') {
  socket.emit('message_blocked')
  return
}
```

### 2. Handle Race Conditions
```typescript
// Store pending messages
const pendingMessages = new Map()

socket.on('send_message', async (data) => {
  const messageId = generateId()
  pendingMessages.set(messageId, data)

  try {
    const result = await moderationClient.check(data.content)
    // Handle result...
  } finally {
    pendingMessages.delete(messageId)
  }
})
```

### 3. Rate Limiting
```typescript
// Limit messages per user
const messageRates = new Map()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userMessages = messageRates.get(userId) || []

  // Remove old messages (older than 1 minute)
  const recentMessages = userMessages.filter((t: number) => now - t < 60000)

  if (recentMessages.length >= 20) {
    return false // Too many messages
  }

  messageRates.set(userId, [...recentMessages, now])
  return true
}
```

## Performance Optimization

### 1. Debouncing
```typescript
const { result } = useModeration({
  debounceMs: 300 // Fast for chat
})
```

### 2. Caching
```typescript
// Cache recent moderation results
const cache = new LRUCache({ max: 100 })

if (cache.has(content)) {
  return cache.get(content)
}

const result = await client.check(content)
cache.set(content, result)
```

### 3. Batch Processing
```typescript
// For message history, batch check
const results = await client.batchCheck({
  policyId: 'strict',
  items: messages.map(m => ({
    id: m.id,
    content: m.content
  }))
})
```

## See Also

- [useModeration Hook](/components/use-moderation)
- [Real-time Integration](/api/sdk#real-time-applications)
- [Social Feed Example](/examples/social-feed)
- [Forum Example](/examples/forum)
