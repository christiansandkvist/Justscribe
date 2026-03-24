const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// ── Native-only modules that must resolve to empty on web ─────────────────
const WEB_EMPTY_MODULES = [
  '@stripe/stripe-react-native',
  'react-native/Libraries/Utilities/Platform.ios',
  'react-native/Libraries/Utilities/Platform.android',
  'jimp-compact',
  '@jimp/core',
  // expo-web-browser is native-only; Google OAuth on web uses window.location redirect
  'expo-web-browser',
];

// ── On web: redirect react-native → react-native-web ─────────────────────
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    // Block native-only packages
    if (WEB_EMPTY_MODULES.some((m) => moduleName === m || moduleName.startsWith(m + '/'))) {
      return { type: 'empty' };
    }

    // Map react-native internals to react-native-web equivalents
    if (moduleName === 'react-native') {
      return context.resolveRequest(context, 'react-native-web', platform);
    }

    // Internal path: react-native/Libraries/... → try react-native-web first
    if (moduleName.startsWith('react-native/')) {
      const subpath = moduleName.replace('react-native/', '');
      const rnwPath = path.join(
        __dirname,
        'node_modules/react-native-web/dist/cjs',
        subpath
      );
      try {
        require.resolve(rnwPath);
        return { type: 'sourceFile', filePath: rnwPath };
      } catch {
        // Not in react-native-web — fall through to default
      }
    }
  }

  return context.resolveRequest(context, moduleName, platform);
};

// ── On web: prefer browser field over react-native field ──────────────────
const originalResolverMainFields = config.resolver.resolverMainFields ?? [
  'react-native',
  'browser',
  'main',
];

// Metro doesn't support per-platform resolverMainFields natively,
// but we handle the critical case (react-native → react-native-web) above.
config.resolver.resolverMainFields = originalResolverMainFields;

// ── File extensions ────────────────────────────────────────────────────────
config.resolver.sourceExts = [
  ...config.resolver.sourceExts.filter((e) => !['mjs', 'cjs'].includes(e)),
  'mjs',
  'cjs',
];

module.exports = config;
