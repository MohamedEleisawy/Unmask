# FIGMA PIXEL-PERFECT IMPLEMENTATION RULES

## MANDATORY WORKFLOW — follow every step, no exceptions

### STEP 1 — Extract before you write a single line of code
Use the Figma MCP to extract ALL of the following from the target node before opening your editor:

1. **Layout & dimensions**
   - Frame width, height, padding (top/right/bottom/left individually)
   - Gap between children (row-gap, column-gap)
   - Layout mode: AUTO (flex) vs NONE (absolute)
   - Alignment: primary axis + counter axis

2. **Typography — for every text node**
   - Font family + exact weight (not "bold" — the numeric value: 400, 500, 600, 700…)
   - Font size in px
   - Line height (px or %) — never assume 1.5
   - Letter spacing (px or em)
   - Text transform, text decoration
   - Color with opacity if any

3. **Colors**
   - Fill: hex + opacity
   - Stroke: hex + width + position (inside/outside/center)
   - Shadow: x, y, blur, spread, color, opacity
   - Background blur if present

4. **Spacing**
   - Every padding value individually (do NOT round unless Figma rounds)
   - Every gap value
   - Margin between siblings (if absolute layout)

5. **Border & radius**
   - Border-radius per corner if mixed
   - Border style + width + color

6. **Assets**
   - Export every icon/image/illustration directly from Figma MCP
   - Use SVG for icons and illustrations
   - Use WebP/AVIF for photos (ask Figma for export)

7. **Component states**
   - Default, hover, focus, active, disabled — extract ALL variants

---

### STEP 2 — Build a design token map before coding
After extraction, output a structured token table:

```
COLOR TOKENS
  --color-primary:      #HEX
  --color-bg:           #HEX
  --color-text:         #HEX
  ...

TYPOGRAPHY TOKENS
  --font-heading:       'Font Name', weight, size, line-height
  --font-body:          'Font Name', weight, size, line-height
  ...

SPACING TOKENS
  --space-xs:  Npx
  --space-sm:  Npx
  --space-md:  Npx
  ...

RADIUS TOKENS
  --radius-sm:  Npx
  --radius-md:  Npx
  ...
```

Only start writing component code once this map is validated.

---

### STEP 3 — Implement with pixel precision

**Absolute rules:**
- Use CSS custom properties (vars) for every repeated value — no magic numbers
- Match Figma padding/gap to the pixel — never approximate
- If Figma uses `font-weight: 600`, use 600, not `bold` or 700
- If Figma uses `line-height: 22px`, use `22px`, not `1.375rem`
- If Figma uses `letter-spacing: 0.02em`, use `0.02em`, not 0
- Translate AUTO layout → flexbox (or CSS grid for grids)
- Translate NONE layout → CSS position: absolute with exact top/left
- Replicate shadows with `box-shadow` or `filter: drop-shadow` exactly
- Export and embed SVG icons inline — never use emoji or approximate icons

**Typography:**
- Load the exact font via Google Fonts or local import
- Never substitute fonts (no "Arial as fallback for now")
- Match font-size, weight, line-height, letter-spacing, color to the pixel

**Spacing:**
- Never use `margin: auto` to approximate a padding
- Every padding, gap, and margin must match the extracted value

**Colors:**
- No approximations — use the exact hex extracted from Figma
- If Figma shows rgba or an opacity, reproduce it with CSS rgba or `opacity`

---

### STEP 4 — Self-review checklist before submitting

After writing the code, visually diff against the Figma frame:

- [ ] Font family matches?
- [ ] Font weight matches (numeric)?
- [ ] Font size matches (px)?
- [ ] Line height matches?
- [ ] Letter spacing matches?
- [ ] All paddings match individually?
- [ ] All gaps match?
- [ ] Background color matches (exact hex)?
- [ ] Text color matches?
- [ ] Border radius matches per corner?
- [ ] Shadows match (x, y, blur, spread, color, opacity)?
- [ ] Icons are SVG from Figma, not approximations?
- [ ] Hover/focus states extracted and implemented?
- [ ] Responsive breakpoints match Figma frames?

If any checkbox fails → fix before responding.

---

### STEP 5 — Responsive implementation

- Extract ALL responsive frames from Figma (mobile, tablet, desktop)
- Map them to breakpoints — use the exact widths Figma defines as frame sizes
- Never invent breakpoints not present in the Figma file

---

## ANTI-PATTERNS — never do these

- ❌ Eyeballing values ("looks like 16px")
- ❌ Using utility classes that approximate (e.g., Tailwind's `p-4` when Figma says `padding: 14px`)
- ❌ Substituting fonts
- ❌ Skipping state variants (hover, focus, disabled)
- ❌ Hardcoding colors instead of using design tokens
- ❌ Using `margin: auto` to center when Figma uses `align-items: center`
- ❌ Rounding line-height to "1.5" when Figma gives 24px
- ❌ Starting to code before completing extraction

---

## TOOL USAGE PRIORITY

When implementing any Figma design, always:
1. `mcp_figma_get_node` → get node data
2. `mcp_figma_get_styles` → get all styles from the file
3. `mcp_figma_get_components` → get component variants
4. `mcp_figma_export` → export assets as SVG/PNG

Never rely on visual interpretation of a screenshot. Always extract from MCP.