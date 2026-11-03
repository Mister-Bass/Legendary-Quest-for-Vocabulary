# Legendary Quest for Vocabulary

An original top-down vocabulary adventure built with Vite, JavaScript, and Phaser. Explore scrolling gardens and archives, fight slimes with a sword, solve vocabulary trials, earn rune keys, and open the next gate.

## Level 1: Digital citizenship and online reputation

Level 1 uses all 45 terms and their supplied definitions from Module_03_Vocabulary.pdf, provided by the teacher for Principles of Information Technology / CompTIA Digital Literacy v3.0, Module 3. Applied situations and game maps are original. The source PDF is not bundled or uploaded to the repository.

The five chambers are:

| Chamber | Vocabulary focus | Terms |
| --- | --- | --- |
| The Footprint Garden | Footprints, identity, metadata, and tracking | 9 |
| Lantern Marsh | Media literacy, misleading content, and biases | 10 |
| The Citizens’ Court | Participation, ethics, accessibility, and online conduct | 7 |
| The Forge of Ideas | Copyright, intellectual property, licensing, and attribution | 12 |
| The Sanctum of Trust | Security principles, malware, VPNs, and software rights | 7 |

Each chamber has three numbered rune seals. Each seal presents 2–4 vocabulary questions. Questions alternate between matching a definition to a term, recognizing a concept in an applied situation, and choosing the meaning of a term. Restore all three seals to receive three rune keys, then interact with the eastern gate to continue. Complete all 45 questions and enter the final gate to win.

Correct answers earn 25 insight; the maximum is 1,125. Wrong answers cost one heart and show the supplied definition as a learning hint. The same word never awards points twice. Slimes patrol and chase around obstacles. At range they signal a violet cast for 0.8 seconds, then fire a magic bolt toward your previous position; at close range they signal orange before striking. Bolts travel visibly, collide with terrain, and can be dodged. A hit costs one heart, followed by 1.2 seconds of protection from further enemy damage. Slimes have three health pips and require three separate sword swings to defeat. Each swing can hit a given slime only once, even across many animation frames. Hits briefly stagger the slime. At one health, a red ring shows its 56-world-pixel death-burst radius. The third hit plays its death animation and a visible burst; a player at or inside the ring loses exactly one heart once, even during ordinary damage protection. Outside the ring, the death burst does no damage. Sword reach is 72 pixels, so the final hit can be landed safely from its outer range. Restart/checkpoint retry restores each slime to three health. Combat never awards vocabulary points. Entering a new chamber restores one heart, up to five. There is no overall time limit; Lantern Marsh has short flame and lily-pad timers that pause while reading.

The four archive chambers are 40 by 28 tiles (1,600 by 1,120 world pixels), four times the original area. An 800 by 560 viewport uses a 1.5× zoom and smoothly follows the traveler within the map bounds. Arrows below the world point toward the three chests and gate. Hold movement keys or touch direction buttons for continuous movement; acceleration and deceleration soften starts/stops, diagonal speed is normalized, and solid terrain blocks both travelers and enemies.

The player uses the supplied Mystic Woods idle, run, and sword-swing animations. The sword is hidden while idle. Left-click inside the game world or press Space to swing; holding either repeats attacks with a short recovery. Touch screens have a Sword button. The traveler starts with the sword only. Opening the first chamber’s door awards one journey item through a slot-machine reel; that item works in every later chamber. Lantern Marsh also allows rolling. Dodge archive slime bolts by moving aside. Combat and movement pause during chest opening, questions, the Keeper conversation, journal, and win/loss screens. Losing focus releases controls; returning from a dialog requires fresh movement input. Game mouse controls do not apply to menus or answer buttons.

Walking into a closed treasure chest plays its four opening frames. The actual first vocabulary question rises out of the chest, then the answer dialog opens. Closing a trial preserves answered words; reopening animates the next unanswered question. Completed chests stay open and gold-tinted, including after checkpoint retry, and cannot award duplicate points. Restart closes every chest and cancels any active question reveal.

