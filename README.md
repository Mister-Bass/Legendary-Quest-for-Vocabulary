# Legendary Quest for Vocabulary

An original top-down vocabulary adventure built with Vite, JavaScript, and Phaser. Explore scrolling gardens and archives, fight inkshades with a sword and shield, solve vocabulary trials, earn rune keys, and open the next gate.

## Level 1: Digital citizenship and online reputation

Level 1 uses all 45 terms and their supplied definitions from Module_03_Vocabulary.pdf, provided by the teacher for Principles of Information Technology / CompTIA Digital Literacy v3.0, Module 3. Applied situations and game maps are original. The source PDF is not bundled or uploaded to the repository.

The five chambers are:

| Chamber | Vocabulary focus | Terms |
| --- | --- | --- |
| The Footprint Garden | Footprints, identity, metadata, and tracking | 9 |
| The Hall of Mirrors | Media literacy, misleading content, and biases | 10 |
| The Citizens’ Court | Participation, ethics, accessibility, and online conduct | 7 |
| The Forge of Ideas | Copyright, intellectual property, licensing, and attribution | 12 |
| The Sanctum of Trust | Security principles, malware, VPNs, and software rights | 7 |

Each chamber has three numbered rune seals. Each seal presents 2–4 vocabulary questions. Questions alternate between matching a definition to a term, recognizing a concept in an applied situation, and choosing the meaning of a term. Restore all three seals to receive three rune keys, then interact with the eastern gate to continue. Complete all 45 questions and enter the final gate to win.

Correct answers earn 25 insight; the maximum is 1,125. Wrong answers cost one heart and show the supplied definition as a learning hint. The same word never awards points twice. Ghosts patrol and chase around obstacles. At range they signal a violet cast for 0.8 seconds, then fire a magic bolt toward your previous position; at close range they signal orange before striking. Bolts travel visibly, collide with terrain, and can be dodged or blocked by facing them with your shield. An unblocked hit costs one heart, followed by 1.2 seconds of protection from further enemy damage. Sword strikes disperse nearby enemies in front of you. Combat never awards vocabulary points. Entering a new chamber restores one heart, up to five. There is no timer.

Each chamber is now 40 by 28 tiles (1,600 by 1,120 world pixels), four times the original area. An 800 by 560 viewport uses a 1.5× zoom and smoothly follows the traveler within the map bounds. Arrows below the world point toward the three crystals and gate. Hold movement keys or touch direction buttons for continuous movement; acceleration and deceleration soften starts/stops, diagonal speed is normalized, and solid terrain blocks both travelers and enemies.

The sword is hidden while idle. Left-click inside the game world or press Space to draw and swing it; holding either repeats swings with a short recovery. Right-click inside the world toggles the shield. Aim the mouse toward an incoming threat; the shield protects your front and slows movement. Left-click or Space lowers a toggled shield to swing. K/Shift remain hold-to-block keyboard alternatives, and touch screens have Sword and Shield buttons. Enemies, projectiles, movement, and attack timers pause during questions, the Keeper conversation, journal, and win/loss screens. Losing focus releases controls and lowers the shield; returning from a dialog requires fresh movement input. Game mouse controls do not apply to menus, answer buttons, or the rest of the page.

The bottom-right exploration minimap starts under fog of war and reveals terrain around places the traveler visits. Unvisited terrain and undiscovered objects remain hidden. Explored terrain stays visible while you backtrack; nearby ghosts appear only within the current revealed vicinity. Exploration is kept separately for each chamber and survives checkpoint retries during the page session. Restarting the adventure or reloading clears exploration.

At zero hearts, Return to chamber restores five hearts and returns to the current chamber's entrance, preserving learned words, completed seals, score, and chamber. Enemies return to their starting positions. Restart adventure resets the entire level. Progress is kept for the current page session; reloading or closing the page resets it. No accounts, student records, analytics, or server storage are used.

## Controls

| Action | Keyboard | Touch / mouse |
| --- | --- | --- |
| Move continuously | Hold arrow keys or WASD | Hold direction buttons under the game |
| Open a crystal's vocabulary trial | Walk into the crystal with arrows or WASD | Move toward the crystal with direction buttons |
| Interact with crystal, Keeper, or gate | Walk into it; E remains a nearby alternative | Move into it; Interact button also works |
| Draw/swing sword / repeat while held | Space or left mouse button inside the world | Sword button (hold to repeat) |
| Raise shield toward incoming attacks | Right-click toggles; hold K/Shift as an alternative | Shield button toggles on/off |
| Answer a vocabulary question | 1–4 | Answer buttons |
| Open word journal | M | Open word journal button |
| Close a trial, guide, or journal | Escape | Close button |
| Start / return after losing | Enter | Begin / Return button |
| Reset the whole adventure | R | Restart adventure button |

