// Su GitHub Pages l'app vive in una sottocartella (/<nome-repository>/): la imposta EXPO_BASE_URL.
module.exports = ({ config }) => ({
  ...config,
  experiments: { ...(config.experiments ?? {}), baseUrl: process.env.EXPO_BASE_URL || '' },
});
