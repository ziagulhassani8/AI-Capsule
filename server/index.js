require('dotenv').config(); // load secrets from .env into process.env

const express = require('express');
const db = require('./db');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser()); // lets us read cookies via req.cookies
app.use(passport.initialize()); // turns on Passport for this app
app.use(express.json()); // lets us read JSON request bodies via req.body

// Tells Passport how to log in via GitHub using our OAuth app credentials
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      const user = {
        id: String(profile.id),
        username: profile.username,
      };
      done(null, user);
    }
  )
);

// Middleware: blocks a request unless it has a valid JWT cookie
function requireAuth(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.userId, username: payload.username };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Starts GitHub login
app.get('/auth/github', passport.authenticate('github', { session: false }));

// GitHub redirects here after login - issues our own JWT and sets it as a cookie
app.get(
  '/auth/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = jwt.sign(
      { userId: req.user.id, username: req.user.username },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.SESSION_COOKIE_SECURE === 'true',
      sameSite: 'lax',
    });

    res.redirect('/dashboard');
  }
);

// Public health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// CREATE - requires login, owner is the real logged-in user
app.post('/api/capsules', requireAuth, (req, res) => {
  const {
    project_name,
    prompt_title,
    prompt_version,
    prompt_text,
    response_summary,
    category,
    usefulness,
    reviewed,
    improved,
    screenshot_url,
    notes,
  } = req.body;

  const stmt = db.prepare(`
    INSERT INTO capsules
      (user_id, project_name, prompt_title, prompt_version, prompt_text,
       response_summary, category, usefulness, reviewed, improved, screenshot_url, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    req.user.id,
    project_name,
    prompt_title,
    prompt_version || null,
    prompt_text,
    response_summary || null,
    category || null,
    usefulness || null,
    reviewed ? 1 : 0,
    improved ? 1 : 0,
    screenshot_url || null,
    notes || null
  );

  res.status(201).json({ id: info.lastInsertRowid });
});

// READ - requires login, only returns this user's own records
app.get('/api/capsules', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM capsules WHERE user_id = ?').all(req.user.id);
  res.json(rows);
});

// UPDATE - requires login, only if the record belongs to this user
app.put('/api/capsules/:id', requireAuth, (req, res) => {
  const existing = db
    .prepare('SELECT * FROM capsules WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);

  if (!existing) {
    return res.status(404).json({ error: 'Record not found' });
  }

  const {
    project_name,
    prompt_title,
    prompt_version,
    prompt_text,
    response_summary,
    category,
    usefulness,
    reviewed,
    improved,
    screenshot_url,
    notes,
  } = req.body;

  db.prepare(`
    UPDATE capsules SET
      project_name = ?,
      prompt_title = ?,
      prompt_version = ?,
      prompt_text = ?,
      response_summary = ?,
      category = ?,
      usefulness = ?,
      reviewed = ?,
      improved = ?,
      screenshot_url = ?,
      notes = ?
    WHERE id = ? AND user_id = ?
  `).run(
    project_name ?? existing.project_name,
    prompt_title ?? existing.prompt_title,
    prompt_version ?? existing.prompt_version,
    prompt_text ?? existing.prompt_text,
    response_summary ?? existing.response_summary,
    category ?? existing.category,
    usefulness ?? existing.usefulness,
    reviewed !== undefined ? (reviewed ? 1 : 0) : existing.reviewed,
    improved !== undefined ? (improved ? 1 : 0) : existing.improved,
    screenshot_url ?? existing.screenshot_url,
    notes ?? existing.notes,
    req.params.id,
    req.user.id
  );

  res.json({ updated: true });
});

// DELETE - requires login, only if the record belongs to this user
app.delete('/api/capsules/:id', requireAuth, (req, res) => {
  const info = db
    .prepare('DELETE FROM capsules WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user.id);

  if (info.changes === 0) {
    return res.status(404).json({ error: 'Record not found' });
  }

  res.json({ deleted: true });
});

// Serve the built React app for everything else
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

app.get('/*splat', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
    return next();
  }
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});