# AI Capsule — Cloud-Deployed AI Prompt Manager

A full-stack app I built for saving and managing AI prompts. It has a React frontend, a
Node/Express backend, GitHub login, and stores prompt records in SQLite. Only the logged-in
user can see and edit their own prompts.

## Deployed URL

- **Live app:** https://ai-capsule-cdr9.onrender.com
- **Hosted on:** Render (free web service)

## Tech stack

- Frontend: React (built with Vite)
- Backend: Node.js + Express
- Login: GitHub OAuth
- Session: my own JWT, stored in a secure cookie called `token`
- Database: SQLite

## How to run it locally

```bash
# backend
cd server
npm install
node index.js

# frontend
cd client
npm install
npm run build
```

Once the frontend is built, the Express server serves everything at `http://localhost:3000`.
You'll need a `.env` file inside `server/` with your own GitHub OAuth keys and a JWT secret
(see the environment variables list below).

## How the frontend and backend talk to each other

Both are served from the same Express server, so they share the same origin. React just
calls relative paths like `/api/capsules`, and the browser automatically sends the login
cookie along with the request.

## Routes

| Route | Access | What it does |
|---|---|---|
| `/` | Public | Landing page |
| `/login` | Public | Starts GitHub login |
| `/dashboard` | Protected | Shows your saved prompts |
| `GET /api/health` | Public | Returns `{ "status": "ok" }` |
| `GET /auth/github` | Public | Sends you to GitHub to log in |
| `GET /auth/github/callback` | Public | GitHub sends you back here after login |
| `GET /api/capsules` | Protected | Get your prompts |
| `POST /api/capsules` | Protected | Create a prompt |
| `PUT /api/capsules/:id` | Protected | Edit a prompt |
| `DELETE /api/capsules/:id` | Protected | Delete a prompt |

## How the login and security works

1. I log in with GitHub.
2. My Express server confirms who I am through GitHub, then creates its own JWT (not
   GitHub's token) and saves it in a secure, HttpOnly cookie called `token`.
3. Every time I try to view/create/edit/delete a prompt, the server checks that cookie is
   real before doing anything.
4. My user ID always comes from that verified token — never from anything sent by the
   browser — so I can only ever see or change my own prompts.

## Environment variables

| Name | What it's for |
|---|---|
| `GITHUB_CLIENT_ID` | My GitHub OAuth app ID |
| `GITHUB_CLIENT_SECRET` | My GitHub OAuth app secret |
| `GITHUB_CALLBACK_URL` | `https://ai-capsule-cdr9.onrender.com/auth/github/callback` |
| `JWT_SECRET` | A random string I made up, used to sign my tokens |
| `SESSION_COOKIE_SECURE` | `true` on Render, `false` on my own computer |
| `PORT` | Set automatically by Render |

None of the real values are in this repo — they're all set through environment variables
and `.env` is git-ignored.

## Database

I used SQLite so it's easy to set up with no separate database server. On Render's free
tier, the storage isn't permanent — the database resets whenever the app redeploys or
restarts, so saved prompts don't stick around long-term.

## Required cURL tests

```bash
curl -i https://ai-capsule-cdr9.onrender.com/api/capsules
```
Result:
```
HTTP/2 401
{"error":"No token provided"}
```

```bash
curl -i -H "Cookie: token=fake-token-123" https://ai-capsule-cdr9.onrender.com/api/capsules
```
Result:
```
HTTP/2 401
{"error":"Invalid or expired token"}
```

Both return 401 as required, confirming the API rejects requests with no token and with a
fake token.

## One limitation

The database isn't permanent on Render's free tier — it resets on redeploy, so this isn't
meant for long-term storage without upgrading to a paid database.

## AI-assisted development

I used Claude (Anthropic) as a guide while building this project, mainly to explain
concepts I hadn't used before — things like middleware, JWTs, and how OAuth actually
works step by step — and to help me figure out what code to write next. I typed and
saved every file myself, and tested each part before moving to the next (backend routes
first, then the database, then login, then the frontend, then deployment).

A few times the code didn't work on the first try, and I had to actually debug it myself
using the real error messages. For example, when I first tried to serve my React app from
Express, I got a crash from `path-to-regexp` saying the wildcard route syntax was wrong —
turns out my version of Express (5.x) doesn't support the old `app.get('*', ...)` syntax
anymore, so I had to change it to `app.get('/*splat', ...)`. I also had a deployment fail
on Render because my `server/package.json` was missing two dependencies
(`better-sqlite3` and `dotenv`) that were installed locally but never got added to the
file — I found this by reading Render's build logs.

One decision I made myself: I chose to serve the React frontend directly from my Express
server instead of hosting them separately, so I wouldn't have to deal with CORS issues
between two different URLs in production.

I typed and tested every part of this project myself, ran it locally before deploying,
and fixed the deployment errors that came up (like a missing dependency in `package.json`
and the route ordering in `index.js`) by reading the actual error logs from Render.