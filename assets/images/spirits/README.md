# Fortune Muse spirit illustrations

Approved American retro editorial character designs, exported individually as PNGs
with alpha transparency. Generated with the built-in image generation tool.

| File | Character | Current theme | Legacy theme |
| --- | --- | --- | --- |
| brix.png | BRIX, anthropomorphic gold bullion bar | gold-bar | nugget |
| bao.png | BAO, anthropomorphic gold sycee ingot | ingot | ingot |
| buck.png | BUCK, anthropomorphic dollar sign | dollar | greenback |
| ruby.png | RUBY, coral heart; new connections and dating | heart | — |
| val.png | VAL, lavender love letter; communication and clarity | love-letter | — |
| ember.png | EMBER, apricot heart flame; intimacy and renewal | heart-flame | — |

`src/components/DeityArt.tsx` owns static asset imports and renders all three with
`contain` scaling, preserving their proportions in every existing screen size.
Database IDs are unchanged to preserve saved reading references.

The home screen filters the catalog by `topic`: three wealth spirits or three
love spirits. Each topic remembers its selected character while the screen is
mounted. Love cards use heart suits and heart particles. The selected spirit's
ID and `love` topic carry through to the conversation and reading screens.
The love illustrations were generated with the built-in image tool; complete
prompts are recorded in `LOVE-PROMPTS.md`.

## Generation prompts

Shared prompt: Extract exactly one character from the approved three-character
concept board. Preserve the silhouette, face, pose, dark-plum outlines, flat
spot-color planes, subtle screenprint grain, colors, limbs and shoes. Remove all
other characters, typography, swatches, backdrop and ground shadow. Output a
centered, fully visible character on a square PNG with true alpha transparency,
crisp antialiased edges, transparent gaps, and opaque eye whites and highlights.
Leave a narrow transparent margin. No redesign, text, checkerboard or extra props.

- BRIX: Extract the left gold bullion bar with beveled planes, four-point star,
  hand on hip, thumbs-up, asymmetric brows, and plum shoes with terracotta soles.
- BAO: Extract the center wide gold sycee with raised boat tips and central dome,
  terracotta underside, half-lidded eyes, thoughtful hand, open hand, small lavender
  scarf and plum shoes. Preserve the broad low silhouette.
- BUCK: Extract the right jade-green dollar sign, single continuous vertical
  stroke, emerald side plane, side-looking smile, extended left hand, raised
  golden index-finger gesture and plum shoes. Preserve transparent loop openings.
