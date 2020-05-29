require("dotenv").config();
const fs = require("fs-extra");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const child_process = require("child_process");
const fetch = require("node-fetch");

const {
  DB_NAME,
  DB_USER,
  DB_PASS,
  DB_HOST,
  ES_HOST,
  ES_PORT,
  ANIME_PATH,
  ANIME_NEW_PATH,
  ANIME_THUMB_PATH,
  RUTORRENT_HOST,
  RUTORRENT_HOST_2,
  WEB_PORT,
  WEB_PASSWORD,
  WEB_WHITELIST_IP,
  WEB_SECRET,
  WEBPUSH_PUBLIC_KEY,
  DONATE_URL,
} = process.env;

const knex = require("knex")({
  client: "mysql",
  connection: {
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
  },
});

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// path with extension
app.get(/[^\/]+\.[^\/]+$/, express.static(path.join(__dirname, "www")));

// path ends with /
app.get(/.*\/$/, (req, res) => {
  res.setHeader("Content-Type", "text/html");
  if (req.path === "/admin/") {
    res.send(
      fs
        .readFileSync(path.join(__dirname, "view/admin.html"), "utf8")
        .replace("RUTORRENT_HOST", RUTORRENT_HOST)
        .replace("RUTORRENT_HOST_2", RUTORRENT_HOST_2)
    );
    return;
  }
  if (
    req.cookies.session &&
    req.cookies.session ===
      crypto.createHmac("sha256", WEB_PASSWORD).update(WEB_SECRET).digest("hex")
  ) {
    const view = /(Android|iPad|iPhone|iPod)/g.test(req.headers["user-agent"])
      ? "mobile"
      : "index";
    res.setHeader("Link", `</js/${view}.js>; as=script; rel=preload`);
    res.send(
      fs
        .readFileSync(path.join(__dirname, `view/${view}.html`), "utf8")
        .replace("WEBPUSH_PUBLIC_KEY", WEBPUSH_PUBLIC_KEY)
        .replace("DONATE_URL", DONATE_URL)
    );
  } else {
    res.send(fs.readFileSync(path.join(__dirname, "view/login.html")));
  }
});

app.post("/login", (req, res) => {
  if (
    req.body.password === WEB_PASSWORD ||
    req.headers["x-real-ip"] === WEB_WHITELIST_IP
  ) {
    res.setHeader(
      "Set-Cookie",
      `session=${crypto
        .createHmac("sha256", WEB_PASSWORD)
        .update(WEB_SECRET)
        .digest("hex")}; Secure; HttpOnly; SameSite=Strict`
    );
  }
  return res.redirect(
    302,
    req.headers["referer"] ? new URL(req.headers["referer"]).pathname : "/"
  );
});

app.get("/logout", (req, res) => {
  res.setHeader("Set-Cookie", `session=; Secure; HttpOnly; SameSite=Strict`);
  return res.redirect(
    302,
    req.headers["referer"] ? new URL(req.headers["referer"]).pathname : "/"
  );
});

// path without extension and not end with /
app.use(/\/[^\.\/]+$/, (req, res, next) => {
  if (
    req.cookies.session &&
    req.cookies.session ===
      crypto.createHmac("sha256", WEB_PASSWORD).update(WEB_SECRET).digest("hex")
  ) {
    next();
  } else {
    return res.sendStatus(403);
  }
});

app.get("/motd", async (req, res) => {
  res.type("text/plain");
  return res.send(
    fs.readFileSync(path.join(__dirname, "www", "message.txt"), "utf8")
  );
});

