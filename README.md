# Spoonful

**A to-do list that shrinks to fit how much energy you have today.**

Built for [Taskforge](https://taskforge.devpost.com/), a student hackathon about accessible tools that help people focus, organize, and get more done.

## The problem

For people living with chronic illness (long COVID, ME/CFS) or ADHD, energy changes a lot from day to day. On a bad day, opening a list of twenty tasks is the problem in itself: it makes you feel behind, so you close the app and do nothing. Most to-do apps make this worse with overdue badges, streaks and counters that turn a hard day into a failure.

## What Spoonful does

Whenever you open it, you answer one question: how much energy do you have today? (Or tap **Same as last time** and go straight to your list.)

| Energy | What you see |
| --- | --- |
| **Good** | Five tasks, gentlest first. The rest are one tap away: "15 more, whenever you want". |
| **Okay** | Only the top 3 light or medium tasks. Everything else is "resting": hidden, never deleted. |
| **Low** | One light task, full screen, with two big buttons: **Done** and **Not today**. Below them, **Help me start** and **Harder than it looked**. If nothing light is left: "Nothing needed today. Rest counts." |

- **Capture in under three seconds.** Type a task and press Enter. No decisions: it starts as **Medium**, and you tap its pill to change it (Light, Medium, Heavy).
- **Help me start** runs a gentle two-minute timer ("Just open the thing."). When it ends: "You started. That counts."
- **Harder than it looked** moves the task up one effort level and offers something lighter instead.
- **Optional due dates.** Tasks due in the next few days show up calmly under **Coming up** on Okay and Low days, even while they rest. Never in red, never "overdue".
- **Daily reminder without a server.** Spoonful never sends notifications, so the **Reminder** button downloads a calendar file with a daily "How's your energy today?" event at the time you choose.
- **Not today** quietly moves a task to tomorrow. It is never recorded as a failure.
- No streaks, no red overdue labels, no progress percentages, no guilt counters. Anywhere.
- The background slowly shifts colour with your energy: sunrise for Good, lavender for Okay, deep night for Low.

## What we changed after user testing

We gave the first version to someone who lives with low and unpredictable energy and asked them to use it for real. They loved that resting tasks are hidden, not deleted, and that "Not today" carries no penalty. They also told us exactly where it got in the way:

| What they told us | What we changed |
| --- | --- |
| Adding a task and choosing its effort was the hardest part. If we built one thing, it should make capture take under three seconds with zero decisions. | An always-visible quick-add box. Enter adds the task as Medium; tap the pill later to retag it. |
| They are bad at guessing effort in advance. | **Harder than it looked** on the Low card bumps the effort and shows something lighter. |
| Out of sight is out of mind: hidden tasks with real deadlines get forgotten. | Optional due dates, and a calm **Coming up** strip for anything due within three days. |
| Starting is the hardest step, not finishing. | **Help me start**: a two-minute timer whose only goal is to begin. |
| The check-in assumed they open the app once, in the morning. | **Same as last time** keeps the previous answer in one tap, any time of day. |
| They wanted reminders, but nothing that leaves the device. | A downloadable daily calendar event instead of push notifications. |
| Good days are risky: seeing everything leads to overdoing it. | Good days now start with five tasks; the rest are one tap away. |

## Accessibility

Accessibility is the core of the project, not an add-on.

- Fully usable with a keyboard alone, with visible focus states.
- Screen-reader labels throughout, and view changes are announced with a polite live region.
- Tap targets of at least 48px, and text meets WCAG AA contrast over the gradients.
- Respects the system "reduce motion" setting, and has its own **Calm mode** toggle that stops all ambient animation.
- The Help me start timer announces when it starts and when it ends, never every second.
- No flashing or fast motion anywhere.
- Plain, kind language in all copy.

These promises are checked automatically. The test suite runs [axe](https://github.com/dequelabs/axe-core) on every view (including the timer, the edit form and the reminder dialog) and fails on any violation. It also checks that Low mode never shows more than one task, that "Not today" leaves no failure record, that quick add keeps focus in the box, and that reduced motion really turns the animation off.

## For the demo

- **Demo day** (header button) loads 20 realistic tasks, three of them with due dates.
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

`npm test` builds the app and then runs the 25 Playwright tests against the production build.

## Tech

React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, lucide-react icons, Playwright with @axe-core/playwright. Data is stored in the browser's localStorage. There is no backend and no account.

## Limitations

- Data lives on one device in one browser. There is no sync, and clearing site data erases your tasks.
- Effort tags are self-reported. Spoonful does not guess how hard a task is; it makes changing your mind cheap instead.
- Reminders depend on your own calendar app. There are no push notifications, because there is no server.
- Automated checks catch many accessibility problems but not all of them. It has not yet been tested with a wide range of screen-reader users.
- Not a medical tool. It supports pacing; it does not replace advice from a clinician.

## AI assistance

This project was built with help from AI coding tools (Claude and Gemini), used for brainstorming, writing code and writing tests. The idea, design decisions and final review are mine.
