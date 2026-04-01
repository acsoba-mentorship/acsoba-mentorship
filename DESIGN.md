# Design System Document

## 1. Colors
Our palette is rooted in the school’s crest, balanced by a modernist neutral foundation.

* **Primary (`#000F33`):** Deep Navy. Used for core branding, primary CTAs, and high-level headings. It represents the "Ink" on our digital paper.
* **Secondary (`#735C00`):** Crest Gold. Reserved for accents and subtle highlights to denote heritage.
* **Tertiary/Error (`#BA1A1A`):** Vibrant Red. Used sparingly for critical alerts or specific brand flourishes. Used in cases of CTAs.
* **Neutral Foundation:** Base `background` is `#F9F9F9` (off-white paper) with `surface_container_lowest` (`#FFFFFF`) used to create subtle highlights.

### The "No-Line" Rule
Designers are prohibited from using standard 1px solid borders to define "boxes" or "cards." Instead:
1. **Sectioning:** Use background color shifts (e.g., a section in `surface_container_low` against the `surface` background).
2. **Dividers:** When a boundary is required, use a single horizontal hairline (`px` weight) using `outline_variant` at 50% opacity.

### Signature Textures
Main CTAs and hero headers should utilize a subtle gradient transition from `primary` to `primary_container` to provide a "silk-screened" depth that flat hex codes cannot achieve.

---

## 3. Typography
**Typeface: Manrope (Sans-Serif)**
Manrope’s geometric yet warm proportions bridge the gap between contemporary tech and classic typesetting.

* **Display (Lg/Md/Sm):** Set with tight tracking (-2%). Use for hero statements. These are the "Mastheads" of your page.
* **Headline (Lg/Md/Sm):** High contrast. Used for section starts. Should always be followed by generous `spacing.8` (2.75rem) to allow the header to breathe.
* **Body (Lg/Md):** Optimized for readability. Line heights should be generous (1.6x) to mimic professional editorial print.
* **Label (Md/Sm):** All-caps with increased letter spacing (+5%) for badges.

---

## 4. Elevation & Depth
We reject the "floating card" aesthetic. Depth is achieved through **Tonal Layering**.

* **The Layering Principle:** Stack `surface-container` tiers to create hierarchy. A profile section might sit on `surface_container_low`, while the interaction buttons sit on `surface_container_lowest` (pure white) to appear naturally lifted.
* **Ambient Shadows:** If an element must float (e.g., a dropdown), use an ultra-diffused shadow: `box-shadow: 0 20px 50px rgba(0, 15, 51, 0.05)`. The tint is Navy, not Grey, mimicking natural light through a lens.
* **Glassmorphism:** For top navigation bars or floating action menus, use `surface` at 80% opacity with a `blur(12px)`. This integrates the content into the "paper" background rather than layering it on top.

---

## 5. Components

### Buttons
* **Primary:** Solid `primary` (Navy) with `on_primary` (White) text. Corner radius: `md` (0.375rem). No shadow.
* **Secondary (Outlined):** `outline` token at 1px. No background fill. Text in `primary`.
* **Tertiary:** Ghost style. No border or background. Uses `primary` text with an underline on hover.

### Badges
* **Style:** A subtle indicator. Use a soft green (`#E8F5E9`) pill with a `label-sm` text.
* **Icon:** Avoid heavy icons.

### Input Fields
* **Styling:** Minimalist bottom-border only or a "Ghost Border" (10% opacity `outline-variant`).
* **Focus State:** Transition the bottom border to `primary` (Navy). Labels should use `body-sm` and float above the input.


---

## 6. Do’s and Don’ts

### Do
* **Do** use asymmetrical layouts. A left-aligned headline with a wide right margin creates a sophisticated, professional tension.
* **Do** use `surface_container_highest` for "Active" states in navigation to subtly shift the paper tone.
* **Do** prioritize vertical rhythm. Use the Spacing Scale consistently to create a predictable "heartbeat" for the user.

### Don’t
* **Don’t** use high-contrast borders. If a user can see the border from a distance, it's too heavy.
* **Don’t** crowd the edges. If an element is within `spacing.4` (1.4rem) of a divider, increase the padding.
* **Don’t** use standard "Material Design" shadows. They are too aggressive for this "Paper-Like" system.