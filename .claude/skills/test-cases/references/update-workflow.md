# Update Workflow — /test-cases update

Sync test cases with use case changes.

## Steps

### 1. Compare UC and TC State

Analyze alignment between `docs/usecases/` and `docs/testcases/`:

- **New UCs**: UC files without corresponding TC files
- **Orphaned TCs**: TC files referencing deleted/moved UC files
- **Modified UCs**: UC files with newer `Last Updated` date than corresponding TC

### 2. Spawn QA Engineer Agent

Spawn `testcase-writer` agent via Task tool with:

```
Sync test cases with use case changes.

New UCs (need TCs generated): {list}
Orphaned TCs (UC deleted): {list}
Modified UCs (may need TC update): {list}

Instructions:
1. For new UCs:
   - Generate TC files following generate workflow pattern
   - Use template from .claude/skills/test-cases/references/templates/test-case-template.md

2. For orphaned TCs:
   - Do NOT auto-delete
   - Add warning header to TC file: "<!-- WARNING: Source UC not found. Review for removal. -->"
   - List in output summary

3. For modified UCs:
   - Read both the UC and existing TC
   - Update TC if UC main flow or alternative flows changed
   - Add new scenarios if new flows added
   - Preserve existing TC IDs — append new scenarios with next available number

4. Regenerate docs/testcases/test-summary.md

Work context: {project-root}
```

### 3. Output Summary

Report:
- New TCs generated (count, modules)
- Orphaned TCs flagged (count, files)
- Updated TCs (count, what changed)
- Updated coverage stats
