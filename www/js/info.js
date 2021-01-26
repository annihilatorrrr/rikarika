const animeTypeMap = {
  TV: "電視",
  TV_SHORT: "電視短篇",
  OVA: "OVA",
  SPECIAL: "特別",
  ONA: "網絡",
  MOVIE: "劇場版",
  MUSIC: "音樂",
};
const animeGenreMap = {
  Action: "動作",
  Adventure: "冒險",
  Cars: "賽車",
  Comedy: "喜劇",
  Dementia: "壞掉",
  Demons: "惡魔",
  Drama: "戲劇",
  Ecchi: "Ecchi",
  Fantasy: "奇幻",
  Game: "遊戲",
  Harem: "後宮",
  Hentai: "紳士",
  Historical: "歷史",
  Horror: "恐怖",
  Josei: "女性",
  Kids: "兒童",
  Magic: "魔法",
  "Martial Arts": "武術",
  Mecha: "機戰",
  Military: "軍事",
  Music: "音樂",
  Mystery: "懸疑",
  Parody: "搞笑",
  Police: "警察",
  Psychological: "心理",
  Romance: "愛情",
  Samurai: "武士",
  School: "校園",
  "Sci-Fi": "科幻",
  Seinen: "青年",
  Shoujo: "少女",
  "Shoujo Ai": "少女愛",
  Shounen: "少年",
  "Shounen Ai": "少年愛",
  "Slice of Life": "日常",
  Space: "太空",
  Sports: "運動",
  "Super Power": "超能力",
  Supernatural: "超自然",
  Thriller: "驚悚",
  Vampire: "吸血鬼",
  Yaoi: "Yaoi",
  Yuri: "百合",
};

const staffRoleMap = {
  Director: "監督",
  "Assistant Director": "副監督",
  "Animation Director": "作畫監督",
  "Chief Animation Director": "總作畫監督",
  Music: "音樂",
  "Sound Director": "音響監督",
  "Series Composition": "系列構成",
  "Original Creator": "原作",
  "Character Design": "人物設計",
  "Original Character Design": "人物原案",
  "Art Director": "美術監督",
  "Theme Song Performance": "主題曲主唱",
  Script: "劇本",
  "Original Story": "原著",
};

const calculateOpacityStyle = function (val, min, max) {
  const bright = 1;
  const dim = 0.3;
  let opacity = 1;
  if (val > max) {
    opacity = bright;
  } else if (val < min) {
    opacity = dim;
  } else {
    opacity = dim + ((val - min) / (max - min)) * (bright - dim);
  }
  if (opacity > 1) {
    opacity = 1;
  }
  return `opacity: ${opacity}`;
};

