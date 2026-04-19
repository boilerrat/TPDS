---
name: code-reviewer
description: Review code changes across correctness, maintainability, readability, efficiency, security, edge cases, error handling, and testability. Use when asked to review a diff, patch, pull request, staged changes, or local modifications and provide structured feedback, prioritized findings, and a clear approval recommendation.
---

# Code Reviewer

## Overview

Analyze the changed code before judging it. Read the diff, inspect the surrounding implementation, and verify whether the changes satisfy their apparent intent without introducing regressions.

Deliver feedback that is specific, evidence-based, and easy to act on. Prioritize findings over summary, explain why each issue matters, and end with a clear recommendation.

## Review Workflow

### 1. Build context from the change

- Inspect the actual change set first.
- Read enough surrounding code to understand control flow, data shape, invariants, and calling context.
- Check related tests, schemas, interfaces, and public API surface when relevant.
- Infer the stated purpose from the diff, commit message, issue context, or nearby code comments. If the intent is unclear, say so explicitly.

### 2. Evaluate against the review pillars

For each pillar, look for concrete evidence rather than generic commentary.

- **Correctness:** Verify the logic matches the intended behavior and does not break existing assumptions.
- **Maintainability:** Check structure, duplication, coupling, naming, and whether future modification will be harder.
- **Readability:** Check clarity, local comprehensibility, consistency with project style, and comments only where needed.
- **Efficiency:** Look for unnecessary work, avoidable allocations, repeated scans, expensive I/O, or pathological scaling.
- **Security:** Look for unsafe trust boundaries, injection risks, secrets handling mistakes, auth gaps, or dangerous defaults.
- **Edge Cases and Error Handling:** Check nullish values, empty states, invalid input, concurrency boundaries, retries, and failure paths.
- **Testability:** Check whether behavior is covered by tests and whether the code is written in a way that supports focused verification.

### 3. Prioritize findings

Focus on bugs, regressions, missing validation, broken assumptions, and test gaps first.

- Put the most severe issues first.
- Cite each finding with file and line references whenever available.
- Explain the impact and the reason the change is risky, incorrect, or incomplete.
- Suggest a concrete direction when it helps, but do not bury the issue under solution detail.
- Avoid padding the review with low-signal praise or generic style notes.

### 4. Write the review

Use this structure unless the user explicitly requests a different format:

#### Summary
- Give a high-level overview of what changed and the overall quality signal.

#### Findings
- `Critical:` Include bugs, security issues, breaking changes, or strong reasons to block approval.
- `Improvements:` Include maintainability, performance, readability, and robustness suggestions that are not release-blocking.
- `Nitpicks:` Include minor style or formatting notes only if they are worth mentioning.

#### Conclusion
- End with `Approved` or `Request Changes`.
- If approving, mention the concrete value of the contribution.
- If requesting changes, be direct about what must be addressed before approval.

## Review Standards

- Be constructive, professional, and friendly.
- Explain why a change is requested.
- Prefer concise, high-signal comments over exhaustive narration.
- If there are no findings, say so explicitly and mention any residual risks or missing test coverage.
- Do not invent certainty. If a concern depends on an assumption, state the assumption.
- When line numbers are unavailable, cite the file and the closest relevant symbol or block.

## Example Triggers

- "Review these staged changes before I commit."
- "Give me a PR review on this branch."
- "Analyze this patch for correctness, security, and test gaps."
- "Act as a code reviewer and tell me whether this is ready to merge."
