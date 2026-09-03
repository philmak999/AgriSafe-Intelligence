import { describe, it, expect, beforeEach, vi } from 'vitest';
import { requireAuth, requireRole } from './auth.js';

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.status = vi.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn((body) => {
    res.body = body;
    return res;
  });
  return res;
}

describe('requireAuth', () => {
  it('rejects with 401 when req.user is missing', () => {
    const req = { user: null };
    const res = mockRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when a user is present', () => {
    const req = { user: { id: '1', role: 'farmer' } };
    const res = mockRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('requireRole', () => {
  let next;
  beforeEach(() => {
    next = vi.fn();
  });

  it('rejects with 401 when unauthenticated', () => {
    const res = mockRes();
    requireRole('scientist')({ user: null }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a farmer with 403 on a scientist-only route', () => {
    const res = mockRes();
    requireRole('scientist')({ user: { role: 'farmer' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows a scientist through a scientist-only route', () => {
    const res = mockRes();
    requireRole('scientist')({ user: { role: 'scientist' } }, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('does not allow a scientist through a farmer-only route', () => {
    const res = mockRes();
    requireRole('farmer')({ user: { role: 'scientist' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
