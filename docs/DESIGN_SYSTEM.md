# ─── Bozone Design System ───

## Brand Identity

| Token | Value |
|-------|-------|
| Brand Name | Bozone |
| Tagline | 跨境，更进一步 |
| Brand Essence | Borderless Commerce, Human Control |
| Brand Personality | Professional, Trustworthy, Modern, Warm |

---

## Color System

### Primary Palette ("Warm Industrial")

```
# Warm Stone Collection
─────────────────────────
Background:    #F7F5F2  (warm parchment)
Surface:       #FFFFFF  (crisp white)
Surface Alt:   #F0EDE8  (warm sand)
Border:        #E5E0D8  (limestone)
Border Strong: #D4CEC4  (weathered stone)

# Depth Collection  
─────────────────────────
Deep Base:     #1C1917  (obsidian)
Deep Alt:      #2D2925  (charcoal)
Mid Gray:      #6B6560  (slate)
Text Primary:  #1C1917  (obsidian)
Text Secondary:#78716C  (warm gray)
Text Tertiary: #A8A29E  (stone)

# Accent Collection
─────────────────────────
Amber (Primary): #D97706  (desk lamp glow)
Amber Light:     #FDE68A  (warm candle)
Amber Dark:      #92400E  (burnished copper)

Semantic Colors:
─────────────────────────
Success:  #059669  (emerald green)
Warning:  #D97706  (amber, same as accent)
Danger:   #DC2626  (red)
Info:     #2563EB  (only blue — used exclusively for links/hyperlinks)
```

### Palette Rationale
- **93% of competitors use blue** → Bozone deliberately avoids blue as primary
- Warm amber provides visual differentiation AND psychological warmth
- Info blue is restricted to links only — the ONE place users expect blue
- The obsidian/charcoal base replaces the generic sidebar dark blue

---

## Typography

### Font Stack

```css
/* Headings */
--font-heading: 'Geist', -apple-system, sans-serif;

/* Body */
--font-body: 'Geist', -apple-system, sans-serif;

/* Data / Numbers */
--font-mono: 'Geist Mono', 'JetBrains Mono', monospace;
```

### Type Scale

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| H1 | 28px (1.75rem) | 700 | Page titles |
| H2 | 22px (1.375rem) | 600 | Section headers |
| H3 | 18px (1.125rem) | 600 | Card titles |
| H4 | 16px (1rem) | 600 | Subsection labels |
| Body | 14px (0.875rem) | 400 | Primary text |
| Body-S | 13px (0.8125rem) | 400 | Secondary text |
| Caption | 12px (0.75rem) | 400 | Meta / labels |
| Data | 14px (0.875rem) | 500 | Table data, numbers |

### Line Height
- Headings: 1.2
- Body: 1.6
- Data/Table: 1.4

---

## Spacing System

```
Unit: 4px base
───────────────
0.5x = 2px   (hairline)
1x   = 4px   (tight)
2x   = 8px   (compact)
3x   = 12px  (standard)
4x   = 16px  (comfortable)
6x   = 24px  (generous)
8x   = 32px  (section)
12x  = 48px  (page padding)
```

---

## Border Radius

```
───────────────
Input / Button / Tag:  6px
Card / Panel:          10px
Modal / Drawer:        14px
Avatar / Badge:        circle (50%)
```

---

## Shadows

### Depth Scale (atmospheric, colored shadows)

```css
--shadow-xs:  0 1px 2px rgba(28,25,23,0.04);
--shadow-sm:  0 2px 8px rgba(28,25,23,0.06);
--shadow-md:  0 4px 16px rgba(28,25,23,0.08);
--shadow-lg:  0 8px 32px rgba(28,25,23,0.10);
--shadow-xl:  0 16px 48px rgba(28,25,23,0.12);
```

### Glow (amber accent only)

```css
--glow-amber: 0 0 20px rgba(217,119,6,0.15);
```

---

## Component Tokens

### Navigation

```
Sider Background:    #1C1917 (obsidian)
Sider Text:          #A8A29E (stone)
Sider Text Active:   #F7F5F2 (warm parchment)
Sider Icon:          #78716C (warm gray)
Sider Border:        #2D2925 (charcoal)
Sider Width:         240px (expanded) / 64px (collapsed)
```

### Page Header

```
Background:          transparent
Title:               H1, Geist 700, #1C1917
Subtitle:            Body, Geist 400, #78716C
Divider:             none (spacing-based separation)
```

### Cards

```
Background:          #FFFFFF
Border:              1px #E5E0D8 (limestone)
Border Radius:       10px
Shadow:              --shadow-sm
Padding:             24px
Hover:               --shadow-md + border #D4CEC4
```

### Tables

```
Header Background:   #F0EDE8 (warm sand)
Header Text:         #6B6560 (slate), Geist 600, 13px
Row Background:      #FFFFFF
Row Alt Background:  #FAFAF8
Row Hover:           #F7F5F2
Border:              #E5E0D8 (limestone)
Cell Padding:        12px 16px
Border Radius:       10px (table container)
```

### Buttons

```
Primary:
  Background:  #D97706 (amber)
  Text:        #FFFFFF
  Hover:       #B45309 (amber dark)
  Border:      none
  Radius:      6px
  Height:      36px (default) / 40px (large) / 28px (small)

Secondary:
  Background:  transparent
  Text:        #1C1917
  Border:      1px #D4CEC4
  Hover:       background #F0EDE8

Ghost:
  Background:  transparent
  Text:        #6B6560
  Hover:       background #F0EDE8
```

### Inputs

