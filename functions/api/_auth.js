const COOKIE = 'pkr_admin_session';
const SESSION_HOURS = 8;

function encode(value) {
  return btoa(unescape(encodeURIComponent(value))).replace(/=/g, '');
}

function decode(value) {
  return decodeURIComponent(escape(atob(value)));
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function createSession(secret) {
  const expires = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const value = `${expires}.${crypto.randomUUID()}`;
  return `${encode(value)}.${await sign(value, secret)}`;
}

export async function isAuthenticated(request, env) {
  const header = request.headers.get('Cookie') || '';
  const match = header.match(new RegExp(`${COOKIE}=([^;]+)`));
  if (!match || !env.SESSION_SECRET) return false;
  try {
    const [encoded, signature] = match[1].split('.');
    const value = decode(encoded);
    const [expires] = value.split('.');
    if (Number(expires) < Date.now()) return false;
    return signature === await sign(value, env.SESSION_SECRET);
  } catch (_) {
    return false;
  }
}

export function sessionCookie(value) {
  return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 60 * 60}`;
}

export function clearSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {status, headers:{'content-type':'application/json; charset=utf-8', ...headers}});
}

export function requireConfig(env) {
  const missing = ['ADMIN_PASSWORD', 'SESSION_SECRET', 'GITHUB_TOKEN', 'GITHUB_REPO'].filter(key => !env[key]);
  return missing.length ? `Missing Cloudflare secret(s): ${missing.join(', ')}` : null;
}

export function githubHeaders(env) {
  return {Authorization:`Bearer ${env.GITHUB_TOKEN}`, Accept:'application/vnd.github+json', 'X-GitHub-Api-Version':'2022-11-28'};
}

export function repoParts(env) {
  const [owner, repo] = env.GITHUB_REPO.split('/');
  if (!owner || !repo) throw new Error('GITHUB_REPO must be owner/repository');
  return {owner, repo};
}

export async function githubFile(env, path) {
  const {owner, repo} = repoParts(env);
  const branch = env.GITHUB_BRANCH || 'main';
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`, {headers:githubHeaders(env)});
  if (!response.ok) throw new Error(`GitHub read failed (${response.status})`);
  return response.json();
}

export function toBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

export async function putGithubFile(env, path, content, message, sha) {
  const {owner, repo} = repoParts(env);
  const body = {message, content, branch:env.GITHUB_BRANCH || 'main'};
  if (sha) body.sha = sha;
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {method:'PUT', headers:{...githubHeaders(env), 'content-type':'application/json'}, body:JSON.stringify(body)});
  if (!response.ok) throw new Error(`GitHub write failed (${response.status})`);
  return response.json();
}
