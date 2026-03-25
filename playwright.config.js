const config = {
  testDir: './tests',
  reporter: [['html']],
  use: {
    baseURL: 'http://localhost:3000'
  },
  webServer: {
    command: 'npx serve . --listen 3000',
    port: 3000
  }
};

module.exports = config;
