"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * PostHog analytics provider.
 * Loads the PostHog JS snippet from CDN and tracks page views on route changes.
 * The API key is read from NEXT_PUBLIC_POSTHOG_KEY env var.
 * If the key is missing, PostHog is silently disabled (no errors).
 */
export default function PostHogProvider({ children }) {
  const pathname = usePathname();
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';

  // Load PostHog on mount
  useEffect(() => {
    if (!apiKey || typeof window === 'undefined') return;
    if (window.posthog) return; // Already loaded

    // Load posthog-js from CDN
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

    window.posthog.init(apiKey, {
      api_host: 'https://us.i.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: false, // We handle this manually below
    });
  }, [apiKey]);

  // Track page views on route changes
  useEffect(() => {
    if (!apiKey || typeof window === 'undefined' || !window.posthog) return;
    window.posthog.capture('$pageview', { $current_url: window.location.href });
  }, [pathname, apiKey]);

  return children;
}
