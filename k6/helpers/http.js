import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api';

export function url(path) {
  return `${BASE_URL}${path}`;
}

export function authHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
}

export function jsonBody(payload) {
  return JSON.stringify(payload);
}

// GET with auth; returns response
export function get(path, token, params = {}) {
  const opts = token ? authHeaders(token) : { headers: { 'Content-Type': 'application/json' } };
  return http.get(url(path), { ...opts, ...params });
}

// POST with auth; returns response
export function post(path, token, body, params = {}) {
  const opts = token ? authHeaders(token) : { headers: { 'Content-Type': 'application/json' } };
  return http.post(url(path), jsonBody(body), { ...opts, ...params });
}

// PATCH with auth; returns response
export function patch(path, token, body, params = {}) {
  const opts = token ? authHeaders(token) : { headers: { 'Content-Type': 'application/json' } };
  return http.patch(url(path), jsonBody(body), { ...opts, ...params });
}

// DELETE with auth; returns response
export function del(path, token, params = {}) {
  const opts = token ? authHeaders(token) : { headers: { 'Content-Type': 'application/json' } };
  return http.del(url(path), null, { ...opts, ...params });
}

// Convenience: assert 2xx + decode JSON
export function checkOk(res, label) {
  return check(res, {
    [`${label} → 2xx`]: (r) => r.status >= 200 && r.status < 300,
  });
}

export function checkStatus(res, status, label) {
  return check(res, {
    [`${label} → ${status}`]: (r) => r.status === status,
  });
}

// Try to parse JSON; return null on failure
export function parseJson(res) {
  try {
    return res.json();
  } catch {
    return null;
  }
}
