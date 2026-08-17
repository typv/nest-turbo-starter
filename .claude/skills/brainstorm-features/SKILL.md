---
name: brainstorm-features
description: "Feature brainstorming with Socratic questioning, design specs, and structured trade-off analysis. MANDATORY for new features, complex requests, or unclear requirements. Produces formal spec before implementation."
license: MIT
version: 1.0.0
argument-hint: "[feature or idea]"
---

# Feature Brainstorming Skill

Turn ideas into fully formed designs and specs through collaborative Socratic dialogue. Produce a formal design spec that feeds into implementation planning.

> **Scope:** Feature ideation, product design, UX decisions, requirement refinement, spec writing. For pure architecture/tech debates, use `brainstorm-technical` instead.

**IMPORTANT:** Do NOT implement anything. Do NOT invoke implementation skills. The ONLY transition is to `/plan`.

## When to Trigger

| Pattern | Action |
|---------|--------|
| "Build/Create/Make [thing]" without details | STOP — ask 3+ questions first |
| Complex feature or new capability | Clarify before proceeding |
| Update/change request with unclear scope | Confirm scope |
| Vague requirements | Ask purpose, users, constraints |

## Anti-Pattern: "Too Simple To Need A Design"

Every feature goes through this process. A todo list, a single-function utility, a config change — all of them. "Simple" projects are where unexamined assumptions cause the most wasted work. The design can be short for truly simple projects, but you MUST present it and get approval.

## Core Principles

- **YAGNI / KISS / DRY** — every solution must honor these
- **Questions reveal consequences** — each question connects to an architectural decision
- **Context before content** — understand greenfield/feature/refactor/debug first
- **Minimum viable questions** — each must eliminate implementation paths
- **Generate data, not assumptions** — don't guess, ask with trade-offs
- **Design for isolation** — smaller units with clear boundaries and interfaces

## Collaboration Tools

- Consult `planner` agent for industry best practices
- Engage `docs-manager` agent for existing project constraints
- Use `WebSearch` for efficient approaches and prior art
- Use `docs-seeker` skill for latest library/framework docs
- Use `ai-multimodal` skill to analyze visual materials and mockups
- Use `sequential-thinking` skill for complex multi-step analysis
- Use `scout` skill to discover relevant files and patterns
- Read `<project-dir>/docs` directory for current project state

## Process

### Phase 1: Explore Project Context

Check files, docs, recent commits. Understand current state before asking anything.

### Phase 2: Scope Check

Before asking detailed questions, assess scope:
- If request describes multiple independent subsystems → flag immediately
- Help decompose into sub-projects: independent pieces, relationships, build order
- Each sub-project gets its own spec → plan → implementation cycle
- Only proceed with deep questioning for appropriately-scoped projects

### Phase 3: Dynamic Questioning

**One question per message.** Do not overwhelm with multiple questions.

Read `references/dynamic-questioning.md` for the full algorithm. Summary:

1. Parse request → extract domain, features, scale indicators
2. Identify decision points → blocking vs deferable vs high-leverage
3. Generate questions by priority: P0 (blocking) > P1 (high-leverage) > P2 (nice-to-have)
4. Format each question with: What, Why It Matters, Options table, Default

**Question format (mandatory):**

```markdown
### [PRIORITY] **[DECISION POINT]**

**Question:** [Clear question]

**Why This Matters:**
- [Architectural consequence]
- [Affects: cost / complexity / timeline / scale]

**Options:**
| Option | Pros | Cons | Best For |
|--------|------|------|----------|
| A | [+] | [-] | [Use case] |
| B | [+] | [-] | [Use case] |

**If Not Specified:** [Default + rationale]
```

Prefer multiple choice when possible. Open-ended is fine when needed.

### Phase 4: Propose Approaches

- Present 2-3 approaches with trade-offs
- Lead with your recommendation and explain why
- Be explicit about cost/complexity/timeline for each

### Phase 5: Present Design

Present design section-by-section. Ask approval after each section:
- Architecture and components
- Data flow and interfaces
- Error handling strategy
- Testing approach

Scale each section to its complexity — a few sentences if straightforward, more if nuanced. Go back and clarify when something doesn't make sense.

**Design for isolation:** Break system into smaller units that each have one clear purpose, communicate through well-defined interfaces, can be understood and tested independently.

**Working in existing codebases:** Follow existing patterns. Only propose improvements to code that's directly in the way of the current goal — no unrelated refactoring.

### Phase 6: Write Design Spec

Save to report path using naming pattern from `## Naming` section in injected context.

### Phase 7: Spec Self-Review

After writing, review with fresh eyes:

1. **Placeholder scan:** Any "TBD", "TODO", incomplete sections, vague requirements? Fix them.
2. **Internal consistency:** Do sections contradict each other? Does architecture match feature descriptions?
3. **Scope check:** Focused enough for a single implementation plan, or needs decomposition?
4. **Ambiguity check:** Could any requirement be interpreted two ways? Pick one, make it explicit.

Fix issues inline. No need to re-review — just fix and move on.

### Phase 8: User Review Gate

> "Spec written to `<path>`. Please review and let me know if you want changes before we write the implementation plan."

Wait for user response. If changes requested, make them and re-run self-review. Only proceed once approved.

### Phase 9: Transition to Implementation

Use `AskUserQuestion` to ask if user wants a plan:
- If **Yes**: Run `/plan` with the spec path as context argument.
  **CRITICAL:** The invoked plan command will create `plan.md` with YAML frontmatter including `status: pending`.
- If **No**: End the session.

## Report Output

Use naming pattern from `## Naming` section in injected context.

### Spec Content

- Problem statement and user stories
- Evaluated approaches with pros/cons
- Final design with architecture, components, data flow
- Interface contracts and boundaries
- Error handling and edge cases
- Testing strategy
- Implementation considerations and risks
- Success metrics and validation criteria
- Next steps and dependencies

**IMPORTANT:** Sacrifice grammar for concision.

## Anti-Patterns (AVOID)

| Anti-Pattern | Why |
|---|---|
| Jumping to solutions before understanding | Wastes time on wrong problem |
| Assuming requirements without asking | Creates wrong output |
| Over-engineering first version | Delays value delivery |
| Ignoring constraints | Creates unusable solutions |
| Asking multiple questions per message | Overwhelms user |
| Static template questions | Miss project-specific concerns |

## Critical Constraints

- You DO NOT implement solutions — you only brainstorm, design, and spec
- You must validate feasibility before endorsing any approach
- Prioritize long-term maintainability over short-term convenience
- Consider both technical excellence and business pragmatism
- The ONLY skill transition is to `/plan` — never invoke implementation skills
