# Legendary Quest for Vocabulary

An original top-down vocabulary adventure built with Vite, JavaScript, and Phaser. Explore ruined gardens and archives, dispel inkshades with a lantern, solve vocabulary trials, earn rune keys, and open the next gate.

## Level 1: Digital citizenship and online reputation

Level 1 uses all 45 terms and their supplied definitions from Module_03_Vocabulary.pdf, provided by the teacher for Principles of Information Technology / CompTIA Digital Literacy v3.0, Module 3. Applied situations and all game artwork are original. The source PDF is not bundled or uploaded to the repository.

The five chambers are:

| Chamber | Vocabulary focus | Terms |
| --- | --- | --- |
| The Footprint Garden | Footprints, identity, metadata, and tracking | 9 |
| The Hall of Mirrors | Media literacy, misleading content, and biases | 10 |
| The Citizens’ Court | Participation, ethics, accessibility, and online conduct | 7 |
| The Forge of Ideas | Copyright, intellectual property, licensing, and attribution | 12 |
| The Sanctum of Trust | Security principles, malware, VPNs, and software rights | 7 |

Each chamber has three numbered rune seals. Each seal presents 2–4 vocabulary questions. Questions alternate between matching a definition to a term, recognizing a concept in an applied situation, and choosing the meaning of a term. Restore all three seals to receive three rune keys, then interact with the eastern gate to continue. Complete all 45 questions and enter the final gate to win.

Correct answers earn 25 insight; the maximum is 1,125. Wrong answers cost one heart and show the supplied definition as a learning hint. The same word never awards points twice. Inkshades cost one heart if you step onto them; a lantern ward dispels nearby shades. Entering a new chamber restores one heart, up to five. There is no timer.

At zero hearts, Return to chamber restores five hearts and preserves learned words, completed seals, score, and chamber position. Restart adventure resets the entire level. Progress is kept for the current page session; reloading or closing the page resets it. No accounts, student records, analytics, or server storage are used.

## Controls

| Action | Keyboard | Touch / mouse |
| --- | --- | --- |
| Move | Arrow keys or WASD | Direction buttons under the game |
| Interact with adjacent seal, Keeper, or gate | E or Space | Interact button |
| Dispel inkshades within two grid cells | J or Z | Lantern ward button |
| Answer a vocabulary question | 1–4 | Answer buttons |
| Open word journal | M | Open word journal button |
| Close a trial, guide, or journal | Escape | Close button |
| Start / return after losing | Enter | Begin / Return button |
| Reset the whole adventure | R | Restart adventure button |

Stone walls, trees, water, and monuments block movement. Stand next to a monument to interact with it. The Keeper beside the starting position explains the rules. The journal stores the definitions of words answered correctly. Puzzle dialogs trap focus and support normal keyboard navigation. The canvas world is visual; this is not a fully nonvisual game.

## Request changes using plain English

You do not need to write or edit code. Open this repository in your coding assistant, provide a word list or vocabulary PDF, and describe what you want. For example:

> Make Level 2 use this vocabulary PDF. Keep the top-down adventure and rune trials, but set it in an icy observatory. Include every term, preserve the definitions, and use middle/high-school situations. Run the build and tests and open a pull request. Wait for my approval before merging or publishing.

> Make the clues harder and add more context questions. Keep gentle feedback after mistakes. Test the complete level and create a pull request.

> Replace the lantern ward with a shield, add a new chamber, or give students more hearts. Update the instructions and tests for me.

The assistant should extract and check your list, implement the game, run the checks, provide screenshots or a preview, and create a PR. Review it before approving a merge. Passing CI alone does not authorize the assistant to merge or publish.

## Source organization

- src/vocabulary.js: all 45 source terms and definitions, in the PDF’s order.
- src/lesson.js: chamber groupings, applied situations, and question construction.
- src/world.js: passable terrain, monuments, gates, and chamber palettes.
- src/art.js: original procedural pixel artwork and scenery.
- src/adventure.js: Phaser scene, movement, trials, hearts, gates, journal, and game states.
- src/adventure.css and index.html: responsive shell and accessible native controls/dialogs.
- tests/adventure.spec.js: browser tests using actual keyboard and button input. Read-only DOM state supports assertions; there are no test-only game mutation shortcuts.

All 45 terms are assigned to exactly one chamber. Game art is generated locally in Phaser without external downloads. No original Zelda characters, maps, music, names, or artwork are included.

## Build and checks

Node 24 is recommended. The assistant or developer runs:

    npm ci
    npm run dev
    npm run build
    npx playwright install --with-deps chromium firefox webkit
    npm test
    npm run package

The production build is dist. Tests run against Vite’s production preview server. Coverage includes vocabulary completeness, loading, movement and collisions, gates, guide dialogs, numbered answers, mistakes and loss, checkpoint recovery, journal, restart, touch controls, lantern wards, and a full 45-word playthrough through all five chambers.

GitHub Actions runs Build and browser tests for every PR, main update, merge queue, and manual run. It builds, runs the full suite in Chromium, Firefox, and WebKit, and generates a ZIP. In the run’s Artifacts section, download legendary-quest-package. It contains legendary-quest-for-vocabulary.zip with playable/ (built game) and source/ (reusable project). GitHub may wrap that ZIP in another ZIP. Game artifacts last 30 days; browser reports last 14 days.

## Cloudflare Pages and approval

The existing Cloudflare GitHub connection uses these settings:

| Setting | Value |
| --- | --- |
| Production branch | main |
| Root directory | repository root |
| Build command | npm run build |
| Build output directory | dist |
| Pages project | Use the existing Pages project connected to this repository |
| Node version | 24 |

Cloudflare Pages builds and publishes the static dist directory through its existing Git integration. There is no deploy command to run, no Worker entry point, and no Wrangler dependency or configuration. PR branches receive Pages preview URLs for review. GitHub Actions validates and packages; Pages handles preview and production hosting. An approved merge to main triggers the connected production build.

Ask for future changes in plain English: “Build the game, run its browser tests, and open a pull request with the Pages preview. Do not merge until I approve.” Keep the Pages build command npm run build and build output directory dist.

Keep production changes in pull requests for owner approval. Repository administrators can require the Build and browser tests check, up-to-date branches, and pull requests in main’s branch-protection settings. These repository settings are separate from workflow YAML and are not automatically enabled by adding this project. The assistant must wait for explicit approval before merging or deploying production.

Serve the ZIP’s playable/ directory over HTTP. Opening index.html directly from disk is unsupported because browser ES modules require HTTP. Physical mobile devices and screen-reader-only gameplay require additional validation.