```
Background:          #FFFFFF
Border:              1px #E5E0D8
Focus Border:        1px #D97706
Focus Shadow:        --glow-amber
Border Radius:       6px
Height:              36px
Placeholder:         #A8A29E
```

### Status Tags

```
Success:  bg #ECFDF5 text #059669 border #A7F3D0
Warning:  bg #FFF7ED text #D97706 border #FED7AA
Danger:   bg #FEF2F2 text #DC2626 border #FECACA
Info:     bg #EFF6FF text #2563EB border #BFDBFE
Default:  bg #F0EDE8 text #6B6560 border #D4CEC4
Border Radius:       6px
Padding:             2px 10px
Font Size:           12px
```

### Modals

```
Background:          #FFFFFF
Border Radius:       14px
Shadow:              --shadow-xl
Header:              22px Geist 600, bottom border #E5E0D8
Max Width:           520px (small) / 720px (medium) / 960px (large)
Overlay:             rgba(28,25,23,0.4) + backdrop blur
```

### Charts (ECharts)

```
Line Color (Profit):   #059669 (emerald)
Line Color (Revenue):  #D97706 (amber)
Bar Color:             #F0EDE8 (sand) → #D97706 (amber, active)
Area Fill Opacity:     0.08
Grid Color:            #E5E0D8
Axis Text:             12px #78716C
```

---

## Dashboard Layout Spec

```
┌──────────────────────────────────────────────────────────┐
│  [Logo]  Bozone                           [User] [⚙]     │  ← 56px header
├────────┬─────────────────────────────────────────────────┤
│        │                                                 │
│  📊    │  Dashboard                              [Date]  │  ← page header
│  仪表盘 │  Welcome back, team                              │
│        │                                                 │
│  📦    │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │  ← stat cards
│  店铺   │  │Revenue│ │Orders│ │Profit│ │  ROI  │          │     (4 cols)
│        │  └──────┘ └──────┘ └──────┘ └──────┘          │
│  📋    │                                                 │
│  订单   │  ┌───────────────────┐ ┌──────────────────┐   │  ← charts
│        │  │   Profit Trend     │ │   Top Products    │   │     (2 cols)
│  🛒    │  │                   │ │                  │   │
│  商品   │  └───────────────────┘ └──────────────────┘   │
│        │                                                 │
│  🤝    │  ┌────────────────────────────────────────┐    │  ← table
│  达人   │  │   Recent Orders                         │    │     (full width)
│        │  └────────────────────────────────────────┘    │
│  🎬    │                                                 │
│  AI内容 │                                                 │
│        │                                                 │
│  💰    │                                                 │
│  财务   │                                                 │
│        │                                                 │
│  ⚙    │                                                 │
│  设置   │                                                 │
│        │                                                 │
└────────┴─────────────────────────────────────────────────┘
  240px                        calc(100% - 240px)
```

### Design Dial Settings
```
DESIGN_VARIANCE:  4 (moderate — professional but not boring)
MOTION_INTENSITY: 5 (fluid — smooth transitions, subtle scroll reveals)
VISUAL_DENSITY:   4 (airy — generous spacing, data given room)
```

---

## Page List & Wireframe Notes

### 1. Dashboard (仪表盘)
- 4 stat cards: Revenue, Orders, Net Profit, ROI
- Profit trend chart (last 30 days, line + area)
- Top 10 hot products (horizontal bar)
- Recent orders table (last 10)
- Quick actions: New Order, Import Data

### 2. Shops (店铺管理)
- Shop list table: Name, Platform, Status, Orders Today, Revenue
- Add shop modal: Connect TikTok Shop / Shopee / Lazada
- Shop detail: stats, order chart, product list

### 3. Orders (订单管理)
- Filter bar: Date range, Shop, Status, Search
- Order table: Order No, Shop, Product, Amount, Status, Time
- Order detail drawer: Items, Cost breakdown, Profit summary
- Batch actions: Mark shipped, Cancel, Export

### 4. Products (商品管理)
- Product grid/table toggle
- Product card: Image, Name, Price, Stock, Weight
- Add/Edit product modal
- SKU management sub-panel

### 5. Influencers (达人BD)
- Influencer table: Name, Platform, Followers, Cooperation Status
- CRM timeline per influencer
- Daily/Weekly reports
- Commission calculator

### 6. AI Studio (AI内容)
- Video generation panel (Seedance 2.0 integration)
- Material library: Images, Videos grid
- Generation history
- Batch generation queue

### 7. Finance (财务管理)
- Cost items configuration
- Profit calculation by product
- Order profit details with cost breakdown
- Exchange rate management
- Profit trend analysis

### 8. Settings (系统设置)
- User & permission management
- System configuration
- Audit logs
- API keys & integrations

---

## Animation Guidelines

### Page Transitions
- Route changes: subtle fade (200ms) + slide up (8px)
- Tab switches: instant (no animation — speed over flash)

### Scroll Reveal
- Stat cards: stagger reveal (50ms delay per card)
- Table rows: no animation (instant for data integrity)

### Interactive
- Button hover: background transition 150ms ease-out
- Card hover: shadow scale + border highlight 200ms
- Modal open: scale 0.95→1.0 + fade 200ms spring
- Dropdown: slideDown 150ms with fade

### Data Updates
- Number changes: count-up animation (easing, not spring)
- Chart transitions: morph (ECharts native, 300ms)
- Filter changes: table shimmer 400ms

### Perpetual (subtle)
- Dashboard welcome: subtle breathing opacity on stat cards (once on load)
- Loading: amber skeleton pulse (not blue shimmer)
- Real-time badge: gentle pulse on "Live" indicator
