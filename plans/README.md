# Animation and dark-mode improvement plans

All plans were written against commit `022634b` using the
`improve-animations` audit rules. They are implementation specifications only;
application source has not been changed by the planning pass.

## Plan index

| Plan | Title | Severity | Status | Dependencies |
| --- | --- | --- | --- | --- |
| 001 | Normalize motion tokens and high-frequency feedback | HIGH | TODO | — |
| 002 | Remove routine dashboard route entrances | HIGH | TODO | — |
| 003 | Fix dialog presence timing and compositor motion | MEDIUM | TODO | 001 |
| 004 | Repair reduced-motion feedback | HIGH | TODO | 001, 003 |
| 005 | Unify modal motion across workflows | MEDIUM | TODO | 003, 004 |
| 006 | Rebuild the dark palette and material hierarchy | MEDIUM | TODO | — |
| 007 | Add semantic elevation and scrim tokens | HIGH | TODO | 006 |
| 008 | Fix confirmation action contrast | HIGH | TODO | 006 |
| 009 | Replace light-only semantic surfaces | HIGH | TODO | 006 |

## Recommended execution order

Two tracks can be executed independently:

1. **Motion foundation**: 001 → 002 → 003 → 004 → 005.
2. **Dark-mode foundation**: 006 → 007 → 008 → 009.

If executing sequentially, use this order:

1. 001 — establish shared motion values and correct frequent interactions.
2. 002 — remove the routine route animation before tuning occasional motion.
3. 003 — make the shared dialog correct and compositor-only.
4. 004 — layer targeted reduced-motion behavior on the corrected primitives.
5. 005 — migrate remaining dialogs after the shared primitive is stable.
6. 006 — establish the graphite palette and material hierarchy.
7. 007 — correct elevation and scrims using the new hierarchy.
8. 008 — correct action contrast against the final dark primary.
9. 009 — migrate semantic warning and success surfaces onto theme-aware tokens.

## Execution rules

- Run one plan at a time with `improve-animations execute <plan path>` or hand the
  plan to an implementation agent.
- Before editing, compare the cited code with commit `022634b`. Stop on drift
  instead of improvising.
- After each plan, run its complete mechanical and feel-check verification.
- Mark a plan `DONE` only after its verification passes.
- Do not combine motion and dark-mode plans in one unreviewed patch, even though
  the two tracks may be implemented in parallel worktrees.
