# REST API

Direct HTTP API reference for Vettly moderation.

## Base URL

```
https://vettly-production.up.railway.app
```

## Authentication

All requests require an API key in the `Authorization` header:

```http
Authorization: Bearer vettly_xxxxxxxxxxxxx
```

## Content Moderation

### Check Content

Check content for moderation violations.

```http
POST /v1/check
```

#### Request

```json
{
  "content": "Text to moderate",
  "policyId": "balanced",
  "contentType": "text",
  "metadata": {
    "userId": "user_123",
    "ip": "192.168.1.1"
  }
}
```

#### Response

```json
{
  "safe": true,
  "flagged": false,
  "action": "allow",
  "categories": [
    {
      "category": "violence",
      "score": 0.05,
      "threshold": 0.7,
      "triggered": false
    },
    {
      "category": "sexual",
      "score": 0.02,
      "threshold": 0.75,
      "triggered": false
    }
  ],
  "decisionId": "dec_abc123xyz",
  "provider": "openai",
  "latency": 234,
  "cost": 0.001
}
```

#### cURL Example

```bash
curl -X POST https://vettly-production.up.railway.app/v1/check \
  -H "Authorization: Bearer vettly_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello, world!",
    "policyId": "balanced",
    "contentType": "text"
  }'
```

### Dry Run

Test a policy without calling AI providers.

```http
POST /v1/check/dry-run
```

#### Request

```json
{
  "policyId": "balanced",
  "mockScores": {
    "violence": 0.8,
    "sexual": 0.3,
    "hate": 0.95
  }
}
```

### Batch Check (Sync)

Check multiple items synchronously.

```http
POST /v1/batch/check
```

#### Request

```json
{
  "policyId": "balanced",
  "items": [
    {
      "id": "comment_1",
      "content": "Great post!",
      "contentType": "text"
    },
    {
      "id": "comment_2",
      "content": "Inappropriate content",
      "contentType": "text"
    }
  ]
}
```

#### Response

```json
{
  "items": [
    {
      "id": "comment_1",
      "safe": true,
      "action": "allow",
      "decisionId": "dec_abc123"
    },
    {
      "id": "comment_2",
      "safe": false,
      "action": "block",
      "decisionId": "dec_def456"
    }
  ]
}
```

### Batch Check (Async)

Check multiple items with webhook delivery.

```http
POST /v1/batch/check/async
```

#### Request

```json
{
  "policyId": "balanced",
  "items": [
    { "id": "1", "content": "Text 1" },
    { "id": "2", "content": "Text 2" }
  ],
  "webhookUrl": "https://myapp.com/webhooks/moderation"
}
```

#### Response

```json
{
  "batchId": "batch_abc123",
  "status": "processing",
  "totalItems": 2
}
```

## Policies

### Create Policy

```http
POST /v1/policies
```

#### Request

```json
{
  "policyId": "my_custom_policy",
  "yamlContent": "name: My Policy\ncategories:\n  violence:\n    threshold: 0.7"
}
```

### Get Policy

```http
GET /v1/policies/{policyId}
```

### List Policies

```http
GET /v1/policies
```

#### Response

```json
{
  "policies": [
    {
      "policyId": "balanced",
      "name": "Moderate Policy",
      "categories": { ... }
    }
  ]
}
```

## Decisions

### Get Decision

```http
GET /v1/decisions/{decisionId}
```

#### Response

```json
{
  "decisionId": "dec_abc123",
  "content": "Original content",
  "safe": true,
  "action": "allow",
  "timestamp": "2025-01-18T10:30:00Z",
  "policyId": "balanced"
}
```

### List Decisions

```http
GET /v1/decisions?limit=100&offset=0
```

### Replay Decision

```http
POST /v1/decisions/{decisionId}/replay
```

#### Request

```json
{
  "policyId": "strict"
}
```

### Get cURL Command

```http
GET /v1/decisions/{decisionId}/curl
```

#### Response

```json
{
  "curl": "curl -X POST https://vettly-production.up.railway.app/v1/check..."
}
```

## Webhooks

### Register Webhook

```http
POST /v1/webhooks
```

#### Request

```json
{
  "url": "https://myapp.com/webhooks/vettly",
  "events": ["moderation.completed", "moderation.failed"],
  "description": "Production webhook"
}
```

#### Response

```json
{
  "id": "wh_abc123",
  "url": "https://myapp.com/webhooks/vettly",
  "events": ["moderation.completed"],
  "secret": "whsec_xxxxx",
  "enabled": true
}
```

### List Webhooks

```http
GET /v1/webhooks
```

### Get Webhook

```http
GET /v1/webhooks/{webhookId}
```

### Update Webhook

```http
PATCH /v1/webhooks/{webhookId}
```

#### Request

