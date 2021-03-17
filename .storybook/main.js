module.exports = {
  stories: ["../stories/**/*.stories.tsx"],
  addons: [
    "@storybook/addon-actions",
    "@storybook/addon-links",
  ],
  webpackFinal: async (config, { configType }) => {
    config.module.rules.push({
      test: /.scss$/,
      use: ["style-loader", "css-loader", "sass-loader"],
    });

    return config;
  },
};
