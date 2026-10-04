import test from 'node:test';
import assert from 'node:assert/strict';
import { getPreviewAccessConfig, isPreviewUserAllowed } from './preview-access.mjs';

test('preview access is disabled and fail-closed by default', () => {
  assert.deepEqual(getPreviewAccessConfig({}), {
    enabled: false,
    allowedUserIds: [],
  });
});

test('preview access parses and deduplicates an explicit user allowlist', () => {
  assert.deepEqual(
    getPreviewAccessConfig({
      AI_ANALYTICS_PREVIEW_ENABLED: 'true',
      AI_ANALYTICS_PREVIEW_USER_IDS: ' user-1, user-2, user-1, ',
    }),
    {
      enabled: true,
      allowedUserIds: ['user-1', 'user-2'],
    },
  );
});

test('only an exact non-empty user ID match is allowed', () => {
  const allowedUserIds = ['user-1', 'user-2'];
  assert.equal(isPreviewUserAllowed('user-2', allowedUserIds), true);
  assert.equal(isPreviewUserAllowed('USER-2', allowedUserIds), false);
  assert.equal(isPreviewUserAllowed('', allowedUserIds), false);
  assert.equal(isPreviewUserAllowed(null, allowedUserIds), false);
});
