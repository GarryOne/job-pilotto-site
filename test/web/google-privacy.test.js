// The privacy page says what Google requires for Gmail and Calendar data (verification of the Google app): read-only scopes, Limited Use, no selling or AI training, how to revoke.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const page = readFileSync(new URL('../../web/public/privacy.html', import.meta.url), 'utf8');

test('the privacy page has the Google data section Google asks for', () => {
  assert.match(page, /<h2>Google data: Gmail and Calendar<\/h2>/);
  assert.match(page, /gmail\.readonly/);
  assert.match(page, /calendar\.readonly/);
  assert.match(page, /api-services-user-data-policy#limited-use/);
  assert.match(page, /used to train AI models/);
  assert.match(page, /myaccount\.google\.com\/permissions/);
});
