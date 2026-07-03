/** Default trade tags — predefined for all users */
export const DEFAULT_TAGS = ['news', 'high impact', 'low volume', 'scalp', 'swing'];

/** Max custom tags a user can add */
export const MAX_CUSTOM_TAGS = 10;

/**
 * Resolve the tag list from user prefs.
 * If the user has saved custom_tags, use ONLY those (they may have deleted defaults).
 * Only fall back to DEFAULT_TAGS if no custom tags are saved.
 */
export function resolveTags(prefs) {
  if (prefs && Array.isArray(prefs.custom_tags) && prefs.custom_tags.length > 0) {
    return prefs.custom_tags;
  }
  return [...DEFAULT_TAGS];
}
