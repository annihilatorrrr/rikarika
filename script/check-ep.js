import "dotenv/config.js";

import child_process from "child_process";
import Knex from "knex";
import aniep from "aniep";

const { DB_NAME, DB_USER, DB_PASS, DB_HOST, ANIME_PATH } = process.env;

const knex = Knex({
  client: "mysql",
  connection: {
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
  },
});

console.log("Reading file list...");
const fileList = child_process
  .execSync(`find -L ${ANIME_PATH} -type f -name "*.mp4"`, {
    maxBuffer: 1024 * 1024 * 100,
  })
  .toString()
  .split("\n")
  .filter((each) => each)
  .sort((a, b) => (a > b ? 1 : -1))
  .map((line) => line.replace(`${ANIME_PATH}/`, "").split("/"))
  .reduce((list, [dir, file]) => {
    if (!list[dir]) {
      list[dir] = [];
    }
    list[dir].push(file);
    return list;
  }, {});

for (const dir in fileList) {
  const epList = Array.from(
    new Set(
      fileList[dir]
        .map((file) => aniep(file))
        .reduce((list, ep) => {
          if (typeof ep === "number") {
            list.push(ep);
          }
          if (Array.isArray(ep)) {
            list = list.concat(ep);
          }
          if (typeof ep === "String" && ep.includes("|")) {
            list = list.concat(ep.split("|").map((ep) => Number(ep)));
          }

          return list;
        }, [])
    )
  ).sort((a, b) => a - b);

  const missing = [];
  for (let i = epList[0]; i < epList[epList.length - 1]; i++) {
    if (!epList.includes(i)) {
      missing.push(i);
    }
  }
  if (missing.length) {
    if (missing.length < 10) {
      const rows = await knex("anime").select("id", "season", "title").where("id", dir);
      if (
        !["Sukebei", "HKTVBJ2", "OVA"].includes(rows[0].season) &&
        ![
          "10",
          "1212",
          "1800",
          "1855",
          "1867",
          "1942",
          "2184",
          "2318",
          "2611",
          "3822",
          "4032",
          "4258",
          "4268",
          "4314",
          "4508",
          "4659",
          "5251",
          "5255",
          "5886",
        ].includes(dir)
      ) {
        console.log(`[${dir}] ${rows[0].season}/${rows[0].title} EP ${missing.join(",")}`);
        // console.log(epList.join(" "));
        // console.log(fileList[dir].map(file => `${aniep(file)} => ${file}`));
      }
    }
  }
}
knex.destroy();

// console.log(fileList);
