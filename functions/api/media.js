import {githubFile, isAuthenticated, json, putGithubFile, requireConfig, toBase64} from './_auth.js';

const MANIFEST = 'content/media.json';
const TYPES = new Set(['gallery', 'videos', 'documents']);

function decodeManifest(file) {
  const raw = atob(file.content.replace(/\n/g, ''));
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(raw, char => char.charCodeAt(0))));
}

function slug(value) {
  return String(value || 'media').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 55) || 'media';
}

async function getManifest(env) {
  const file = await githubFile(env, MANIFEST);
  return {data:decodeManifest(file), sha:file.sha};
}

async function saveManifest(env, data, sha, message) {
  const content = btoa(unescape(encodeURIComponent(`${JSON.stringify(data, null, 2)}\n`)));
  await putGithubFile(env, MANIFEST, content, message, sha);
}

export async function onRequestGet({request, env}) {
  if (!(await isAuthenticated(request, env))) return json({error:'Not authorized.'}, 401);
  try {
    const {data} = await getManifest(env);
    return json(data);
  } catch (error) {
    return json({error:error.message}, 500);
  }
}

export async function onRequestPost({request, env}) {
  if (!(await isAuthenticated(request, env))) return json({error:'Not authorized.'}, 401);
  const configError = requireConfig(env);
  if (configError) return json({error:configError}, 503);
  try {
    const form = await request.formData();
    const type = form.get('type');
    const title = String(form.get('title') || '').trim();
    const description = String(form.get('description') || '').trim();
    const file = form.get('file');
    if (!TYPES.has(type) || !title || !file || typeof file.arrayBuffer !== 'function') return json({error:'Type, title, and a file are required.'}, 400);
    if (file.size > 24 * 1024 * 1024) return json({error:'Please keep each upload below 24 MB for reliable Cloudflare Pages deployments.'}, 413);
    const {data, sha} = await getManifest(env);
    const id = `${slug(title)}-${Date.now().toString(36)}`;
    const extension = (file.name.split('.').pop() || (type === 'videos' ? 'mp4' : type === 'documents' ? 'pdf' : 'jpg')).toLowerCase().replace(/[^a-z0-9]/g, '');
    const folder = type === 'gallery' ? 'assets/admin-gallery' : type === 'videos' ? 'assets/admin-videos' : 'assets/admin-documents';
    const path = `${folder}/${id}.${extension}`;
    await putGithubFile(env, path, toBase64(new Uint8Array(await file.arrayBuffer())), `Add ${type} media: ${title}`);
    const item = {id, title, description, src:path};
    if (type === 'gallery') item.alt = title;
    if (type === 'videos') {
      const poster = form.get('poster');
      if (poster && typeof poster.arrayBuffer === 'function' && poster.size <= 8 * 1024 * 1024) {
        const posterExt = (poster.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
        item.poster = `${folder}/${id}-poster.${posterExt}`;
        await putGithubFile(env, item.poster, toBase64(new Uint8Array(await poster.arrayBuffer())), `Add poster for ${title}`);
      }
    }
    if (type === 'documents') {
      const cover = form.get('cover');
      if (cover && typeof cover.arrayBuffer === 'function' && cover.size <= 8 * 1024 * 1024) {
        const coverExt = (cover.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
        item.cover = `${folder}/${id}-cover.${coverExt}`;
        await putGithubFile(env, item.cover, toBase64(new Uint8Array(await cover.arrayBuffer())), `Add cover for ${title}`);
      }
    }
    data[type].push(item);
    await saveManifest(env, data, sha, `Update media catalog: ${title}`);
    return json({ok:true, item});
  } catch (error) {
    return json({error:error.message}, 500);
  }
}

export async function onRequestPut({request, env}) {
  if (!(await isAuthenticated(request, env))) return json({error:'Not authorized.'}, 401);
  try {
    const body = await request.json();
    const {data, sha} = await getManifest(env);
    if (!body || !TYPES.has(body.type) || !Array.isArray(body.items)) return json({error:'Invalid media catalog.'}, 400);
    data[body.type] = body.items;
    await saveManifest(env, data, sha, `Edit ${body.type} media catalog`);
    return json({ok:true});
  } catch (error) {
    return json({error:error.message}, 500);
  }
}
