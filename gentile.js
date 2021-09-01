import child_process from "child_process";
import path from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default (mp4Path, pngPath, webpPath, avifPath) => {
  if (!fs.existsSync(pngPath)) {
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
        `'${pngPath.replace(/'/g, "'\\''").replace(/%/g, "%%")}'`,
      ].join(" ")
    );
  }
  if (!fs.existsSync(webpPath)) {
    child_process.execSync(
      [
        "cwebp",
        "-quiet",
        "-m 6", // compression level (0-6 highest, default 4)
        "-q 15", // quality (0-100 highest, default 75)
        `'${pngPath.replace(/'/g, "'\\''").replace(/%/g, "%%")}'`,
        `-o '${webpPath.replace(/'/g, "'\\''").replace(/%/g, "%%")}'`,
      ].join(" ")
    );
  }
  if (!fs.existsSync(avifPath)) {
    child_process.execSync(
      [
        path.join(__dirname, "bin/avif-linux-x64"),
        `-e '${pngPath.replace(/'/g, "'\\''").replace(/%/g, "%%")}'`,
        `-o '${avifPath.replace(/'/g, "'\\''").replace(/%/g, "%%")}'`,
        "-s 4", // speed (0-8 fastest, default 4)
        "-q 40", // quality (0-63 lowest, default 25)
      ].join(" ")
    );
  }
};
