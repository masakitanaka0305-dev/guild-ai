# GUILD AI Water Theme — Engineer MVP Core

## Design Principle: Essentialism
- No Animation: transitions/animations disabled via `[data-anim="off"]`
- Fast Response: data reflects immediately on click
- Zero Typing: apply flow is select box + button only

## Color Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#06B6D4` (cyan-500) | CTAs, active states, Recommended border |
| `--primary-hover` | `#0891B2` (cyan-600) | Hover states |
| `--bg` | `#020617` (slate-950) | Page background |
| `--surface` | `#0F172A` (slate-900) | Card background |
| `--muted` | `#94A3B8` (slate-400) | Secondary text |
| `--negative` | `#E64545` | Error/negative indicators (unchanged) |

## Screens
### Deploy (/onboarding)
- Text table of GitHub repos → Analyze button → draft page → Mint
### Projects (/projects)
- Match Score column, Recommended border (>=80%) with cyan left border
### Apply (/projects/[id])
- MD select box + single apply button, zero form fields
### Applications (/applications)
- Status text steps: 受付 → AI鑑定中 → クライアント確認中
