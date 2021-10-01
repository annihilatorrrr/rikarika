const Ø = document.querySelector.bind(document);
const ØØ = document.querySelectorAll.bind(document);

const formatFileSize = (bytes) => {
  let size = parseInt(bytes, 10);
  if (bytes > 1000000000) {
    size = `${parseFloat(size / 1024 / 1024 / 1024).toFixed(2)}GB`;
  } else if (bytes > 1000000) {
    size = `${parseFloat(size / 1024 / 1024).toFixed(0)}MB`;
  } else if (bytes > 1000) {
    size = `${parseFloat(size / 1024).toFixed(0)}KB`;
  } else {
    size = `${parseFloat(size).toFixed(0)}Bytes`;
  }
  return size;
};

const getDateTimeOpacity = (timeStringUTC) => {
  const lastModified = new Date(timeStringUTC);
  const seconds = Math.floor((new Date() - lastModified) / 1000);
  let opacity = 0.3 + 0.7 * (1 - seconds / (86400 * 7));
  if (opacity > 1) {
    opacity = 1;
  }
  if (opacity < 0.3) {
    opacity = 0.3;
  }
  return opacity;
};

const formatDateTime = (timeStringUTC) => {
  const lastModified = new Date(timeStringUTC);
  const formattedDate = `${lastModified.getFullYear()}-${(lastModified.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${lastModified.getDate().toString().padStart(2, "0")}`;
  const seconds = Math.floor((new Date() - lastModified) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return formattedDate;
  }
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return formattedDate;
  }
  interval = Math.floor(seconds / 86400);
  if (interval >= 10) {
    return formattedDate;
  } else if (interval >= 1) {
    return `${interval} 日前`;
  }
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return `${interval} 小時前`;
  }
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return `${interval} 分鐘前`;
  }
  if (seconds >= 1) {
    return `${Math.floor(seconds)} 秒前`;
  }
  return "剛剛更新";
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

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
  "Advertising Producer": "宣傳制作",
  "Animation Director": "作畫監督",
  "Art Design": "美術設定",
  "Art Director": "美術監督",
  "Assistant Animation Director": "副作畫監督",
  "Assistant Director": "副導演",
  "Assistant Producer": "助理制作",
  "CG Animation": "CG 動畫",
  "CG Director": "CG 導演",
  "Character Design": "角色設計",
  "Chief Animation Director": "總作畫監督",
  "Chief Director": "總監督",
  "Chief Producer": "總製作",
  "Color Design": "色彩設定",
  "Costume Design": "服裝設計",
  Director: "導演",
  "Director of Photography": "攝影監督",
  Editing: "剪輯",
  "Episode Director": "導演",
  "Inserted Song Arrangement": "插入曲作曲",
  "Inserted Song Composition": "插入曲編曲",
  "Inserted Song Lyrics": "插入曲作詞",
  "Inserted Song Performance": "插入曲主唱",
  "Key Animation": "動畫師",
  Music: "音樂",
  "Music Producer": "音樂製作",
  "Original Character Design": "人物原案",
  "Original Creator": "原作",
  "Original Story": "原著",
  Producer: "製作",
  Production: "製作",
  "Production Assistant": "助理製作",
  Script: "劇本",
  "Series Composition": "系列構成",
  "Sound Director": "音響監督",
  "Sound Effects": "音響效果",
  "Sound Production Manager": "音響製作",
  Storyboard: "分鏡",
  "Sub Character Design": "角色設計",
  "Theme Song Arrangement": "主題曲作曲",
  "Theme Song Composition": "主題曲編曲",
  "Theme Song Lyrics": "主題曲作詞",
  "Theme Song Performance": "主題曲主唱",
};

const getSummaryText = (src) => {
  let air_verb = "放送";
  if (src.format === "MOVIE") {
    air_verb = "上映";
  }
  let air_status = "";
  if (src.status === "RELEASING" || src.status === "NOT_YET_RELEASED") {
    air_status = "開始";
  }
  let text = "";
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
      text += `${strStartDate + air_verb}的`;
    } else {
      text += `${strStartDate} 至 ${strEndDate}${air_verb}的`;
    }
  } else if (strStartDate) {
    text += `${strStartDate + air_status + air_verb}的`;
  }

  if (src.format) {
    text += animeTypeMap[src.format];
  }
  text += "動畫";
  if (src.episodes) {
    if (src.format !== "Movie") {
      text += `，共${src.episodes}集`;
    }
  }
  if (src.duration) {
    if (src.episodes === 1) {
      text += `，全長${src.duration}分鐘`;
    } else {
      text += `，每集${src.duration}分鐘`;
    }
  }
  text += "。";
  return text;
};

