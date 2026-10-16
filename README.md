# Legendary Quest for Vocabulary

An original top-down vocabulary adventure built with Vite, JavaScript, and Phaser. Explore scrolling gardens and archives, fight slimes with a sword, solve vocabulary trials, earn rune keys, and open the next gate.

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

Correct answers earn 25 insight; the maximum is 1,125. Wrong answers cost one heart and show the supplied definition as a learning hint. The same word never awards points twice. Slimes patrol and chase around obstacles. At range they signal a violet cast for 0.8 seconds, then fire a magic bolt toward your previous position; at close range they signal orange before striking. Bolts travel visibly, collide with terrain, and can be dodged. A hit costs one heart, followed by 1.2 seconds of protection from further enemy damage. Slimes have three health pips and require three separate sword swings to defeat. Each swing can hit a given slime only once, even across many animation frames. Hits briefly stagger the slime. At one health, a red ring shows its 56-world-pixel death-burst radius. The third hit plays its death animation and a visible burst; a player at or inside the ring loses exactly one heart once, even during ordinary damage protection. Outside the ring, the death burst does no damage. Sword reach is 72 pixels, so the final hit can be landed safely from its outer range. Restart/checkpoint retry restores each slime to three health. Combat never awards vocabulary points. Entering a new chamber restores one heart, up to five. There is no timer.

Each chamber is now 40 by 28 tiles (1,600 by 1,120 world pixels), four times the original area. An 800 by 560 viewport uses a 1.5× zoom and smoothly follows the traveler within the map bounds. Arrows below the world point toward the three chests and gate. Hold movement keys or touch direction buttons for continuous movement; acceleration and deceleration soften starts/stops, diagonal speed is normalized, and solid terrain blocks both travelers and enemies.

The player uses the supplied Mystic Woods idle, run, and sword-swing animations. The sword is hidden while idle. Left-click inside the game world or press Space to swing; holding either repeats attacks with a short recovery. Touch screens have a Sword button. The shield graphic and all shield controls have been removed. Dodge slime bolts by moving aside. Combat and movement pause during chest opening, questions, the Keeper conversation, journal, and win/loss screens. Losing focus releases controls; returning from a dialog requires fresh movement input. Game mouse controls do not apply to menus or answer buttons.

Walking into a closed treasure chest plays its four opening frames. The actual first vocabulary question rises out of the chest, then the answer dialog opens. Closing a trial preserves answered words; reopening animates the next unanswered question. Completed chests stay open and gold-tinted, including after checkpoint retry, and cannot award duplicate points. Restart closes every chest and cancels any active question reveal.

Closing a reading dialog grants 1.2 seconds of damage protection, allowing time to resume controls before a nearby paused projectile can hurt the player.

The bottom-right exploration minimap starts under fog of war and reveals terrain around places the traveler visits. Unvisited terrain and undiscovered objects remain hidden. Explored terrain stays visible while you backtrack; nearby slimes appear only within the current revealed vicinity. Exploration is kept separately for each chamber and survives checkpoint retries during the page session. Restarting the adventure or reloading clears exploration.

At zero hearts, Return to chamber restores five hearts and returns to the current chamber's entrance, preserving learned words, completed seals, score, and chamber. Enemies return to their starting positions. Restart adventure resets the entire level. Progress is kept for the current page session; reloading or closing the page resets it. No accounts, student records, analytics, or server storage are used.

## Controls

| Action | Keyboard | Touch / mouse |
| --- | --- | --- |
| Move continuously | Hold arrow keys or WASD | Hold direction buttons under the game |
| Open a chest's vocabulary trial | Walk into the chest with arrows or WASD | Move toward the chest with direction buttons |
| Interact with chest, Keeper, or gate | Walk into it; E remains a nearby alternative | Move into it; Interact button also works |
| Draw/swing sword / repeat while held | Space or left mouse button inside the world | Sword button (hold to repeat) |
| Answer a vocabulary question | 1–4 | Answer buttons |
| Open word journal | M | Open word journal button |
| Close a trial, guide, or journal | Escape | Close button |
| Start / return after losing | Enter | Begin / Return button |
| Reset the whole adventure | R | Restart adventure button |

Walk into chests, the Keeper, and gates to interact automatically. An unlocked gate advances to the next chamber on contact; a locked gate explains which keys are missing. The traveler stays beside a chest or the Keeper while a dialog is open. Closing a trial preserves answered words. Step away and touch the object again to resume, or use E/Interact beside it; dialogs do not repeatedly reopen while you remain in contact. Completed chests remain open and cannot award duplicate points. Space is now reserved for the sword. Fences, water, and monuments block movement. The journal stores learned definitions. Puzzle dialogs trap focus and support normal keyboard navigation. The canvas world is visual; this is not a fully nonvisual game.

## Request changes using plain English

You do not need to write or edit code. Open this repository in your coding assistant, provide a word list or vocabulary PDF, and describe what you want. For example:

> Make Level 2 use this vocabulary PDF. Keep the top-down adventure and rune trials, but set it in an icy observatory. Include every term, preserve the definitions, and use middle/high-school situations. Run the build and tests and open a pull request. Wait for my approval before merging or publishing.

