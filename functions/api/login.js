import {createSession, json, requireConfig, sessionCookie} from './_auth.js';

export async function onRequestPost({request, env}) {
  const configError = requireConfig(env);
  if (configError) return json({error:configError}, 503);
  const body = await request.json().catch(() => ({}));
  if (!body.password || body.password !== env.ADMIN_PASSWORD) return json({error:'Incorrect password.'}, 401);
  const token = await createSession(env.SESSION_SECRET);
  return json({ok:true}, 200, {'set-cookie':sessionCookie(token)});
}
