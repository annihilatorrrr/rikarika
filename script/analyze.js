require("dotenv").config();

const child_process = require("child_process");
const cluster = require("cluster");
const fs = require("fs");
const os = require("os");

const { ANIME_PATH } = process.env;

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

  fs.writeFileSync("db.json", "[\n");
  for (let i = 0; i < concurrency; i++) {
    const worker = cluster.fork();
    let fileName = fileList.pop();
    worker.send(fileName);
    worker.on("message", (message) => {
      fs.appendFileSync("db.json", `${JSON.stringify(JSON.parse(message))},\n`);
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
      if (fileList.length === 0) {
        worker.kill();
      } else {
        worker.send(fileList.pop());
      }
    });

    worker.on("exit", (code) => {
      finished += 1;
      if (finished === concurrency) {
        fs.appendFileSync("db.json", "\n]");
        console.log("all done");
      }
    });
  }
} else {
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
      process.send(result);
    } catch (e) {
      console.log(e, message);
    }
  });
}
