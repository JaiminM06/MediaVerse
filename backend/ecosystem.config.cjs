module.exports = {
  apps: [
    {
      name: "mediaverse-backend",
      script: "./src/index.js",
      node_args: "-r dotenv/config",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "test"
      }
    }
  ]
};