const displayInfo = function (src) {
  const h1 = document.createElement("h1");
  h1.innerText = src.title.chinese ? src.title.chinese : src.title.romaji;
  h1.style = "font-size:1.5em";
  document.querySelector("#info").appendChild(h1);
  const h2 = document.createElement("h2");
  h2.innerText = src.title.native ? src.title.native : src.title.romaji;
  document.querySelector("#info").appendChild(h2);
  const h22 = document.createElement("h2");
  h22.innerText = src.title.romaji;
  document.querySelector("#info").appendChild(h22);
  const div1 = document.createElement("div");
  div1.style = "clear:both; border-bottom:1px solid #666; margin-bottom:13px";
  document.querySelector("#info").appendChild(div1);

  if (src.coverImage.large) {
    const img1 = document.createElement("img");
    img1.src = src.coverImage.large.replace("http:", "");
    const a1 = document.createElement("a");
    a1.href = `//anilist.co/anime/${src.id}`;
    a1.target = "_blank";
    a1.rel = "noreferrer";
    const div2 = document.createElement("div");
    div2.id = "poster";
    a1.appendChild(img1);
    div2.appendChild(a1);
    document.querySelector("#info").appendChild(div2);
  }

  let air_verb = "放送";
  if (src.format === "MOVIE") {
    air_verb = "上映";
  }
  let air_status = "";
  if (src.status === "RELEASING" || src.status === "NOT_YET_RELEASED") {
    air_status = "開始";
  }
  let naturalText = "";
  const strStartDate =
    src.startDate && src.startDate.year && src.startDate.month && src.startDate.day
      ? `${src.startDate.year}年${src.startDate.month}月${src.startDate.day}日`
      : null;
  const strEndDate =
    src.endDate && src.endDate.year && src.endDate.month && src.endDate.day
      ? `${src.endDate.year}年${src.endDate.month}月${src.endDate.day}日`
      : null;
  if (strStartDate && strEndDate) {
    if (strStartDate === strEndDate) {
      naturalText += `${strStartDate + air_verb}的`;
    } else {
      naturalText += `${strStartDate} 至 ${strEndDate}${air_verb}的`;
    }
  } else if (strStartDate) {
    naturalText += `${strStartDate + air_status + air_verb}的`;
  }

  if (src.format) {
    naturalText += animeTypeMap[src.format];
  }
  naturalText += "動畫";
  if (src.episodes) {
    if (src.format !== "Movie") {
      naturalText += `，共${src.episodes}集`;
    }
  }
  if (src.duration) {
    if (src.episodes === 1) {
      naturalText += `，全長${src.duration}分鐘`;
    } else {
      naturalText += `，每集${src.duration}分鐘`;
    }
  }
  naturalText += "。";
  const div3 = document.createElement("div");
  div3.id = "naturalText";
  div3.innerText = naturalText;
  document.querySelector("#info").appendChild(div3);

  const table1 = document.createElement("table");
  table1.id = "table";

  const tr1 = document.createElement("tr");
  const td1 = document.createElement("td");
  td1.innerText = "評分";
  tr1.appendChild(td1);
  const td2 = document.createElement("td");
  td2.innerText = src.averageScore > 0 ? parseFloat(src.averageScore).toFixed(1) : "-";
  tr1.appendChild(td2);
  table1.appendChild(tr1);

  const tr2 = document.createElement("tr");
  const td3 = document.createElement("td");
  td3.innerText = "人氣";
  tr2.appendChild(td3);
  const td4 = document.createElement("td");
  td4.innerText = src.popularity;
  tr2.appendChild(td4);
  table1.appendChild(tr2);

  const tr3 = document.createElement("tr");
  const td5 = document.createElement("td");
  td5.innerText = "棄番率";
  tr3.appendChild(td5);
  const td6 = document.createElement("td");
  td6.innerText =
    src.popularity > 0
      ? `${(
          (src.stats.statusDistribution.filter((e) => e.status === "DROPPED")[0].amount /
            src.popularity) *
          100
        ).toFixed(1)}%`
      : "-";
  tr3.appendChild(td6);
  table1.appendChild(tr3);

  if (src.genres.length > 0) {
    const tr4 = document.createElement("tr");
    const td7 = document.createElement("td");
    td7.innerText = "類型";
    tr4.appendChild(td7);
    const td8 = document.createElement("td");
    td8.innerText = src.genres.map((each) => animeGenreMap[each]).join(", ");
    tr4.appendChild(td8);
    table1.appendChild(tr4);
  }

  if (src.studios && src.studios && src.studios.edges.length > 0) {
    const tr5 = document.createElement("tr");
    const td9 = document.createElement("td");
    td9.innerText = "動畫制作";
    tr5.appendChild(td9);
    const td10 = document.createElement("td");
    src.studios.edges.forEach((entry) => {
      if (entry.node.siteUrl) {
        const a2 = document.createElement("a");
        a2.href = entry.node.siteUrl;
        a2.target = "_blank";
        a2.rel = "noreferrer";
        a2.innerText = entry.node.name;
        td10.appendChild(a2);
      } else {
        const span1 = document.createElement("span");
        span1.innerText = entry.node.name;
        td10.appendChild(span1);
      }
      td10.appendChild(document.createElement("br"));
    });
    tr5.appendChild(td10);
    table1.appendChild(tr5);
  }

  if (src.synonyms_chinese.length > 0) {
    const tr6 = document.createElement("tr");
    const td11 = document.createElement("td");
    td11.innerText = "其他譯名";
    tr6.appendChild(td11);
    const td12 = document.createElement("td");
    td12.innerHTML = Array.isArray(src.synonyms_chinese)
      ? src.synonyms_chinese.join("<br>")
      : "<br>";
    tr6.appendChild(td12);
    table1.appendChild(tr6);
  }

  if (src.externalLinks && src.externalLinks.length > 0) {
    const tr7 = document.createElement("tr");
    const td13 = document.createElement("td");
    td13.innerText = "外部連結";
    tr7.appendChild(td13);
    const td14 = document.createElement("td");
    src.externalLinks.forEach((entry) => {
      const a3 = document.createElement("a");
      a3.href = entry.url;
      a3.target = "_blank";
      a3.rel = "noreferrer";
      a3.innerText = `${entry.site} `;
      td14.appendChild(a3);
    });
    tr7.appendChild(td14);
    table1.appendChild(tr7);
  }

  document.querySelector("#info").appendChild(table1);

  if (src.staff && src.staff.edges && src.staff.edges.length > 0) {
    const br1 = document.createElement("br");
    br1.style = "clear:both";
    document.querySelector("#info").appendChild(br1);
    const h32 = document.createElement("h3");
    h32.innerText = "製作人員";
    document.querySelector("#info").appendChild(h32);
    const div4 = document.createElement("div");
    div4.style = "clear:both; border-bottom:1px solid #666; margin-bottom:3px";
    document.querySelector("#info").appendChild(div4);

    const staffTable = document.createElement("table");
    staffTable.id = "staff";
    src.staff.edges.forEach((entry) => {
      const row = document.createElement("tr");
      let name = entry.node.name.native;
      if (!name && entry.node.name.first && entry.node.name.last) {
        name = `${entry.node.name.last} ${entry.node.name.first}`;
      }
      const col = document.createElement("td");
      col.innerText = staffRoleMap[entry.role]
        ? staffRoleMap[entry.role]
        : entry.role.replace("Theme Song Performance", staffRoleMap["Theme Song Performance"]);
      row.appendChild(col);

      const nameTD = document.createElement("td");
      const a4 = document.createElement("a");
      a4.className = `staff_${entry.node.id}`;
      a4.href = `//anilist.co/staff/${entry.node.id}`;
      a4.target = "_blank";
      a4.rel = "noreferrer";
      a4.innerText = name;
      nameTD.appendChild(a4);
      row.appendChild(nameTD);
      staffTable.appendChild(row);
    });
    document.querySelector("#info").appendChild(staffTable);
  }

  const br2 = document.createElement("br");
  br2.style = "clear:both";
  document.querySelector("#info").appendChild(br2);
  const h33 = document.createElement("h3");
  h33.innerText = "簡介";
  document.querySelector("#info").appendChild(h33);
  const div5 = document.createElement("div");
  div5.style = "clear:both; border-bottom:1px solid #666; margin-bottom:3px";
  document.querySelector("#info").appendChild(div5);
  const div6 = document.createElement("div");
  div6.style = "text-align:justify";
  div6.innerHTML = src.description;
  document.querySelector("#info").appendChild(div6);

  if (src.characters && src.characters.edges && src.characters.edges.length > 0) {
    const br3 = document.createElement("br");
    br3.style = "clear:both";
    document.querySelector("#info").appendChild(br3);
    const h34 = document.createElement("h3");
    h34.innerText = "登場角色";
    document.querySelector("#info").appendChild(h34);
    const div7 = document.createElement("div");
    div7.style = "clear:both; border-bottom:1px solid #666; margin-bottom:3px";
    document.querySelector("#info").appendChild(div7);

    const characterDIV = document.createElement("div");
    src.characters.edges.forEach((entry) => {
      const charDIV = document.createElement("div");
      charDIV.className = "character";
      const charImgDiv = document.createElement("div");
      if (entry.node.image.large === "//anilist.co") {
        entry.node.image.large = "//anilist.co/img/dir/anime/reg/noimg.jpg";
      }
      if (entry.node.image.medium === "//anilist.co") {
        entry.node.image.medium = "//anilist.co/img/dir/anime/med/noimg.jpg";
      }
      const charIMG = document.createElement("a");
      charIMG.href = entry.node.image.large.replace("http:", "");
      charIMG.target = "_blank";
      charIMG.rel = "noreferrer";
      charImgDiv.appendChild(charIMG);
      const charBgDIV = document.createElement("div");
      charBgDIV.style = `background-image:url(${entry.node.image.medium.replace("http:", "")})`;
      charIMG.appendChild(charBgDIV);
      charDIV.appendChild(charImgDiv);
      const charNameDiv = document.createElement("div");
      const charName = document.createElement("div");
      let char_name = entry.node.name.native;
      if (!char_name && entry.node.name.first && entry.node.name.last) {
        char_name = `${entry.node.name.last} ${entry.node.name.first}`;
      }
      const charA = document.createElement("a");
      charA.className = `character_${entry.node.id}`;
      charA.href = `//anilist.co/character/${entry.node.id}`;
      charA.target = "_blank";
      charA.rel = "noreferrer";
      charA.innerText = char_name;
      charName.appendChild(charA);
      if (entry.voiceActors && entry.voiceActors.length > 0) {
        charName.appendChild(document.createElement("br"));

        let name = entry.voiceActors[0].name.native;
        if (!name && entry.voiceActors[0].name.first && entry.voiceActors[0].name.last) {
          name = `${entry.voiceActors[0].name.last} ${entry.voiceActors[0].name.first}`;
        }
        charName.appendChild(document.createTextNode("(CV: "));
        const charCVA = document.createElement("a");
        charCVA.className = `staff_${entry.voiceActors[0].id}`;
        charCVA.href = `//anilist.co/staff/${entry.voiceActors[0].id}`;
        charCVA.target = "_blank";
        charCVA.rel = "noreferrer";
        charCVA.innerText = name;
        charName.appendChild(charCVA);
        charName.appendChild(document.createTextNode(")"));
      }
      charNameDiv.appendChild(charName);
      charDIV.appendChild(charNameDiv);
      characterDIV.appendChild(charDIV);
    });
    document.querySelector("#info").appendChild(characterDIV);
  }
};

