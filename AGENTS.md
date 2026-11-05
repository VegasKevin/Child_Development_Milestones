# Kevin's agent instructions

These are common instructions for Kevin's agents across all scenarios.

## General Guidelines

* Never use the em dash "—". Use plain dash "-" instead
* When writing commit messages, NEVER auto-add your agent name as co-author
* Never manually modify CHANGELOG.md files or any files that are marked as auto-generated
* When writing or substantially editing long Markdown files, put each full sentence on its own line.
Preserve normal Markdown structure, but avoid wrapping multiple sentences onto one physical line.
* When making technical decisions, do not give much weight to development cost.
Instead, prefer quality, simplicity, robustness, scalability, and long term maintainability.
* When doing bug fixes, always start with reproducing the bug in an E2E setting as closely aligned with how an end user would use the product as possible.
This makes sure you find the real problem so your fix will actually solve it.
* Keep changes within the current slice. Report unrelated issues separately with a file or screen reference and a short description of the impact. If an unrelated issue blocks verification, explain the blocker before expanding the scope.
* Apply that same high standard to engineering excellence: lint, test failures, and test flakiness.
If you see one, even if it is not caused by what you are working on right now, still get it fixed.
* Work one small slice at a time. Read only the requirements, decisions, and acceptance cases relevant to that slice.
* Build vertically. Deliver one observable behavior through its normal entry point. For a platform-neutral slice, exercise the closest runnable boundary and state what remains for full end-to-end coverage.
* Start with a failing end-to-end test. Confirm it fails for the expected reason, implement the smallest change that makes it pass, then rerun the affected checks.
* Get a fresh review after tests pass. Spawn a subagent with fresh context. Give it the slice’s requirement IDs, relevant excerpts, diff, and test commands. Ask it to verify the behavior independently. Resolve material findings and rerun the checks before calling the slice done.
* For slices that create or change a user-facing screen, use the `frontend-design` skill and consult the relevant original design reference linked in `mobile-ui.md`.

