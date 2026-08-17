# Dynamic Question Generation

> **PRINCIPLE:** Questions are not about gathering data — they reveal **architectural consequences**.
> Every question must connect to a concrete implementation decision affecting cost, complexity, or timeline.

## Core Principles

### 1. Questions Reveal Consequences

```markdown
BAD:  "What authentication method?"
GOOD: "Should users sign up with email/password or social login?

 Impact:
 - Email/Pass → Need password reset, hashing, 2FA infrastructure
 - Social → OAuth providers, user profile mapping, less control

 Trade-off: Security vs. Development time vs. User friction"
```

### 2. Context Before Content

| Context | Question Focus |
|---------|----------------|
| **Greenfield** | Foundation: stack, hosting, scale |
| **Feature Addition** | Integration points, existing patterns, breaking changes |
| **Refactor** | Why refactor? Performance? Maintainability? What's broken? |
| **Debug** | Symptoms → Root cause → Reproduction path |

### 3. Minimum Viable Questions

Each question must eliminate a fork in the implementation road.

```
Before Question:  3 possible paths (5min / 15min / 1hr)
After Question:   1 confirmed path (5min)
```

If a question doesn't reduce implementation paths → **DELETE IT**.

### 4. Generate Data, Not Assumptions

```markdown
BAD:  Assume "User probably wants Stripe for payments"
GOOD: "Which payment provider fits your needs?

 Stripe → Best docs, 2.9%+$0.30, US-centric
 LemonSqueezy → Merchant of Record, 5%+$0.50, global taxes
 Paddle → Complex pricing, handles EU VAT, enterprise focus"
```

## Question Generation Algorithm

```
INPUT: User request + Context (greenfield/feature/refactor/debug)

STEP 1: Parse Request
├── Extract domain (ecommerce, auth, realtime, cms, etc.)
├── Extract features (explicit and implied)
└── Extract scale indicators (users, data volume, frequency)

STEP 2: Identify Decision Points
├── What MUST be decided before coding? (blocking)
├── What COULD be decided later? (deferable)
└── What has ARCHITECTURAL impact? (high-leverage)

STEP 3: Generate Questions (Priority Order)
├── P0: Blocking decisions (cannot proceed without answer)
├── P1: High-leverage (affects >30% of implementation)
├── P2: Medium-leverage (affects specific features)
└── P3: Nice-to-have (edge cases, optimization)

STEP 4: Format Each Question
├── What: Clear question
├── Why: Impact on implementation
├── Options: Trade-offs (not just A vs B)
└── Default: What happens if user doesn't answer
```

## Mandatory Question Format

```markdown
### [PRIORITY] **[DECISION POINT]**

**Question:** [Clear, specific question]

**Why This Matters:**
- [Explain architectural consequence]
- [Affects: cost / complexity / timeline / scale]

**Options:**
| Option | Pros | Cons | Best For |
|--------|------|------|----------|
| A | [Advantage] | [Disadvantage] | [Use case] |
| B | [Advantage] | [Disadvantage] | [Use case] |

**If Not Specified:** [Default choice + rationale]
```

## Domain-Specific Question Banks

### E-Commerce

| Question | Why It Matters |
|----------|----------------|
| Single or Multi-vendor? | Multi → commission logic, vendor dashboards, split payments |
| Inventory Tracking? | Stock tables, reservation logic, low-stock alerts |
| Digital or Physical? | Digital → download links, no shipping. Physical → shipping APIs |
| Subscription or One-time? | Subscription → recurring billing, dunning, proration |

### Authentication

| Question | Why It Matters |
|----------|----------------|
| Social Login Needed? | OAuth providers vs password reset infrastructure |
| Role-Based Permissions? | RBAC tables, policy enforcement, admin UI |
| 2FA Required? | TOTP/SMS infrastructure, backup codes, recovery flow |
| Email Verification? | Verification tokens, email service, resend logic |

### Real-time

| Question | Why It Matters |
|----------|----------------|
| WebSocket or Polling? | WS → server scaling, connection management |
| Expected Concurrent Users? | <100 single server, >1k Redis pub/sub, >10k specialized |
| Message Persistence? | History tables, storage costs, pagination |
| Ephemeral or Durable? | Ephemeral → in-memory. Durable → DB write before emit |

### Content/CMS

| Question | Why It Matters |
|----------|----------------|
| Rich Text or Markdown? | Rich Text → sanitization, XSS risks |
| Draft/Publish Workflow? | Status field, scheduled jobs, versioning |
| Media Handling? | Upload endpoints, storage, optimization |
| Multi-language? | i18n tables, translation UI, fallback logic |

## Iterative Questioning

### First Pass (3-5 Questions)
Focus on **blocking decisions**. Don't proceed without answers.

### Second Pass (After Initial Design)
As patterns emerge:
- "This feature implies [X]. Should we handle [edge case] now or defer?"
- "We're using [Pattern A]. Should [Feature B] follow the same pattern?"

### Third Pass (Optimization)
When design is solid:
- "Performance bottleneck at [X]. Optimize now or acceptable?"
- "Refactor [Y] for maintainability or ship as-is?"

## Principles Recap

1. Every question = architectural decision, not data gathering
2. Show trade-offs — user understands consequences
3. Prioritize blocking decisions — cannot proceed without
4. Provide defaults — if user doesn't answer, proceed anyway
5. Domain-aware — ecommerce questions != auth questions != realtime questions
6. Iterative — more questions as patterns emerge during design