> Make the clues harder and add more context questions. Keep gentle feedback after mistakes. Test the complete level and create a pull request.

> Add a new chamber or give students more hearts. Keep sword combat. Update the instructions and tests for me.

The assistant should extract and check your list, implement the game, run the checks, provide screenshots or a preview, and create a PR. Review it before approving a merge. Passing CI alone does not authorize the assistant to merge or publish.

## Source organization

- src/vocabulary.js: all 45 source terms and definitions, in the PDF’s order.
- src/lesson.js: chamber groupings, applied situations, and question construction.
- src/world.js: passable terrain, monuments, gates, and chamber palettes.
- src/art.js: local sprite loading, animations, scenery, and original Keeper artwork.
- public/assets/mystic/: owner-supplied sprites, terrain, attribution, and original license.
- src/adventure.js: Phaser scene, movement, trials, hearts, gates, journal, and game states.
- src/action-world.js: continuous movement, collision, enemy patrol/chase/attacks, sword combat, follow camera, and direction hints.
- src/minimap.js: per-chamber exploration, fog of war, and the bottom-right canvas minimap.
- src/adventure.css and index.html: responsive shell and accessible native controls/dialogs.
- tests/adventure.spec.js: browser tests using actual keyboard and button input. Read-only DOM state supports assertions; there are no test-only game mutation shortcuts.

All 45 terms are assigned to exactly one chamber. Artwork loads from this site's own assets; gameplay does not depend on Drive or third-party image hosts. No original Zelda characters, maps, music, names, or artwork are included.

## Artwork credits

Mystic Woods Free 2.1 by [Game Endeavor](https://game-endeavor.itch.io/mystic-woods), supplied by the owner. Uses player.png (48×48 frames), slime.png (32×32), chest_01.png (16×16), and grass/plains/fence terrain from the supplied tilesets folder. All 45 vocabulary terms belong to Level 1 across its five chambers, which now share this artwork. Pixel frames are selected, flipped, and scaled in original maps. The player's own sword-swing frames replace the old generated sword. The gate and interface are original project artwork. The Keeper, water, and trees use the additional owner-supplied packs credited below.

This free pack permits non-commercial use and restricts redistribution. The owner confirmed permission to include the supplied files in this project's public repository and downloadable ZIP on October 15, 2026. That confirmation does not change the creator's license or grant downstream users rights to extract/reuse the pack. The original license and attribution are retained in public/assets/mystic/LICENSE.txt and CREDITS.txt and in both playable and source ZIP folders. Old TOP-DOWN pack files are retained with their separate CC BY 4.0 notice for historical compatibility but are no longer loaded by the game.

### Water, dancing Keeper, and scattered trees

The ponds use all eight 16×16 frames of **Myth of Pixel – Water Temple** water by [Atari Boy](https://atari-boy.itch.io/myth-of-pixel-pack-dungeon-asset-water-temple), looping at 6 fps. The Keeper uses **Mage-Cyan.png from Puny Characters** by [Shade](https://opengameart.org/content/puny-characters), CC0, with stepping and arm-raise poses arranged into a 7 fps dance. The dance is decorative; contact and E still open the Keeper's advice.

Each chamber has 13 scattered trees with four varieties from **Tiny Swords Free Pack** by [Pixel Frog](https://pixelfrog-assets.itch.io/tiny-swords), swaying through eight frames. Trunk cells block the traveler, enemies, and projectiles and appear on explored minimap terrain. Positions are deterministic, away from the main dirt paths and interactions; all objectives remain reachable. Restart/retry redraw the same grove. Water still blocks walking.

All additional files load locally from public/assets/scenery/. CREDITS.txt documents authors, source links, selected frames, and terms. Tiny Swords and Water Temple permit game use but restrict redistribution of assets. The owner confirmed permission to include these new files in the public repository and downloadable ZIP on October 15, 2026. This is not a blanket downstream license to extract/reuse them. The water page also displays CC0 metadata, but this project retains its more restrictive custom terms. Credit links are visible in the footer.

### Starting pond bridge

The first chamber now has a north–south stone bridge over the nearby pond at column 10, rows 15–18. Walk onto it from either bank; surrounding water remains impassable. The minimap shows explored bridge tiles in tan. Other chambers retain their pond layouts.

Artwork: [16x16 Bridge by Deco](https://opengameart.org/content/16x16-bridge-0), used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The unmodified pontev2.png is rendered at 4× pixel scale and rotated 90° across the original starting pond. Attribution/source/license links are retained in public/assets/bridge/CREDITS.txt, the game footer, and source/playable ZIP folders. No endorsement is implied.

## Build and checks

Node 24 is recommended. The assistant or developer runs:

    npm ci
    npm run dev
    npm run build
    npx playwright install --with-deps chromium firefox webkit
    npm test
    npm run package

The production build is dist. Tests run against Vite’s production preview server. Coverage includes vocabulary completeness, asset loading, movement/collision, scrolling camera, contact interactions and gates, modal/projectile pause, mistakes/loss, checkpoint recovery, journal, restart, mobile controls, mouse/Space sword controls, removed shield controls, slime projectiles and damage, chest opening and rising questions, fog exploration/reset, and a full 45-word contact playthrough across five chambers.

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
