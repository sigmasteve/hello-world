// Vendored from react-native-health-connect's own app.plugin.js (MIT
// licensed, see node_modules/react-native-health-connect/LICENSE).
//
// Why this exists instead of just listing "react-native-health-connect" in
// app.json's plugins array: Expo's config-plugin loader auto-discovers a
// package's plugin via `<package>/app.plugin.js`, and on at least one real
// machine that auto-resolution has failed with
// `PluginError: Unexpected token 'typeof'` — the resolver falls through to
// requiring the package's plain JS "main" entry (compiled output, not a
// plugin) instead of app.plugin.js, and something about parsing that
// surfaces a syntax error. It didn't reproduce in every environment, so the
// exact trigger is unconfirmed, but referencing this file directly by path
// sidesteps Expo's auto-discovery for this package entirely — there's
// nothing left to misresolve.
//
// If upstream changes what this mod does, diff against
// node_modules/react-native-health-connect/app.plugin.js and update here.
const {
  AndroidConfig,
  createRunOncePlugin,
  withAndroidManifest,
} = require('@expo/config-plugins');

const { getMainActivityOrThrow, getMainApplicationOrThrow } =
  AndroidConfig.Manifest;

const RATIONALE_ACTION = 'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE';
const VIEW_PERMISSION_USAGE_ALIAS = 'ViewPermissionUsageActivity';

const hasIntentFilter = (androidName, intentFilters) =>
  intentFilters.some((intentFilter) =>
    (intentFilter.action || []).some(
      (action) => action.$['android:name'] === androidName
    )
  );

const hasActivityAlias = (androidName, activityAliases) =>
  activityAliases.some(
    (activityAlias) => activityAlias.$['android:name'] === androidName
  );

const withHealthConnect = (config) =>
  withAndroidManifest(config, async (config) => {
    const mainApplication = getMainApplicationOrThrow(config.modResults);
    const mainActivity = getMainActivityOrThrow(config.modResults);

    // Through Android 13, the main activity handles the intent shown when users tap
    // the privacy policy link in the Health Connect permission dialog.
    if (!mainActivity['intent-filter']) {
      mainActivity['intent-filter'] = [];
    }

    if (!hasIntentFilter(RATIONALE_ACTION, mainActivity['intent-filter'])) {
      mainActivity['intent-filter'].push({
        action: [{ $: { 'android:name': RATIONALE_ACTION } }],
      });
    }

    // Starting with Android 14 the same rationale is reached through an activity
    // alias guarded by START_VIEW_PERMISSION_USAGE instead.
    if (!mainApplication['activity-alias']) {
      mainApplication['activity-alias'] = [];
    }

    if (
      !hasActivityAlias(
        VIEW_PERMISSION_USAGE_ALIAS,
        mainApplication['activity-alias']
      )
    ) {
      mainApplication['activity-alias'].push({
        $: {
          'android:name': VIEW_PERMISSION_USAGE_ALIAS,
          'android:exported': 'true',
          'android:targetActivity': mainActivity.$['android:name'],
          'android:permission':
            'android.permission.START_VIEW_PERMISSION_USAGE',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.intent.action.VIEW_PERMISSION_USAGE',
                },
              },
            ],
            category: [
              {
                $: {
                  'android:name': 'android.intent.category.HEALTH_PERMISSIONS',
                },
              },
            ],
          },
        ],
      });
    }

    return config;
  });

// The name/version here are only bookkeeping createRunOncePlugin uses to
// dedupe repeated applications in the resolved config's history — not a
// real reference to the package, so a hardcoded version (kept loosely in
// sync with package.json's pinned "react-native-health-connect") is fine.
module.exports = createRunOncePlugin(
  withHealthConnect,
  'react-native-health-connect',
  '4.1.3'
);
