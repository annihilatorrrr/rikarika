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

const scrollTop = [];

const appendChunk = (chunk) => {
  Ø(".list").append(
    ...chunk.map(({ season, name, modified, size, anime_id }) => {
      const div0 = document.createElement("div0");
      div0.classList.add("item");
      const div1 = document.createElement("div");
      if ([".mp4", ".txt", ".ass"].includes(name.slice(-4))) {
        if (localStorage.getItem(`/${anime_id}/${name}`)) {
          div0.classList.add("watched");
        }
        div0.addEventListener("click", async (event) => {
          const href = `/${anime_id}/${encodeURIComponent(name)}`;
          if (event.target.parentNode.classList.contains("item")) {
            event.target.parentNode.classList.add("watched");
          } else {
            event.target.parentNode.parentNode.classList.add("watched");
          }
          localStorage.setItem(decodeURIComponent(href), 1);

          if (href.slice(-4) === ".mp4") {
            if (localStorage.getItem("player") === "external") {
              window.open(href, "_blank");
            } else if (localStorage.getItem("player")) {
              const a = document.createElement("a");
              a.href = `intent:${
                new URL(href, document.baseURI).href
              }#Intent;package=${localStorage.getItem("player")};end`;
              a.click();
            } else {
              location.href = href;
            }
          } else if (localStorage.getItem("player") === "external") {
            window.open(href, "_blank");
          } else {
            location.href = href;
          }
        });
        div0.href = `/${anime_id}/${encodeURIComponent(name)}`;
        div1.innerText = name.slice(0, -4);
      } else {
        div0.addEventListener(
          "click",
          async (event) => {
            scrollTop[window.location.pathname.split("/").length - 2] = Ø(".list").scrollTop;
            history.pushState(
              null,
              null,
              season ? `/${season}/${encodeURIComponent(name)}/` : `${encodeURIComponent(name)}/`
            );
            await render(scrollTop[window.location.pathname.split("/").length - 2] || 0);
          },
          { once: true }
        );
        div1.innerText = `📁 ${name}`;
      }
      const div2 = document.createElement("div");
      div2.className = "details";
      const div3 = document.createElement("div");
      div3.className = "left";
      div3.innerText = ""; // formatFileSize(size)
      const div4 = document.createElement("div");
      div4.className = "right";
      div4.style.opacity = getDateTimeOpacity(modified);
      div4.innerText = formatDateTime(modified);
      div2.append(div3, div4);
      div0.append(div1, div2);
      return div0;
    })
  );
};

let lazyLoadHandleList = [];

const render = async (scrollTo) => {
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
  if (season === "list") {
    document.title = "カリ(仮)";
    Ø(".title").innerText = "カリ(仮)";
    const txt = await fetch("/list").then((e) => e.text());
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
    div15.onclick = render;
    div15.innerText = `似乎出現了一點問題\n(${dirEntries})\n\n點擊頁面重試`;
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
  const chunkList = filteredEntries.reduce(
    (acc, cur, index, array) => (index % 100 ? acc : [...acc, array.slice(index, index + 100)]),
    []
  );
  appendChunk(chunkList[0]);
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
        }, 50)
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
    div0.addEventListener(
      "click",
      async (event) => {
        history.pushState(null, null, `/${season}/${encodeURIComponent(title)}/`);
        await render();
      },
      { once: true }
    );
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
    div4.innerText = formatDateTime(updated);
    div2.append(div3, div4);
    div0.append(div1, div2);
    Ø(".list").appendChild(div0);
  }
};

render();

