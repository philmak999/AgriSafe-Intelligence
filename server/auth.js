import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me';
const COOKIE_NAME = 'agrisafe_session';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is not set — using an insecure default. Set JWT_SECRET in .env before deploying anywhere real.');
}

export function issueSession(res, user) {
  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name, farmName: user.farmName || null },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_MS,
  });
}

export function clearSession(res) {
  res.clearCookie(COOKIE_NAME);
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
