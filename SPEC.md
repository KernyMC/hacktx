# Familiars: spec (source of truth)

If this file and DESIGN.md disagree, this file wins. DESIGN.md is the research and the three explored directions.

## Look and feel

- **One UI style for the whole app: Meadow Cottage chrome.** Wood plaques with a light/dark bevel, cream parchment panels, dark-brown outlines, notched pixel corners. Lives in `src/styles/theme.ts`.
- **Pets differ only in sprite, palette, aura, particles and habitat.** Nothing else in the UI changes per pet, with one exception: the accent color (XP bar fill, active nav tab) tints toward the active pet's palette.
- **Every pet has its own habitat background**, drawn as 16-bit pixel art on a low-res canvas (scaled up, `image-rendering: pixelated`). Each habitat has 4 time-of-day looks.
- **Fonts are all pixel fonts.** Display: Pixelify Sans. Body: VT323 at 18px or more on mobile, line height 1.3 or more.
- **Pixel grid rules.** UI chrome uses 3px pixels. Sprites and habitats scale by whole numbers only. No blur, no smooth radial glows (glows are hard-edged bands).

## Time of day

Habitats follow the device clock:

| Phase | Hours | Look |
|---|---|---|
| Dawn | 5:00-8:00 | Pink-lilac sky, long soft light, low sun |
| Day | 8:00-17:00 | Clear sky, full color |
| Sunset | 17:00-20:00 | Orange-magenta sky, warm rim on everything |
| Night | 20:00-5:00 | Deep blue, moon and stars, scenery darkened and cooled |

The phase is computed on the client, so server and client never disagree about the time.

## Rarity tiers

The jump in detail between tiers should be obvious at a glance.

| Tier | Sprite size | Display scale | Flash color | Egg odds | Extras |
|---|---|---|---|---|---|
| Common | 16x16 | x8 | Gray `#b8b8c0` | 55% | Up to 4 colors, chunky shapes |
| Uncommon | 24x24 | x6 | Green `#6abe30` | 25% | Shading plus one highlight |
| Rare | 32x32 | x5 | Blue `#5fa8ff` | 13% | Full shading, cheek blush, eye shine |
| Mythic | 48x48 | x4 | Purple `#b05cff` | 6% | Hue-shifted shading, idle particles |
| Legendary | 64x64 | x4 | Gold `#f4c542` | 1% | Animated (multiple frames), aura, particles |

### Starting roster (10 pets)

| # | Pet | Tier | Size | Habitat | Particles |
|---|---|---|---|---|---|
| 1 | Mochi, a jelly slime | Common | 16 | Grassy meadow | Hearts |
| 2 | Pip, a chick | Common | 16 | Sunflower patch | Hearts |
| 3 | Nib, a mushroom sprite | Common | 16 | Mossy forest floor | Spores (sparkles) |
| 4 | Clover, a bunny | Uncommon | 24 | Clover hill with a burrow | Hearts |
| 5 | Puddle, a frog | Uncommon | 24 | Lily pond | Bubbles |
| 6 | Sprout, a leaf chibi | Rare | 32 | Cottage garden | Leaves |
| 7 | Lumi, a spirit cat | Rare | 32 | Starry rooftop | Sparkles |
| 8 | Ember, a flame-tailed fox | Mythic | 48 | Autumn volcano ridge | Embers |
| 9 | Marina, an axolotl | Mythic | 48 | Coral reef | Bubbles |
| 10 | Aurora, a celestial dragon | Legendary | 64 | Cloud temple sky | Stars and confetti, gold aura |

This roster replaces the earlier "5 bodies with color variants plus 4 evolved forms" idea. Evolution is out of scope for now.

## Economy

- **Quests give coins** (10-30 each) and XP. XP levels up your pet.
- **The shop sells** eggs (gacha, 100 coins), curses and blessings. There are no raids and no other players.
- State lives in `localStorage` on the device. No backend yet.

## Eggs and gacha

- **Odds** are in the tier table above.
- **Pity:** a rare or better pet is guaranteed within 10 eggs. A pity bar on the shop's egg card shows `n / 10`. The counter resets whenever a rare or better pet hatches.
- **Reveal sequence:**
  1. The egg wobbles.
  2. It cracks in 3 stages, each with a crack sound and a shake.
  3. The screen flashes the tier color (gray, green, blue, purple or gold).
  4. The pet pops out with particles and the hatch sound.
- **Legendary extras:** screen shake, a gold burst, and the fanfare sound instead of the hatch sound.
- The egg sprite has 4 states: whole plus 3 crack stages. During the reveal it is tinted toward the tier color.

## Collection book