```json
{
  "enabled": false,
  "events": ["moderation.completed"]
}
```

### Delete Webhook

```http
DELETE /v1/webhooks/{webhookId}
```

### Test Webhook

```http
POST /v1/webhooks/{webhookId}/test
```

#### Request

```json
{
  "eventType": "moderation.completed"
}
```

### Get Deliveries

```http
GET /v1/webhooks/{webhookId}/deliveries?limit=50
```

## Rate Limits

| Plan | Requests/minute | Requests/day |
|------|-----------------|--------------|
| Free | 60 | 10,000 |
| Starter | 300 | 100,000 |
| Pro | 1,000 | 1,000,000 |
| Enterprise | Custom | Custom |

### Rate Limit Headers

```http
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 299
X-RateLimit-Reset: 1642531200
```

### Rate Limit Exceeded

```http
HTTP/1.1 429 Too Many Requests
```

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

## Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Check API key |
| 403 | Forbidden | Check API key permissions |
| 404 | Not Found | Check endpoint/resource ID |
| 429 | Too Many Requests | Implement rate limiting |
| 500 | Server Error | Retry or contact support |

### Error Response Format

```json
{
  "error": "Invalid API key",
  "code": "INVALID_API_KEY",
  "details": "The provided API key is not valid"
}
```

## Content Types

### Text

```json
{
  "content": "Text to check",
  "contentType": "text"
}
```

### Image (Base64)

```json
{
  "content": "/9j/4AAQSkZJRgABAQAAAQ...",
  "contentType": "image"
}
```

### Video (Not directly supported)

Use the React component or SDK for video moderation, which handles frame extraction client-side.

## Best Practices

### 1. Use Idempotency Keys

Prevent duplicate checks:

```http
POST /v1/check
Idempotency-Key: unique-request-id
```

### 2. Handle Retries

Use exponential backoff for failed requests:

```javascript
async function checkWithRetry(content, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch('/v1/check', { ... })
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await sleep(1000 * Math.pow(2, i))
    }
  }
}
```

### 3. Cache Results

Cache decisions by content hash:

```javascript
const cacheKey = sha256(content + policyId)
const cached = cache.get(cacheKey)
if (cached) return cached
```

### 4. Monitor Costs

Track API usage:

```javascript
let totalCost = 0
result.cost && (totalCost += result.cost)
console.log('Total cost today:', totalCost)
```

### 5. Use Batch Endpoints

For multiple checks:

```javascript
// ❌ Don't do this
for (const comment of comments) {
  await fetch('/v1/check', { body: comment })
}

// ✅ Do this
await fetch('/v1/batch/check', {
  body: { items: comments }
})
```

## Webhooks Integration

See [Webhooks documentation](/api/webhooks) for details on:
- Event types
- Payload formats
- Signature verification
- Retry logic

## SDK vs REST API

**Use the SDK when:**
- Building Node.js/TypeScript apps
- Want automatic retries and error handling
- Need TypeScript types
- Using Express middleware

**Use REST API when:**
- Building in other languages (Python, Ruby, Go)
- Need direct HTTP control
- Building serverless functions
- Integrating with no-code tools

## Examples

### Python

```python
import requests

response = requests.post(
    'https://vettly-production.up.railway.app/v1/check',
    headers={
        'Authorization': 'Bearer vettly_xxxxx',
        'Content-Type': 'application/json'
    },
    json={
        'content': 'Text to check',
        'policyId': 'balanced',
        'contentType': 'text'
    }
)

result = response.json()
print('Safe:', result['safe'])
```

### Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "net/http"
)

func checkContent(content string) (bool, error) {
    payload := map[string]string{
        "content": content,
        "policyId": "balanced",
        "contentType": "text",
    }

    body, _ := json.Marshal(payload)

    req, _ := http.NewRequest(
        "POST",
        "https://vettly-production.up.railway.app/v1/check",
        bytes.NewBuffer(body),
    )

    req.Header.Set("Authorization", "Bearer vettly_xxxxx")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, err := client.Do(req)

    // Handle response...
}
```

### Ruby

```ruby
require 'net/http'
require 'json'

uri = URI('https://vettly-production.up.railway.app/v1/check')
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = true

request = Net::HTTP::Post.new(uri.path)
request['Authorization'] = 'Bearer vettly_xxxxx'
request['Content-Type'] = 'application/json'
request.body = {
  content: 'Text to check',
  policyId: 'balanced',
  contentType: 'text'
}.to_json

response = http.request(request)
result = JSON.parse(response.body)

puts "Safe: #{result['safe']}"
```

## See Also

- [TypeScript SDK](/api/sdk) - Official SDK documentation
- [Webhooks](/api/webhooks) - Webhook events and signatures
- [Next.js Integration](/api/nextjs) - Next.js API routes
- [Express Integration](/api/express) - Express middleware
