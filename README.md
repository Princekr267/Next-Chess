# ♟ Next-Chess

> A polished chess app built for the web — play locally, track your Elo, and build your match history.

![screenshot](./screenshot.png)

---

## Features

| Feature | Status |
|---|---|
| Local pass-and-play (two players, one screen) | ✅ Ready |
| Guest play (no account required) | ✅ Ready |
| Account creation & authentication via better-auth | ✅ Ready |
| Match history (saved per user) | ✅ Ready |
| Elo-based rating system | ✅ Ready |
| Fullscreen mode (mobile + desktop layouts) | ✅ Ready |
| Bot mode (vs AI) | 🚧 In progress |
| Online multiplayer (vs friend via room code) | 🚧 In progress |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI | [React 19](https://react.dev) + TypeScript |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| Chess logic | [chess.js](https://github.com/jhlywa/chess.js) |
| Chess board | [react-chessboard](https://github.com/Clariity/react-chessboard) |
| Auth | [better-auth](https://www.better-auth.com) |
| ORM | [Drizzle ORM](https://orm.drizzle.team) |
| Database | PostgreSQL ([Neon](https://neon.tech)) |
| Animations | [Framer Motion](https://www.framer.com/motion/) |

---

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/your-username/next-chess.git
cd next-chess
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
# Postgres connection string (Neon, Supabase, or any Postgres provider)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# better-auth secrets
BETTER_AUTH_SECRET=your-random-secret-here
BETTER_AUTH_URL=http://localhost:3000
```

### 3. Run database migrations

```bash
npx drizzle-kit push
```

> If you prefer generating SQL migration files first: `npx drizzle-kit generate` then `npx drizzle-kit migrate`.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── api/              # API route handlers (matches, auth)
│   ├── history/          # Match history page
│   ├── modes/            # Game mode selection
│   ├── play/             # Chess game page
│   ├── sign-in/          # Auth pages
│   └── sign-up/
├── components/
│   ├── chess/            # Chess-specific UI (board, cards, move history)
│   └── nav.tsx           # Site navigation
├── db/                   # Drizzle schema + client
└── lib/                  # Auth client, utilities
```

---

## Deploy on Vercel

The easiest way to deploy is via the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Set the three environment variables (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`) in your Vercel project settings, then push to deploy.

See the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
