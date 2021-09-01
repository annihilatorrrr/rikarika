import "dotenv/config.js";
import fs from "fs-extra";
import path from "path";
import express from "express";
import rateLimit from "express-rate-limit";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import child_process from "child_process";
import fetch from "node-fetch";
import Knex from "knex";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const {
  DB_NAME,
  DB_USER,
  DB_PASS,
  DB_HOST,
  ES_HOST,
  ES_PORT,
  ANIME_PATH,
  ANIME_NEW_PATH,
  ANIME_WEBP_PATH,
  ANIME_AVIF_PATH,
  RUTORRENT_HOST,
  RUTORRENT_HOST_2,
  WEB_PORT,
  WEB_PASSWORD,
  WEB_WHITELIST_IP,
  WEB_SECRET,
  WEBPUSH_PUBLIC_KEY,
  DONATE_URL,
  TELEGRAM_JOIN_URL,
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

const app = express();

app.disable("x-powered-by");

app.set("trust proxy", 1);

app.use((req, res, next) => {
  res.set("Referrer-Policy", "no-referrer");
  res.set("X-Content-Type-Options", "nosniff");
  res.set(
    "Content-Security-Policy",
    [
      "default-src 'none'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' * data:",
      "font-src * 'self'",
      "media-src 'self'",
      "worker-src 'self'",
      "form-action 'self'",
      "base-uri 'none'",
      "frame-ancestors 'none'",
      "block-all-mixed-content",
      "manifest-src 'self'",
      "connect-src * 'self'",
    ].join("; ")
  );
  next();
});

app.use(
  new rateLimit({
    max: 360, // limit each IP to 60 requests per 60 seconds
    delayMs: 0, // disable delaying - full speed until the max limit is reached
  })
);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// path with extension
app.get(/[^\/]+\.[^\/]+$/, express.static(path.join(__dirname, "www")));

// path ends with /
app.get(/.*\/$/, (req, res) => {
  if (req.query.view) {
    if (["desktop", "mobile"].includes(req.query.view)) {
      const date = new Date();
      date.setTime(date.getTime() + 30 * 24 * 60 * 60 * 1000);
      res.setHeader(
        "Set-Cookie",
        `view=${
          req.query.view
        }; Path=/; Expires=${date.toGMTString()}; Secure; HttpOnly; SameSite=Strict`
      );
    }
    return res.redirect(302, req.path ?? "/");
  }

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
    const view = ["desktop", "mobile"].includes(req.cookies.view)
      ? req.cookies.view
      : /(Android|iPad|iPhone|iPod)/g.test(req.headers["user-agent"])
      ? "mobile"
      : "desktop";
    res.setHeader("Link", `</js/${view}.js>; as=script; rel=preload`);
    res.append("Link", `</css/${view}.css>; as=style; rel=preload`);
    res.send(
      fs
        .readFileSync(path.join(__dirname, `view/${view}.html`), "utf8")
        .replace("WEBPUSH_PUBLIC_KEY", WEBPUSH_PUBLIC_KEY)
        .replace(/DONATE_URL/g, DONATE_URL)
        .replace(/TELEGRAM_JOIN_URL/g, TELEGRAM_JOIN_URL)
    );
  } else {
    res.send(
      fs
        .readFileSync(path.join(__dirname, "view/login.html"), "utf8")
        .replace("REDIRECT", req.path.startsWith("/") ? req.path : "/")
    );
  }
});

app.post("/login", (req, res) => {
  if (
    req.body.password === WEB_PASSWORD ||
    req.body.passwd === WEB_PASSWORD ||
    req.ip === WEB_WHITELIST_IP
  ) {
    const date = new Date();
    date.setTime(date.getTime() + 7 * 24 * 60 * 60 * 1000);
    res.setHeader(
      "Set-Cookie",
      `session=${crypto
        .createHmac("sha256", WEB_PASSWORD)
        .update(WEB_SECRET)
        .digest("hex")}; Path=/; Expires=${date.toGMTString()}; Secure; HttpOnly; SameSite=Strict`
    );
  }
  return res.redirect(302, req.body.redirect ?? "/");
});

app.get("/logout", (req, res) => {
  res.setHeader("Set-Cookie", `session=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Strict`);
  res.append("Set-Cookie", `view=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Strict`);
  return res.redirect(302, "/");
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

app.get("/donate-code", async (req, res) => {
  res.type("image/jpeg");
  return res.send(fs.readFileSync(path.join(__dirname, "www", "donate-code.jpg")));
});

app.get("/motd", async (req, res) => {
  res.type("text/plain");
  return res.send(fs.readFileSync(path.join(__dirname, "www", "message.txt"), "utf8"));
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
      ...(await knex("anime").select("season", "title").orderBy(["season", "title"])).map(
        (e) => `${e.season}/${e.title}`
      ),
    ].join("\n")
  );
});

