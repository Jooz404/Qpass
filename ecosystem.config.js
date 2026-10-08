module.exports = {
  apps: [
    {
      name: 'qpass-backend',
      script: 'src/server.js',
      cwd: './backend',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
