import "dotenv/config.js";
import v8 from "v8";
import cluster from "cluster";
import fs from "fs-extra";
import path from "path";
import { URLSearchParams } from "url";
import chokidar from "chokidar";
import fetch from "node-fetch";
import Knex from "knex";
import aniep from "aniep";
import webpush from "web-push";
import gentile from "./gentile.js";
import addAnime from "./add-anime.js";

console.log(
  `${(v8.getHeapStatistics().total_available_size / 1024 / 1024).toFixed(0)} MB Available Memory`
);

if (!cluster.isMaster) {
  process.on("message", (message) => {
    const [task, input, output, arg3, arg4, arg5] = JSON.parse(message);
    if (fs.existsSync(input)) {
      console.log(`Building ${output}`);
      if (task === "gentile") gentile(input, output, arg3, arg4, arg5);
      if (task === "addAnime") addAnime(input, output, arg3, arg4, arg5);
    } else {
      console.log(`Gone     ${output}`);
    }
    process.send(output);
  });
  await new Promise((resolve) => {});
  process.exit();
}

const {
  DB_NAME,
  DB_USER,
  DB_PASS,
  DB_HOST,
  ANIME_PATH,
  ANIME_NEW_PATH,
  ANIME_WEBP_PATH,
  ANIME_PNG_PATH,
  ANIME_AVIF_PATH,
  ANIME_ADD_PATH,
  WEBPUSH_GCM_API_KEY,
  WEBPUSH_SUBJECT,
  WEBPUSH_PUBLIC_KEY,
  WEBPUSH_PRIVATE_KEY,
  TELEGRAM_ID,
  TELEGRAM_TOKEN,
  WEB_HOST,
  NUM_WORKERS,
} = process.env;

const knex = Knex({
  client: "mysql",
  connection: {
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
  },
  pool: {
    min: 0,
  },
});

webpush.setGCMAPIKey(WEBPUSH_GCM_API_KEY);
webpush.setVapidDetails(WEBPUSH_SUBJECT, WEBPUSH_PUBLIC_KEY, WEBPUSH_PRIVATE_KEY);

console.log("Scanning folder...");
const taskList = [];
const workerList = [];
for (let i = 0; i < NUM_WORKERS; i++) {
  const worker = cluster.fork();
  worker.on("message", (filePath) => {
    if (typeof filePath === "object") return;
    console.log(`Complete ${filePath}`);
    if (taskList.length > 0) {
      worker.send(taskList.shift());
    } else {
      workerList.push(worker);
      if (process.argv.includes("--rescan")) {
        process.exit();
      }
    }
  });
  workerList.push(worker);
}

const CHMap = [
  ["BIG5", "GB"],
  ["BIG5", "GB_CN"],
  ["Big5", "GB"],
  ["big5", "gb"],
  ["big5", "GB"],
  ["BIG", "GB"],
  ["TC", "SC"],
  ["tc", "sc"],
  ["tc_jp", "sc_jp"],
  ["jp_tc", "jp_sc"],
  ["CHT", "CHS"],
  ["Cht", "Chs"],
  ["cht", "chs"],
  ["Hant", "Hans"],
];

const isSP = (fileName) =>
  fileName.match(/\W(?:OVA|OAD|Special|Preview|Prev)[\W_]/i) ||
  fileName.match(/\WSP\W{0,1}\d{1,2}/i) ||
  aniep(fileName) === null;

const isRAW = (fileName) => fileName.match(/.*(?:Ohys-Raws|Leopard-Raws|ZhuixinFan).*/i);

const isNewEP = (fileName, dirEntries) => {
  if (!dirEntries.length) return true;
  const ep = aniep(fileName); // number, array or string
  let thisEP = Array.isArray(ep)
    ? ep.pop() // choose largest ep number
    : typeof ep === "string"
    ? Number(ep.split("|").pop()) // choose largest possible
    : ep;
  const lastEP = dirEntries
    .filter((e) => e !== fileName && !isSP(e) && !isRAW(e))
    .map((e) => aniep(e))
    .map((ep) =>
      Array.isArray(ep)
        ? ep.pop()
        : typeof ep === "string"
        ? Number(ep.split("|")[0]) // choose smallest possible
        : ep
    )
    .sort((a, b) => b - a)[0];
  return thisEP > lastEP || lastEP === undefined;
};

