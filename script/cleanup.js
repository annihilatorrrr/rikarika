require("dotenv").config();

const path = require("path");
const fs = require("fs-extra");
const child_process = require("child_process");

const {
  DB_NAME,
  DB_USER,
  DB_PASS,
  DB_HOST,
  ANIME_PATH,
  ANIME_NEW_PATH,
  ANIME_THUMB_PATH,
  ANIME_ADD_PATH,
} = process.env;

console.log("Cleaning up thumbnails...");
const fileList = child_process
  .execSync(`find -L ${ANIME_THUMB_PATH} -type f`, {
    maxBuffer: 1024 * 1024 * 100,
  })
  .toString()
  .split("\n")
  .filter((each) => each);

for (let jpgPath of fileList) {
  const mp4Dir = path.dirname(jpgPath.replace(ANIME_THUMB_PATH, ANIME_PATH));
  const mp4Path = path.join(mp4Dir, `${path.basename(jpgPath, ".jpg")}.mp4`);
  if (!fs.existsSync(mp4Path)) {
    console.log(`Deleting ${jpgPath}`);
    fs.removeSync(jpgPath);
  }
}
