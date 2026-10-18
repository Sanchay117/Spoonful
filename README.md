# Spoonful

**A to-do list that shrinks to fit how much energy you have today.**

Built for [Taskforge](https://taskforge.devpost.com/), a student hackathon about accessible tools that help people focus, organize, and get more done.

## The problem

For people living with chronic illness (long COVID, ME/CFS) or ADHD, energy changes a lot from day to day. On a bad day, opening a list of twenty tasks is the problem in itself: it makes you feel behind, so you close the app and do nothing. Most to-do apps make this worse with overdue badges, streaks and counters that turn a hard day into a failure.

## What Spoonful does

Each morning you answer one question: how much energy do you have today?

| Energy | What you see |
| --- | --- |
| **Good** | Your full list, gentlest tasks first. |
| **Okay** | Only the top 3 light or medium tasks. Everything else is "resting": hidden, never deleted. |
| **Low** | One light task, full screen, with two big buttons: **Done** and **Not today**. If nothing light is left: "Nothing needed today. Rest counts." |

- Every task is tagged **Light**, **Medium** or **Heavy** when you add it.
- **Not today** quietly moves a task to tomorrow. It is never recorded as a failure.
- No streaks, no red overdue labels, no progress percentages, no guilt counters. Anywhere.
- The background slowly shifts colour with your energy: sunrise for Good, lavender for Okay, deep night for Low.

## Accessibility

Accessibility is the core of the project, not an add-on.

- Fully usable with a keyboard alone, with visible focus states.
- Screen-reader labels throughout, and view changes are announced with a polite live region.
- Tap targets of at least 48px, and text meets WCAG AA contrast over the gradients.
- Respects the system "reduce motion" setting, and has its own **Calm mode** toggle that stops all ambient animation.
- No flashing or fast motion anywhere.
- Plain, kind language in all copy.

These promises are checked automatically. The test suite runs [axe](https://github.com/dequelabs/axe-core) on every view and fails on any violation. It also checks that Low mode never shows more than one task, that "Not today" leaves no failure record, and that reduced motion really turns the animation off.

## For the demo

- **Demo day** (header button) loads 20 realistic tasks.
- **Compare** (header button, or press **C**) shows a split screen: a typical cluttered to-do app on the left and the same day in Spoonful's Low mode on the right. Press **Escape** to close it.

## Run it

Requires Node 18 or newer.

```bash
npm install
npm run dev
```

Then open the local address Vite prints (usually http://localhost:5173).

Build for production:

```bash
npm run build
```

The static site ends up in `dist/`. It deploys to Netlify as is (see `netlify.toml`) or to any static host. Spoonful is an installable PWA and works offline once loaded.

## Tests

```bash
npx playwright install chromium
npm test
```

`npm test` builds the app and then runs the 15 Playwright tests against the production build.

## Tech

React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, lucide-react icons, Playwright with @axe-core/playwright. Data is stored in the browser's localStorage. There is no backend and no account.

## Limitations

- Data lives on one device in one browser. There is no sync, and clearing site data erases your tasks.
- Effort tags are self-reported. Spoonful does not guess how hard a task is.
- Automated checks catch many accessibility problems but not all of them. It has not yet been tested with a wide range of screen-reader users.
- Not a medical tool. It supports pacing; it does not replace advice from a clinician.

## AI assistance

This project was built with help from AI coding tools (Claude), used for brainstorming, writing code and writing tests. The idea, design decisions and final review are mine.
