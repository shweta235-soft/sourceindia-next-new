/** BULK137: reusable, dependency-free, isolated-QA settings-image safety rules. */
import {basename,isAbsolute,parse,resolve} from 'node:path';

const accepted = {
  '.png': ['image/png'],
  '.jpg': ['image/jpeg','image/jpg'],
  '.jpeg': ['image/jpeg','image/jpg'],
  '.gif': ['image/gif'],
  '.webp': ['image/webp'],
  '.ico': ['image/x-icon','image/vnd.microsoft.icon','image/ico'],
};
export const SETTINGS_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const SETTINGS_MULTIPART_MAX_BYTES = 16 * 1024 * 1024;
const uuidFile = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(png|jpg|jpeg|gif|webp|ico)$/i;

export function settingsImageType(filename, mime, bytes) {
  if (!filename || typeof filename !== 'string' || !(bytes instanceof Uint8Array) || bytes.length < 8 || bytes.length > SETTINGS_IMAGE_MAX_BYTES) return null;
  const extension = ('.' + filename.split('.').pop()).toLowerCase();
  const allowed = accepted[extension];
  if (!allowed || typeof mime !== 'string' || !allowed.includes(mime.toLowerCase())) return null;
  const isPng = bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
  const isJpeg = bytes.length >= 4 && bytes[0]===255 && bytes[1]===216 && bytes[2]===255;
  const isGif = bytes.length >= 6 && String.fromCharCode(...bytes.subarray(0,6))==='GIF89a' || bytes.length >= 6 && String.fromCharCode(...bytes.subarray(0,6))==='GIF87a';
  const isWebp = bytes.length >= 12 && String.fromCharCode(...bytes.subarray(0,4))==='RIFF' && String.fromCharCode(...bytes.subarray(8,12))==='WEBP';
  const isIco = bytes.length >= 6 && bytes[0]===0 && bytes[1]===0 && bytes[2]===1 && bytes[3]===0 && bytes[4]>0;
  const ok = extension==='.png'?isPng : extension==='.jpg'||extension==='.jpeg'?isJpeg : extension==='.gif'?isGif : extension==='.webp'?isWebp : isIco;
  if (!ok) return null;
  return {extension, mime: extension==='.ico'?'image/x-icon':extension==='.jpg'||extension==='.jpeg'?'image/jpeg':`image/${extension.slice(1)}`};
}

/** The QA storage directory must already exist and be explicitly named QA/test/sandbox.
 * Never use the project root or a drive root as the storage directory. */
export function settingsQaRoot(raw) {
  if (typeof raw!=='string' || !isAbsolute(raw)) return null;
  const root=resolve(raw);
  if (root===parse(root).root || !/(qa|test|sandbox)/i.test(basename(root))) return null;
  // Original React workspace D:\\sourceindia is strictly read-only.
  const win=root.replace(/\//g,'\\').toLowerCase();
  if(win==='d:\\sourceindia'||win.startsWith('d:\\sourceindia\\'))return null;
  return root;
}
export function settingsOwnedFilename(value) { return typeof value==='string' && uuidFile.test(value); }
export function settingsOwnedDbPath(value) { return typeof value==='string' && value.startsWith('upload/siteSettings/') && settingsOwnedFilename(value.slice('upload/siteSettings/'.length)); }
export function settingsImageMime(filename) {
  if (!settingsOwnedFilename(filename)) return null;
  const ext='.'+filename.split('.').pop().toLowerCase();
  return ext==='.ico'?'image/x-icon' : ext==='.jpg'||ext==='.jpeg'?'image/jpeg':`image/${ext.slice(1)}`;
}
