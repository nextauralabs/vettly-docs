# Moderation Policies

Configure what content is acceptable in your application.

## What is a Policy?

A **moderation policy** defines the rules for what content is allowed in your app. Each policy specifies:

- **Categories** to check (violence, sexual content, hate speech, etc.)
- **Thresholds** for each category (how sensitive)
- **Actions** to take when content is flagged

Think of policies as "strictness levels" for your content moderation.

## Quick Start

Using a pre-built policy is simple:

```tsx
<ModeratedTextarea
  apiKey="vettly_xxxxx"
  policyId="balanced" // ← Choose a pre-built policy
/>
```

## Pre-built Policies

Vettly provides ready-to-use policies for common use cases:

### Permissive

**Use for**: Open forums, discussion boards, adult platforms

**Sensitivity**: Low - Only blocks extreme content

**Category Thresholds**:
| Category | Threshold | Notes |
|----------|-----------|-------|
| Violence/Gore | 0.9 | Extreme violence only |
| Sexual (Explicit) | 0.95 | Hardcore content only |
| Hate Speech | 0.8 | Clear hate only |
| Harassment | 0.9 | Severe harassment |
| Self-harm | 0.7 | Direct encouragement |

**Example flagged content**:
- Graphic violence depictions
- Hardcore explicit imagery
- Clear calls for violence

**Example allowed content**:
- Mild profanity
- Political debates
- Artistic nudity
- Gaming violence discussions

```tsx
<ModeratedTextarea policyId="permissive" />
```

### Balanced (Default)

**Use for**: Social media, community platforms, SaaS apps

**Sensitivity**: Medium - Balanced approach

**Category Thresholds**:
| Category | Threshold | Notes |
|----------|-----------|-------|
| Violence/Gore | 0.7 | Moderate violence blocked |
| Sexual (Explicit) | 0.75 | Sexual content blocked |
| Sexual (Suggestive) | 0.85 | Suggestive content warned |
| Hate Speech | 0.5 | Sensitive to hate |
| Harassment | 0.6 | Blocks harassment |
| Self-harm | 0.5 | Blocks self-harm content |
| Illegal | 0.6 | Blocks illegal activities |

**Example flagged content**:
- Violent imagery or descriptions
- Sexual content
- Hate speech or slurs
- Harassment or bullying
- Drug promotion

**Example allowed content**:
- Mild profanity (context-dependent)
- News articles about violence
- Health/education discussions
- Respectful debates

```tsx
<ModeratedTextarea policyId="balanced" />
```

### Strict

**Use for**: Kids apps, education platforms, family content

**Sensitivity**: High - Very strict filtering

**Category Thresholds**:
| Category | Threshold | Notes |
|----------|-----------|-------|
| Violence/Gore | 0.4 | Even mild violence blocked |
| Sexual (All) | 0.5 | All sexual content blocked |
| Hate Speech | 0.3 | Very sensitive |
| Harassment | 0.4 | Zero tolerance |
| Self-harm | 0.3 | Maximum protection |
| Profanity | 0.5 | Blocks swearing |
| Illegal | 0.4 | Strict on illegal content |

**Example flagged content**:
- Any violence references
- All sexual content
- Profanity
- Cyberbullying
- Dating/romance content
- Controversial topics

**Example allowed content**:
- Educational content
- Positive messages
- Safe gaming discussions
- Age-appropriate topics

```tsx
<ModeratedTextarea policyId="strict" />
```

### E-Commerce

**Use for**: E-commerce, classifieds, product listings

**Sensitivity**: Medium-High - Focused on commerce safety

**Category Thresholds**:
| Category | Threshold | Notes |
|----------|-----------|-------|
| Violence | 0.6 | Weapons, dangerous items |
| Sexual | 0.7 | Adult products |
| Illegal | 0.4 | Stolen goods, drugs |
| Scams/Spam | 0.5 | Fraud detection |
| PII Leakage | 0.4 | Personal info protection |

**Example flagged content**:
- Weapons or explosives
- Counterfeit goods
- Stolen items
- Pyramid schemes
- Contact info in listings

**Example allowed content**:
- Product descriptions
- Honest reviews
- Pricing information
- Shipping details

```tsx
<ModeratedImageUpload policyId="ecommerce" />
```

### Social Media

**Use for**: Twitter-like platforms, comment systems

**Sensitivity**: Medium - Optimized for social content

