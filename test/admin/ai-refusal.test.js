// admin/ai-refusal.js: a refused AI is named, kinds are told apart, the owner is told once per outage, the key is never printed.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {ask} from '../../admin/build-digest.js';
import {AiRefused, describe, isRefusal, kindOf, reportRefusal, shouldTell, staysDown, tellOwner} from '../../admin/ai-refusal.js';

const answer = (status, error) => ({fetch: async () => new Response(JSON.stringify({type: 'error', error}), {status})});
const LIMIT = {type: 'invalid_request_error', message: 'You have reached your specified workspace API usage limits. You will regain access on 2026-11-01'};

test('ask throws AiRefused with the kind: the 400 usage limit, 401, 429, 529', async () => {
  for (const [status, error, kind] of [[400, LIMIT, 'limit'], [401, {type: 'authentication_error', message: 'invalid x-api-key'}, 'auth'], [429, {type: 'rate_limit_error', message: 'slow down'}, 'rate'], [529, {type: 'overloaded_error', message: 'Overloaded'}, 'overloaded'], [400, {type: 'invalid_request_error', message: 'max_tokens too big'}, 'other']]) {
    const caught = await ask({system: 's', user: 'u'}, {key: 'sk-secret', ...answer(status, error)}).catch(error => error);
    assert.ok(isRefusal(caught), `${status}`);
    assert.equal(caught.kind, kind);
    assert.equal(caught.status, status);
    assert.match(caught.message, new RegExp(`^model answered ${status}: `));
  }
  assert.equal(kindOf(500, ''), 'overloaded');
});

test('the description names the cause and the API words, never the key', async () => {
  const caught = await ask({system: 's', user: 'u'}, {key: 'sk-secret', ...answer(400, {...LIMIT, message: `${LIMIT.message} sk-secret`})}).catch(error => error);
  assert.match(describe(caught), /AI refused \(limit\): the Anthropic workspace's spend limit is reached\. invalid_request_error: You have reached/);
  assert.doesNotMatch(describe(caught), /sk-secret/);
  assert.ok(staysDown(caught) && !staysDown(new AiRefused(400, 'max_tokens too big')) && !staysDown(new Error('x')));
});

test('the owner is told when the outage begins and once a day at 08, not at every red run', () => {
  assert.ok(shouldTell({previous: 'success', zurichHour: 14}) && shouldTell({previous: null, zurichHour: 14}));
  assert.ok(!shouldTell({previous: 'failure', zurichHour: 14}));
  assert.ok(shouldTell({previous: 'failure', zurichHour: 8}));
});

test('tellOwner uses the CI alerts bot, else the Build Log bot, skips without one, and never throws', async () => {
  const sent = [];
  const fetch = async (url, init) => { sent.push([url, JSON.parse(init.body).chat_id]); return new Response('{}'); };
  assert.deepEqual(await tellOwner('x', {env: {BUILDLOG_TELEGRAM_TOKEN: 'b', BUILDLOG_TELEGRAM_CHAT: '2', CI_ALERTS_TELEGRAM_BOT_TOKEN: 'a', CI_ALERTS_TELEGRAM_CHAT_ID: '1'}, fetch}), {sent: true});
  assert.deepEqual(await tellOwner('x', {env: {BUILDLOG_TELEGRAM_TOKEN: 'b', BUILDLOG_TELEGRAM_CHAT: '2'}, fetch}), {sent: true});
  assert.deepEqual(sent, [['https://api.telegram.org/bota/sendMessage', '1'], ['https://api.telegram.org/botb/sendMessage', '2']]);
  assert.ok((await tellOwner('x', {env: {}, fetch})).skipped);
  assert.ok((await tellOwner('x', {env: {BUILDLOG_TELEGRAM_TOKEN: 'b', BUILDLOG_TELEGRAM_CHAT: '2'}, fetch: async () => { throw new TypeError('down'); }})).skipped);
});

test('reportRefusal logs the named error and tells once: the run before red means no message', async () => {
  const told = [];
  const env = {BUILDLOG_TELEGRAM_TOKEN: 'b', BUILDLOG_TELEGRAM_CHAT: '2', GITHUB_REPOSITORY: 'o/r', GITHUB_RUN_ID: '9'};
  const fetch = async (_, init) => { told.push(JSON.parse(init.body).text); return new Response('{}'); };
  const runs = conclusion => () => JSON.stringify([{databaseId: 9, status: 'in_progress', conclusion: null}, {databaseId: 8, status: 'completed', conclusion}]);
  const error = new AiRefused(400, LIMIT.message);
  await reportRefusal(error, {job: 'Changelog publish', effect: 'Plain entries went out.', workflow: 'w.yml', zurichHour: 14, env, fetch, run: runs('success')});
  assert.equal(told.length, 1);
  assert.match(told[0], /Changelog publish: AI refused \(limit\).*\nPlain entries went out\./);
  await reportRefusal(error, {job: 'Changelog publish', workflow: 'w.yml', zurichHour: 14, env, fetch, run: runs('failure')});
  assert.equal(told.length, 1, 'already red before: no second message');
});
