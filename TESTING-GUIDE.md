# Testing Guide — Next-Chess

This is your study doc. Read it top to bottom once, then keep it as reference.

---

## 1. Why test at all (for your resume story)

Having tests in a portfolio project signals: you understand code correctness,
you can refactor without fear, and you think about edge cases. For an
interview, "I wrote unit tests for my Elo rating logic and component tests
for my UI" is a strong, concrete talking point.

---

## 2. The tools, and what each one does

| Tool | Job | Why this one |
|---|---|---|
| **Vitest** | Runs your test files, gives pass/fail output | Fast, works natively with Vite/Next tooling, near-identical API to Jest |
| **jsdom** | Fakes a browser (DOM) inside Node.js | React components need a `document` to render into — Node doesn't have one by default |
| **React Testing Library (RTL)** | Renders components and lets you query them like a user would | Encourages testing *behavior* ("does it show the name?") not *implementation* ("is `state.name` set?") |
| **jest-dom** | Adds matchers like `.toBeInTheDocument()` | Plain Vitest doesn't know what a DOM element is; this teaches `expect()` that vocabulary |
| **user-event** | Simulates real typing/clicking | More realistic than firing raw DOM events — it fires the same sequence a browser would (keydown, input, keyup...) |

---

## 3. The three layers of testing in this project

### Layer 1 — Unit tests (`src/lib/elo.test.ts`)
Tests a **pure function**: same input always gives same output, no side
effects (no database, no DOM, no network). This is the easiest and cheapest
kind of test to write, and your `elo.ts` is a perfect candidate because it's
already written that way (the file's own comment says so).

**Key concepts:**
- `describe("name", () => {...})` — groups related tests, purely for organizing output
- `it("does X", () => {...})` — one individual test case (also written as `test`)
- `expect(actual).toBe(expected)` — the assertion; fails the test if not equal
- `toBeCloseTo` — for floating point numbers (avoids precision bugs failing your test)
- `toBeGreaterThan` / `toBeLessThan` — for relative comparisons

### Layer 2 — Component tests (`src/components/chess/PlayerCard.test.tsx`)
Tests a **React component** in isolation. We `render()` it into a fake DOM
(jsdom), then use `screen` to query what's actually visible — the same way a
user or a screen reader would find things.

**Key concepts:**
- `render(<Component prop={x} />)` — mounts the component into the test DOM
- `screen.getByText(...)` — finds an element by its visible text; throws if not found (good — you want tests to fail loudly)
- `screen.queryByText(...)` — like `getByText` but returns `null` instead of throwing; use this when you're asserting something is **absent**
- `screen.getByDisplayValue(...)` — finds an `<input>` by its current value
- `screen.getByRole("textbox")` — finds elements by their accessibility role; this is RTL's preferred way to query, because it mirrors how assistive tech "sees" the page
- `vi.fn()` — creates a mock function so you can assert *how* it was called, without it doing anything real
- `userEvent.setup()` + `await user.type(...)` — simulates realistic typing

### Layer 3 — API route tests (not yet written — see Section 5)
Tests your `/api/matches` route. This is the hardest layer because the route
touches `auth.api.getSession()` and the database (`db.select`, `db.insert`,
`db.update`). You don't want real tests hitting a real Postgres database, so
you **mock** those dependencies — replace them with fake versions that return
canned data.

---

## 4. How to run these tests

Once you've copied these files into your real project locally:

```bash
# 1. Install dependencies
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event

# 2. Add a script to package.json:
#    "test": "vitest"

# 3. Run it
npm test
```

Vitest will watch your files by default and re-run tests on save. Use
`npm test -- --run` for a single pass (useful in CI).

---

## 5. Next steps (in order)

1. **Run the two test files I've written** and get them green locally. This
   confirms your setup works before you write anything new.
2. **Add a test for `GameResultCard`** — same pattern as `PlayerCard.test.tsx`.
   Try writing it yourself first: render with `result="win"`, assert the text
   "You won! 🎉" appears; render with `result={null}`, assert the component
   renders nothing.
3. **Mock `better-auth` and `drizzle`** to test `/api/matches`. This needs
   `vi.mock()` — a more advanced Vitest feature. Ask me for this once you're
   ready and I'll walk you through it step by step rather than just handing
   you the file, since mocking is the concept most worth understanding
   deeply.
4. **Add a GitHub Actions workflow** (`.github/workflows/test.yml`) so tests
   run automatically on every push — great resume/portfolio signal.

---

## 6. Common confusion points (ask me if any of these hit you)

- **"Why jsdom and not a real browser?"** — jsdom is much faster since it's
  just a JS simulation of the DOM API, not a full rendering engine. For true
  browser testing (screenshots, real CSS layout) you'd reach for Playwright
  or Cypress instead — different tool, different job.
- **"Why RTL instead of just checking component internals?"** — if you refactor
  `PlayerCard` to use different internal state but the same rendered output,
  RTL tests still pass. Tests that peek at internals break on every refactor
  even when the component still works correctly.
- **"What's the difference between `get`, `query`, and `find` in RTL?"**
  `getBy*` throws if not found (use when you expect it to exist), `queryBy*`
  returns null if not found (use when checking something is absent),
  `findBy*` is async and waits (use for things that appear after a delay,
  like an API response).
