require("dotenv").config();

const path = require("path");
const fs = require("fs-extra");

const { ANIME_NEW_PATH } = process.env;

for (const season of fs.readdirSync(ANIME_NEW_PATH)) {
  for (const anime of fs.readdirSync(path.join(ANIME_NEW_PATH, season))) {
    console.log(path.join(ANIME_NEW_PATH, season, anime));
    const [lastModifiedFile] = fs
      .readdirSync(path.join(ANIME_NEW_PATH, season, anime))
      .map((file) => fs.statSync(path.join(ANIME_NEW_PATH, season, anime, file)))
      .sort((a, b) => b.mtimeMs - a.mtimeMs);
    if (lastModifiedFile) {
      fs.utimesSync(
        path.join(ANIME_NEW_PATH, season, anime),
        lastModifiedFile.atime,
        lastModifiedFile.mtime
      );
    }
  }
  console.log(path.join(ANIME_NEW_PATH, season));
  const [lastModifiedDir] = fs
    .readdirSync(path.join(ANIME_NEW_PATH, season))
    .map((dir) => fs.statSync(path.join(ANIME_NEW_PATH, season, dir)))
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
  if (lastModifiedDir) {
    fs.utimesSync(path.join(ANIME_NEW_PATH, season), lastModifiedDir.atime, lastModifiedDir.mtime);
  }
}
