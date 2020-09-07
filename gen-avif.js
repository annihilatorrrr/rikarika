const child_process = require("child_process");
const os = require("os");
const path = require("path");
const fs = require("fs-extra");

module.exports = (mp4Path, avifPath) => {
  const nb_frames = JSON.parse(
    child_process
      .execSync(
        [
          "ffprobe",
          "-show_format",
          "-show_streams",
          "-v quiet",
          "-print_format json=compact=1",
          `'${mp4Path.replace(/'/g, "'\\''")}'`,
        ].join(" ")
      )
      .toString()
  ).streams.filter((e) => e.codec_type === "video")[0].nb_frames;
  const tmpPath = `${path.join(os.tmpdir(), process.hrtime().join(""))}.png`;
  child_process.execSync(
    [
      "ffmpeg",
      "-loglevel panic",
      "-y",
      "-ss 00:00:00",
      "-i",
      `'${mp4Path.replace(/'/g, "'\\''")}'`,
      "-frames 1",
      `-vf "select=not(mod(n\\,${Math.floor(nb_frames / 144) + 1})),scale=160:90,tile=12x12"`,
      "-qscale:v 2 ",
      `${tmpPath}`,
    ].join(" ")
  );
  child_process.execSync(
    [
      path.join(__dirname, "bin/avif-linux-x64"),
      `-e ${tmpPath}`,
      `-o '${avifPath.replace(/'/g, "'\\''")}'`,
      "--best",
      "-q 40",
    ].join(" ")
  );
  fs.removeSync(tmpPath);
};
