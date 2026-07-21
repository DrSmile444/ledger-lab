---
name: validate-openspec-config
description: Validate openspec/config.yaml for correctness. Reports what's wrong, why the CLI silently ignores it, and applies fixes after confirmation.
---

Validate `openspec/config.yaml` for correctness.

**What this skill checks:**

- Rule strings that contain `: ` and are unquoted — YAML parses them as objects, so the CLI silently drops those rules with a warning
- Rule values that are not strings for any other reason
- Empty strings inside rule arrays (silently ignored by the CLI)
- Artifact keys in `rules` that the CLI does not recognise for the configured schema
- `context` field that exceeds the 50 KB size limit

---

## Steps

### 1. Find the config file

Check if `openspec/config.yaml` exists. If not, try `openspec/config.yml`. If neither exists, report:

> No `openspec/config.yaml` found. Nothing to validate.

Stop here if missing.

### 2. Read the raw config

Read the raw file text. Note the exact content — you will need it later for fix application.

### 3. Run the diagnostic

Run the following bash command to parse the YAML and detect issues.
Replace `<PROJECT_ROOT>` with the actual project root path (current working directory).

```bash
OPENSPEC_DIR="$(npm root -g)/@fission-ai/openspec"

node --input-type=module -e "
import { readFileSync } from 'fs';
import { parse } from '${OPENSPEC_DIR}/node_modules/yaml/dist/index.js';

const raw = parse(readFileSync('openspec/config.yaml', 'utf-8'));
const issues = [];

// 1. context size
if (raw?.context && typeof raw.context === 'string' && raw.context.length > 50 * 1024) {
  issues.push({ type: 'context_too_large', size: raw.context.length, limit: 50 * 1024 });
}

// 2. rules field
if (raw?.rules !== undefined) {
  if (typeof raw.rules !== 'object' || Array.isArray(raw.rules)) {
    issues.push({ type: 'rules_not_object' });
  } else {
    for (const [artifactId, value] of Object.entries(raw.rules)) {
      if (!Array.isArray(value)) {
        issues.push({ type: 'rules_not_array', artifactId, actualType: typeof value });
        continue;
      }
      value.forEach((item, i) => {
        if (typeof item !== 'string') {
          // Reconstruct the original unquoted string from the parsed object
          const keys = Object.keys(item);
          const original = keys.length === 1
            ? keys[0] + ': ' + item[keys[0]]
            : JSON.stringify(item);
          issues.push({ type: 'yaml_ambiguity', artifactId, index: i, original });
        } else if (item.trim() === '') {
          issues.push({ type: 'empty_rule', artifactId, index: i });
        }
      });
    }
  }
}

console.log(JSON.stringify(issues, null, 2));
" 2>&1
```

Parse the JSON output. If the command errors out (e.g. yaml package not found), fall back to the regex-based check below.

**Regex fallback** — if the node script fails, grep the raw file for unquoted rule lines containing `: `:

```bash
grep -n "^    - " openspec/config.yaml | grep -v "^[^:]*: *['\"]" | grep ": "
```

Any line this returns is a potential YAML ambiguity candidate.

### 4. Validate artifact IDs

Run the openspec CLI to cross-check rule keys against valid artifact IDs for the configured schema:

```bash
openspec instructions tasks --json 2>&1 | grep "Unknown artifact"
```

Collect any "Unknown artifact ID" warnings as additional issues.

### 5. Report findings

If no issues were found, report:

> ✓ `openspec/config.yaml` is valid. No issues found.

Stop here.

If issues were found, present them in this format for each one:

---

**Issue: \<short title\>**

- **What:** \<what is wrong\>
- **Why it matters:** \<why the CLI silently ignores it and what the symptom is\>
- **Fix:** \<exact change to make, showing before → after\>

---

Use these descriptions per issue type:

| Type                | Title                                  | Why it matters                                                                                                                                                                                    | Fix                                                |
| ------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `yaml_ambiguity`    | Unquoted rule string contains `: `     | YAML parses the string as a mapping object. `z.array(z.string())` then fails, so the CLI logs `"Rules for '<id>' must be an array of strings"` and drops **all** rules for that artifact silently | Quote the string with `"…"`                        |
| `empty_rule`        | Empty string in rules array            | The CLI filters it out silently, reducing the effective rule count                                                                                                                                | Remove the empty entry                             |
| `rules_not_object`  | `rules` field is not a plain object    | The CLI ignores the entire `rules` field                                                                                                                                                          | Restructure as `rules:\n  <artifact>:\n    - rule` |
| `rules_not_array`   | Rules for `<artifact>` is not an array | Same as above — entire artifact's rules are dropped                                                                                                                                               | Change value to a YAML sequence (`- rule`)         |
| `context_too_large` | `context` exceeds 50 KB                | The CLI truncates or ignores it                                                                                                                                                                   | Shorten the context                                |
| `unknown_artifact`  | Unknown artifact ID `<id>` in rules    | Rules for unrecognised artifacts are ignored                                                                                                                                                      | Rename to a valid ID                               |

### 6. Ask for confirmation

Use the **AskUserQuestion tool** with:

> "Issues found in `openspec/config.yaml`. Apply all fixes automatically?"

Options:

- **Fix all automatically** (recommended if all issues have clear mechanical fixes)
- **Show me each fix individually** (for review before applying)
- **Skip** (report only, no changes)

### 7. Apply fixes

**For `yaml_ambiguity`:** In the raw file, find the exact line containing `- <original>` and replace it with `- "<original>"`. If the original string contains double quotes, escape them as `\"` or use single-quote wrapping `'…'` instead.

**For `empty_rule`:** Remove the line `   -` (the empty list item).

**For other structural issues:** Apply the structural fix described in step 5.

Apply each fix using the Edit tool. Do not batch multiple fixes in a single Edit call — apply one at a time so each is auditable.

### 8. Re-validate

After applying all fixes, re-run the diagnostic from step 3 to confirm zero issues remain. Report the result:

> ✓ All issues resolved. `openspec/config.yaml` is valid.

---

## Guardrails

- Never modify the config without user confirmation.
- If the string being quoted already contains both `"` and `'`, flag it as needing manual review rather than applying an automatic fix.
- If the YAML file has a parse error (malformed YAML entirely), report the raw parse error message and stop — do not attempt fixes on a malformed file.
- If the node diagnostic command fails to find the yaml package, always fall back to the regex approach rather than giving up.