const renderInfo = function (root, src) {
  root.innerHTML = "";
  const container = document.createElement("div");
  root.append(container);
  if (!src) {
    const placeholder = document.createElement("div");
    placeholder.classList.add("placeholder");
    placeholder.textContent = "沒有相關資料";
    container.append(placeholder);
    return;
  }
  const titles = new Set([src.title.native ?? src.title.romaji, src.title.chinese]);
  container.append(
    ...Array.from(titles)
      .filter((e) => e)
      .map((title) => {
        const div = document.createElement("div");
        div.classList.add("subtitle");
        div.textContent = title;
        return div;
      })
  );

  const divider1 = document.createElement("div");
  divider1.classList.add("divider");
  container.appendChild(divider1);

  const group1 = document.createElement("div");
  group1.classList.add("group", "gap");

  if (src.coverImage.large) {
    const a1 = document.createElement("a");
    a1.href = `//anilist.co/anime/${src.id}`;
    a1.target = "_blank";
    a1.rel = "noreferrer";
    const poster = document.createElement("div");
    poster.classList.add("poster");
    poster.style = `background-image:url(${src.coverImage.large.replace("http:", "")})`;
    a1.appendChild(poster);
    group1.appendChild(a1);
  }

  const summary = document.createElement("div");
  summary.classList.add("summary");
  summary.textContent = getSummaryText(src);
  container.appendChild(summary);

  const basic = document.createElement("table");
  basic.classList.add("basic");

  const tr1 = document.createElement("tr");
  const td1 = document.createElement("td");
  td1.textContent = "評分";
  tr1.appendChild(td1);
  const td2 = document.createElement("td");
  td2.textContent = src.averageScore > 0 ? parseFloat(src.averageScore).toFixed(1) : "-";
  tr1.appendChild(td2);
  basic.appendChild(tr1);

  const tr2 = document.createElement("tr");
  const td3 = document.createElement("td");
  td3.textContent = "人氣";
  tr2.appendChild(td3);
  const td4 = document.createElement("td");
  td4.textContent = src.popularity;
  tr2.appendChild(td4);
  basic.appendChild(tr2);

  const tr3 = document.createElement("tr");
  const td5 = document.createElement("td");
  td5.textContent = "棄番率";
  tr3.appendChild(td5);
  const td6 = document.createElement("td");
  td6.textContent =
    src.popularity > 0
      ? `${(
          (src.stats.statusDistribution.filter((e) => e.status === "DROPPED")[0].amount /
            src.popularity) *
          100
        ).toFixed(1)}%`
      : "-";
  tr3.appendChild(td6);
  basic.appendChild(tr3);

  if (src.genres.length > 0) {
    const tr4 = document.createElement("tr");
    const td7 = document.createElement("td");
    td7.textContent = "類型";
    tr4.appendChild(td7);
    const td8 = document.createElement("td");
    td8.textContent = src.genres.map((each) => animeGenreMap[each]).join(", ");
    tr4.appendChild(td8);
    basic.appendChild(tr4);
  }

  if (src.studios?.edges?.length > 0) {
    const tr5 = document.createElement("tr");
    const td9 = document.createElement("td");
    td9.textContent = "動畫制作";
    tr5.appendChild(td9);
    const td10 = document.createElement("td");
    src.studios.edges.forEach((entry) => {
      if (entry.node.siteUrl) {
        const a2 = document.createElement("a");
        a2.href = entry.node.siteUrl;
        a2.target = "_blank";
        a2.rel = "noreferrer";
        a2.textContent = entry.node.name;
        td10.appendChild(a2);
      } else {
        const span1 = document.createElement("span");
        span1.textContent = entry.node.name;
        td10.appendChild(span1);
      }
      td10.appendChild(document.createElement("br"));
    });
    tr5.appendChild(td10);
    basic.appendChild(tr5);
  }

  if (src.synonyms_chinese?.length > 0) {
    const tr6 = document.createElement("tr");
    const td11 = document.createElement("td");
    td11.textContent = "其他譯名";
    tr6.appendChild(td11);
    const td12 = document.createElement("td");
    td12.append(
      ...src.synonyms_chinese.map((e) => {
        const a = document.createElement("div");
        a.textContent = e;
        return a;
      })
    );
    tr6.appendChild(td12);
    basic.appendChild(tr6);
  }

  if (src.externalLinks?.length > 0) {
    const tr7 = document.createElement("tr");
    const td13 = document.createElement("td");
    td13.textContent = "外部連結";
    tr7.appendChild(td13);
    const td14 = document.createElement("td");
    td14.append(
      ...src.externalLinks.map((e) => {
        const div = document.createElement("div");
        const a = document.createElement("a");
        a.href = e.url;
        a.target = "_blank";
        a.rel = "noreferrer";
        a.textContent = e.site;
        div.append(a);
        return div;
      })
    );
    tr7.appendChild(td14);
    basic.appendChild(tr7);
  }
  group1.appendChild(basic);

  const description = document.createElement("div");
  description.classList.add("description");
  description.innerHTML = src.description;
  group1.appendChild(description);

  container.appendChild(group1);

  if (src.characters?.edges?.length > 0) {
    const heading4 = document.createElement("div");
    heading4.classList.add("heading");
    heading4.textContent = "登場角色";
    container.appendChild(heading4);
    const divider4 = document.createElement("div");
    divider4.classList.add("divider");
    container.appendChild(divider4);

    const characterDIV = document.createElement("div");
    characterDIV.classList.add("characters");
    characterDIV.append(
      ...src.characters.edges.map((entry) => {
        const charDIV = document.createElement("div");
        charDIV.classList.add("character");
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
        const charName = document.createElement("div");
        let char_name = entry.node.name.native;
        if (!char_name && entry.node.name.first && entry.node.name.last) {
          char_name = `${entry.node.name.last} ${entry.node.name.first}`;
        }
        const charA = document.createElement("a");
        charA.classList.add(`character_${entry.node.id}`);
        charA.href = `//anilist.co/character/${entry.node.id}`;
        charA.target = "_blank";
        charA.rel = "noreferrer";
        charA.textContent = char_name;
        charName.appendChild(charA);
        if (entry.voiceActors?.length > 0) {
          charName.appendChild(document.createElement("br"));

          let name = entry.voiceActors[0].name.native;
          if (!name && entry.voiceActors[0].name.first && entry.voiceActors[0].name.last) {
            name = `${entry.voiceActors[0].name.last} ${entry.voiceActors[0].name.first}`;
          }
          charName.appendChild(document.createTextNode("(CV: "));
          const charCVA = document.createElement("a");
          charCVA.classList.add(`staff_${entry.voiceActors[0].id}`);
          charCVA.href = `//anilist.co/staff/${entry.voiceActors[0].id}`;
          charCVA.target = "_blank";
          charCVA.rel = "noreferrer";
          charCVA.textContent = name;
          charName.appendChild(charCVA);
          charName.appendChild(document.createTextNode(")"));
        }
        charDIV.appendChild(charName);
        return charDIV;
      })
    );
    container.appendChild(characterDIV);
  }

  if (src.staff?.edges?.length > 0) {
    const heading3 = document.createElement("div");
    heading3.classList.add("heading");
    heading3.textContent = "製作人員";
    container.appendChild(heading3);
    const divider3 = document.createElement("div");
    divider3.classList.add("divider");
    container.appendChild(divider3);

    const staffNodes = src.staff.edges
      .map((entry) => {
        const [role, inCharge] = entry.role.split("(");
        if (inCharge?.length < 10) {
          entry.role = [staffRoleMap[role.trim()] ?? role.trim(), inCharge].join(" (");
        } else {
          entry.role = staffRoleMap[role.trim()] ?? role.trim();
        }
        return entry;
      })
      .sort((a, b) => (a.role > b.role ? 1 : -1))
      .map((entry) => {
        const row = document.createElement("tr");
        let name = entry.node.name.native;
        if (!name && (entry.node.name.first || entry.node.name.last)) {
          name = [entry.node.name.last, entry.node.name.first].join(" ");
        }
        const col = document.createElement("td");
        col.textContent = entry.role;
        row.appendChild(col);

        const nameTD = document.createElement("td");
        const a4 = document.createElement("a");
        a4.classList.add(`staff_${entry.node.id}`);
        a4.href = `//anilist.co/staff/${entry.node.id}`;
        a4.target = "_blank";
        a4.rel = "noreferrer";
        a4.textContent = name;
        nameTD.appendChild(a4);
        row.appendChild(nameTD);
        return row;
      });

    const group2 = document.createElement("div");
    group2.classList.add("group");

    const staff = document.createElement("table");
    staff.classList.add("staff");
    staff.append(...staffNodes.splice(0, Math.ceil(staffNodes.length / 2)));
    group2.append(staff);

    const staff2 = document.createElement("table");
    staff2.classList.add("staff");
    staff2.append(...staffNodes);
    group2.append(staff2);

    container.append(group2);
  }

  if (src.bannerImage) {
    const banner = document.createElement("img");
    banner.classList.add("banner");
    banner.src = src.bannerImage.replace("http:", "");
    root.appendChild(banner);
  }
};

