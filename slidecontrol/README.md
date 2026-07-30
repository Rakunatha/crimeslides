# Slide deck + remote control (Render deployment)

This is a single small Node.js service that hosts **two pages** and keeps
them in sync in real time over WebSocket:

- `/present.html` — the slide deck. This is the link you give your **audience**.
- `/control.html` — a remote control (Prev / Next / jump-to-slide). This is the link **you** keep on your phone/laptop.

Pressing Next/Prev on the control page instantly moves the deck on
`present.html`, no matter how many people have that link open (they'll all
move together).

## Why one service instead of two separate sites

Two independently-hosted static sites can't talk to each other without a
shared backend anyway (browsers can't push messages between two unrelated
domains). So instead of standing up two Render deployments plus a third
thing to sync them, this packages the sync server and both pages into one
small Render **Web Service**. You still get two distinct links to hand out
(one for the audience, one for you) — they just happen to live on the same
domain.

## Deploying to Render

1. Push this folder to a GitHub repo (or use Render's "Public Git repository" option if you don't want to create one).
2. In the Render dashboard: **New +** → **Web Service** → connect the repo.
3. Settings:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance type**: Free is fine for a live talk.
4. Deploy. Render will give you a URL like `https://your-app.onrender.com`.

## Links to use on the day

- Audience: `https://your-app.onrender.com/present.html`
- You (remote): `https://your-app.onrender.com/control.html`

### Running multiple talks / rehearsing without interfering with the live show

Both pages accept a `?room=` query param. Anyone on the same room shares the
same slide position:

- `.../present.html?room=myroom`
- `.../control.html?room=myroom`

If you don't pass `?room=`, everyone defaults to the same room (`main`), so
for a single talk you can just use the plain links above. Use a custom room
name if you want to rehearse in private while the "main" link might already
be open somewhere, or if you're running more than one talk from the same
deployment at once.

## Notes

- On Render's free tier the service may spin down after inactivity and take
  ~30–60 seconds to wake up on the first request. Open both links a couple
  of minutes before you go on stage to warm it up.
- Slide position is kept in memory only — if the service restarts mid-talk
  (rare, but possible on a redeploy) it resets to slide 1. Nothing else about
  the deck changes.
- Keyboard shortcuts (← → space) and swipe still work directly on the
  presentation page too, in case you ever need to advance it locally — this
  is treated the same as a remote command, so everyone stays in sync either way.

## Local testing

```
npm install
npm start
```

Then open `http://localhost:3000/present.html` in one tab and
`http://localhost:3000/control.html` in another.
