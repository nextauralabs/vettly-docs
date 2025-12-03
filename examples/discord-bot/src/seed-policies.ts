/**
 * Seed Discord moderation policies
 * Run this once to create the policies in Vettly
 *
 * Usage: bun run src/seed-policies.ts
 */
import { pino } from 'pino';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
});

// Validate environment
if (!process.env.VETTLY_API_URL || !process.env.VETTLY_API_KEY) {
  logger.error('Missing VETTLY_API_URL or VETTLY_API_KEY');
  process.exit(1);
}

const POLICIES = [
  {
    policyId: 'discord-strict',
    name: 'Discord Strict',
    yaml: `policy:
  name: "discord-strict"
  version: "2024-11-28"

  rules:
    # Zero tolerance for hate speech
    - category: hate_speech
      threshold: 0.3
      provider: openai
      action: block
      priority: 100

    # Very low threshold for harassment
    - category: harassment
      threshold: 0.4
      provider: openai
      action: block
      priority: 90

    # Block violent content
    - category: violence
      threshold: 0.5
      provider: openai
      action: block
      priority: 80

    # Block self-harm content
    - category: self_harm
      threshold: 0.3
      provider: openai
      action: block
      priority: 85

    # Block sexual content
    - category: sexual
      threshold: 0.4
      provider: openai
      action: block
      priority: 75

  fallback:
    provider: fallback
    on_timeout: true
    timeout_ms: 5000
`,
  },
  {
    policyId: 'discord-balanced',
    name: 'Discord Balanced',
    yaml: `policy:
  name: "discord-balanced"
  version: "2024-11-28"

  rules:
    # Block clear hate speech
    - category: hate_speech
      threshold: 0.5
      provider: openai
      action: block
      priority: 100

    # Block clear harassment
    - category: harassment
      threshold: 0.6
      provider: openai
      action: block
      priority: 90

    # Flag violence for review
    - category: violence
      threshold: 0.7
      provider: openai
      action: flag
      priority: 80

    # Block self-harm content
    - category: self_harm
      threshold: 0.5
      provider: openai
      action: block
      priority: 85

    # Block explicit sexual content
    - category: sexual
      threshold: 0.6
      provider: openai
      action: block
      priority: 75

  fallback:
    provider: fallback
    on_timeout: true
    timeout_ms: 5000
`,
  },
  {
    policyId: 'discord-permissive',
    name: 'Discord Permissive',
    yaml: `policy:
  name: "discord-permissive"
  version: "2024-11-28"

  rules:
    # Only block severe hate speech
    - category: hate_speech
      threshold: 0.8
      provider: openai
      action: block
      priority: 100

    # Flag severe harassment
    - category: harassment
      threshold: 0.85
      provider: openai
      action: flag
      priority: 90

    # Allow most violence (gaming/fiction)
    - category: violence
      threshold: 0.9
      provider: openai
      action: flag
      priority: 80

    # Block only clear self-harm instructions
    - category: self_harm
      threshold: 0.7
      provider: openai
      action: block
      priority: 85

    # Flag explicit sexual content
    - category: sexual
      threshold: 0.85
      provider: openai
      action: flag
      priority: 75

  fallback:
    provider: fallback
    on_timeout: true
    timeout_ms: 5000
`,
  },
];

async function seedPolicies() {
  const baseUrl = process.env.VETTLY_API_URL!;
  const apiKey = process.env.VETTLY_API_KEY!;

  for (const policy of POLICIES) {
    logger.info({ policyId: policy.policyId }, 'Creating policy...');

    try {
      const response = await fetch(`${baseUrl}/v1/policies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          policyId: policy.policyId,
          yaml: policy.yaml,
          displayName: policy.name,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error({ policyId: policy.policyId, status: response.status, error: errorText }, 'Failed to create policy');
        continue;
      }

      const result = await response.json();
      logger.info({ policyId: policy.policyId, result }, 'Policy created');
    } catch (error) {
      logger.error({ policyId: policy.policyId, error }, 'Error creating policy');
    }
  }

  logger.info('Done seeding policies');
}

seedPolicies();
