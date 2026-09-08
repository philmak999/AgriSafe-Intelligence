import { Storage } from '@google-cloud/storage';

// The service-account key is passed as a base64-encoded env var rather than
// a mounted file path, so the same code works unchanged against a local
// .env and Render's env var UI (Render has no first-class "secret file" on
// the free tier).
function getCredentials() {
  if (!process.env.GCS_KEY_JSON_BASE64) return undefined;
  const json = Buffer.from(process.env.GCS_KEY_JSON_BASE64, 'base64').toString('utf-8');
  return JSON.parse(json);
}

let storage = null;
function getStorage() {
  if (!storage) {
    storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      credentials: getCredentials(),
    });
  }
  return storage;
}

function getBucket() {
  return getStorage().bucket(process.env.GCS_BUCKET_NAME);
}

export async function uploadBuffer(buffer, originalName, mimetype) {
  const ext = originalName.includes('.') ? originalName.slice(originalName.lastIndexOf('.')) : '';
  const key = `uploads/${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;

  await getBucket().file(key).save(buffer, {
    contentType: mimetype,
    resumable: false,
  });

  return key;
}

export async function getSignedReadUrl(key) {
  const [url] = await getBucket()
    .file(key)
    .getSignedUrl({ version: 'v4', action: 'read', expires: Date.now() + 15 * 60 * 1000 });
  return url;
}

export async function deleteObject(key) {
  await getBucket().file(key).delete({ ignoreNotFound: true });
}
