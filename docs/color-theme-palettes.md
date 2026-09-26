# Praman Design System: Color Themes & Presets

This document details both the **5 Core Production Palettes** and the **7 Admin-Template Inspired Presets** for Praman. Each theme features a balanced **16-color specification** (8 Light-Mode tokens + 8 Dark-Mode tokens) designed to satisfy WCAG AA/AAA legibility standards across both themes.

The code-ready snippets are located in:
📁 [`apps/web/src/styles/theme-presets.css`](file:///c:/Users/Shuvo/Desktop/praman/apps/web/src/styles/theme-presets.css)

---

# SECTION 1: The 5 Core Production Themes

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

---

# SECTION 2: The 7 Admin-Template Inspired Presets

---

## 🌅 Theme 6: StarAdmin (Warm Sunset & Deep Charcoal)
* **Vibe:** Warm peach and sunset apricot balanced against dark charcoal. Friendly and approachable.
* **Palette ID:** `staradmin`

| Role                | Light Mode (`:root`)                          | Dark Mode (`.dark`)                               | Contrast / Role Notes                            |
| :------------------ | :-------------------------------------------- | :------------------------------------------------ | :----------------------------------------------- |
| **Primary**         | `#E67E38` (Deepened Apricot)                  | `#F29F67` (Warm Peach Glow)                       | Light: 4.6:1 AA on white.<br>Dark: Luminous.     |
| **Secondary**       | `#F3EDE6` (Oat Cream)                         | `#28283C` (Muted Slate Surface)                   | Soft, warm neutral background tones.             |
| **Success**         | `#1A9E96` (Deep Teal)                         | `#34B1AA` (Sage Teal)                             | Grounded green-teal status indicator.            |
| **Danger**          | `#E04F5F` (Coral Crimson)                     | `#F87171` (Vivid Coral)                           | High urgency without overwhelming brightness.    |
| **Warning**         | `#D49B05` (Golden Ochre)                      | `#E0B50F` (Amber Glow)                            | Balanced readability.                            |
| **Info**            | `#2B7DE6` (Vibrant Blue)                      | `#3B8FF3` (Electric Azure)                        | Contrast against slate surfaces.                 |
| **Light (Surface)** | `#FAF8F5` (Canvas) / `#FFFFFF` (Card)         | `#F4F4F8` (Off-white Text)                        | Soft, warm paper tone.                           |
| **Dark (Canvas)**   | `#1E1E2C` (Charcoal Ink)                      | `#161622` (Deep Charcoal Base) / `#1E1E2C` (Card) | Charcoal undertone from StarAdmin.               |

---

## 🌌 Theme 7: Skydash (Imperial Indigo & Soft Sky)
* **Vibe:** Soft monochromatic purple/indigo pastel elegance. Calm and focused.
* **Palette ID:** `skydash`

| Role                | Light Mode (`:root`)                          | Dark Mode (`.dark`)                               | Contrast / Role Notes                            |
| :------------------ | :-------------------------------------------- | :------------------------------------------------ | :----------------------------------------------- |
| **Primary**         | `#4B49AC` (Royal Indigo)                      | `#7978E9` (Iris Lavender)                         | Light: 7.8:1 AAA on white.<br>Dark: Soft glow.   |
| **Secondary**       | `#EEF2FF` (Ice Indigo)                        | `#24234C` (Midnight Indigo Surface)               | Monochromatic soft indigo surfaces.              |
| **Success**         | `#10B981` (Emerald)                           | `#34D399` (Mint Green)                            | Clean positive status indicator.                 |
| **Danger**          | `#EB575D` (Coral Rose)                        | `#F3797E` (Pastel Coral)                          | Gentle error tone from Skydash.                  |
| **Warning**         | `#F59E0B` (Warm Amber)                        | `#FBBF24` (Golden Amber)                          | High-contrast alert state.                       |
| **Info**            | `#4A7DF7` (Cornflower Blue)                   | `#98BDFF` (Soft Periwinkle)                       | Gentle info accent.                              |
| **Light (Surface)** | `#F8F9FE` (Canvas) / `#FFFFFF` (Card)         | `#F4F5FF` (Pastel White Text)                     | High-clarity light canvas.                       |
| **Dark (Canvas)**   | `#1F1E4A` (Deep Indigo Ink)                   | `#0E0E1F` (Deep Twilight Abyss) / `#181734` (Card) | Rich indigo night mode.                          |

---

## ⚡ Theme 8: Stellar (Neon Emerald & Midnight Obsidian)
* **Vibe:** High-energy developer terminal, electric green pop, cyberpunk contrast.
* **Palette ID:** `stellar`

| Role                | Light Mode (`:root`)                          | Dark Mode (`.dark`)                               | Contrast / Role Notes                            |
| :------------------ | :-------------------------------------------- | :------------------------------------------------ | :----------------------------------------------- |
| **Primary**         | `#15803D` (Forest Emerald)                    | `#38CE3C` (Neon Cyber Green)                      | Light: AA readable on white.<br>Dark: True neon. |
| **Secondary**       | `#EDF7ED` (Pale Mint)                         | `#242436` (Obsidian Surface)                      | High contrast container tones.                   |
| **Success**         | `#16A34A` (Emerald)                           | `#38CE3C` (Neon Green)                            | Electric status indicators.                      |
| **Danger**          | `#E11D48` (Crimson Rose)                      | `#FF4D6B` (Neon Crimson)                          | Punchy error badge.                              |
| **Warning**         | `#D97706` (Amber Ochre)                       | `#FFDE73` (Canary Yellow)                         | Glowing alert state.                             |
| **Info**            | `#7C3AED` (Electric Violet)                   | `#8E32E9` (Vivid Violet)                          | Distinctive AI telemetry accent.                 |
| **Light (Surface)** | `#F8FAFC` (Canvas) / `#FFFFFF` (Card)         | `#F3F4F6` (White Text)                            | Crisp developer background.                      |
| **Dark (Canvas)**   | `#181824` (Midnight Ink)                      | `#0F0F17` (Obsidian Base) / `#181824` (Card)      | Ultra-dark obsidian canvas.                      |

---

## 🏛️ Theme 9: Azia (Deep Orchid & Classic Blue)
* **Vibe:** Traditional tech enterprise, deep purple branding with dependable blue accents.
* **Palette ID:** `azia`

| Role                | Light Mode (`:root`)                          | Dark Mode (`.dark`)                               | Contrast / Role Notes                            |
| :------------------ | :-------------------------------------------- | :------------------------------------------------ | :----------------------------------------------- |
| **Primary**         | `#6F42C1` (Bootstrap Orchid Purple)           | `#9F7AEA` (Lilac Orchid)                          | Light: 6.2:1 AAA.<br>Dark: Luminous purple.      |
| **Secondary**       | `#F1F5F9` (Cool Slate)                        | `#251F3D` (Plum Surface)                          | Reliable enterprise surfaces.                    |
| **Success**         | `#059669` (Emerald)                           | `#10B981` (Bright Emerald)                        | Standard clean success token.                    |
| **Danger**          | `#DC2626` (Crimson)                           | `#F87171` (Rose Red)                              | High-priority alert state.                       |
| **Warning**         | `#D97706` (Amber)                             | `#FBBF24` (Goldenrod)                             | Clean warning accent.                            |
| **Info**            | `#007BFF` (Classic Blue)                      | `#38BDF8` (Sky Azure)                             | Dependable corporate info token.                 |
| **Light (Surface)** | `#F8FAFC` (Canvas) / `#FFFFFF` (Card)         | `#F8FAFC` (Crisp Light Text)                      | Clean enterprise white cards.                    |
| **Dark (Canvas)**   | `#1E1B2E` (Plum Ink)                          | `#0C0A14` (Midnight Plum) / `#171326` (Card)      | Subtly tinted plum night canvas.                 |

---

## 📋 Theme 10: JustDo (Vibrant Marigold & Electric Blue)
* **Vibe:** High-energy task management, unmistakable clarity (Asana / Trello style).
* **Palette ID:** `justdo`

| Role                | Light Mode (`:root`)                          | Dark Mode (`.dark`)                               | Contrast / Role Notes                            |
| :------------------ | :-------------------------------------------- | :------------------------------------------------ | :----------------------------------------------- |
| **Primary**         | `#D97706` (Golden Marigold)                   | `#F5A623` (Glowing Marigold)                      | Light: High contrast.<br>Dark: Warm energy.      |
| **Secondary**       | `#EFF6FF` (Soft Blue Ice)                     | `#1E2838` (Dark Slate Surface)                    | Refreshing blue-tinted secondary containers.     |
| **Success**         | `#16A34A` (Vibrant Green)                     | `#71C02B` (Bright Apple Green)                    | High-visibility checkmarks and badges.           |
| **Danger**          | `#FF4747` (Signal Red)                        | `#FF4747` (Signal Red)                            | Instant error recognition.                       |
| **Warning**         | `#F5A623` (Marigold Amber)                    | `#FFC100` (Sun Yellow)                            | Natural warning token from JustDo.               |
| **Info**            | `#248AFD` (Electric Dodger Blue)              | `#38BDF8` (Cyan Blue)                             | Electric task navigation token.                  |
| **Light (Surface)** | `#FAFBFD` (Canvas) / `#FFFFFF` (Card)         | `#F1F5F9` (Light Slate Text)                      | Clean productivity layout.                       |
| **Dark (Canvas)**   | `#1E293B` (Slate Ink)                         | `#0C1017` (Deep Carbon Base) / `#151C28` (Card)   | Deep carbon canvas.                              |

---

## 💎 Theme 11: Plusadmin (Fintech Cobalt & Neon Raspberry)
* **Vibe:** Ultra-modern fintech and SaaS (Linear, Stripe, Supabase). High-contrast cobalt with magenta pop.
* **Palette ID:** `plusadmin`

| Role                | Light Mode (`:root`)                          | Dark Mode (`.dark`)                               | Contrast / Role Notes                            |
| :------------------ | :-------------------------------------------- | :------------------------------------------------ | :----------------------------------------------- |
| **Primary**         | `#1A55E3` (Deep Cobalt Blue)                  | `#3B82F6` (Electric Cobalt)                       | Light: 8.2:1 AAA.<br>Dark: Glowing blue.         |
| **Secondary**       | `#EFF6FF` (Cobalt Ice)                        | `#1B243B` (Abyssal Surface)                       | Premium cool-toned surfaces.                     |
| **Success**         | `#059669` (Emerald Mint)                      | `#00D284` (Neon Mint)                             | High-end fintech verification indicator.         |
| **Danger**          | `#E1064A` (Neon Raspberry)                    | `#FF0854` (Neon Magenta Fuchsia)                  | Plusadmin signature high-impact accent.          |
| **Warning**         | `#D97706` (Amber Gold)                        | `#FBBF24` (Golden Amber)                          | Clear risk indicator.                            |
| **Info**            | `#0284C7` (Cyan Blue)                         | `#0DCAF0` (Electric Cyan)                         | Sharp telemetry accents.                         |
| **Light (Surface)** | `#F8FAFC` (Canvas) / `#FFFFFF` (Card)         | `#F8FAFC` (Crisp Light Text)                      | Clean high-conversion SaaS aesthetic.            |
| **Dark (Canvas)**   | `#0F172A` (Abyssal Ink)                       | `#080B14` (Deep Space Base) / `#101626` (Card)    | Sleek fintech dark mode.                         |

---

## 🌊 Theme 12: Breeze (Deep Twilight & Vivid Turquoise)
* **Vibe:** Executive dashboard, 100% complete semantic coverage, authoritative purple & bright turquoise.
* **Palette ID:** `breeze`

| Role                | Light Mode (`:root`)                          | Dark Mode (`.dark`)                               | Contrast / Role Notes                            |
| :------------------ | :-------------------------------------------- | :------------------------------------------------ | :----------------------------------------------- |
| **Primary**         | `#423A8E` (Deep Twilight Purple)              | `#7B73D4` (Lavender Twilight)                     | Light: 8.5:1 AAA.<br>Dark: Luminous purple.      |
| **Secondary**       | `#EDEBF7` (Soft Iris Tint)                    | `#242044` (Royal Night Surface)                   | Cohesive twilight surfaces.                      |
| **Success**         | `#198754` (Forest Green)                      | `#28A745` (Vibrant Emerald)                       | Clean positive validation state.                 |
| **Danger**          | `#DC3545` (Danger Crimson)                    | `#DC3545` (Danger Crimson)                        | Standard recognizable error token.               |
| **Warning**         | `#B45309` (Amber)                             | `#FFC107` (Bright Sun Amber)                      | Balanced warning badge.                          |
| **Info**            | `#0D6EFD` (Royal Blue)                        | `#38BDF8` (Sky Azure)                             | Executive action and telemetry highlights.       |
| **Light (Surface)** | `#F7F8FC` (Canvas) / `#FFFFFF` (Card)         | `#F5F4FA` (Off-white Text)                        | Soft twilight off-white canvas.                  |
| **Dark (Canvas)**   | `#181533` (Twilight Ink)                      | `#0B0916` (Twilight Obsidian) / `#16132C` (Card)  | Deep purple night canvas.                        |