**Category Thresholds**:
| Category | Threshold | Notes |
|----------|-----------|-------|
| Violence | 0.65 | Context-aware |
| Sexual | 0.8 | Allows discussion |
| Hate Speech | 0.45 | Strict on hate |
| Harassment | 0.55 | Protects users |
| Spam | 0.6 | Blocks spam |
| Misinformation | 0.7 | Flags misinfo |

**Example flagged content**:
- Targeted harassment
- Hate speech
- Spam/scams
- Explicit content
- Coordinated attacks

**Example allowed content**:
- Political opinions
- News sharing
- Debates (respectful)
- Personal stories

```tsx
<ModeratedTextarea policyId="social_media" />
```

## Category Reference

### Violence & Gore

Detects violent content including:
- Physical violence descriptions
- Gore, blood, injuries
- Weapons, explosives
- Animal cruelty
- War/combat content

**Threshold guide**:
- `0.3-0.4` = Blocks even cartoon violence
- `0.5-0.7` = Blocks realistic violence
- `0.8+` = Only extreme violence

### Sexual Content

Detects sexual content including:
- **Explicit**: Nudity, sexual acts
- **Suggestive**: Provocative, flirting
- Adult services, prostitution
- Non-consensual content

**Threshold guide**:
- `0.3-0.5` = Blocks all sexual references
- `0.6-0.7` = Blocks explicit content
- `0.8+` = Only hardcore content

### Hate Speech

Detects hateful content including:
- Slurs and derogatory terms
- Discrimination based on:
  - Race, ethnicity
  - Religion
  - Gender, sexuality
  - Disability
- Supremacist ideology

**Threshold guide**:
- `0.3-0.4` = Very sensitive (may over-flag)
- `0.5-0.6` = Balanced (recommended)
- `0.7+` = Only clear hate speech

### Harassment & Bullying

Detects harassment including:
- Personal attacks
- Cyberbullying
- Doxxing, stalking
- Threats, intimidation
- Coordinated harassment

**Threshold guide**:
- `0.4-0.5` = Protective
- `0.6-0.7` = Standard
- `0.8+` = Severe harassment only

### Self-Harm

Detects self-harm content including:
- Suicide discussion/encouragement
- Self-injury
- Eating disorders (promotion)
- Crisis content

**Threshold guide**:
- `0.3-0.5` = Maximum protection
- `0.6-0.7` = Allows support discussions
- `0.8+` = Direct encouragement only

### Illegal Activities

Detects illegal content including:
- Drug sales/promotion
- Weapons trafficking
- Stolen goods
- Hacking/fraud
- Child safety violations

**Threshold guide**:
- `0.4-0.5` = Strict enforcement
- `0.6-0.7` = Clear violations
- `0.8+` = Obvious crimes only

### Spam & Scams

Detects spam including:
- Repetitive content
- Phishing attempts
- Pyramid schemes
- Fake giveaways
- Link farms

**Threshold guide**:
- `0.4-0.6` = Aggressive filtering
- `0.7-0.8` = Standard protection
- `0.9+` = Obvious spam only

### Personal Information (PII)

Detects PII including:
- Email addresses
- Phone numbers
- Social security numbers
- Credit card numbers
- Home addresses

**Threshold guide**:
- `0.3-0.5` = Maximum privacy
- `0.6-0.7` = Standard protection
- `0.8+` = Obvious leaks only

## Custom Policies

Create policies tailored to your needs using the Vettly dashboard or API.

### Creating a Policy (Dashboard)

1. Go to **Dashboard → Policies**
2. Click **Create Policy**
3. Configure categories and thresholds
4. Name your policy
5. Copy the policy ID

### Creating a Policy (API)

```typescript
import { ModerationClient } from '@nextauralabs/vettly-sdk'

const client = new ModerationClient({ apiKey: 'vettly_xxxxx' })

const policy = await client.createPolicy({
  name: 'My Custom Policy',
  description: 'For my app',
  categories: {
    violence: {
      enabled: true,
      threshold: 0.6,
      action: 'warn'
    },
    sexual: {
      enabled: true,
      threshold: 0.8,
      action: 'block'
    },
    hate: {
      enabled: true,
      threshold: 0.4,
      action: 'block'
    }
  }
})

console.log('Policy ID:', policy.id)
```

### Using Custom Policies

```tsx
<ModeratedTextarea
  apiKey="vettly_xxxxx"
  policyId="pol_custom_abc123" // Your custom policy ID
/>
```

## Actions

Each category can have a different action:

