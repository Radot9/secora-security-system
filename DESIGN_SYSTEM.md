# Secora Security System Design System v1.1

## Design Philosophy

Secora is a modern estate security platform designed for:

* Residents
* Security Personnel
* Estate Administrators

The interface prioritizes:

1. Clarity
2. Trust
3. Accessibility
4. Speed
5. Professionalism

Every screen should communicate security, confidence, and ease of use.

---

# Design Principles

## Clarity First

Users should understand a screen within 3 seconds.

Avoid:

* Dense interfaces
* Tiny text
* Complex navigation

Prefer:

* Clear hierarchy
* Large touch targets
* Minimal decision points

---

## Security First

Visual language should reinforce:

* Trust
* Verification
* Authority
* Safety

---

## Accessibility First

Design for:

* Elderly residents
* First-time users
* Low technical literacy

Use:

* High contrast
* Large fonts
* Clear labels
* Consistent interactions

---

# Color System

## Primary Navy

```css
#041B4A
```

Used for:

* Primary buttons
* Headers
* Navigation
* Security actions

---

## Premium Gold

```css
#C8942F
```

Used for:

* Active states
* Highlights
* Icons
* Premium indicators

---

## Success

```css
#16A34A
```

Examples:

* Valid Pass
* Verified
* Checked In

---

## Warning

```css
#D97706
```

Examples:

* Pending Visitor
* Awaiting Action

---

## Danger

```css
#DC2626
```

Examples:

* Revoked Pass
* Expired Pass
* Denied Entry

---

## Information

```css
#0284C7
```

Examples:

* Notifications
* Updates
* System Messages

---

# Neutral Palette

## Background

```css
#FAFAFA
```

---

## Surface

```css
#FFFFFF
```

---

## Border

```css
#E5E7EB
```

---

## Text Primary

```css
#111827
```

---

## Text Secondary

```css
#6B7280
```

---

# Typography

## Font Family

Primary:

```css
font-family: Inter, sans-serif;
```

Alternative:

```css
font-family: Plus Jakarta Sans, sans-serif;
```

---

# Typography Scale

All typography uses rem units.

## Display

```css
2.5rem
font-weight: 700;
```

Tailwind:

```html
text-4xl
```

---

## Page Title

```css
2rem
font-weight: 700;
```

Tailwind:

```html
text-3xl
```

Examples:

* Dashboard
* Visitors
* Security

---

## Section Title

```css
1.5rem
font-weight: 700;
```

Tailwind:

```html
text-2xl
```

Examples:

* Today's Activity
* Visitor History

---

## Card Title

```css
1.125rem
font-weight: 600;
```

Tailwind:

```html
text-lg
```

---

## Body

```css
1rem
font-weight: 400;
```

Tailwind:

```html
text-base
```

---

## Small

```css
0.875rem
font-weight: 400;
```

Tailwind:

```html
text-sm
```

---

## Caption

```css
0.75rem
font-weight: 400;
```

Tailwind:

```html
text-xs
```

---

# Spacing System

All spacing uses rem.

## Scale

| Token | Value   |
| ----- | ------- |
| xs    | 0.5rem  |
| sm    | 0.75rem |
| md    | 1rem    |
| lg    | 1.5rem  |
| xl    | 2rem    |
| 2xl   | 3rem    |

---

## Recommended Usage

Cards:

```css
padding: 1.5rem;
```

Sections:

```css
margin-bottom: 2rem;
```

Page Layout:

```css
gap: 2rem;
```

---

# Border Radius

## Small

```css
0.75rem
```

---

## Medium

```css
1rem
```

Inputs

Buttons

---

## Large

```css
1.5rem
```

Cards

---

## Pill

```css
9999px
```

Status badges

---

# Buttons

## Primary

Background:

```css
#041B4A
```

Text:

```css
#FFFFFF
```

Height:

```css
3.5rem
```

---

## Secondary

Background:

```css
#FFFFFF
```

Border:

```css
1px solid #041B4A
```

---

## Destructive

Background:

```css
#FFFFFF
```

Border:

```css
1px solid #DC2626
```

Text:

```css
#DC2626
```

Examples:

* Revoke Pass
* Delete Visitor

---

# Cards

Standard Card

```css
background: #FFFFFF;
border-radius: 1.5rem;
padding: 1.5rem;
border: 1px solid #E5E7EB;
```

---

# Status System

## Valid Pass

Color:

```css
#16A34A
```

Display:

```text
🟢 Valid Pass
```

---

## Pending

Color:

```css
#D97706
```

Display:

```text
🟡 Pending Entry
```

---

## Revoked

Color:

```css
#DC2626
```

Display:

```text
🔴 Access Revoked
```

---

## Expired

Color:

```css
#DC2626
```

Display:

```text
⛔ Pass Expired
```

---

## Checked Out

Color:

```css
#6B7280
```

Display:

```text
⚪ Visitor Left
```

---

# Navigation

## Mobile

Bottom Navigation

Maximum:

```text
4 items
```

Recommended:

* Home
* Visitors
* Activity
* Settings

---

## Desktop

Sidebar Navigation

Width:

```css
18rem
```

---

# Layout Rules

## Mobile

```css
0 - 767px
```

Single column only.

---

## Tablet

```css
768px - 1023px
```

Allow two-column layouts.

---

## Desktop

```css
1024px+
```

Sidebar enabled.

Multi-column layouts allowed.

---

# Accessibility

Minimum touch target:

```css
2.75rem
```

Preferred touch target:

```css
3.5rem
```

---

# Empty States

Every page must have an empty state.

Examples:

## Currently Inside

```text
No visitors currently inside the estate.
```

---

## Visitor History

```text
No visitor records found.
```

---

## Search

```text
No visitors match your search.
```

---

# Development Standards

## Use rem for

* Typography
* Padding
* Margin
* Gap
* Component sizing

---

## Use px only for

* Borders
* Dividers
* Icon dimensions when necessary

---

## Never Hardcode Colors

Use design tokens or Tailwind theme variables.

---

# Future Features

* Resident Management
* Visitor History
* Access Logs
* Estate Analytics
* Camera QR Scanner
* Multi-Estate Support
* Push Notifications
* Incident Reporting