Closing a reading dialog grants 1.2 seconds of damage protection, allowing time to resume controls before a nearby paused projectile can hurt the player.

The bottom-right exploration minimap starts under fog of war and reveals terrain around places the traveler visits. Unvisited terrain and undiscovered objects remain hidden. Explored terrain stays visible while you backtrack; nearby slimes appear only within the current revealed vicinity. Exploration is kept separately for each chamber and survives checkpoint retries during the page session. Restarting the adventure or reloading clears exploration.

At zero hearts, Return to chamber restores five hearts and returns to the current chamber's entrance, preserving learned words, completed seals, score, and chamber. Enemies return to their starting positions. Restart adventure resets the entire level. Progress is kept for the current page session; reloading or closing the page resets it. No accounts, student records, analytics, or server storage are used.

## A02 · Lantern Marsh

The marsh is a 32×32 map of native 32-pixel terrain cells, rendered in a scrolling 1,280×1,280 world at 1.1× zoom.

A02 grass and forest borders use the supplied `top-down-forest-tileset.png`. The source grass is converted to a 32×32 runtime tile; the larger forest border is composed of 32×32 cells. The chamber, Marsh map, and A02 overworld/atlas share these textures. Other areas retain their existing assets. The original image is included unchanged with its provenance in `public/assets/forest/CREDITS.txt`; its creator and license are unknown, so this project does not grant an additional license to reuse it.

Mud patches use the supplied `wet-mud-tile.png`, with a glossy, irregular shore and slow pixel bubbles that pause during reading and map dialogs. The same texture appears in the Marsh map and overworld atlas. The original PNG and supplied provenance are retained in `public/assets/marsh/`; creator and license were not provided.

Fourteen trees, bushes, and stumps from the supplied 32×32 pack dress the banks and forest edge. Willow, oak, and dead trees mix with dense/fern/round bushes and mossy/plain stumps. Their roots use existing solid cells, preserving every route and puzzle clearance. Complete 32×32 sprites span native 32-pixel terrain cells and appear consistently in the chamber, Marsh map, and A02 atlas. Selected originals and provenance are in `public/assets/marsh-plants/`; no creator or license was included in the supplied folder.

The pond uses all thirteen supplied Kenney RPG Tiles Vector water/shore PNGs (CC0). Neighbor-aware curved banks outline the pond and island consistently in the chamber and map views. Wind streaks drift across open water; occasional fading rings and a fish jumping about every ten seconds bring it to life. These decorative effects avoid the lily pads, do not change collisions/combat/scoring, pause during reading/maps, and restart with the chamber. Original PNGs, credit, and the original license are retained in `public/assets/kenney-pond/`. Other regions keep their water artwork.

The three pond enemies use the supplied `octorot.png` strip. Eight cutout poses face the traveler and animate on the paused gameplay clock. The navy/gray backing is removed only in transient runtime textures; the original PNG stays unchanged in `public/assets/octorot/`, with its supplied provenance. Existing mud-ball timing, damage, shields, enemy health, and positions are unchanged. Slurgs retain their artwork.

Guardian lanterns use original 32×32 pixel art in a 16-bit adventure style: bronze caps and frames, faceted glass, carved stone posts, and clearly distinct dark and lit states. Lit flames flicker through four hand-authored frames with a soft ground glow. The larger sprites are planted at the same interaction points; animation pauses with the marsh clock during reading/maps. This is code-native artwork, with no new external assets or licenses.

Gloamwisps use original 32×32 floating-flame sprites in a 16-bit style: curling cyan tongues, ivory-gold cores, and drifting sparks. Four frames flicker at six frames per second, with a soft glow, a small ground shadow, and the existing hover motion. They have no face or lantern housing. Animation pauses with gameplay. Fleeing, defeat/respawn behavior, hitboxes, and renewable Wisp Flame drops remain unchanged.

