import "dotenv/config.js";

import path from "path";
import fs from "fs-extra";
import child_process from "child_process";
import Knex from "knex";

const {
  DB_NAME,
  DB_USER,
  DB_PASS,
  DB_HOST,
  ANIME_PATH,
  ANIME_NEW_PATH,
  ANIME_PNG_PATH,
  ANIME_WEBP_PATH,
  ANIME_AVIF_PATH,
} = process.env;

const knex = Knex({
  client: "mysql",
  connection: {
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
  },
});

const season = await knex("anime").distinct("season");
const titleList = await knex("anime").select("id", "season", "title");
const list = titleList.map((e) => path.join(ANIME_PATH, `${e.id}`));
const seasonList = season.map((e) => path.join(ANIME_NEW_PATH, e.season));
const newList = titleList.map((e) => path.join(ANIME_NEW_PATH, e.season, e.title));
const pngList = titleList.map((e) => path.join(ANIME_PNG_PATH, `${e.id}`));
const webpList = titleList.map((e) => path.join(ANIME_WEBP_PATH, `${e.id}`));
const avifList = titleList.map((e) => path.join(ANIME_AVIF_PATH, `${e.id}`));

console.log("Missing symlink / folders:");
for (const entry of seasonList) {
  if (!fs.existsSync(entry) || !fs.statSync(entry).isDirectory()) {
    console.log(entry);
  }
}
for (const entry of list) {
  if (!fs.existsSync(entry) || !fs.statSync(entry).isDirectory()) {
    console.log(entry);
  }
}
for (const entry of newList) {
  if (!fs.existsSync(entry) || !fs.statSync(entry).isDirectory()) {
    console.log(entry);
  }
}
for (const entry of pngList) {
  if (
    !fs.existsSync(entry) &&
    fs.readdirSync(entry.replace(ANIME_PNG_PATH, ANIME_PATH)).length > 0
  ) {
    console.log(entry);
  }
}
for (const entry of webpList) {
  if (
    !fs.existsSync(entry) &&
    fs.readdirSync(entry.replace(ANIME_WEBP_PATH, ANIME_PATH)).length > 0
  ) {
    console.log(entry);
  }
}
for (const entry of avifList) {
  if (
    !fs.existsSync(entry) &&
    fs.readdirSync(entry.replace(ANIME_AVIF_PATH, ANIME_PATH)).length > 0
  ) {
    console.log(entry);
  }
}
console.log("Extra symlink / folders:");
for (const entry of child_process
  .execSync(`find ${ANIME_PATH}/* -type d`, {
    maxBuffer: 1024 * 1024 * 100,
  })
  .toString()
  .split("\n")
  .filter((e) => !list.includes(e))
  .filter((e) => e)) {
  console.log(entry);
}

for (const entry of child_process
  .execSync(`find ${ANIME_NEW_PATH}/* -maxdepth 0`, {
    maxBuffer: 1024 * 1024 * 100,
  })
  .toString()
  .split("\n")
  .filter((e) => !seasonList.includes(e))
  .filter((e) => e)) {
  console.log(entry);
}

for (const entry of child_process
  .execSync(`find ${ANIME_NEW_PATH}/*/*`, {
    maxBuffer: 1024 * 1024 * 100,
  })
  .toString()
  .split("\n")
  .filter((e) => !newList.includes(e))
  .filter((e) => e)) {
  console.log(entry);
}

for (const entry of child_process
  .execSync(`find ${ANIME_PNG_PATH}/* -type d`, {
    maxBuffer: 1024 * 1024 * 100,
  })
  .toString()
  .split("\n")
  .filter((e) => !pngList.includes(e))
  .filter((e) => e)) {
  console.log(entry);
}

console.log("Extra png:");
for (const entry of child_process
  .execSync(`find ${ANIME_PNG_PATH}/* -type f`, {
    maxBuffer: 1024 * 1024 * 100,
  })
  .toString()
  .split("\n")
  .map((e) => e.replace(ANIME_PNG_PATH, ANIME_PATH).replace(".png", ".mp4"))
  .filter((e) => !fs.existsSync(e))
  .filter((e) => e)) {
  console.log(entry.replace(ANIME_PATH, ANIME_PNG_PATH).replace(".mp4", ".png"));
  if (process.argv.includes("--delete")) {
    fs.removeSync(entry.replace(ANIME_PATH, ANIME_PNG_PATH).replace(".mp4", ".png"));
  }
}

for (const entry of child_process
  .execSync(`find ${ANIME_WEBP_PATH}/* -type d`, {
    maxBuffer: 1024 * 1024 * 100,
  })
  .toString()
  .split("\n")
  .filter((e) => !webpList.includes(e))
  .filter((e) => e)) {
  console.log(entry);
}

console.log("Extra webp:");
for (const entry of child_process
  .execSync(`find ${ANIME_WEBP_PATH}/* -type f`, {
    maxBuffer: 1024 * 1024 * 100,
  })
  .toString()
  .split("\n")
  .map((e) => e.replace(ANIME_WEBP_PATH, ANIME_PATH).replace(".webp", ".mp4"))
  .filter((e) => !fs.existsSync(e))
  .filter((e) => e)) {
  console.log(entry.replace(ANIME_PATH, ANIME_WEBP_PATH).replace(".mp4", ".webp"));
  if (process.argv.includes("--delete")) {
    fs.removeSync(entry.replace(ANIME_PATH, ANIME_WEBP_PATH).replace(".mp4", ".webp"));
  }
}
for (const entry of child_process
  .execSync(`find ${ANIME_AVIF_PATH}/* -type d`, {
    maxBuffer: 1024 * 1024 * 100,
  })
  .toString()
  .split("\n")
  .filter((e) => !avifList.includes(e))
  .filter((e) => e)) {
  console.log(entry);
}

console.log("Extra avif:");
for (const entry of child_process
  .execSync(`find ${ANIME_AVIF_PATH}/* -type f`, {
    maxBuffer: 1024 * 1024 * 100,
  })
  .toString()
  .split("\n")
  .map((e) => e.replace(ANIME_AVIF_PATH, ANIME_PATH).replace(".avif", ".mp4"))
  .filter((e) => !fs.existsSync(e))
  .filter((e) => e)) {
  console.log(entry.replace(ANIME_PATH, ANIME_AVIF_PATH).replace(".mp4", ".avif"));
  if (process.argv.includes("--delete")) {
    fs.removeSync(entry.replace(ANIME_PATH, ANIME_AVIF_PATH).replace(".mp4", ".avif"));
  }
}
knex.destroy();