app.get("/list", async (req, res) => {
  res.type("text/plain");
  return res.send(
    [
      child_process.execSync("date").toString().trim(),
      "",
      `Number of mp4 files: ${child_process
        .execSync(`find "${ANIME_PATH}" -type f -name "*.mp4" | wc -l`)
        .toString()
        .trim()}`,
      `Number of ass files: ${child_process
        .execSync(`find "${ANIME_PATH}" -type f -name "*.ass" | wc -l`)
        .toString()
        .trim()}`,
      `Number of txt files: ${child_process
        .execSync(`find "${ANIME_PATH}" -type f -name "*.txt" | wc -l`)
        .toString()
        .trim()}`,
      `Number of files: ${child_process
        .execSync(`find "${ANIME_PATH}" -type f | wc -l`)
        .toString()
        .trim()}`,
      `Number of folders: ${child_process
        .execSync(`find "${ANIME_PATH}" -type d | wc -l`)
        .toString()
        .trim()}`,
      `Total size: ${child_process
        .execSync(`du -h -d 0 -BGB "${ANIME_PATH}" | cut -d$'\t' -f1`)
        .toString()
        .trim()}`,
      `Disk space: ${child_process
        .execSync(`df -h -BGB /dev/md127 | tail -1 | tr -s ' ' | cut -d' ' -f2`)
        .toString()
        .trim()}`,
      `Disk free space: ${child_process
        .execSync(`df -h -BGB /dev/md127 | tail -1 | tr -s ' ' | cut -d' ' -f4`)
        .toString()
        .trim()}`,
      "",
      ...(
        await knex("anime")
          .select("season", "title")
          .orderBy(["season", "title"])
      ).map((e) => `${e.season}/${e.title}`),
    ].join("\n")
  );
});

app.get("/ls", async (req, res) => {
  if (!req.query || !req.query.path || req.query.path.indexOf("/../") >= 0) {
    return res.send("invalid path");
  }
  if (req.query.path.split("/").length === 2) {
    const rows = await knex("anime")
      .distinct("season")
      .orderBy("season", "asc");
    return res.send(
      rows.map((row) => ({
        name: row.season,
        modified: fs.lstatSync(
          fs.realpathSync(path.join(ANIME_NEW_PATH, row.season))
        ).mtime,
      }))
    );
  }
  if (req.query.path.split("/").length === 3) {
    const rows = await knex("anime")
      .select("id", "anilist_id", "season", "title")
      .where("season", req.query.path.split("/")[1]);
    return res.send(
      rows.map((row) => ({
        anime_id: row.id,
        anilist_id: row.anilist_id,
        name: row.title,
        modified: fs.lstatSync(path.join(ANIME_PATH, row.id.toString())).mtime,
      }))
    );
  }
  if (req.query.path.split("/").length === 4) {
    const rows = await knex("anime")
      .select("id", "anilist_id")
      .where({
        season: req.query.path.split("/")[1],
        title: decodeURIComponent(req.query.path.split("/")[2]),
      })
      .limit(1)
      .offset(0);
    if (!rows || !rows.length || !rows[0].id) {
      return res.send([]);
    }
    const [{ id, anilist_id }] = rows;
    const path_series = fs
      .readdirSync(path.join(ANIME_PATH, `${id}`))
      .map((file) => ({
        anime_id: id,
        anilist_id,
        name: file,
        modified: fs.lstatSync(path.join(ANIME_PATH, `${id}`, file)).mtime,
        size: fs.lstatSync(path.join(ANIME_PATH, `${id}`, file)).size,
        thumb: fs.existsSync(
          path.join(
            ANIME_THUMB_PATH,
            `${id}`,
            `${path.basename(file, ".mp4")}.jpg`
          )
        )
          ? `${path.basename(file, ".mp4")}.jpg`
          : null,
      }));
    return res.send(path_series);
  }
  return res.send([]);
});

app.get("/info", async (req, res) => {
  if (!req.query || !req.query.season) {
    return res.send("invalid query");
  }
  if (req.query.title) {
    const [anime] = await knex("anime")
      .select("id", "anilist_id")
      .where({
        season: req.query.season,
        title: decodeURIComponent(req.query.title),
      });
    return res.send(
      await fetch(
        `http://${ES_HOST}:${ES_PORT}/anilist/anime/${anime.anilist_id}`
      ).then((response) => response.json())
    );
  }

  const rows = await knex("anime")
    .select("id", "anilist_id")
    .where("season", req.query.season);

  const result = await fetch(
    `http://${ES_HOST}:${ES_PORT}/anilist/anime/_search`,
    {
      method: "POST",
      body: JSON.stringify({
        size: 500,
        query: {
          ids: {
            type: "anime",
            values: rows.map((row) => row.anilist_id),
          },
        },
        _source: [
          "id",
          "title.chinese",
          "popularity",
          "stats.statusDistribution",
          "averageScore",
        ],
        sort: {
          averageScore: {
            order: "desc",
          },
          popularity: {
            order: "desc",
          },
        },
      }),
      headers: { "Content-Type": "application/json" },
    }
  ).then((response) => response.json());

  return res.send(result.hits ? result.hits.hits : []);
});

