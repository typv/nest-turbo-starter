# Update Workflow — /specs update

Sync FSD and use cases with current codebase state.

## Steps

### 1. Detect Project Type

```bash
sh .claude/skills/common/detect-project-type.sh
```

### 2. Read Current Documents

- Read `docs/project-fsd.md`
- List all use case files in `docs/usecases/`
- If neither exists, warn: "No BA documents found. Run `/specs init` first."

### 3. Analyze Codebase Changes

Compare current code against documented state:
- Check for new routes/endpoints not in FSD
- Check for new models/entities not in data models
- Check for new feature modules without use cases
- Use `git diff` or file analysis to identify changes

### 4. Spawn Business Analyst Agent

Spawn `business-analyst` agent via Task tool with:

```
Sync FSD and use cases with current codebase.

Project type: {detected-type}
Current FSD: {fsd-content}
Existing use cases: {list-with-modules}
Codebase changes detected: {changes-summary}

Instructions:
1. Update docs/project-fsd.md:
   - Add sections for new modules/features found in code
   - Update data models if new entities detected
   - Update API contracts if new endpoints found
   - Remove or flag sections for deleted features

2. Use case maintenance:
   - Create use cases for new features without coverage
   - Flag orphaned use cases (UC references features no longer in code)
   - Do NOT auto-delete — flag for user review

3. Ensure cross-references remain consistent

Work context: {project-root}
```

### 5. Output Summary

Report:
- Changes detected in codebase
- FSD sections added/updated/flagged
- Use cases added/flagged as orphaned
- Recommendation for any manual review needed

## Important
- Never auto-delete use cases — flag as potentially orphaned instead
- Preserve user-edited content in existing documents
