/** Default trade tags — predefined for all users */
export const DEFAULT_TAGS = ['News', 'High Impact', 'Low Volume', 'Scalp', 'Swing'];

/** Max custom tags a user can add */
export const MAX_CUSTOM_TAGS = 10;

/**
 * Resolve the full tag list: custom tags from prefs (if any) merged with defaults.
 * Custom tags appear after defaults. Duplicates removed.
 */
export function resolveTags(prefs) {
  const custom = (prefs && Array.isArray(prefs.custom_tags) && prefs.custom_tags.length > 0)
    ? prefs.custom_tags
    : [];
  const all = [...DEFAULT_TAGS, ...custom];
  return [...new Set(all)];
}