const scrollTop = [];

const appendChunk = (chunk) => {
  Ø(".list").append(
    ...chunk.map(({ season, name, modified, size, anime_id }) => {
      const div0 = document.createElement("div");
      div0.classList.add("item");
      const div1 = document.createElement("div");
      if ([".mp4", ".txt", ".ass"].includes(name.slice(-4))) {
        if (localStorage.getItem(`/${anime_id}/${name}`)) {
          div0.classList.add("watched");
        }
        div0.onclick = async (event) => {
          const href = `/${anime_id}/${encodeURIComponent(name)}`;
          for (const item of document.querySelectorAll(".item")) {
            item.classList.remove("highlight");
          }
          if (event.target.parentNode.classList.contains("item")) {
            event.target.parentNode.classList.add("highlight");
            event.target.parentNode.classList.add("watched");
          } else {
            event.target.parentNode.parentNode.classList.add("highlight");
            event.target.parentNode.parentNode.classList.add("watched");
          }
          localStorage.setItem(decodeURIComponent(href), 1);
          Ø(".history").innerText = `🗑️ 清除播放紀錄 (${
            Object.entries(localStorage).filter((e) => e[0].startsWith("/")).length
          } 個)`;
          if (href.slice(-4) === ".mp4") {
            if (localStorage.getItem("player") === "internal") {
              location.href = href;
            } else if (localStorage.getItem("player") === "external") {
              window.open(href, "_blank");
            } else if (localStorage.getItem("player")) {
              const a = document.createElement("a");
              a.href = `intent:${
                new URL(href, document.baseURI).href
              }#Intent;package=${localStorage.getItem("player")};end`;
              a.click();
            } else {
              Ø(".player video").src = href;
              Ø(".player").classList.remove("hidden");
              Ø(".progress").classList.remove("hidden");
              resize();
            }
          } else if (localStorage.getItem("player") === "external") {
            window.open(href, "_blank");
          } else {
            location.href = href;
          }
        };
        div0.href = `/${anime_id}/${encodeURIComponent(name)}`;
        div1.innerText = name.slice(0, -4);
      } else {
        div0.onclick = async (event) => {
          ØØ(".list .item").forEach((e) => (e.onclick = null));
          scrollTop[window.location.pathname.split("/").length - 2] = Ø(".list").scrollTop;
          history.pushState(
            null,
            null,
            season ? `/${season}/${encodeURIComponent(name)}/` : `${encodeURIComponent(name)}/`
          );
          await render(scrollTop[window.location.pathname.split("/").length - 2] || 0);
        };
        div1.innerText = `📁 ${name}`;
      }
      const div2 = document.createElement("div");
      div2.className = "details";
      const div3 = document.createElement("div");
      div3.className = "left";
      div3.innerText = window.location.pathname.split("/")[1] === "Latest" ? season : "";
      const div4 = document.createElement("div");
      div4.className = "right";
      div4.style.opacity = getDateTimeOpacity(modified);
      div4.innerText = modified ? formatDateTime(modified) : "";
      div2.append(div3, div4);
      div0.append(div1, div2);
      return div0;
    })
  );
};