window.onpopstate = async () => {
  await render(scrollTop[window.location.pathname.split("/").length - 2] || 0);
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

const activation = 50;
const pullThreshold = activation + 200;
const swipeThreshold = activation + 50;
let startTouchX = 0;
let startTouchY = 0;
let startTouchAtTop = false;
let startTouchAtLeftEdge = false;
let startTouchOnMenu = false;
let activatedGesture = "";
let isMenuScrolling = false;
Ø(".menu").addEventListener(
  "scroll",
  () => {
    isMenuScrolling = true;
  },
  { passive: true }
);
document.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length > 1) return;
    activatedGesture = "";
    startTouchX = e.touches[0].clientX;
    startTouchY = e.touches[0].clientY;
    startTouchAtTop = !Ø(".list").scrollTop;
    startTouchAtLeftEdge = startTouchX < 30 && startTouchY > 65;
    startTouchOnMenu = startTouchX < 250 && !Ø(".overlay").classList.contains("hidden");
    if (startTouchAtLeftEdge) {
      e.preventDefault();
    }
  },
  { passive: false }
);
document.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length > 1) return;
    const diffX = e.changedTouches[0].clientX - startTouchX;
    const diffY = e.changedTouches[0].clientY - startTouchY;
    const isVertical = Math.abs(diffY) > Math.abs(diffX);
    if (!activatedGesture) {
      if (!Ø(".overlay").classList.contains("hidden")) {
        if (startTouchOnMenu && !isMenuScrolling && diffX < -10) {
          activatedGesture = "close";
          Ø(".menu").classList.add("dragging");
          Ø(".overlay").classList.add("dragging");
        }
      } else if (startTouchAtLeftEdge) {
        activatedGesture = "open";
        Ø(".menu").classList.remove("hidden");
        Ø(".menu").classList.add("dragging");
        Ø(".overlay").classList.remove("hidden");
        Ø(".overlay").classList.add("dragging");
      } else if (Math.abs(diffX) > activation || Math.abs(diffY) > activation) {
        if (isVertical && diffY > 0 && startTouchAtTop) {
          activatedGesture = "pull";
          Ø(".reload").classList.remove("hidden");
          Ø(".reload").classList.remove("active");
        } else if (!isVertical && Math.abs(diffY) < activation && diffX > 0) {
          activatedGesture = "LTR";
        } else if (!isVertical && Math.abs(diffY) < activation && diffX < 0) {
          activatedGesture = "RTL";
        }
        if (activatedGesture) Ø(".list").classList.add("dragging");
      }
    }
    if (activatedGesture === "open") {
      const translate = diffX - 224 > 0 ? 0 : diffX - 224;
      Ø(".menu").style.transform = `translate(${translate}px, 0)`;
      Ø(".overlay").style.opacity = (translate + 224) / 224;
    } else if (activatedGesture === "close") {
      const translate = diffX > 0 ? 0 : diffX;
      Ø(".menu").style.transform = `translate(${translate}px, 0)`;
      Ø(".overlay").style.opacity = (translate + 224) / 224;
    } else if (activatedGesture === "pull") {
      Ø(".reload").style.width = `${((diffY - activation) / (pullThreshold - activation)) * 100}%`;
      if (diffY > pullThreshold) {
        Ø(".reload").classList.add("active");
      } else {
        Ø(".reload").classList.remove("active");
      }
    } else if (activatedGesture === "LTR") {
      let translate = diffX - activation;
      translate = translate < 0 ? 0 : translate;
      translate = translate > swipeThreshold - activation ? swipeThreshold - activation : translate;
      Ø(".bar").style.transform = `translate(${translate / 4}px, 0)`;
      Ø(".list").style.transform = `translate(${translate / 4}px, 0)`;
    } else if (activatedGesture === "RTL") {
      let translate = diffX + activation;
      translate = translate > 0 ? 0 : translate;
      translate =
        translate < -(swipeThreshold - activation) ? -(swipeThreshold - activation) : translate;
      Ø(".bar").style.transform = `translate(${translate / 4}px, 0)`;
      Ø(".list").style.transform = `translate(${translate / 4}px, 0)`;
    }
  },
  { passive: true }
);
document.addEventListener("touchend", async (e) => {
  if (e.touches.length > 1) return;
  isMenuScrolling = false;
  const diffX = e.changedTouches[0].clientX - startTouchX;
  const diffY = e.changedTouches[0].clientY - startTouchY;
  Ø(".list").classList.remove("dragging");
  if (activatedGesture === "pull") {
    Ø(".reload").classList.add("hidden");
    Ø(".reload").classList.remove("active");
    Ø(".reload").style.width = "0%";
    if (diffY > pullThreshold) {
      await render();
    }
  } else if (activatedGesture === "LTR") {
    Ø(".bar").style.transform = `translate(${0}px, 0)`;
    Ø(".list").style.transform = `translate(${0}px, 0)`;
    if (diffX > swipeThreshold) {
      history.back();
    }
  } else if (activatedGesture === "RTL") {
    Ø(".bar").style.transform = `translate(${0}px, 0)`;
    Ø(".list").style.transform = `translate(${0}px, 0)`;
    if (diffX < -swipeThreshold) {
      history.forward();
    }
  } else if (activatedGesture === "open") {
    Ø(".menu").style.removeProperty("transform");
    Ø(".menu").classList.remove("dragging");
    Ø(".overlay").style.removeProperty("opacity");
    Ø(".overlay").classList.remove("dragging");
    if (diffX > 224 * 0.25) {
      Ø(".menu").classList.remove("hidden");
      Ø(".overlay").classList.remove("hidden");
    } else {
      Ø(".menu").classList.add("hidden");
      Ø(".overlay").classList.add("hidden");
    }
  } else if (activatedGesture === "close") {
    Ø(".menu").style.removeProperty("transform");
    Ø(".menu").classList.remove("dragging");
    Ø(".overlay").style.removeProperty("opacity");
    Ø(".overlay").classList.remove("dragging");
    if (-diffX > 224 * 0.25) {
      Ø(".menu").classList.add("hidden");
      Ø(".overlay").classList.add("hidden");
    }
  }
  activatedGesture = "";
});

const closeMenu = async () => {
  Ø(".menu").classList.add("hidden");
  Ø(".list").classList.remove("blur");
  Ø(".bar").classList.remove("blur");
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
  Ø(".menu").classList.remove("dragging");
  Ø(".menu").classList.remove("hidden");
  Ø(".overlay").classList.remove("dragging");
  Ø(".overlay").classList.remove("hidden");
};
Ø(".home").onclick = () => (location.href = "/");
Ø(".toDesktop").onclick = () => (location.href = "/?view=desktop");
Ø(".fullList").onclick = async () => {
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

const supportedPlayers = [["external", "外部應用程式"]];
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

navigator.serviceWorker?.register("/sw.js");
