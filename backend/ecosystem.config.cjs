module.exports = {
  apps: [
    {
      name: "mediaverse-backend",
      script: "./src/index.js",
      node_args: "-r dotenv/config",
      instances: "max",
      exec_mode: "cluster",
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
