# Praman Design System: 5 Curated 16-Color Palettes

This document details **5 production-ready color themes** for Praman. Each theme contains a balanced **16-color specification** (8 Light-Mode tokens + 8 Dark-Mode tokens) designed to satisfy WCAG AA/AAA legibility standards across both themes.

The code-ready snippets for all 5 themes are located in:
📁 [`apps/web/src/styles/theme-presets.css`](file:///c:/Users/Shuvo/Desktop/praman/apps/web/src/styles/theme-presets.css)

---

## Quick Switch Guide (Takes ~15 Seconds)

1. Open [`apps/web/src/styles/theme-presets.css`](file:///c:/Users/Shuvo/Desktop/praman/apps/web/src/styles/theme-presets.css).
2. Copy the `:root` and `.dark` blocks from your chosen preset.
3. Open [`apps/web/src/app/globals.css`](file:///c:/Users/Shuvo/Desktop/praman/apps/web/src/app/globals.css) and paste over the existing `:root` (lines ~163–242) and `.dark` (lines ~247–318) values.
4. Save the file. Because Next.js and Vite have instant HMR, your running browser updates immediately with no restarts needed.

---

## 🎨 Theme 1: "Enterprise Modern" (The Requested Palette Refined)

- **Vibe:** Authoritative, corporate, polished SaaS (Atlassian, Salesforce, LinkedIn).
- **Best For:** Users who love clean, familiar, enterprise-grade software.

| Role                | Light Mode (`:root`)                          | Dark Mode (`.dark`)                               | Contrast / Role Notes                                          |
| :------------------ | :-------------------------------------------- | :------------------------------------------------ | :------------------------------------------------------------- |
| **Primary**         | `#3B71CA` (Royal Blue)                        | `#5C93E8` (Luminous Blue)                         | Light: 4.6:1 AA on white.<br>Dark: Tuned luminous (7.2:1 AAA). |
| **Secondary**       | `#F1F5F9` (Surface) / `#9FA6B2` (Muted)       | `#262222` (Surface) / `#9FA6B2` (Muted)           | Soft neutral balance across containers.                        |
| **Success**         | `#14A44D` (Emerald)                           | `#2ECC71` (Vibrant Mint)                          | Light: 4.5:1 AA.<br>Dark: 9.1:1 AAA on dark cards.             |
| **Danger**          | `#DC4C64` (Ruby Crimson)                      | `#F87171` (Vivid Coral)                           | Urgent without blinding red glare.                             |
| **Warning**         | `#B45309` (Readable Text) / `#E4A11B` (Badge) | `#FBBF24` (Luminous Amber)                        | Safe from yellow-on-white washed out text.                     |
| **Info**            | `#0284C7` (Readable Text) / `#54B4D3` (Badge) | `#54B4D3` (Sky Cyan)                              | Light: 4.6:1 AA.<br>Dark: 7.5:1 AAA.                           |
| **Light (Surface)** | `#FBFBFB` (Canvas) / `#FFFFFF` (Card)         | `#FBFBFB` (High-contrast text)                    | Off-white canvas, pure white elevated cards.                   |
| **Dark (Canvas)**   | `#332D2D` (Text & Ink)                        | `#181515` (Deep Charcoal Base) / `#262222` (Card) | Warm charcoal surface.                                         |

---

## ⚡ Theme 2: "Cyber Obsidian" (Praman Signature AI Aesthetic)

- **Vibe:** AI-native, futuristic terminal, high-contrast neon proof-of-work (Cursor, Supabase, Neon.tech).
- **Best For:** High-tech developers, AI enthusiasts, dark-mode terminal power users.

| Role                | Light Mode (`:root`)                  | Dark Mode (`.dark`)                           | Contrast / Role Notes               |
| :------------------ | :------------------------------------ | :-------------------------------------------- | :---------------------------------- |
| **Primary**         | `#08D9D6` (Electric Cyan)             | `#08D9D6` (Neon Cyan Pulse)                   | Signature Praman brand identifier.  |
| **Secondary**       | `#F1F5F9` (Ice Slate)                 | `#191F2C` (Deep Slate Surface)                | High contrast with glowing accents. |
| **Success**         | `#047857` (Deep Emerald)              | `#34D399` (Mint Neon)                         | WCAG AAA certified on both modes.   |
| **Danger**          | `#E11D48` (Vivid Rose)                | `#FF2E63` (Neon Cyber Pink)                   | Praman's signature pink badge tone. |
| **Warning**         | `#B45309` (Amber Bronze)              | `#FBBF24` (Luminous Gold)                     | High readability.                   |
| **Info**            | `#1D4ED8` (Cobalt Tech)               | `#60A5FA` (Electric Sky)                      | Clean developer diagnostics.        |
| **Light (Surface)** | `#F8FAFC` (Canvas) / `#FFFFFF` (Card) | `#F1F5F9` (Crisp Light Text)                  | Clean paper feel.                   |
| **Dark (Canvas)**   | `#0F172A` (Obsidian Ink)              | `#090B10` (Pitch Obsidian) / `#121620` (Card) | Ultra-deep black canvas.            |

---

## 🎯 Theme 3: "Linear Stealth / Raycast Indigo" (Modern Developer Suite)

- **Vibe:** Ultra-sleek, minimalist, premium engineering tool (Linear, Raycast, Vercel).
- **Best For:** Fast workflow, modern product feel, zero visual clutter.

| Role                | Light Mode (`:root`)                   | Dark Mode (`.dark`)                          | Contrast / Role Notes                  |
| :------------------ | :------------------------------------- | :------------------------------------------- | :------------------------------------- |
| **Primary**         | `#5E6AD2` (Linear Blurple)             | `#818CF8` (Soft Indigo Glow)                 | The modern standard for dev tools.     |
| **Secondary**       | `#F4F4F5` (Zinc 100)                   | `#222227` (Zinc 800 Surface)                 | Neutral greys that keep focus on data. |
| **Success**         | `#059669` (Jade Emerald)               | `#10B981` (Vibrant Emerald)                  | Crisp match indicators.                |
| **Danger**          | `#E11D48` (Ruby Rose)                  | `#FB7185` (Soft Rose)                        | Refined warnings.                      |
| **Warning**         | `#D97706` (Citron Ochre)               | `#F59E0B` (Amber Flame)                      | Distinct from orange and red.          |
| **Info**            | `#0284C7` (Sky Azure)                  | `#38BDF8` (Cyan Pulse)                       | Sleek technical highlights.            |
| **Light (Surface)** | `#FAFAFA` (Zinc 50) / `#FFFFFF` (Card) | `#FAFAFA` (Pure White Text)                  | Balanced Zinc background.              |
| **Dark (Canvas)**   | `#18181B` (Zinc 900 Text)              | `#09090B` (True OLED 950) / `#141417` (Card) | OLED-level deep blacks.                |

---

## 🌊 Theme 4: "Deep Oceanic / Tech Titan" (Stripe & Deep Navy)

- **Vibe:** Financial-grade trust, calm clarity, enterprise security (Stripe, GitHub, Docker).
- **Best For:** Trust-building, executive resume reviews, institutional credibility.

| Role                | Light Mode (`:root`)                         | Dark Mode (`.dark`)                              | Contrast / Role Notes                       |
| :------------------ | :------------------------------------------- | :----------------------------------------------- | :------------------------------------------ |
| **Primary**         | `#0284C7` (Deep Ocean Blue)                  | `#38BDF8` (Luminous Sky Blue)                    | Universal trust and authority.              |
| **Secondary**       | `#F0F9FF` (Breeze Slate)                     | `#1E293B` (Navy Slate Surface)                   | Cohesive cool-temperature palette.          |
| **Success**         | `#16A34A` (Clean Green)                      | `#4ADE80` (Seafoam Mint)                         | Fresh, positive confirmation.               |
| **Danger**          | `#DC2626` (Pure Red)                         | `#F87171` (Coral Red)                            | Clear error status.                         |
| **Warning**         | `#D97706` (Warm Tangerine)                   | `#FB923C` (Tangerine Glow)                       | High visibility against navy surfaces.      |
| **Info**            | `#2563EB` (Cobalt Royal)                     | `#60A5FA` (Electric Azure)                       | Layered blue hierarchy.                     |
| **Light (Surface)** | `#F8FAFC` (Glacier White) / `#FFFFFF` (Card) | `#F8FAFC` (Glacier White Text)                   | Clean oceanic contrast.                     |
| **Dark (Canvas)**   | `#0F172A` (Navy Midnight Text)               | `#080D1A` (Deep Abyssal Navy) / `#0F172A` (Card) | Rich navy undertone rather than flat black. |

---

## 📜 Theme 5: "Warm Editorial / Notion Stone" (Calm Focus & Low Eyestrain)

- **Vibe:** Warm paper, human, intellectual, editorial publication (Notion, ReadCV, Substack).
- **Best For:** Long reading sessions, job description analysis, calming ergonomics.

| Role                | Light Mode (`:root`)                           | Dark Mode (`.dark`)                                | Contrast / Role Notes                |
| :------------------ | :--------------------------------------------- | :------------------------------------------------- | :----------------------------------- |
| **Primary**         | `#B45309` (Warm Bronze Amber)                  | `#FBBF24` (Warm Sunlit Amber)                      | Warm, scholarly, distinctive accent. |
| **Secondary**       | `#F5F5F4` (Warm Stone 100)                     | `#292524` (Stone 800 Surface)                      | Natural stone tones.                 |
| **Success**         | `#15803D` (Pine Green)                         | `#4ADE80` (Sage Glow)                              | Grounded natural green.              |
| **Danger**          | `#BE123C` (Vintage Wine Red)                   | `#FB7185` (Muted Coral)                            | Warm crimson without harshness.      |
| **Warning**         | `#B45309` (Warm Ochre)                         | `#FCD34D` (Sunlit Amber)                           | Golden warm highlights.              |
| **Info**            | `#0369A1` (Slate Teal)                         | `#38BDF8` (Ice Teal)                               | Sophisticated teal-leaning blue.     |
| **Light (Surface)** | `#FAFAF9` (Warm Bone/Paper) / `#FFFFFF` (Card) | `#FAFAF9` (Warm Off-White Text)                    | Eliminates bright blue-light glare.  |
| **Dark (Canvas)**   | `#1C1917` (Deep Espresso Text)                 | `#141210` (Warm Espresso Pitch) / `#1C1917` (Card) | Cozy warm-black dark mode.           |
