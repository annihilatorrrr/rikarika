const v8 = require("v8");
console.log(
  `${(v8.getHeapStatistics().total_available_size / 1024 / 1024).toFixed(0)} MB Available Memory`
);

const cluster = require("cluster");
const fs = require("fs-extra");

if (!cluster.isMaster) {
  process.on("message", (message) => {
    const [task, input, output, arg3, arg4, arg5] = JSON.parse(message);
    if (fs.existsSync(input)) {
      console.log(`Building ${output}`);
      require(task)(input, output, arg3, arg4, arg5);
    } else {
      console.log(`Gone     ${output}`);
    }
    process.send(output);
  });
  return;
}

require("dotenv").config();

const os = require("os");
const path = require("path");
const chokidar = require("chokidar");
const fetch = require("node-fetch");
const { URLSearchParams } = require("url");
const aniep = require("aniep");

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
} = process.env;

const knex = require("knex")({
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

const webpush = require("web-push");
webpush.setGCMAPIKey(WEBPUSH_GCM_API_KEY);
webpush.setVapidDetails(WEBPUSH_SUBJECT, WEBPUSH_PUBLIC_KEY, WEBPUSH_PRIVATE_KEY);

console.log("Scanning folder...");
const taskList = [];
const workerList = [];
const concurrency = Math.ceil(os.cpus().length / 2);
for (let i = 0; i < concurrency; i++) {
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
        worker.send(JSON.stringify(["./gentile.js", filePath, pngPath, webpPath, avifPath]));
      } else {
        console.log(`Queued   ${pngPath}`);
        taskList.push(JSON.stringify(["./gentile.js", filePath, pngPath, webpPath, avifPath]));
        taskList.sort();
      }
    }
    if (process.argv.includes("--rescan")) {
      return;
    }

    const dirName = path.dirname(filePath);
    const fileName = path.basename(filePath);
    const { season, title } = (
      await knex("anime")
        .select("season", "title")
        .where("id", dirName.replace(ANIME_PATH, "").split("/")[1])
    )[0];
    if (season === "Sukebei" || title === "Test") {
      fs.utimesSync(
        path.dirname(filePath),
        fs.statSync(filePath).atime,
        fs.statSync(filePath).mtime
      );
      fs.utimesSync(
        path.join(ANIME_NEW_PATH, season),
        fs.statSync(filePath).atime,
        fs.statSync(filePath).mtime
      );
      return;
    }
    if (!isRAW(fileName) && (isSP(fileName) || isNewEP(fileName, fs.readdirSync(dirName)))) {
      fs.utimesSync(
        path.dirname(filePath),
        fs.statSync(filePath).atime,
        fs.statSync(filePath).mtime
      );
      fs.utimesSync(
        path.join(ANIME_NEW_PATH, season),
        fs.statSync(filePath).atime,
        fs.statSync(filePath).mtime
      );
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

      const rows = await knex("subscription").select("*");
      for (let i = 0; i < rows.length; i += 1) {
        await webpush // do this one-by-one to avoid spamming
          .sendNotification(
            JSON.parse(rows[i].json),
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
              await knex("subscription").where("id", rows[i].id).delete();
              console.log(`Deleted  ${rows[i].id}`);
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
        worker.send(JSON.stringify(["./add-anime.js", filePath, newFilePath]));
      } else {
        console.log(`Queued   ${newFilePath}`);
        taskList.push(JSON.stringify(["./add-anime.js", filePath, newFilePath]));
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