const closePlayer = () => {
  Ø(".player video").src = "";
  Ø(".player").classList.add("hidden");
  Ø(".player").style.removeProperty("width");
  Ø(".player").style.removeProperty("height");
  Ø(".player").style.removeProperty("left");
  Ø(".bar").style.removeProperty("width");
  Ø(".bar").style.removeProperty("top");
  Ø(".bar").classList.remove("thin");
  Ø(".list").style.removeProperty("width");
  Ø(".list").style.removeProperty("top");
  Ø(".list").classList.remove("thin");
  Ø(".info").style.removeProperty("width");
  Ø(".info").style.removeProperty("top");
  Ø(".info").classList.remove("thin");
  if (Ø(".item.highlight")) {
    Ø(".list").scrollTo(0, Ø(".item.highlight").offsetTop - 4.2 * 16);
  }
};

let lazyLoadHandleList = [];
let anilistInfo = null;
const render = async (scrollTo) => {
  anilistInfo = null;
  Ø(".info").innerHTML = "";
  Ø(".info").classList.add("hidden");
  closePlayer();
  Ø(".item.highlight")?.classList.remove("highlight");

  for (const handle of lazyLoadHandleList) {
    clearTimeout(handle);
  }
  const [season, title] = location.pathname
    .split("/")
    .filter((e) => e)
    .map((e) => decodeURIComponent(e));

  document.title = title || (season !== "search" ? season : "") || "カリ(仮)";
  Ø(".title").innerText = title || season || "カリ(仮)";

  Ø(".title").classList.remove("hidden");
  Ø(".search").classList.add("hidden");
  Ø("button").innerText = "搜尋";
  if (season === "search") {
    Ø(".title").classList.add("hidden");
    Ø(".search").classList.remove("hidden");
    if (!Ø(".search").value) {
      Ø(".search").focus();
    }
    if (title) {
      Ø("input").value = title;
      Ø("button").innerText = "清除";
    } else {
      Ø("input").value = "";
      Ø("button").innerText = "取消";
      Ø(".search").focus();
    }
  }

  Ø(".progress").classList.remove("hidden");
  if (season === "list" || season === "msg") {
    document.title = "カリ(仮)";
    Ø(".title").innerText = "カリ(仮)";
    const txt = await fetch(`/${season}`).then((e) => e.text());
    Ø(".progress").classList.add("hidden");
    Ø(".list").innerHTML = `<div class="pre">${txt}</div>`;
    return;
  }
  const dirEntries =
    season === "search" && !title
      ? []
      : await fetch(
          season === "search"
            ? `/search?q=${title}`
            : `/ls?path=${encodeURIComponent(location.pathname)}`
        )
          .then((res) => res.json())
          .catch((e) => e);

  Ø(".list").innerHTML = "";
  if (!Array.isArray(dirEntries)) {
    Ø(".progress").classList.add("hidden");
    const div15 = document.createElement("div");
    div15.classList.add("placeholder");
    div15.innerText = `出現了一點問題poi\n(${dirEntries})\n\n住下拉頁面重試`;
    Ø(".list").appendChild(div15);
    return;
  }

  if (season === "search") {
    Ø(".progress").classList.add("hidden");
    if (title && !Ø(".search").value) Ø(".search").value = title;
    renderSearchResult(dirEntries, title);
    return;
  }

  const filteredEntries = localStorage.getItem("nsfw")
    ? dirEntries
    : dirEntries.filter((e) => e.name !== "Sukebei" && e.season !== "Sukebei");

  if (window.location.pathname.split("/").length === 4) {
    Ø(".info").innerHTML = "<div>正在載入動畫資料...</div>";
    fetch(`/info?season=${season}&title=${encodeURIComponent(title)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json._source) {
          anilistInfo = json._source;
        }
        renderInfo(Ø(".info"), anilistInfo);
        if (!filteredEntries.length) {
          Ø(".info").classList.remove("hidden");
          Ø(".info").classList.remove("no-transition");
        }
      });
  }

  if (!dirEntries.length) {
    Ø(".progress").classList.add("hidden");
    const div15 = document.createElement("div");
    div15.classList.add("placeholder");
    div15.innerText = "此目錄沒有任何檔案";
    Ø(".list").appendChild(div15);
    return;
  }

  const chunkList = filteredEntries.reduce(
    (acc, cur, index, array) => (index % 100 ? acc : [...acc, array.slice(index, index + 100)]),
    []
  );
  if (chunkList.length) appendChunk(chunkList[0]);
  if (scrollTo && Ø(".list").scrollHeight >= scrollTo) {
    Ø(".list").scrollTo(0, scrollTo);
  } else {
    Ø(".list").scrollTo(0, 0);
  }

  lazyLoadHandleList = [];
  Ø(".progress").classList.remove("hidden");
  for (const chunk of chunkList.slice(1)) {
    await new Promise((resolve) =>
      lazyLoadHandleList.push(
        setTimeout(() => {
          appendChunk(chunk);
          if (scrollTo && Ø(".list").scrollHeight >= scrollTo) {
            Ø(".list").scrollTo(0, scrollTo);
          }
          resolve();
        }, 0)
      )
    );
  }
  Ø(".progress").classList.add("hidden");
};

const renderSearchResult = async (results, keyword) => {
  Ø(".list").scrollTo(0, 0);
  if (!results.length) {
    const div15 = document.createElement("div");
    div15.classList.add("placeholder");
    div15.innerText = keyword
      ? `找不到 ${keyword} 的搜尋結果`
      : "可輸入 中文 / 日文 / 羅馬拼音 關鍵字";
    Ø(".list").appendChild(div15);
  }
  for (const { season, title, updated } of results) {
    if (!localStorage.getItem("nsfw") && season === "Sukebei") {
      continue;
    }
    const div0 = document.createElement("div");
    div0.classList.add("item");
    div0.onclick = async (event) => {
      ØØ(".list .item").forEach((e) => (e.onclick = null));
      history.pushState(null, null, `/${season}/${encodeURIComponent(title)}/`);
      await render();
    };
    const div1 = document.createElement("div");
    div1.innerText = `📁 ${title}`;
    const div2 = document.createElement("div");
    div2.className = "details";
    const div3 = document.createElement("div");
    div3.className = "left";
    div3.innerText = season;
    const div4 = document.createElement("div");
    div4.className = "right";
    div4.style.opacity = getDateTimeOpacity(updated);
    div4.innerText = updated ? formatDateTime(updated) : "";
    div2.append(div3, div4);
    div0.append(div1, div2);
    Ø(".list").appendChild(div0);
  }
};

render();

window.onpopstate = async () => {
  await render(scrollTop[window.location.pathname.split("/").length - 2] || 0);
};

Ø(".title").onclick = () => {
  if (window.location.pathname.split("/").length !== 4) return;
  if (Ø(".info").classList.contains("hidden")) {
    Ø(".info").classList.remove("hidden");
    Ø(".info").classList.remove("no-transition");
  } else {
    Ø(".info").classList.add("hidden");
  }
};

let typing = null;
Ø(".search").oninput = (e) => {
  clearTimeout(typing);
  typing = setTimeout(() => {
    if (e.target.value.trim()) {
      history.replaceState(null, null, `/search/${encodeURIComponent(e.target.value)}/`);
    } else {
      history.replaceState(null, null, "/search/");
    }
    render();
  }, 500);
};
Ø("button").onclick = () => {
  ØØ(".list .item").forEach((e) => (e.onclick = null));
  const keyword = Ø(".search").value;
  if (location.pathname.split("/").filter((e) => e)[0] === "search") {
    if (keyword.trim()) {
      history.pushState(null, null, "/search/");
    } else {
      history.pushState(null, null, "/");
    }
  } else {
    if (keyword.trim()) {
      history.pushState(null, null, `/search/${encodeURIComponent(keyword)}/`);
    } else {
      history.pushState(null, null, "/search/");
    }
  }
  render();
  return;
};

Ø(".search").onfocus = (e) => {
  if (e.target.value.trim()) {
    history.pushState(null, null, `/search/${encodeURIComponent(e.target.value)}/`);
    render();
  }
};

let playerSize = {};
const resize = async () => {
  if (Ø(".player").classList.contains("hidden")) return;
  let safeAreaInsetBottom = Number(
    getComputedStyle(document.documentElement)
      .getPropertyValue("--safe-area-inset-bottom")
      .replace("px", "")
  );
  if (navigator.userAgent.includes("Mac") && "ontouchend" in document) {
    await new Promise((resolve) => setTimeout(resolve), 500);
    safeAreaInsetBottom = Number(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--safe-area-inset-bottom")
        .replace("px", "")
    );
  }
  const videoAspectRatio = Ø(".player video").videoWidth / Ø(".player video").videoHeight || 16 / 9;
  if (window.innerWidth > window.innerHeight) {
    const listWidth = window.innerWidth - window.innerHeight * videoAspectRatio;
    const minListWidth = listWidth < 320 ? 320 : listWidth;
    Ø(".player").style.width = `${window.innerWidth - minListWidth}px`;
    Ø(".player").style.height = `${window.innerHeight}px`;
    Ø(".player video").style.height = `${window.innerHeight - safeAreaInsetBottom}px`;
    Ø(".player").style.left = `${minListWidth}px`;
    Ø(".list").style.width = `${minListWidth}px`;
    Ø(".bar").style.width = `${minListWidth}px`;
    Ø(".info").style.width = `${minListWidth}px`;
    Ø(".list").style.removeProperty("top");
    Ø(".bar").style.removeProperty("top");
    Ø(".info").style.removeProperty("top");
    Ø(".list").classList.add("thin");
    Ø(".bar").classList.add("thin");
    Ø(".info").classList.add("thin");
  } else {
    Ø(".player").style.width = "100%";
    Ø(".player").style.height = `${window.innerWidth / videoAspectRatio}px`;
    Ø(".player video").style.height = "100%";
    Ø(".player").style.left = 0;
    Ø(".list").style.removeProperty("width");
    Ø(".bar").style.removeProperty("width");
    Ø(".info").style.removeProperty("width");
    Ø(".list").style.top = `${Math.ceil(Ø(".player").style.height.replace("px", ""))}px`;
    Ø(".bar").style.top = `${Math.ceil(Ø(".player").style.height.replace("px", ""))}px`;
    Ø(".info").style.top = `${Math.ceil(Ø(".player").style.height.replace("px", ""))}px`;
    Ø(".list").classList.remove("thin");
    Ø(".bar").classList.remove("thin");
    Ø(".info").classList.remove("thin");
  }
  playerSize = Ø(".player").getBoundingClientRect();
  if (Ø(".item.highlight")) {
    Ø(".list").scrollTo(0, Ø(".item.highlight").offsetTop - 4.2 * 16);
  }
};
window.addEventListener("resize", resize);

Ø(".player video").addEventListener("loadedmetadata", () => {
  Ø(".progress").classList.add("hidden");
  resize();
});

const activation = 20;
const swipeThreshold = activation + 12;
let startTouchX = 0;
let startTouchY = 0;
let startTouchAtLeftEdge = false;
let gesture = "";
let isSomethingScrolling = false;
window.addEventListener("scroll", () => (isSomethingScrolling = true), { passive: true });
Ø(".menu").addEventListener("scroll", () => (isSomethingScrolling = true), { passive: true });
Ø(".info").addEventListener("scroll", () => (isSomethingScrolling = true), { passive: true });
Ø(".list").addEventListener("scroll", () => (isSomethingScrolling = true), { passive: true });

document.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length > 1) return;
    gesture = "";
    isSomethingScrolling = false;
    startTouchX = e.touches[0].clientX;
    startTouchY = e.touches[0].clientY;
    startTouchAtLeftEdge = startTouchX < 30 && startTouchY > 65;
    if (startTouchAtLeftEdge && navigator.userAgent.includes("Mac")) {
      e.preventDefault();
    }
  },
  { passive: false }
);
document.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length > 1) return;
    if (isSomethingScrolling) return;
    if (
      !Ø(".player").classList.contains("hidden") &&
      startTouchX >= playerSize.x &&
      startTouchX <= playerSize.x + playerSize.width &&
      startTouchY >= playerSize.y &&
      startTouchY <= playerSize.y + playerSize.height
    )
      return;
    const diffX = e.changedTouches[0].clientX - startTouchX;
    const diffY = e.changedTouches[0].clientY - startTouchY;
    if (!gesture) {
      if (Ø(".menu").classList.contains("hidden") && startTouchAtLeftEdge) {
        gesture = "open";
      } else if (
        !Ø(".menu").classList.contains("hidden") &&
        (startTouchX > 224 || Math.abs(diffX) > activation)
      ) {
        gesture = "close";
      } else if (Math.abs(diffX) > activation && Math.abs(diffY) < activation && diffX > 0) {
        gesture = "LTR";
      } else if (Math.abs(diffX) > activation && Math.abs(diffY) < activation && diffX < 0) {
        gesture = "RTL";
      }
      if (gesture === "open") {
        Ø(".menu").classList.remove("hidden");
        Ø(".overlay").classList.remove("hidden");
      }
      if (gesture === "open" || gesture === "close") {
        Ø(".menu").classList.add("no-transition");
        Ø(".overlay").classList.add("no-transition");
      }
    }
    if (gesture) e.preventDefault();
    if (
      !Ø(".menu").classList.contains("hidden") &&
      Ø(".menu").clientHeight >= Ø(".menu").scrollHeight
    )
      e.preventDefault();

    if (gesture === "open") {
      const translate = diffX - 224 > 0 ? 0 : diffX - 224;
      Ø(".menu").style.transform = `translate(${translate}px, 0)`;
      Ø(".overlay").style.opacity = (translate + 224) / 224;
    } else if (gesture === "close") {
      const translate = diffX > 0 ? 0 : diffX;
      Ø(".menu").style.transform = `translate(${translate}px, 0)`;
      Ø(".overlay").style.opacity = (translate + 224) / 224;
    } else if (gesture === "LTR") {
      let translate = diffX - activation;
      translate = translate < 0 ? 0 : translate;
      translate = translate > swipeThreshold - activation ? swipeThreshold - activation : translate;
      Ø(".icon").style.transform = `translate(${translate / 2}px, 0)`;
    } else if (gesture === "RTL") {
      let translate = diffX + activation;
      translate = translate > 0 ? 0 : translate;
      translate =
        translate < -(swipeThreshold - activation) ? -(swipeThreshold - activation) : translate;
      Ø(".icon").style.transform = `translate(${translate / 2}px, 0)`;
    }
  },
  { passive: false }
);
document.addEventListener("touchend", async (e) => {
  if (e.touches.length > 1) return;

  Ø(".icon").style.removeProperty("transform");
  Ø(".menu").style.removeProperty("transform");
  Ø(".overlay").style.removeProperty("opacity");
  Ø(".menu").classList.remove("no-transition");
  Ø(".overlay").classList.remove("no-transition");
  Ø(".info").classList.remove("no-transition");

  const diffX = e.changedTouches[0].clientX - startTouchX;
  if (gesture === "LTR" && diffX > swipeThreshold) {
    if (!Ø(".info").classList.contains("hidden")) {
      Ø(".info").classList.add("hidden");
    } else if (!Ø(".player").classList.contains("hidden")) {
      closePlayer();
    } else history.back();
  } else if (gesture === "RTL" && diffX < -swipeThreshold) {
    if (
      window.location.pathname.split("/").length === 4 &&
      window.location.pathname.split("/")[1] !== "search"
    ) {
      Ø(".info").classList.remove("hidden");
    } else history.forward();
  } else if (gesture === "open") {
    if (diffX < 224 * 0.25) {
      await closeMenu();
    }
  } else if (gesture === "close") {
    if (-diffX > 224 * 0.25) {
      await closeMenu();
    }
  }
  gesture = "";
  isSomethingScrolling = false;
});

const closeMenu = async () => {
  Ø(".menu").classList.remove("no-transition");
  Ø(".overlay").classList.remove("no-transition");
  Ø(".menu").classList.add("hidden");
  Ø(".overlay").classList.add("hide");
  await new Promise((resolve) => setTimeout(resolve, 300));
  Ø(".overlay").classList.remove("hide");
  Ø(".overlay").classList.add("hidden");
};

Ø(".overlay").onclick = async (e) => {
  if (e.target !== Ø(".overlay")) return;
  await closeMenu();
};

Ø(".bar .icon").onclick = async () => {
  Ø(".menu").classList.remove("no-transition");
  Ø(".overlay").classList.remove("no-transition");
  Ø(".menu").classList.remove("hidden");
  Ø(".overlay").classList.remove("hidden");
};
Ø(".home").onclick = () => (location.href = "/");
Ø(".toDesktop").onclick = () => (location.href = "/?view=desktop");
Ø(".msg").onclick = async () => {
  ØØ(".list .item").forEach((e) => (e.onclick = null));
  Ø(".list").innerHTML = "";
  closeMenu();
  history.pushState(null, null, "/msg/");
  await render();
};
Ø(".fullList").onclick = async () => {
  ØØ(".list .item").forEach((e) => (e.onclick = null));
  Ø(".list").innerHTML = "";
  closeMenu();
  history.pushState(null, null, "/list/");
  await render();
};
Ø(".telegram").onclick = () =>
  window.open(Ø("meta[name=telegram-url]").getAttribute("content"), "_blank");
Ø(".donate").onclick = () =>
  window.open(Ø("meta[name=donate-url]").getAttribute("content"), "_blank");
Ø(".logout").onclick = () => (location.href = "/logout");

if (document.body.requestFullscreen) {
  Ø(".fullscreen").classList.remove("hidden");
  Ø(".fullscreen input").checked = false;
  document.addEventListener("fullscreenchange", (event) => {
    if (document.fullscreenElement) {
      Ø(".fullscreen input").checked = true;
    } else {
      Ø(".fullscreen input").checked = false;
    }
  });
  Ø(".fullscreen input").onchange = async () => {
    if (!document.fullscreenElement) {
      await document.body.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  Ø(".install").classList.remove("hidden");
  Ø(".install").onclick = () => e.prompt();
});

Ø(".history").innerText = `🗑️ 清除播放紀錄 (${
  Object.entries(localStorage).filter((e) => e[0].startsWith("/")).length
} 個)`;
Ø(".history").onclick = (event) => {
  if (confirm("你確定要刪除所有播放紀錄嗎？")) {
    for (const key in localStorage) {
      if (key.startsWith("/")) {
        localStorage.removeItem(key);
      }
    }
    event.target.innerText = `🗑️ 清除播放紀錄 (${
      Object.entries(localStorage).filter((e) => e[0].startsWith("/")).length
    } 個)`;
    ØØ(".watched").forEach((each) => {
      each.classList.remove("watched");
    });
  }
};

const updateNSFW = () => {
  if (localStorage.getItem("nsfw")) {
    Ø(".sukebei input").checked = true;
  } else {
    Ø(".sukebei input").checked = false;
  }
};
updateNSFW();
Ø(".sukebei input").onchange = async (event) => {
  if (localStorage.getItem("nsfw")) {
    localStorage.removeItem("nsfw");
  } else {
    localStorage.setItem("nsfw", "nsfw");
  }
  updateNSFW();
  await render();
};

const supportedPlayers = [
  ["", "內置播放器 (預設)"],
  ["internal", "直接開啟連結"],
  ["external", "在新視窗開啟連結"],
];
if (navigator.userAgent.includes("Android")) {
  supportedPlayers.push(["com.mxtech.videoplayer.ad", "MX Player"]);
  supportedPlayers.push(["com.mxtech.videoplayer.pro", "MX Player Pro"]);
  supportedPlayers.push(["org.videolan.vlc", "VLC Player"]);
}
for (const supportedPlayer of supportedPlayers) {
  const option = document.createElement("option");
  option.value = supportedPlayer[0];
  option.innerText = supportedPlayer[1];
  option.selected = localStorage.getItem("player") === supportedPlayer[0];
  Ø(".defaultPlayer select").appendChild(option);
}

Ø(".defaultPlayer select").onchange = (e) => {
  const selectedPlayer = e.target.options[e.target.selectedIndex].value;
  if (selectedPlayer) {
    localStorage.setItem("player", selectedPlayer);
  } else {
    localStorage.removeItem("player");
  }
};

const subscribe = async (event) => {
  const registration = await navigator.serviceWorker.ready;
  if (!registration) return false;
  const subscription =
    (await registration?.pushManager?.getSubscription()) ??
    (await registration?.pushManager
      ?.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          Ø("meta[name=webpush-public-key]").getAttribute("content")
        ),
      })
      .catch(async (e) => {
        await registration.unregister();
        alert(e);
      }));
  if (!subscription) return false;
  const res = await fetch("/subscribe/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });
  return res.status < 400;
};

const unsubscribe = async (event) => {
  const registration = await navigator.serviceWorker.ready;
  if (!registration) return false;
  const subscription = await registration?.pushManager?.getSubscription();
  if (!subscription) return false;
  const res = await fetch("/unsubscribe/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });
  return res.status < 400;
};

Ø(".notification input").onchange = async () => {
  Ø(".notification input").disabled = true;
  if (Ø(".notification input").checked) {
    Ø(".notification input").checked = await subscribe();
  } else {
    Ø(".notification input").checked = !(await unsubscribe());
  }
  Ø(".notification input").disabled = false;
};

(async () => {
  if (!navigator.serviceWorker) return;
  if (navigator.userAgent.includes("Mac") && "ontouchend" in document) return;
  navigator.serviceWorker.register("/sw.js");
  const registration = await navigator.serviceWorker.ready;
  if (registration) {
    const subscription = await registration?.pushManager?.getSubscription();
    if (subscription) {
      const res = await fetch("/subscribed/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });
      if (res.status === 200) {
        Ø(".notification input").checked = true;
        Ø(".notification").classList.remove("hidden");
        return;
      }
    }
  }
  Ø(".notification input").checked = false;
  Ø(".notification").classList.remove("hidden");
})();
