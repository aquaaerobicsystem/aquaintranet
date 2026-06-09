module.exports = {
  apps: [
    {
      name: "aqua-admin-portal",
      script: "./server.js",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 5025
      }
    }
  ]
};