Walk into crystals, the Keeper, and gates to interact automatically. An unlocked gate advances to the next chamber on contact; a locked gate explains which keys are missing. The traveler stays beside a crystal or the Keeper while a dialog is open. Closing a trial preserves answered words. Step away and touch the object again to resume, or use E/Interact beside it; dialogs do not repeatedly reopen while you remain in contact. Completed crystals display keys and cannot award duplicate points. Space is now reserved for the sword. Stone walls, trees, water, and monuments block movement. The journal stores learned definitions. Puzzle dialogs trap focus and support normal keyboard navigation. The canvas world is visual; this is not a fully nonvisual game.

## Request changes using plain English

You do not need to write or edit code. Open this repository in your coding assistant, provide a word list or vocabulary PDF, and describe what you want. For example:

> Make Level 2 use this vocabulary PDF. Keep the top-down adventure and rune trials, but set it in an icy observatory. Include every term, preserve the definitions, and use middle/high-school situations. Run the build and tests and open a pull request. Wait for my approval before merging or publishing.

> Make the clues harder and add more context questions. Keep gentle feedback after mistakes. Test the complete level and create a pull request.

> Add a new chamber or give students more hearts. Keep sword and shield combat. Update the instructions and tests for me.

The assistant should extract and check your list, implement the game, run the checks, provide screenshots or a preview, and create a PR. Review it before approving a merge. Passing CI alone does not authorize the assistant to merge or publish.

## Source organization

- src/vocabulary.js: all 45 source terms and definitions, in the PDF’s order.
- src/lesson.js: chamber groupings, applied situations, and question construction.
- src/world.js: passable terrain, monuments, gates, and chamber palettes.
- src/art.js: local sprite loading, animations, scenery, and original Keeper artwork.
- public/assets/topdown/: selected TOP-DOWN Adventure Pack PNGs and attribution notice.
- src/adventure.js: Phaser scene, movement, trials, hearts, gates, journal, and game states.
- src/action-world.js: continuous movement, collision, enemy patrol/chase/attacks, sword/shield combat, follow camera, and direction hints.
- src/minimap.js: per-chamber exploration, fog of war, and the bottom-right canvas minimap.
- src/adventure.css and index.html: responsive shell and accessible native controls/dialogs.
- tests/adventure.spec.js: browser tests using actual keyboard and button input. Read-only DOM state supports assertions; there are no test-only game mutation shortcuts.

All 45 terms are assigned to exactly one chamber. Artwork loads from this site's own assets; gameplay does not depend on Drive or third-party image hosts. No original Zelda characters, maps, music, names, or artwork are included.

## Artwork credits

TOP-DOWN Adventure Pack v1.0 by [o_lobster](https://o-lobster.itch.io/adventure-pack), licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) as listed on the creator's asset page. Selected unmodified PNGs were supplied by the owner through Google Drive and renamed for loading. The game selects frames, scales pixels, tints terrain, and arranges them into original chamber maps. No endorsement is implied. The Keeper, rune bases, gate bars, sword/shield effects, and interface remain original project artwork.

Animated four-direction idle/run characters, phantoms, water, crystals, and earned keys come from this pack. Crystals mark the numbered rune trials; completed trials display gold keys. Attribution and the original pack credit are retained in public/assets/topdown/CREDITS.txt, on the game page, and in both playable and source ZIP folders. Keep this notice with reused assets. Other packs in the supplied Drive folder are not included.

## Build and checks

Node 24 is recommended. The assistant or developer runs:

    npm ci
    npm run dev
    npm run build
    npx playwright install --with-deps chromium firefox webkit
    npm test
    npm run package

The production build is dist. Tests run against Vite’s production preview server. Coverage includes vocabulary completeness, asset loading, movement/collision, scrolling camera, contact interactions and gates, modal/projectile pause, mistakes/loss, checkpoint recovery, journal, restart, mobile controls, mouse/Space sword controls, right-click shielding, ghost projectiles and blocking, fog exploration/reset, and a full 45-word contact playthrough across five chambers.

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
