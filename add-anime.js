import path from "path";
import fs from "fs-extra";
import os from "os";
import child_process from "child_process";
import OpenCC from "opencc";

export default (input, output) => {
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
  const hasSubtitle = Boolean(
    mediaInfo.streams.find(
      (e) => e.codec_type === "subtitle" && ["subrip", "ass"].includes(e.codec_name)
    )
  );
  const tmpPath = path.join(os.tmpdir(), process.hrtime().join(""));
  const tcSubtitleID = mediaInfo.streams
    .filter((e) => e.codec_type === "subtitle" && ["subrip", "ass"].includes(e.codec_name))
    .map(({ index, codec_name }) => {
      const subtitleTempPath = `${tmpPath}.${index}.${codec_name === "subrip" ? "srt" : "ass"}`;
      child_process.execSync(
        [
          "ffmpeg",
          "-y",
          "-hide_banner",
          "-loglevel warning",
          "-nostats",
          `-i '${input.replace(/'/g, "'\\''")}'`,
          `-map 0:${index}`,
          `'${subtitleTempPath}'`,
        ].join(" ")
      );
      const subtitleText = fs.readFileSync(subtitleTempPath, "utf8").replace(/[ -~]/g, "");
      fs.removeSync(subtitleTempPath);

      let tcGlyphCount = 0;
      for (let glyphTC of new Set(new OpenCC("s2t.json").convertSync(subtitleText).split(""))) {
        if (new Set(subtitleText.split("")).has(glyphTC)) {
          tcGlyphCount++; // if the subtitle is TC it should have higher count
        }
      }
      return { index, tcGlyphCount };
    })
    .sort((a, b) => b.tcGlyphCount - a.tcGlyphCount)[0]?.index; // select highest

  const subtitleFormat =
    mediaInfo.streams.find((e) => e.index === tcSubtitleID)?.codec_name === "subrip"
      ? "srt"
      : "ass";
  const subtitleTempPath = `${tmpPath}.${subtitleFormat}`;
  if (hasSubtitle) {
    child_process.execSync(
      [
        "ffmpeg",
        "-y",
        "-hide_banner",
        "-loglevel warning",
        "-nostats",
        `-i '${input.replace(/'/g, "'\\''")}'`,
        `-map 0:${tcSubtitleID}`,
        `'${subtitleTempPath}'`,
      ].join(" ")
    );
  }

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
      !hasSubtitle && ["High", "Main"].includes(videoInfo.profile) && videoInfo.level <= 51
        ? "-c:v copy"
        : "-c:v libx264 -r 24000/1001 -pix_fmt yuv420p -profile:v high -preset medium",
      hasSubtitle && subtitleFormat === "srt" ? `-vf "subtitles=${subtitleTempPath}"` : "",
      hasSubtitle && subtitleFormat === "ass" ? `-vf "ass=${subtitleTempPath}"` : "",
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
  fs.removeSync(subtitleTempPath);
  fs.ensureDirSync(path.dirname(output));
  fs.moveSync(`${tmpPath}.mp4`, output, { overwrite: true });
  fs.removeSync(input);
};