| Action | Meaning | UI Behavior | Use Case |
|--------|---------|-------------|----------|
| `allow` | Content is fine | Green, no warning | Safe content |
| `warn` | Minor concerns | Yellow, show warning | Borderline content |
| `flag` | Needs review | Orange, queue for review | Uncertain content |
| `block` | Violates policy | Red, prevent submission | Clear violations |

### Action Examples

```typescript
const policy = {
  categories: {
    violence: {
      threshold: 0.7,
      action: 'block' // Hard block
    },
    profanity: {
      threshold: 0.6,
      action: 'warn' // Allow with warning
    },
    spam: {
      threshold: 0.5,
      action: 'flag' // Queue for review
    }
  }
}
```

## Threshold Tuning

### Finding the Right Balance

**Too strict** (0.3-0.4):
- ❌ Many false positives
- ❌ Users frustrated
- ✅ Maximum safety

**Balanced** (0.5-0.7):
- ✅ Good accuracy
- ✅ Reasonable UX
- ✅ **Recommended**

**Too permissive** (0.8-0.9):
- ✅ Few false positives
- ❌ Misses violations
- ❌ Safety concerns

### A/B Testing Policies

```tsx
const policyId = Math.random() > 0.5 ? 'strict' : 'balanced'

<ModeratedTextarea
  policyId={policyId}
  onModerationResult={(result) => {
    analytics.track('moderation_result', {
      policy: policyId,
      safe: result.safe,
      action: result.action
    })
  }}
/>
```

### Monitoring Policy Performance

Track metrics:
- **Precision**: True positives / (True positives + False positives)
- **Recall**: True positives / (True positives + False negatives)
- **User appeals**: How often users report false positives
- **Missed content**: How often violations slip through

## Use Case Recommendations

### Kids App (Age 6-12)

```typescript
{
  policyId: 'strict',
  customizations: {
    violence: 0.3,
    sexual: 0.3,
    profanity: 0.4
  }
}
```

### Teen Social Network (Age 13-17)

```typescript
{
  policyId: 'balanced',
  customizations: {
    hate: 0.5,
    harassment: 0.5,
    sexual: 0.7
  }
}
```

### Adult Forum (18+)

```typescript
{
  policyId: 'permissive',
  customizations: {
    hate: 0.6,
    harassment: 0.7,
    illegal: 0.5
  }
}
```

### Product Reviews

```typescript
{
  policyId: 'balanced',
  customizations: {
    spam: 0.5,
    pii: 0.4,
    profanity: 0.7
  }
}
```

### News Comments

```typescript
{
  policyId: 'balanced',
  customizations: {
    hate: 0.45,
    harassment: 0.55,
    violence: 0.8 // Allow news discussion
  }
}
```

## Best Practices

### ✅ Do

- Start with pre-built policies
- Monitor false positives/negatives
- Adjust thresholds based on data
- Use different policies for different contexts
- Document your policy choices
- Provide user appeals process

### ❌ Don't

- Set all thresholds to 0.9 (defeats purpose)
- Set all thresholds to 0.3 (too many false positives)
- Use same policy for kids and adults
- Ignore user feedback
- Change policies without testing
- Skip manual review for flagged content

## Multi-Policy Strategy

Use different policies in different contexts:

```tsx
function CommentSection({ userAge }) {
  const policyId = userAge < 13 ? 'strict' : 'balanced'

  return (
    <ModeratedTextarea
      policyId={policyId}
      apiKey="vettly_xxxxx"
    />
  )
}

function ProductListing() {
  return (
    <ModeratedImageUpload
      policyId="ecommerce"
      apiKey="vettly_xxxxx"
    />
  )
}

function ProfileBio({ isPublic }) {
  const policyId = isPublic ? 'strict' : 'balanced'

  return (
    <ModeratedTextarea
      policyId={policyId}
      apiKey="vettly_xxxxx"
    />
  )
}
```

## Testing Policies

Use test content to validate your policy:

```typescript
const testCases = [
  { content: 'Hello, world!', expect: 'allow' },
  { content: 'You are stupid', expect: 'warn' },
  { content: 'Explicit violence...', expect: 'block' }
]

for (const test of testCases) {
  const result = await client.check({
    content: test.content,
    policyId: 'balanced',
    contentType: 'text'
  })

  console.log(`Expected ${test.expect}, got ${result.action}`)
}
```

## See Also

- [How It Works](/guide/how-it-works) - Understand the moderation flow
- [API Reference](/api/sdk) - Create policies programmatically
- [Examples](/examples/social-feed) - See policies in action
- [Dashboard](https://vettly.dev/dashboard) - Manage policies visually