app.get("/search", async (req, res) => {
  if (!req.query || !req.query.q) {
    return res.send("invalid query");
  }
  const result = await fetch(
    `http://${ES_HOST}:${ES_PORT}/anilist/anime/_search`,
    {
      method: "POST",
      body: JSON.stringify({
        _source: ["id", "title"],
        size: 100,
        query: {
          multi_match: {
            query: req.query.q,
            fields: [
              "title.native",
              "title.romaji",
              "title.english",
              "title.chinese",
              "synonyms",
              "synonyms_chinese",
            ],
            type: "phrase_prefix",
            prefix_length: 0,
          },
        },
      }),
      headers: { "Content-Type": "application/json" },
    }
  ).then((response) => response.json());

  const rows = await knex("anime")
    .select("id", "anilist_id", "season", "title")
    .whereIn(
      "anilist_id",
      result.hits.hits.map((e) => Number(e._source.id))
    );

  return res.send(
    rows.map((row) => ({
      anime_id: row.id,
      anilist_id: row.anilist_id,
      season: row.season,
      title: row.title,
    }))
  );
});

app.post("/subscribe", async (req, res) => {
  console.log(`subscription registering: ${req.body.endpoint}`);
  try {
    await knex("subscription").insert({
      id: crypto
        .createHmac("sha256", "")
        .update(req.body.endpoint)
        .digest("base64"),
      json: JSON.stringify(req.body),
    });
  } catch (e) {
    console.log("already registered");
  }
  return res.send("subscription registered");
});

app.use("/admin/get_series", async (req, res) => {
  const id_list = req.query.anilist_id
    ? req.query.anilist_id
    : req.body.anilist_id;
  const rows = await knex("anime")
    .select("id", "anilist_id", "season", "title")
    .whereIn(
      "anilist_id",
      id_list.split(",").map((e) => parseInt(e, 10))
    );
  return res.send(
    rows.map((row) => ({
      anime_id: row.id,
      anilist_id: row.anilist_id,
      season: row.season,
      title: row.title,
    }))
  );
});

app.post("/admin/add_anilist_chinese", async (req, res) => {
  if (!req.query || !req.query.anilist_id) {
    return res.send("invalid query");
  }
  const rows = await knex.raw(
    "INSERT INTO anilist_chinese (id, json) values (?, ?) ON DUPLICATE KEY UPDATE json=?",
    [
      parseInt(req.query.anilist_id, 10),
      JSON.stringify(req.body),
      JSON.stringify(req.body),
    ]
  );
  return res.send(JSON.stringify(rows));
});

app.post("/admin/add_series", async (req, res) => {
  let id = req.body.kari_id;
  const { anilist_id, season = "", title = "" } = req.body;
  if (id) {
    console.log(`Updating anime ID: ${id}`);
    await knex("anime").where({ id }).update({
      anilist_id,
      season,
      title,
    });
  } else {
    console.log(`Adding new anime anlistID: ${anilist_id}`);
    id = await knex("anime").insert({
      anilist_id,
      season,
      title,
    });
  }
  if (season && title) {
    const src = path.join(ANIME_PATH, id.toString());

    if (!fs.existsSync(src)) {
      console.log(`Creating directory ${src}`);
      fs.ensureDirSync(src);
    }

    const animeNewDest = path.join(ANIME_NEW_PATH, season, title);
    // remove existing (incorrect) links
    // if (fs.existsSync(animeNewDest)) {
    //   console.log(`Removing ${animeNewDest}`);
    //   fs.removeSync(animeNewDest);
    // }
    if (!fs.existsSync(animeNewDest)) {
      console.log(`Creating symlink ${animeNewDest}`);
      fs.symlinkSync(
        path.relative(path.dirname(animeNewDest), src),
        animeNewDest,
        fs.S_IFLNK
      );
    }
  }
  return res.send(JSON.stringify(id));
});

app.listen(WEB_PORT, () => console.log(`Server listening on port ${WEB_PORT}`));