const displayRanking = function (hits, dirEntries) {
  if (hits.length > 0) {
    const table = document.createElement("table");
    table.id = "ranking";

    const thead = document.createElement("thead");
    const tr1 = document.createElement("tr");
    tr1.className = "no-sort";
    const td1 = document.createElement("td");
    td1.innerText = "人氣";
    tr1.appendChild(td1);
    const td2 = document.createElement("td");
    td2.innerText = "評分";
    tr1.appendChild(td2);
    const td3 = document.createElement("td");
    td3.innerText = "棄番率";
    tr1.appendChild(td3);
    const td4 = document.createElement("td");
    td4.innerText = "名稱";
    tr1.appendChild(td4);
    thead.appendChild(tr1);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    hits.forEach((entry) => {
      const src = entry._source;
      const row = document.createElement("tr");
      const col1 = document.createElement("td");
      col1.style = calculateOpacityStyle(parseFloat(src.popularity), 1000, 3000);
      col1.innerText = src.popularity;
      row.appendChild(col1);
      const col2 = document.createElement("td");
      if (src.averageScore > 0) {
        col2.style = calculateOpacityStyle(parseFloat(src.averageScore), 65, 75);
        col2.innerText = parseFloat(src.averageScore).toFixed(1);
      } else {
        col2.style = calculateOpacityStyle(0, 65, 75);
        col2.innerText = "-";
      }
      row.appendChild(col2);
      const col3 = document.createElement("td");
      if (src.popularity > 0) {
        col3.style = calculateOpacityStyle(
          parseFloat(
            (src.stats.statusDistribution.filter((e) => e.status === "DROPPED")[0].amount /
              src.popularity) *
              100
          ),
          5,
          15
        );
        col3.innerText = `${(
          (src.stats.statusDistribution.filter((e) => e.status === "DROPPED")[0].amount /
            src.popularity) *
          100
        ).toFixed(1)}%`;
      } else {
        col3.style = calculateOpacityStyle(0, 5, 15);
        col3.innerText = "-";
      }
      row.appendChild(col3);
      const col4 = document.createElement("td");
      const a5 = document.createElement("a");
      a5.href = `${encodeURIComponent(dirEntries.find((e) => e.anilist_id === src.id).name)}/`;
      a5.innerText = dirEntries.find((e) => e.anilist_id === src.id).name;
      col4.appendChild(a5);
      col4.onmouseup = navfolder; // eslint-disable-line
      col4.onclick = (event) => {
        if (event.button === 0) {
          event.preventDefault();
        }
      };
      row.appendChild(col4);
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    document.querySelector("#info").appendChild(table);
    new Tablesort(document.getElementById("ranking"), {
      descending: true,
    });
  }
};
