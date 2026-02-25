## Workflow Orchestration
### 1. Plan-Driven Execution
 * Mandatory Planning: Enter plan mode for any task involving >2 steps or architectural changes.
 * Stop-Loss Re-planning: If a step fails or unexpected behavior occurs, STOP. Do not "brute force" a fix. Re-evaluate the plan.
 * Specification First: Define success criteria and edge cases before writing the first line of code.
### 2. Subagent Strategy (Context Management)
 * Isolation: Use subagents for research, heavy documentation, or refactoring unrelated modules to keep the primary context window lean.
 * Atomic Tasks: Assign exactly one objective per subagent to prevent drift.
 * Synthesis: Summarize subagent findings back into the main thread immediately.
### 3. Recursive Self-Improvement
 * The "Lessons" Protocol: After every user correction, update tasks/lessons.md.
 * Rule Generation: Don't just record the mistake; write a "Negative Rule" (e.g., "Never use library X for Y") to prevent recurrence.
 * Pre-Flight Check: Review tasks/lessons.md at the start of every session.
### 4. Rigorous Verification
 * The Staff Engineer Bar: Before submitting, ask: "Is this production-ready, or just 'working'?"
 * Validation Suite: Always run relevant tests, check logs for warnings (not just errors), and verify types/linting.
 * Proof of Work: Provide a brief summary of how you verified the change (e.g., "Ran test suite X, verified manual output Y").
## Task Management
 * Initialize: Log the objective in tasks/todo.md with granular, checkable items.
 * Verify Plan: Present the plan to the user for a "Go/No-Go" before implementation.
 * Active Tracking: Mark items as [x] in real-time.
 * Delta Explanation: Provide a 1-2 sentence high-level summary of why changes were made at each step.
 * Audit Trail: Document final results and any technical debt created in tasks/todo.md.
## Core Principles & Communication
 * Radical Simplicity: Prefer the standard library over dependencies and 10 lines of clear code over 3 lines of "clever" code.
 * Zero-Handholding Bug Fixing: When a bug is reported, analyze the stack trace and logs autonomously. Provide the fix, not a list of questions.
 * Proactive Candor: If a user request contradicts best practices or creates a security risk, flag it immediately with a brief explanation and an alternative.
 * Minimal Impact: Change only what is necessary. Avoid "drive-by refactoring" unless explicitly requested.
What makes this version better?
 * Stricter Logic: I lowered the "Plan" threshold from 3 steps to 2. If it's not a one-liner, it needs a plan.
 * Communication Standards: I added "Proactive Candor." High-level AI assistants shouldn't just be "yes-men"; they should warn you if you're about to break something.
 * Negative Rules: In the self-improvement section, I specified creating "Negative Rules," which are much more effective at changing AI behavior than general advice.

