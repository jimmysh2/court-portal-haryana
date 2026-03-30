---
description: Sync UI changes (Tables, PS) to repository before any push
---

Before any `git commit` or `git push`, follow these steps:

1. Check to see if any files were updated (e.g. `Disrtrict_PS.csv`, `prisma/seed-production.js`, `prisma/table-definitions.js`)
   `git status`

2. If files were changed, add them to the staging area
   `git add .`

3. Proceed with commit and push
   `git commit -m "Your commit message"`
   `git push`
