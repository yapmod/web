import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { setImmediate } from 'node:timers/promises';
import { runInNewContext } from 'node:vm';

for (const platform of ['chrome', 'firefox']) {
  const content = await readFile(new URL(`../dist/${platform}/content.js`, import.meta.url), 'utf8');

  async function start(reply) {
    const requests = [];
    const timers = [];
    const warnings = [];
    const runtime = {
      async sendMessage(message) {
        requests.push(message.type);
        return reply(message);
      },
    };
    runInNewContext(content, {
      [platform === 'firefox' ? 'browser' : 'chrome']: { runtime },
      localStorage: { getItem: () => null },
      console: { log() {}, warn: (...args) => warnings.push(args) },
      setTimeout: (callback, delay) => timers.push({ callback, delay }),
    });
    await setImmediate();
    return { requests, timers, warnings };
  }

  test(`${platform} retries a missing injection acknowledgement only once`, async () => {
    const { requests, timers, warnings } = await start(({ type }) =>
      type === 'FETCH_BUNDLE' ? { source: 'client' } : undefined,
    );
    assert.equal(timers.length, 1);
    const retry = timers.shift();
    assert.equal(retry.delay, 60_000);
    retry.callback();
    await setImmediate();
    assert.deepEqual(requests, ['FETCH_BUNDLE', 'INJECT_BUNDLE', 'FETCH_BUNDLE', 'INJECT_BUNDLE']);
    assert.equal(timers.length, 0);
    assert.equal(warnings.length, 2);
  });

  test(`${platform} can recover from a closed channel on the second attempt`, async () => {
    let attempts = 0;
    const { requests, timers } = await start(({ type }) => {
      if (type !== 'FETCH_BUNDLE') return { ok: true };
      if (++attempts === 1) throw new Error('Message channel closed');
      return { source: 'client' };
    });
    assert.equal(timers.length, 1);
    timers.shift().callback();
    await setImmediate();
    assert.deepEqual(requests, ['FETCH_BUNDLE', 'FETCH_BUNDLE', 'INJECT_BUNDLE', 'REGISTER_PLUGIN']);
    assert.equal(timers.length, 0);
  });

  test(`${platform} keeps the loaded client when settings registration fails`, async () => {
    const { requests, timers, warnings } = await start(({ type }) => {
      if (type === 'FETCH_BUNDLE') return { source: 'client' };
      if (type === 'INJECT_BUNDLE') return { ok: true };
      return { ok: false };
    });
    assert.deepEqual(requests, ['FETCH_BUNDLE', 'INJECT_BUNDLE', 'REGISTER_PLUGIN']);
    assert.equal(timers.length, 0);
    assert.equal(warnings.length, 1);
    assert.match(String(warnings[0][1]), /Missing acknowledgement for REGISTER_PLUGIN/);
  });
}