A grid of all 10 pets. Discovered pets show in full color with their name and tier. Undiscovered pets show as dark silhouettes (the same sprite drawn in one dark color) with "???" for the name.

## Tutorial

Three short steps, each a parchment speech bubble from the pet:

1. Hatch your starter egg. It is always a common pet and costs nothing.
2. Do your first quest.
3. Open your first egg in the shop. The tutorial gives you enough coins for it.

## Curses and blessings

Every curse and blessing does four things while it lasts (24 hours):

- **Mechanic:** changes how quests or the shop work.
- **Cosmetic:** adds an accessory to the pet sprite, drawn on the pet's own pixel grid.
- **Pet voice:** the pet's speech bubbles switch to that voice.
- **Quest voice:** quest titles are rewritten in that voice, and a voice quest is added that asks *you* to talk that way.

You can have at most one curse and one blessing active. **Curses are cheap (40 coins) and pay you back**: every curse also gives +50% coins on quests, to make up for the trouble.

### Curses

| Curse | Mechanic | Cosmetic | Voice | Voice quest |
|---|---|---|---|---|
| Pirate's Plunder | Each quest pays a random 0.5x-2x coins (loot!) | Tricorn hat and eyepatch | "Arr, ye scallywag!" | Say "Ahoy" to 3 people |
| Pompous Monarch | Quests must be done in the listed order | Oversized crown and monocle | "We are most displeased." | Refer to yourself as "we" all day |
| The Bard | To finish a quest you write a one-line rhyme about it | Ruff collar and a feathered cap | "Hark! Thou hast hydrated!" | Speak one sentence in rhyme to a friend |
| High Noon | Quests done before noon pay double, after noon half | Cowboy hat and bandana | "Howdy, partner." | Call someone "partner" |
| Beep Boop | Each quest needs 3 check-ins (a progress bar of 3) | Antenna and visor | "BEEP. TASK ACKNOWLEDGED." | Answer one question as a robot |
| Opposite Day | Coins and XP are swapped on every reward | The pet is drawn upside down | "I *hate* that you did that." | Say "goodbye" when you mean hello |
| Soap Opera | Skipping a quest costs 10 coins ("betrayal tax") | Sunglasses and a rose | "How COULD you, Brenda?!" | Gasp dramatically at something mundane |
| Gloom Cloud | You must pet your familiar 3 times before each quest counts | Tiny raincloud overhead | "*sigh* ...okay." | Sigh loudly before starting a task |

### Blessings

| Blessing | Price | Mechanic | Cosmetic | Voice | Voice quest |
|---|---|---|---|---|---|
| Golden Hour | 150 | 2x coins | Golden halo | "Everything glitters today!" | Compliment someone's shine |
| Bargain Bunny | 120 | Shop prices halved | Bunny-ear headband | "What a DEAL!" | Haggle over something, politely |
| Scholar's Specs | 120 | 2x XP | Round glasses and a grad cap | "Fascinating. Truly." | Share one fun fact |
| Lucky Clover | 150 | Next egg: rare+ odds doubled and pity +2 | Four-leaf clover | "I can feel it... luck!" | Make a wish out loud |
| Second Wind | 100 | One missed quest still counts today | Sweatband | "ONE MORE REP!" | Hype someone up like a coach |
| Chef's Kiss | 100 | Food and water quests give 3x | Chef hat | "Magnifique!" | Describe your lunch like a food critic |
| Fairy Favor | 130 | Each quest has a 20% chance to drop a free egg | Fairy wings and wand | "Bibbidi-bobbidi-quest!" | End one sentence with "...and so it shall be" |
| Sunny Side | 80 | Habitat stays daytime and +10% XP | Flower crown | "Sunshine, you did it!" | Say good morning to someone, at any hour |

## Accessories on sprites

Each pet defines two anchor points on its own grid: `head` (top center of the head) and `eyes` (center between the eyes). Accessories are small sprites composited onto the pet's canvas at native resolution before scaling, so they share the pet's pixel grid. Pets 48px and larger draw accessories at 2x to keep the proportions right.

## Screens (in build order)

1. **Kit** (`/dev/kit`): theme, UI components, all sprites, habitats at all 4 times, accessories, particles, sounds.
2. **Egg reveal**: a full-screen overlay component, used by the tutorial and the shop.
3. **Home** (`/`): habitat with the pet, tap to pet (squish, hearts, sound), speech bubble, XP bar, today's quests, bottom nav.
4. Later: Shop, Collection book, Tutorial flow, curses and blessings wired into quests.

## Out of scope for now

Backend and accounts, AI-generated quests (another teammate owns `src/lib/ai.ts` and `src/app/api/`), friends and trading, pet evolution, push notifications.
