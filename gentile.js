const child_process = require("child_process");
const path = require("path");
const fs = require("fs-extra");

module.exports = (mp4Path, pngPath, jpgPath, webpPath, avifPath) => {
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
      `'${pngPath.replace(/'/g, "'\\''")}'`,
    ].join(" ")
  );

  child_process.execSync(
    [
      "ffmpeg",
      "-loglevel panic",
      "-y",
      "-i",
      `'${pngPath.replace(/'/g, "'\\''")}'`,
      "-qscale:v 2 ",
      `'${jpgPath.replace(/'/g, "'\\''")}'`,
    ].join(" ")
  );

  if (!fs.existsSync(webpPath)) {
    child_process.execSync(
      [
        "cwebp",
        "-quiet",
        "-m 6", // compression level (0-6 highest, default 4)
        "-q 10", // quality (0-100 highest, default 75)
        `'${pngPath}'`,
        `-o '${webpPath.replace(/'/g, "'\\''")}'`,
      ].join(" ")
    );
  }
  if (!fs.existsSync(avifPath)) {
    child_process.execSync(
      [
        path.join(__dirname, "bin/avif-linux-x64"),
        `-e '${pngPath}'`,
        `-o '${avifPath.replace(/'/g, "'\\''")}'`,
        "-s 4", // speed (0-8 fastest, default 4)
        "-q 40", // quality (0-63 lowest, default 25)
      ].join(" ")
    );
  }
};