chokidar
  .watch(`${ANIME_PATH}/**/*.mp4`, {
    persistent: true,
    ignoreInitial: !process.argv.includes("--rescan"),
    usePolling: false,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100,
    },
    atomic: true,
  })
  .on("add", async (filePath) => {
    console.log(`Added    ${filePath}`);

    // remove existing CHS file if CHT version added
    for (const [cht, chs] of CHMap) {
      if (filePath.replace(cht, chs) !== filePath && fs.existsSync(filePath.replace(cht, chs))) {
        console.log(`Existed  ${filePath}`);
        fs.removeSync(filePath.replace(cht, chs));
        return;
      }
    }

    const pngDir = path.dirname(filePath.replace(ANIME_PATH, ANIME_PNG_PATH));
    const pngPath = path.join(pngDir, `${path.basename(filePath, ".mp4")}.png`);
    const webpDir = path.dirname(filePath.replace(ANIME_PATH, ANIME_WEBP_PATH));
    const webpPath = path.join(webpDir, `${path.basename(filePath, ".mp4")}.webp`);
    const avifDir = path.dirname(filePath.replace(ANIME_PATH, ANIME_AVIF_PATH));
    const avifPath = path.join(avifDir, `${path.basename(filePath, ".mp4")}.avif`);
    fs.ensureDirSync(pngDir);
    fs.ensureDirSync(webpDir);
    fs.ensureDirSync(avifDir);
    if (!fs.existsSync(pngPath) || !fs.existsSync(webpPath) || !fs.existsSync(avifPath)) {
      if (workerList.length > 0) {
        const worker = workerList.pop();
        worker.send(JSON.stringify(["gentile", filePath, pngPath, webpPath, avifPath]));
      } else {
        console.log(`Queued   ${pngPath}`);
        taskList.push(JSON.stringify(["gentile", filePath, pngPath, webpPath, avifPath]));
        taskList.sort();
      }
    }
    if (process.argv.includes("--rescan")) {
      return;
    }

    const dirName = path.dirname(filePath);
    const fileName = path.basename(filePath);
    const id = dirName.replace(ANIME_PATH, "").split("/")[1];
    const { season, title } = (await knex("anime").select("season", "title").where("id", id))[0];
    if (season === "Sukebei" || title === "Test") return;
    if (!isRAW(fileName) && (isSP(fileName) || isNewEP(fileName, fs.readdirSync(dirName)))) {
      await knex("anime").where("id", id).update({ updated: new Date() });
      fs.appendFileSync(
        "./www/message.txt",
        ["", new Date().toISOString(), title, season, fileName, ""].join("\n")
      );
      // no need to await
      fetch(`https://api.telegram.org/${TELEGRAM_TOKEN}/sendMessage`, {
        method: "POST",
        body: new URLSearchParams({
          chat_id: TELEGRAM_ID,
          parse_mode: "Markdown",
          text: [
            `[${title.replace(/[\[\]]/g, "")}](https://${WEB_HOST}/${season}/${encodeURIComponent(
              title
            )
              .replace(/([\(])/g, "%28")
              .replace(/([\)])/g, "%29")}/)`,
            `[${season}](https://${WEB_HOST}/${season}/)`,
            `\`${fileName}\``,
          ].join("\n"),
        }),
      });

      const rows = await knex("subscriber").select("*");
      for (const row of rows) {
        await webpush // do this one-by-one to avoid spamming
          .sendNotification(
            JSON.parse(row.json),
            JSON.stringify({
              title,
              body: fileName,
              tag: fileName,
              icon: "/favicon.png",
              data: {
                url: `https://${WEB_HOST}/${season}/${encodeURIComponent(title)}/`,
              },
            })
          )
          .catch(async (e) => {
            if (e.statusCode === 403 || e.statusCode === 410) {
              await knex("subscriber").where("endpoint", row.endpoint).delete();
              console.log(`Deleted  ${row.endpoint}`);
            } else {
              console.log(e);
            }
          });
      }
    }
  })
  .on("unlink", (filePath) => {
    console.log(`Deleted  ${filePath}`);
    const pngPath = path.join(
      path.dirname(filePath.replace(ANIME_PATH, ANIME_PNG_PATH)),
      `${path.basename(filePath, ".mp4")}.png`
    );
    if (fs.existsSync(pngPath)) {
      fs.removeSync(pngPath);
      console.log(`Deleted  ${pngPath}`);
    }
    const webpPath = path.join(
      path.dirname(filePath.replace(ANIME_PATH, ANIME_WEBP_PATH)),
      `${path.basename(filePath, ".mp4")}.webp`
    );
    if (fs.existsSync(webpPath)) {
      fs.removeSync(webpPath);
      console.log(`Deleted  ${webpPath}`);
    }
    const avifPath = path.join(
      path.dirname(filePath.replace(ANIME_PATH, ANIME_AVIF_PATH)),
      `${path.basename(filePath, ".mp4")}.avif`
    );
    if (fs.existsSync(avifPath)) {
      fs.removeSync(avifPath);
      console.log(`Deleted  ${avifPath}`);
    }
  })
  .on("ready", () => {
    console.log(`Scanned  ${ANIME_PATH}/**/*.mp4`);
    if (process.argv.includes("--rescan")) {
      if (taskList.length === 0) {
        process.exit();
      }
    }
  });

