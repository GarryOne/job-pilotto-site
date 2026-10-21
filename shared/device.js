// "Mac", "Windows"... from a browser's User-Agent: all that is kept of a visitor's device. Used by api/downloads.js and shared/auth.js.
// Guarded by test/worker/stats.test.js.
export function device(agent = '') {
  if (/iPhone|iPad/.test(agent)) return 'iPhone';
  if (/Android/.test(agent)) return 'Android';
  if (/Mac OS X|Macintosh/.test(agent)) return 'Mac';
  if (/Windows/.test(agent)) return 'Windows';
  if (/Linux/.test(agent)) return 'Linux';
  return 'other';
}
