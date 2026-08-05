# SIARE design system

The whole system lives in `src/app/globals.css`. This file explains how to use
it and, more importantly, what not to do.

## The one rule

**Read tokens. Never write raw palette values.**

```tsx
// no
<div className="border-gray-200 bg-white text-gray-500">
<Button className="bg-blue-600 hover:bg-blue-700 text-white">

// yes
<div className="border-border bg-background text-muted-foreground">
<Button>
```

The second `Button` is already a SIARE button, because `--primary` is SIARE
blue. That was the actual bug this system fixes: `--primary` was an untouched
shadcn default (near-black), so every call site overrode it by hand. Some
overrode it to `blue-600`, some to `blue-700`, some not at all, and the
dashboard drifted away from the wizard one component at a time.

## Tokens

### Surfaces and text

| Token | Use |
|---|---|
| `bg-background` / `text-foreground` | Cards, panels, primary text |
| `bg-app` | The page ground. **Only the shell sets this** |
| `bg-muted` / `text-muted-foreground` | Secondary surfaces, hints, labels |
| `border-border` | Every border and divider |
| `ring-ring` | Focus rings |

A page must not paint its own background. The shell owns `bg-app`; a page that
sets its own is how two screens end up different shades of grey.

### Brand

`navy-950 … navy-600` — the brand ink and every dark surface. The sidebar is
`bg-navy-900`.

`brand-50 … brand-900` — the action colour. `brand-600` is primary,
`brand-400` is the accent that reads on navy.

### Status — four meanings, four colours

| Token | Meaning |
|---|---|
| `positive-*` | Feasible, passing, confirmed, above target |
| `caution-*` | Verify this, marginal, low confidence |
| `critical-*` | Not feasible, breach, error |
| `brand-*` | Informational |

A verdict, a confidence badge and an insight all read the same tokens, so they
speak the same language. Do not introduce a fifth colour for a fifth shade of
meaning — map it onto one of these four.

### Type

`font-sans` is Inter, `font-mono` is JetBrains Mono.

Two component classes carry the rest:

- **`.figure`** — every money and rate figure. Mono, tabular, semibold, so a
  column of numbers aligns and a value that changes does not shift the ones
  beside it.
- **`.eyebrow`** — the small uppercase label above a group.

## Dark surfaces

`muted-foreground` is tuned for contrast on light backgrounds. On navy it lands
around 3.4:1, under the 4.5:1 minimum. On a dark surface use `text-white` and
`text-slate-300` / `text-slate-400` instead.

## Adding a colour

Don't, unless it carries a meaning the four status tokens cannot. If you must,
add it to the `@theme inline` block in `globals.css` with a comment saying what
it means — never inline a hex value in a component.

## Gotcha: Turbopack and new token names

Adding a token *and* its first usage in the same edit can leave the dev server
serving a CSS chunk built before the new class existed, so the style silently
does nothing. `rm -rf .next` and restart. `next build` is always correct; if a
token works in a production build but not in dev, this is why.
