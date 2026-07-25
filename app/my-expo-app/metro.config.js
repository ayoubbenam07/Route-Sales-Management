const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Avoid Metro inlineRequires issues with the PowerSync RN package.
// https://github.com/powersync-ja/powersync-js/tree/main/packages/react-native#metro-config-optional
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      inlineRequires: {
        blockList: {
          [require.resolve('@powersync/react-native')]: true,
        },
      },
    },
  }),
};

module.exports = withNativeWind(config, { input: './global.css' });
