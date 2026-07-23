# Gallery — thematic 4K imagery

These are the full-bleed background photos used across the site (all 3840 px wide, ~4K).
Each is placed behind a dark overlay (`.section--photo::before`) so text stays legible.

| File               | Where it's used                    | Theme                        |
| ------------------ | ---------------------------------- | ---------------------------- |
| `code.jpg`         | Hero — preview inside the Live-stack card | React code editor       |
| `circuit.jpg`      | Services section background        | Circuit board / hardware     |
| `architecture.jpg` | Architecture section background    | Earth from orbit / network   |
| `team.jpg`         | Team section background            | Dev team working together    |

## Replacing an image

Drop a new file with the **same name** (keep it dark and 1920–3840 px wide), or point the
CSS variable to a new file. Backgrounds are wired via a CSS custom property:

```css
.architecture-section { --photo: url("../assets/gallery/architecture.jpg"); }
.services-section     { --photo: url("../assets/gallery/circuit.jpg"); }
.team-section         { --photo: url("../assets/gallery/team.jpg"); }
```

Source: Unsplash (free to use). Swap for your own brand photography when available.
