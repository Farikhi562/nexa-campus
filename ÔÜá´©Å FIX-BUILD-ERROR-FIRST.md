# ⚠️ Fix this before pushing — build is still broken

The Vercel build has failed **twice** with the same error.
This must be committed before any other file.

## File to edit

```
src/app/api/study/packs/[id]/flashcards/route.ts
```

## Line 5 — change one word

```diff
- import type { StudyRoadmapStep } from '@/lib/study/types'
+ import type { RoadmapStep } from '@/lib/study/types'
```

Then rename every usage of `StudyRoadmapStep` → `RoadmapStep` in the same file.

## Why this keeps failing

The type `StudyRoadmapStep` does not exist in `@/lib/study/types`.
The correct name is `RoadmapStep` (the compiler says so in the error message).
This file has not been fixed in commits f6eba9b or 743d4a8.

## What to commit

```bash
git add src/app/api/study/packs/[id]/flashcards/route.ts
git commit -m "fix: rename StudyRoadmapStep → RoadmapStep in flashcards route"
git push
```

Vercel will re-deploy automatically. The build will pass and you can then
wire in the v25 components below.