Lily pads have no countdown circles. A sinking pad disappears to reveal the pond texture and leaves a brief fading water ripple, then regrows after four seconds. The live exploration minimap reflects visible and submerged pads; the paused Marsh map keeps the full route visible for planning.

The second area and second vocabulary chamber follow the owner's marsh reference: a southern stone entrance, two Slurg mud patches, narrow banks with bushes/boulders, a deep central pond, an island, a winding lily-pad crossing, and a northern lantern portal flanked by pillars. A02 keeps its permanent editing ID. Its overworld entrance now sits on the south bank; the atlas projects the same geography while keeping the wider world's roads connected. The overworld stays peaceful; the timed puzzle and enemies are inside the chamber.

Defeat a pale **Gloamwisp** and walk into its Wisp Flame. The carried flame lasts **10 seconds**. Touch a guardian lantern while carrying it to kindle the lantern, then finish that lantern's existing vocabulary group to light it fully. The two bank lanterns prepare you for the island run. A Wisp flees your sword, so use a tree or boulder to corner it near the crossing. An earned bow, stone, or bomb can also defeat it. Wisps relight after six seconds, so flames are renewable. A kindled lantern keeps its ember if you close a question or retry the checkpoint. All ten original media-literacy terms remain, and the complete adventure still contains 45 words.

Lily-pad cells sink **two seconds after first contact**, rescue you to the last safe bank/island, extinguish carried fire, and can cost a heart. They regrow four seconds later. Mud and Octorok mud balls slow movement. Opening vocabulary, journal, atlas, or **Marsh map** pauses simulation—including fire, pad, and enemy timers—so reading never consumes your crossing time.

| Marsh action | Keyboard / mouse | Touch |
| --- | --- | --- |
| Sword | Space / left-click | Existing Sword button |
| Block with the earned shield | Hold Q / F / right-click | Hold Shield item button |
| Roll and briefly avoid hits | Shift | Roll |
| Use the earned bow or stone | F / right-click (mouse aims) | Named item button |
| Use the earned bomb | F / B / right-click | Bomb item button |
| Plan the entire level | Marsh map button | Marsh map |

Three red **Mire Octoroks** surface and fire mud balls. The two mud-colored **Slurgs** emerge from mud, hop, and split into two smaller slimes on a hit. Two pale bank Gloamwisps supply the first two flames; the final Gloamwisp is trapped inside Croak. The island chest grants a **Heart Piece (1/4)** and restores one heart, once per run. This one piece does not add a full maximum heart. Lighting both bank lanterns awakens **Grandfather Croak**. A brief, input-locked camera sequence shows the original 32×32 giant frog rising from the pond and a portcullis rising across the southern entrance. Its slams shorten pad time to 0.9 seconds. Hit Croak with the earned bow, bomb, or stone **while its tongue is extended**, or face and block the tongue with the earned shield. Then strike its exposed belly. Six belly hits defeat it and restore normal pad timing. The chest is optional. Defeating Croak releases the final Gloamwisp, whose flame is required for the island lantern. Completing that lantern opens the northern portal. The tongue visibly extends, holds, and retracts, and only its current length can hit the player. Defeating the frog lowers the southern gate and releases the final Gloamwisp; the northern portal waits for the island lantern’s vocabulary trial. The atlas remains viewable, but leaving for overworld exploration is blocked during the fight. Checkpoint recovery resumes the fight safely on the island with six boss health, preserving vocabulary and lanterns. Progress, kindled/lit lanterns, the collected Heart Piece, and a defeated boss survive checkpoint retry and revisits. R/restart resets everything.

For a direct review/practice run, append `?area=A02` to the game URL. It clearly labels itself **AREA PRACTICE**, begins in the marsh, and does not award the opening chamber's words or points. Use the ordinary URL for the full adventure. All art for new marsh scenery/creatures is original 16-pixel code art in `src/marsh-art.js`; the existing owner-supplied player, Keeper, chest, and water remain in use. `src/marsh-map.js` owns geography, `src/marsh-model.js` owns pause-safe simulation, and `src/marsh-world.js` connects it to Phaser/input. Request changes in plain English, for example: “In A02, move the western Wisp closer to the south bank and keep the ten vocabulary terms.”

