# Explanation: Link the contract into the BFF

## What was the task / issue?
Add `@handoff/contracts@workspace:*` to the BFF so it shares the same
`Vehicle` shape that refdata produces.

## What changed?
Ran:
```bash
pnpm --filter bff add @handoff/contracts@workspace:*
```
This added one line to `services/bff/package.json`:
```json
"dependencies": {
  "@handoff/contracts": "workspace:*",
  ...
}
```

## Why this approach?
- `--filter bff` scopes the install to the `bff` workspace so the
  dependency lands in `services/bff/package.json`, not the root.
- `workspace:*` tells pnpm the dependency is a local monorepo package
  (not a registry download — it isn't published). pnpm wires it up as a
  symlink, so the BFF always uses the in-repo version.

This gives the BFF the same single source of truth for the `Vehicle`
shape that refdata uses. If the contract changes, both services see it
and TypeScript catches mismatches at compile time.

## Anything to watch for?
- The contracts package must be built (`dist/` present) for the BFF's
  runtime import to resolve, since it's a compiled CommonJS package.
  `dist/` already exists; rebuild with
  `pnpm --filter @handoff/contracts build` if the source changes.
- No code imports the contract in the BFF yet — that happens in the next
  task ("BFF fetches from refdata").

## Verification
- `services/bff/package.json` shows `"@handoff/contracts": "workspace:*"`.
- `services/bff/node_modules/@handoff/contracts` symlinks to
  `../../../../packages/contracts` (local package, not a registry copy).
