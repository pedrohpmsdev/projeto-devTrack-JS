import os from "os";

const config = {
  port: process.env.PORT,
  github_token: process.env.GITHUB_TOKEN.length | undefined,
  data_dir: "./data",
  debug: process.env.DEBUG,
  max_workers: os.cpus().length,
  webhook_url: process.env.WEBHOOK_URL.length | undefined,
};

export default config;