## The Lanternlands overworld and area designations

### 32×32 artwork and matching chamber scenery

**A01 · Whisperwood uses the owner-selected Overworld_Tileset.png from TOP-DOWN Adventure Pack v1.0 by o_lobster.** The exact sheet was already bundled as `public/assets/topdown/overworld.png`; it is unchanged. Only A01 (columns 0–23, rows 0–17) opts into this override. Its grass, dirt paths, earthen ledges, small plants, flowers, and 2×3-cell broadleaf trees come from that sheet, using the same source rectangles in the atlas and playable region. Tree trunks retain their existing blocked cells, and every road and landmark keeps its original location. Other regions retain their scenery except A02, whose marsh redesign is described above. The supplied player, Keeper, water animations, door cutscene, vocabulary, and controls remain in use. Credits: [TOP-DOWN Adventure Pack by o_lobster](https://o-lobster.itch.io/adventure-pack), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); the bundled credit notice records frame selection, scaling, and arrangement into original maps.

The free **Puny World** tileset by [Shade on itch.io](https://merchant-shade.itch.io/16x16-puny-world) supplies the original 16×16 grass, dirt paths, ledges, masonry, roofs, and stone floors. It is CC0; the unmodified sheet, source links, and credit record are bundled locally in `public/assets/puny/`. The atlas, playable overworld, and vocabulary chambers use the same tile painter. All terrain is converted and baked at 32 pixels per cell with nearest-neighbor sampling; the existing 40-pixel movement grid and camera zoom remain intact. Characters, chests, animated trees, water, doors, bridge, keys, and water enemies now use 32×32 runtime frames. Source files and credits remain unchanged.

| Area | Scenery direction | Vocabulary chamber |
| --- | --- | --- |
| A01 · Whisperwood | Dense green woods, mossy ledges, dirt clearings | Exploration landmark |
| A02 · Lantern Marsh | Misty pond, muddy banks, lily pads, lantern portal | Lantern Marsh |
| A03 · Crown Heights | Golden highland paths and rock ledges | Exploration landmark |
| A04 · Citizens’ Commons | Village greens, timber roofs, civic paving | Citizens’ Court |
| A05 · Lantern Crossroads | Pale citadel walls, formal gardens, moat | Exploration landmark |
| A06 · Ember Quarry | Ochre rock terraces and warm forge paving | Forge of Ideas |
| A07 · Footprint Fields | Dry fields, planted rows, sandy garden paths | Footprint Garden |
| A08 · Willow Marsh | Mossy banks, wetland channels, bridge | Exploration landmark |
| A09 · Trust Sanctuary | Cool stone, island gardens, lake water | Sanctum of Trust |

Chambers remain separate vocabulary arenas with their tested objective and collision layouts; their terrain, walls, gardens, and tree colors now reflect the home region. They are not literal enlarged crops of the atlas. Existing water, tree, player, slime, Keeper, chest, and bridge assets remain. The chamber minimap samples the actual terrain texture beneath its fog. Tell the assistant, for example: “Make A06 more rocky and carry those changes into the Forge chamber; keep the vocabulary and controls.” No code editing is needed.

The landscape now follows the artistic direction of the supplied classic overworld reference: dense woodland masses, warm stepped cliffs, a central white-walled citadel and moat, a western settlement, connected rivers, a wetland crossing, and a southeastern lake with a sanctuary island. Geography flows across the area boundaries; the nine IDs remain administrative editing references. This is original scenery composed with existing assets and code-painted terrain, not a traced or imported reference image. The existing player, slimes, trees, water, Keeper, chests, bridge, and all asset/credit files are retained. The atlas and playable terrain share one painter so paths, shorelines, cliffs, houses, and walls agree with collision. Static terrain uses small canvas chunks to reduce rendering work; the existing water and tree animations remain live.


Press **O** or click **Overworld atlas** during play. Select a region to see its permanent ID, description, landmark, and chamber status. **Explore overworld** enters an original 72 × 54 tile (2,880 × 2,160 pixel) landscape with a following camera, connected roads, northern lake, southern marsh, stone ridges, courtyards, animated trees, and water. It takes inspiration from classic top-down adventure geography; the layout and names are original. All previously included assets remain in the repository and package.

The areas are arranged in this north-to-south grid:

| West | Center | East |
| --- | --- | --- |
| **A01 · Whisperwood** — forest / Listening Grove | **A02 · Lantern Marsh** — bog / Lantern Marsh (chamber 2) | **A03 · Crown Heights** — highlands / Crown Lookout |
| **A04 · Citizens’ Commons** — meadow / Citizens’ Court (chamber 3) | **A05 · Lantern Crossroads** — central roads / Lantern Citadel | **A06 · Ember Quarry** — stone terraces / Forge of Ideas (chamber 4) |
| **A07 · Footprint Fields** — starting garden / Footprint Garden (chamber 1) | **A08 · Willow Marsh** — wetland / Willow Crossing | **A09 · Trust Sanctuary** — sanctuary / Sanctum of Trust (chamber 5) |

Hold arrows/WASD or the touch direction buttons to explore. Walk into an available marked chamber entrance, or press E/Interact nearby, to enter it. Finish chambers in order to unlock the next entrance; exploring does not bypass vocabulary trials. The overworld is peaceful; combat stays in the existing chambers. Open the atlas and choose **Return to quest** to resume the current chamber at the exact position you left. Entering a different unlocked chamber starts at that chamber's checkpoint and resets its enemies, while preserving hearts, score, learned terms, and completed chests. Revisiting an already unlocked chamber never restores an extra heart. Your overworld position and revealed terrain persist until restart/reload. The atlas shows the complete geography for planning; the bottom-right minimap reveals only traveled areas. The atlas pauses movement and combat.

**No code editing is needed to request an area change.** Select its designation in the atlas, then tell the assistant what to change, for example:

> In A01 (Whisperwood), add a hidden vocabulary chest behind a winding tree path. Keep the player, slime, water, and tree assets. Test it and update the pull request for my approval.

> In A08 (Willow Marsh), widen the river and add another north–south bridge. Leave A07 unchanged.

> Rename A03 to Scholar’s Peak and put a new vocabulary challenge there using my next word list. Keep the stable ID A03.

Area IDs stay fixed when names or layouts change. The atlas is a selection/reference interface, not a terrain painting editor. The assistant makes requested changes in a pull request. This release adds exploration locations, not extra vocabulary beyond the existing 45 terms. Regions A01, A03, A05, and A08 are exploration landmarks ready for future content.

For maintainers, `src/overworld.js` owns the area registry, deterministic geography, passability, and atlas drawing; `src/overworld-art.js` paints the shared pixel scenery; `src/overworld-scene.js` renders exploration with the existing sprite assets; `src/atlas.js` manages the accessible atlas dialog and selection. Existing vocabulary/chamber files remain the content source. The overworld is included automatically in the source/playable ZIP and Cloudflare Pages build.

## Controls

The eastern exit uses a 32×32 pixel door converted from the original 16×16 drawing with three empty key slots. Earn all three chamber keys, then touch the door or press E beside it. A short pixel cutscene inserts the three keys one by one, releases the lock, and opens the doorway before advancing. The final chamber plays the same sequence before the win screen. Movement, attacks, enemies, and projectiles pause during the cutscene; Escape cannot skip the locks. **Restart adventure** (or R) cancels the animation and resets the adventure safely. The images and credits are bundled locally in `public/assets/gate/`; no external artwork or service is required.

| Action | Keyboard | Touch / mouse |
| --- | --- | --- |
| Move continuously | Hold arrow keys or WASD | Hold direction buttons under the game |
| Open a chest's vocabulary trial | Walk into the chest with arrows or WASD | Move toward the chest with direction buttons |
| Interact with chest, Keeper, or gate | Walk into it; E remains a nearby alternative | Move into it; Interact button also works |
| Draw/swing sword / repeat while held | Space or left mouse button inside the world | Sword button (hold to repeat) |
| Answer a vocabulary question | 1–4 | Answer buttons |
| Open overworld atlas / close atlas | O / Escape | Overworld atlas / close button |
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

All 45 terms are assigned to exactly one chamber. Artwork loads from this site's own assets; gameplay does not depend on Drive or third-party image hosts. The traveler retains the owner-supplied sprite. Marsh layouts and new creature graphics are original project artwork, with no imported Zelda graphics or music.

## Artwork credits

Mystic Woods Free 2.1 by [Game Endeavor](https://game-endeavor.itch.io/mystic-woods), supplied by the owner. Uses player.png (48×48 frames), slime.png (32×32), chest_01.png (16×16), and grass/plains/fence terrain from the supplied tilesets folder. All 45 vocabulary terms belong to Level 1 across its five chambers, which now share this artwork. Original non-32 frames are converted to 32×32 at load time, then selected, flipped, and scaled in the maps. The player's own sword-swing frames replace the old generated sword. The gate and interface are original project artwork. The Keeper, water, and trees use the additional owner-supplied packs credited below.

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

The production build is dist. Tests run against Vite’s production preview server. Coverage includes vocabulary completeness, asset loading, movement/collision, scrolling camera, contact interactions and gates, modal/projectile pause, mistakes/loss, checkpoint recovery, journal, restart, mobile controls, mouse/Space sword controls, removed shield controls, slime projectiles and damage, chest opening and rising questions, fog exploration/reset, and a full 45-word contact playthrough across five chambers. Marsh coverage adds renewable/expiring Wisp Flames, sinking/regrowing pads, mud, shields/rolls, splitting Slurgs, Croak’s weakness window, real-input lantern restoration, and an island chest/boss fight with restart.

GitHub Actions runs Build and browser tests for every PR, main update, merge queue, and manual run. It builds, runs the full suite in Chromium, Firefox, and WebKit, and generates a ZIP. In the run’s Artifacts section, download legendary-quest-package. It contains legendary-quest-for-vocabulary.zip with playable/ (built game) and source/ (reusable project). GitHub may wrap that ZIP in another ZIP. Game artifacts last 30 days; browser reports last 14 days.

Optional assistant diagnostics: `GAME_TEST_PROGRESS=1` logs read-only marsh progress. `GAME_TEST_CPU_RATE=8` slows Chromium during the island approach to exercise movement under CPU pressure.

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

### Consistent 32×32 / 16-bit-style art

Every game area now uses 32×32 terrain cells and sprite frames. Existing 32×32 slimes, Keeper, plants, lanterns, Gloamwisps, and frog artwork retain their authored pixels. The older 16px and 48px frames and larger trees, bridge, and Octorot are converted at startup with nearest-neighbor sampling. Tall sprites fit a square transparent frame; their world-space display sizes preserve their silhouettes. Supplied original files are retained for provenance and future edits. This is a frame-format conversion, not a claim that every supplied asset was redrawn.

The marsh map is now 1024×1024 (32 cells of 32 pixels), chamber terrain is 32 pixels per cell, and the gate film is 256×160. Large scenery and maps are compositions of cells; the two-cell arena gate remains 64×32. UI text stays readable HTML. The 16-bit description refers to the pixel-art aesthetic, not a 16-bit PNG file encoding.

Fish, mud balls, slime bolts, stones, bombs, carried fire, and the active shield have original 32×32 pixel artwork in `src/effect-art.js`; no external generation or download is required. Ripples, mist, lighting, and combat warnings remain animated effects. `src/pixel-format.js` defines the conversion rules so future supplied assets follow the same format. Browser checks verify the actual runtime sprite frame dimensions, terrain size, loading, controls, and restart.

You can request further changes in plain English, for example: “Make A03 snowy, keep the 32×32 16-bit style, and preserve the paths and vocabulary.”

A02 Slurgs and their split offspring use the same 32×32 Mystic Woods slime frames as the first chamber, recolored with the marsh mud's five brown/gold shades. Eyes, mouths, transparency, hiding, hopping, splitting, and collision rules are preserved. The original blue slime sheet is unchanged; `src/mud-slime-art.js` makes the palette variant at load time. Both sizes use the first chamber's idle/run poses and frame rates.

### Lantern portal

The A02 shrine door is now original 32×32 pixel portal artwork. Three amber runes track the lit lanterns; the third completed vocabulary lantern activates a six-frame, 8 fps blue/cyan vortex. Its animation follows the marsh clock and pauses during reading and maps. Touch the northern portal or press E nearby to travel to the next chamber through a short portal transition, with no key-insertion sequence. Fewer than three fully lit lanterns leave it dormant. Checkpoint retry preserves lit lanterns and the portal; Restart clears them.

Croak rises and seals the southern path when both bank lanterns are lit. Defeat him to release the final Gloamwisp, then take its flame to the island lantern and finish that vocabulary trial to open the portal. The other four chambers retain their three-key doors and cutscenes. Marsh map, atlas, minimap, objectives, and Keeper advice describe the portal.

### Croak’s final Gloamwisp

The final 32×32 Gloamwisp rises from Croak’s open mouth as he sinks, arcs onto the island over 1.4 seconds, and then uses the existing floating-flame animation and flee behavior. It is protected during emergence so the killing sword swing cannot erase the reveal. Defeat it and collect its flame within 12 seconds; the carried flame lasts 10 seconds. Ordinary bank flames cannot kindle the island lantern. A failed flame attempt is recoverable: the final wisp relights after six seconds, and checkpoint retry restores it on the island if the last lantern has not been kindled. Restart restores the original two bank wisps and resets Croak and all lanterns. No new vocabulary or external assets are introduced.

Touching the unopened A02 portal (or pressing E beside it) opens a reading message explaining the three lanterns, Wisp Flames, and vocabulary trials without revealing the Croak encounter. It shows the number of lit lanterns and pauses gameplay while open. Closing it resumes play; remaining in contact does not repeatedly reopen it. The active portal still travels to the next chamber.

### One item for the journey

The player starts without a shield, stone, or bomb. After the first chamber’s three-key door opens, a three-window slot machine cycles through **Shield, Bow, Bomb, Stone** and settles on one randomly selected item, with equal chances. Continue accepts the result and enters Lantern Marsh. That one item stays with the player through every remaining chamber, overworld visit, and checkpoint retry; it is never rerolled at later doors. Restart/Begin again starts a new run and removes the item. Nothing is saved across page reloads or browser sessions.

**F**, right-click, or the named touch button uses the earned item. Hold **Q** to block if it is the shield; **B** is also accepted for the bomb. Bow arrows, thrown stones, and bombs have their own firing rates. Only the earned item can be used; there are no starting-item buttons or hidden shortcuts for the other rewards. The sword remains on Space/left-click, and Shift rolls in the marsh. The shield blocks incoming projectiles and melee attacks; blocking Croak’s tongue stuns him so the shield reward can complete the required fight. The bow, stone, and bomb stun him on a tongue-window hit. Wisps can still be cornered and struck with the sword when the reward is the shield.

The A02 practice URL skips the first chamber, so it offers the same single random item when a practice run begins. It follows the same ownership, retry, and restart rules. The inventory strip displays the owned item and its controls. The reel pauses gameplay, announces the result once, and keeps Continue disabled until it settles. All reward/effect artwork is local 32×32 pixel graphics.
