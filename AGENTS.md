# Game studio instructions

- The owner requests games in plain English. Implement, test, and document them without asking the owner to edit code.
- Keep production changes on feature branches and pull requests. Never push directly to main, merge a PR, or deploy production without the owner's approval.
- Keep reusable UI, controls, responsive sizing, and test coverage when replacing a sample game.
- Keep vocabulary in src/vocabulary.js and level/trial content in src/lesson.js. Use local assets with documented rights.
- Run npm run build, npm test, and npm run package before handing off changes. Report untested behavior.
- CI required check: Build and browser tests. Do not disable tests to bypass a failing check.
- Deploy through the existing Cloudflare Pages Git integration: build npm run build; output dist; Node 24; production branch main. PR branches receive Pages previews for review. Do not add a Workers deploy command or Wrangler configuration for this static game.
