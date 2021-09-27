import "dotenv/config.js";

import child_process from "child_process";
import cluster from "cluster";
import Knex from "knex";

const { ANIME_PATH, DB_NAME, DB_USER, DB_PASS, DB_HOST } = process.env;

const knex = Knex({
  client: "mysql",
  connection: {
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
  },
});

if (cluster.isMaster) {
  console.log("Reading file list...");
  const fileList = child_process
    .execSync(`find -L ${ANIME_PATH} -type f -name "*.mp4"`, {
      maxBuffer: 1024 * 1024 * 100,
    })
    .toString()
    .split("\n")
    // .slice(0, 100)
    .filter((each) => each);

  let finished = 0;
  const concurrency = 8;
  const displayInterval = 500; // ms
  let speedRecord = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let time = 0;
  let mark = fileList.length;
  let total = fileList.length;

  for (let i = 0; i < concurrency; i++) {
    const worker = cluster.fork();
    worker.on("message", async (message) => {
      if (message) {
        const { filePath, result } = JSON.parse(message);
        await knex.raw(
          knex("mediainfo")
            .insert({
              path: filePath,
              json: result,
            })
            .toString()
            .replace(/^insert/i, "insert ignore")
        );
        if (Date.now() - time > displayInterval) {
          const speed = (mark - fileList.length) / (displayInterval / 1000);
          speedRecord.push(speed);
          speedRecord = speedRecord.slice(1);
          const averageSpeed = speedRecord.reduce((a, b) => a + b, 0) / speedRecord.length;
          const ETA = fileList.length / averageSpeed;
          const completed = total - fileList.length;
          const percentage = ((completed / total) * 100).toFixed(2);
          console.log(
            `${completed}/${total}`,
            `(${percentage}%)`,
            `[${averageSpeed.toFixed(1)} tasks/s, ETA ${ETA.toFixed(0)}s]`
          );
          time = Date.now();
          mark = fileList.length;
        }
      }
      if (fileList.length === 0) {
        worker.kill();
      } else {
        worker.send(fileList.pop());
      }
    });

    worker.on("exit", (code) => {
      finished += 1;
      if (finished === concurrency) {
        console.log("all done");
        process.exit();
      }
    });
  }
} else {
  process.send("");
  process.on("message", (message) => {
    try {
      const result = child_process
        .execSync(
          [
            "ffprobe",
            "-show_format",
            "-show_streams",
            "-v quiet",
            "-print_format json=compact=1",
            `'${message.replace(/'/g, "'\\''")}'`,
          ].join(" ")
        )
        .toString();
      process.send(JSON.stringify({ filePath: message, result: result }));
    } catch (e) {
      console.log(e, message);
    }
  });
}
