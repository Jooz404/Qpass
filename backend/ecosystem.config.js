module.exports = {
  apps: [
    {
      name: 'qpass-backend',
      script: './src/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
