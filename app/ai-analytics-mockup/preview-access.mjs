export function getPreviewAccessConfig(environment = {}) {
  const allowedUserIds = String(environment.AI_ANALYTICS_PREVIEW_USER_IDS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    enabled: environment.AI_ANALYTICS_PREVIEW_ENABLED === 'true',
    allowedUserIds: [...new Set(allowedUserIds)],
  };
}

export function isPreviewUserAllowed(userId, allowedUserIds = []) {
  return Boolean(userId) && allowedUserIds.includes(userId);
}
