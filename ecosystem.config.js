module.exports = {
  apps: [
    {
      name: "rikarika-web",
      script: "server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      exec_mode: "fork",
    },
    {
      name: "rikarika-workers",
      script: "watch.js",
      node_args: "--max-old-space-size=4096",
      instances: 1,
      autorestart: true,
      watch: false,
      exec_mode: "fork",
    },
  ],
};