if (!process.argv.includes("--rescan")) {
  chokidar
    .watch(ANIME_ADD_PATH, {
      persistent: true,
      ignoreInitial: false,
      usePolling: false,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100,
      },
      atomic: true,
    })
    .on("add", (filePath) => {
      console.log(`New      ${filePath}`);
      if (filePath.replace(ANIME_ADD_PATH, "").split("/").length < 3) return;
      const animeID = filePath.replace(ANIME_ADD_PATH, "").split("/")[1];
      const fileName = filePath.replace(ANIME_ADD_PATH, "").split("/").pop();
      if (filePath.replace(ANIME_ADD_PATH, "").split("/").length > 3) {
        fs.moveSync(filePath, path.join(ANIME_ADD_PATH, animeID, fileName), {
          overwrite: true,
        });
        return;
      }
      if (![".mp4", ".mkv", ".webm"].includes(path.extname(fileName).toLowerCase())) {
        fs.removeSync(filePath);
        return;
      }
      const newFilePath = path.join(
        ANIME_PATH,
        animeID,
        `${path.basename(fileName, path.extname(fileName))}.mp4`
      );
      // remove incoming file if same file name already exist
      if (fs.existsSync(newFilePath)) {
        console.log(`Existed  ${newFilePath}`);
        fs.removeSync(filePath);
      }
      // remove incoming CHS file if CHT version already exist
      for (const [cht, chs] of CHMap) {
        if (
          newFilePath.replace(chs, cht) !== newFilePath &&
          fs.existsSync(newFilePath.replace(chs, cht))
        ) {
          console.log(`Existed  ${newFilePath}`);
          fs.removeSync(filePath);
          return;
        }
      }
      for (const [cht, chs] of CHMap) {
        if (filePath.replace(chs, cht) !== filePath && fs.existsSync(filePath.replace(chs, cht))) {
          console.log(`Existed  ${filePath}`);
          fs.removeSync(filePath);
          return;
        }
      }
      if (workerList.length > 0) {
        const worker = workerList.pop();
        worker.send(JSON.stringify(["addAnime", filePath, newFilePath]));
      } else {
        console.log(`Queued   ${newFilePath}`);
        taskList.push(JSON.stringify(["addAnime", filePath, newFilePath]));
        taskList.sort();
      }
    })
    .on("unlink", (filePath) => {
      console.log(`Deleted  ${filePath}`);
      if (
        fs.existsSync(path.dirname(filePath)) &&
        fs.readdirSync(path.dirname(filePath)).length === 0
      ) {
        fs.removeSync(path.dirname(filePath));
      }
    })
    .on("unlinkDir", (dirPath) => {
      console.log(`Deleted  ${dirPath}`);
      if (
        dirPath.startsWith(ANIME_ADD_PATH) &&
        path.dirname(dirPath) !== ANIME_ADD_PATH &&
        fs.readdirSync(path.dirname(dirPath)).length === 0
      ) {
        fs.removeSync(path.dirname(dirPath));
      }
    })
    .on("ready", () => {
      console.log(`Scanned  ${ANIME_ADD_PATH}`);
    });
}
