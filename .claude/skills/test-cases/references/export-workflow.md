# Export Workflow — /test-cases export csv|json

Export test cases to CSV or JSON format.

## Arguments

Format from `$ARGUMENTS` after `export`: `csv` or `json`.
Default to `csv` if unclear.

## Steps

### 1. Parse Format

Determine export format from arguments.

### 2. Spawn QA Engineer Agent

Spawn `testcase-writer` agent via Task tool with:

```
Export all test cases to {format} format.

Instructions:
1. Read all test case files: docs/testcases/{module}/*.md
2. Parse each TC section by header pattern: ## TC-{MOD}-{NNN}-{NN}: {Title}
3. Extract structured fields:
   - ID, Module, Related UC, Title, Type, Priority, Precondition, Steps, Expected Result

4. Create output directory: docs/testcases/export/ (if not exists)

5. For CSV format:
   - Output: docs/testcases/export/testcases-{YYYY-MM-DD}.csv
   - Header row: ID,Module,Related UC,Title,Type,Priority,Precondition,Steps,Expected Result
   - Escape commas and newlines in field values
   - Steps joined with " | " separator

6. For JSON format:
   - Output: docs/testcases/export/testcases-{YYYY-MM-DD}.json
   - Array of objects: [{id, module, relatedUC, title, type, priority, precondition, steps[], expectedResult}]
   - Pretty-printed with 2-space indent

Work context: {project-root}
```

### 3. Output Summary

Report:
- Format exported
- Total test cases exported
- Output file path
- Any parsing warnings (malformed TC sections skipped)