app.get("/ls", async (req, res) => {
  if (!req.query || !req.query.path) {
    return res.send("invalid path");
  }
  if (req.query.path.split("/").length === 2) {
    const latests = await knex("anime").select("updated").orderBy("updated", "desc").limit(1);
    const rows = await knex("anime")
      .select("season")
      .max("updated", { as: "updated" })
      .groupBy("season");
    return res.send(
      [{ name: "Latest", modified: latests[0].updated }].concat(
        rows
          .sort((a, b) => (a.season > b.season ? -1 : 1))
          .map((row) => ({
            name: row.season,
            modified: row.updated,
          }))
      )
    );
  }
  if (req.query.path.split("/").length === 3) {
    const season = req.query.path.split("/")[1];
    const rows =
      season === "Latest"
        ? await knex("anime")
            .select("id", "anilist_id", "season", "title", "updated")
            .orderBy("updated", "desc")
            .limit(100)
        : await knex("anime")
            .select("id", "anilist_id", "season", "title", "updated")
            .where("season", season);
    return res.send(
      rows
        .map((row) => ({
          anime_id: row.id,
          anilist_id: row.anilist_id,
          season: row.season,
          name: row.title,
          modified: row.updated,
        }))
        .sort((a, b) =>
          ["2021-07", "2021-04", "Movie", "OVA", "Sukebei", "Latest"].includes(season)
            ? a.modified > b.modified
              ? -1
              : 1
            : a.name > b.name
            ? 1
            : -1
        )
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
      .sort((a, b) => (a > b ? 1 : -1))
      .map((file) => ({
        anime_id: id,
        anilist_id,
        name: file,
        modified: fs.lstatSync(path.join(ANIME_PATH, `${id}`, file)).mtime,
        size: fs.lstatSync(path.join(ANIME_PATH, `${id}`, file)).size,
        webp: fs.existsSync(
          path.join(ANIME_WEBP_PATH, `${id}`, `${path.basename(file, ".mp4")}.webp`)
        )
          ? `${path.basename(file, ".mp4")}.webp`
          : null,
        avif: fs.existsSync(
          path.join(ANIME_AVIF_PATH, `${id}`, `${path.basename(file, ".mp4")}.avif`)
        )
          ? `${path.basename(file, ".mp4")}.avif`
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
    const rows = await knex("anime_view")
      .select("id", "anilist_id", "json")
      .where({
        season: req.query.season,
        title: decodeURIComponent(req.query.title),
      });
    if (!rows.length) {
      return res.send({});
    }
    return res.send({ found: true, _source: JSON.parse(rows[0].json) });
  }
  const rows = await knex("anime_view")
    .select("id", "anilist_id", "json")
    .where("season", req.query.season);
  if (!rows.length) {
    return res.send([]);
  }
  return res.send(
    rows
      .filter((e) => e.anilist_id)
      .map((e) => {
        const json = JSON.parse(e.json);
        return {
          _source: {
            averageScore: json.averageScore,
            id: json.id,
            popularity: json.popularity,
            stats: { statusDistribution: json.stats.statusDistribution },
            title: json.title,
          },
        };
      })
      .sort((a, b) => (a._source.averageScore < b._source.averageScore ? 1 : -1))
  );
});

app.get("/search", async (req, res) => {
  if (!req.query || !req.query.q) {
    res.status(400);
    return res.json([]);
  }
  const result = await fetch(`http://${ES_HOST}:${ES_PORT}/anilist/anime/_search`, {
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
  }).then((response) => response.json());

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
  try {
    await knex.raw(
      knex("subscriber")
        .insert({
          endpoint: req.body.endpoint,
          json: JSON.stringify(req.body),
        })
        .toString()
        .replace(/^insert/i, "insert ignore")
    );
  } catch (e) {
    console.log(e);
    return res.sendStatus(400);
  }
  return res.sendStatus(201);
});

app.post("/subscribed", async (req, res) => {
  try {
    const rows = await knex("subscriber").where("endpoint", req.body.endpoint);
    return res.sendStatus(rows.length ? 200 : 204);
  } catch (e) {
    console.log(e);
    return res.sendStatus(400);
  }
});

app.post("/unsubscribe", async (req, res) => {
  try {
    await knex("subscriber").where("endpoint", req.body.endpoint).delete();
  } catch (e) {
    console.log(e);
    return res.sendStatus(400);
  }
  return res.sendStatus(204);
});

app.use("/admin/get_series", async (req, res) => {
  const id_list = req.query.anilist_id ? req.query.anilist_id : req.body.anilist_id;
  if (!id_list) {
    return res.send([]);
  }
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

app.use("/admin/get_anilist", async (req, res) => {
  if (req.query.id && Number(req.query.id)) {
    const rows = await knex("anime").select("id", "anilist_id").where("id", Number(req.query.id));
    if (rows.length) {
      return res.send(`${rows[0].anilist_id}`);
    }
    return res.send("");
  }
  return res.send("");
});

app.post("/admin/add_anilist_chinese", async (req, res) => {
  if (!req.query || !req.query.anilist_id) {
    return res.send("invalid query");
  }
  const rows = await knex.raw(
    "INSERT INTO anilist_chinese (id, json) values (?, ?) ON DUPLICATE KEY UPDATE json=?",
    [parseInt(req.query.anilist_id, 10), JSON.stringify(req.body), JSON.stringify(req.body)]
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
      fs.symlinkSync(path.relative(path.dirname(animeNewDest), src), animeNewDest, fs.S_IFLNK);
    }
  }
  return res.send(JSON.stringify(id));
});

app.listen(WEB_PORT, () => console.log(`Server listening on port ${WEB_PORT}`));
