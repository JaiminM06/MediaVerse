module.exports = {
  apps: [
    {
      name: "mediaverse-api",
      script: "./src/index.js",
      instances: "max",
      exec_mode: "cluster",
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "mediaverse-worker",
      script: "./src/workers/index.js",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};