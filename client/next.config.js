module.exports = {
  webpackDevMiddleware: (config) => {
    config.watchOptions.poll = 300;
    return 300;
  },
};
