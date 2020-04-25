const path = require("path");
const fs = require("fs-extra");
const os = require("os");
const child_process = require("child_process");

module.exports = (input, output) => {
  const mediaInfo = JSON.parse(
    child_process
      .execSync(
        [
          "ffprobe",
          "-show_format",
          "-show_streams",
          "-v quiet",
          "-print_format json=compact=1",
          `'${input.replace(/'/g, "'\\''")}'`,
        ].join(" ")
      )
      .toString()
  );
  const videoInfo = mediaInfo.streams.find((e) => e.codec_type === "video");
  const skipTranscode =
    ["High", "Main"].includes(videoInfo.profile) && videoInfo.level <= 51;

  const tmpPath = path.join(os.tmpdir(), process.hrtime().join(""));
  child_process.execSync(
    [
      "ffmpeg",
      "-hide_banner",
      "-loglevel warning",
      "-nostats",
      `-i '${input.replace(/'/g, "'\\''")}'`,
      `-vn '${tmpPath}.wav'`,
    ].join(" ")
  );
  child_process.execSync(`normalize --quiet '${tmpPath}.wav'`);
  child_process.execSync(
    [
      "ffmpeg",
      "-hide_banner",
      "-loglevel warning",
      "-nostats",
      `-i '${input.replace(/'/g, "'\\''")}'`,
      `-i '${tmpPath}.wav'`,
      "-strict experimental",
      "-map_metadata -1",
      "-map_chapters -1",
      skipTranscode ? "-c:v copy" : "-c:v libx264",
      "-c:a aac",
      "-b:a 128k",
      "-movflags",
      "+faststart",
      "-map 0:v:0",
      "-map 1:a:0",
      `'${tmpPath}.mp4'`,
    ].join(" ")
  );
  fs.removeSync(`${tmpPath}.wav`);
  fs.ensureDirSync(path.dirname(output));
  const { atime, mtime } = fs.statSync(path.dirname(output));
  fs.moveSync(`${tmpPath}.mp4`, output, { overwrite: true });
  fs.utimesSync(path.dirname(output), atime, mtime);
  fs.removeSync(input);
};
