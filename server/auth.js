import jwt from 'jsonwebtoken';

const COOKIE_NAME = 'agrisafe_session';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// In production a missing secret must fail startup, not silently sign
// tokens with a well-known default anyone could forge a session with.
// Dev keeps a fallback so `npm run dev` works without a .env file.
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production. Refusing to start with an insecure default.');
}
if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is not set — using an insecure default. Set JWT_SECRET in .env before deploying anywhere real.');
}
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me';

// Local dev: frontend and API share an origin via the Vite proxy, so a plain
// same-site cookie works. Deployed: GitHub Pages and the API live on two
// different origins, and only a SameSite=None cookie is sent cross-site —
// which browsers only honor when the cookie is also Secure (HTTPS-only).
const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? 'none' : 'lax',
  secure: isProduction,
  maxAge: SESSION_MAX_AGE_MS,
};

export function issueSession(res, user) {
  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name, farmName: user.farmName || null },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.cookie(COOKIE_NAME, token, cookieOptions);
}

export function clearSession(res) {
  // clearCookie must be called with the same attributes used to set the
  // cookie, or the browser won't recognize it as the same cookie to remove.
  res.clearCookie(COOKIE_NAME, cookieOptions);
}

export function readSession(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Attaches req.user if a valid session cookie is present; does not block the
// request either way. Use requireAuth/requireRole to actually gate a route.
export function attachUser(req, res, next) {
  req.user = readSession(req);
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Sign in required.' });
  next();
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Sign in required.' });
    if (req.user.role !== role) return res.status(403).json({ error: 'Not authorized for this action.' });
    next();
  };
}
