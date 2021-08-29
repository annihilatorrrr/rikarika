const formatFileSize = function (bytes) {
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

const renderFileSizeStyle = function () {
  if (navigator.connection && navigator.connection.type === "cellular") {
    document.querySelectorAll(".file .details_size").forEach((each) => {
      each.style.visibility = "visible";
    });
  } else {
    document.querySelectorAll(".details_size").forEach((each) => {
      each.style.visibility = "hidden";
    });
  }
};
if (navigator.connection) {
  navigator.connection.ontypechange = renderFileSizeStyle;
}

const getDateTimeOpacity = function (timeStringUTC) {
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

const formatDateTime = function (timeStringUTC) {
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

const preventClick = (event) => {
  if (event.button === 0) {
    event.preventDefault();
  }
};

const clickFile = function (event) {
  if (event && event.button !== 0) {
    return;
  }
  const href = this.querySelector("a").pathname;
  this.classList.add("watched");
  localStorage.setItem(decodeURIComponent(href), 1);

  if (href.slice(-4) === ".mp4") {
    if (localStorage.getItem("player") === "external") {
      window.open(href, "_blank");
    } else if (localStorage.getItem("player")) {
      const url = this.querySelector("a").href;
      const a = document.createElement("a");
      a.href = `intent:${url}#Intent;package=${localStorage.getItem(
        "player"
      )};S.browser_fallback_url=${url};end`;
      a.click();
    } else {
      location.href = href;
    }
  } else if (localStorage.getItem("player") === "external") {
    window.open(href, "_blank");
  } else {
    location.href = href;
  }
};

const scrollTop = [];
const clickFolder = function (event) {
  if (event.button !== 0) {
    return;
  }
  scrollTop[window.location.pathname.split("/").length - 2] =
    document.querySelector(".list").scrollTop;
  history.pushState(null, null, this.querySelector("a").pathname);
  render();
};

const appendChunk = (chunk) => {
  document.querySelector(".list").append(
    ...chunk.map(({ season, name, modified, size, anime_id }) => {
      const div7 = document.createElement("div");
      const a4 = document.createElement("a");
      const span1 = document.createElement("span");
      const span2 = document.createElement("span");
      span1.className = "details_modified";
      span1.dataset.modified = modified;
      span1.style.opacity = getDateTimeOpacity(modified);
      span1.innerText = formatDateTime(modified);
      span2.className = "details_size";
      span2.innerText = formatFileSize(size || 0);
      switch (name.slice(-4)) {
        case ".mp4":
        case ".txt":
        case ".ass":
          div7.className = "file";
          if (localStorage.getItem(`/${anime_id}/${name}`)) {
            div7.classList.add("watched");
          }
          div7.onmouseup = clickFile;
          a4.href = `/${anime_id}/${encodeURIComponent(name)}`;
          a4.appendChild(
            document.createTextNode(
              `${name.slice(-4) === ".mp4" ? "🎞️" : "📄"} ${name.slice(0, -4)}`
            )
          );
          a4.onclick = preventClick;
          break;
        default:
          div7.className = "folder";
          div7.onmouseup = clickFolder;
          a4.href = season
            ? `/${season}/${encodeURIComponent(name)}/`
            : `${encodeURIComponent(name)}/`;
          a4.appendChild(document.createTextNode(`📁 ${name}`));
          a4.onclick = preventClick;
      }
      div7.appendChild(a4);
      div7.appendChild(document.createElement("br"));
      div7.appendChild(span1);
      div7.appendChild(span2);
      return div7;
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

  if (season === "search" && !title) {
    history.replaceState(null, null, "/");
    render();
    return;
  }

  document.title = title || season || "カリ(仮)";
  if (season === "search") {
    document.querySelector(".search").value = title;
  }
  document.querySelectorAll(".folder").forEach((each) => {
    each.onmouseup = null;
  });

  const loadingTimer = setTimeout(() => {
    document.querySelector(".list").innerHTML = "";
    const div3 = document.createElement("div");
    div3.className = "folder";
    div3.appendChild(document.createTextNode("Loading..."));
    document.querySelector(".progress").style.visibility = "visible";
    document.querySelector(".list").appendChild(div3);
  }, 300);

  const dirEntries = await fetch(
    season === "search" ? `/search?q=${title}` : `/ls?path=${encodeURIComponent(location.pathname)}`
  )
    .then((res) => res.json())
    .catch((e) => e);
  clearTimeout(loadingTimer);

  document.querySelector(".list").innerHTML = "";
  if (!Array.isArray(dirEntries)) {
    await renderRetryButton(dirEntries);
    return;
  }

  if (season === "search") {
    renderSearchResult(dirEntries);
    return;
  } else if (season) {
    await renderBackButton(season, title);
  }

  const filteredEntries = localStorage.getItem("nsfw")
    ? dirEntries
    : dirEntries.filter((e) => e.name !== "Sukebei");
  const chunkList = filteredEntries.reduce(
    (acc, cur, index, array) => (index % 100 ? acc : [...acc, array.slice(index, index + 100)]),
    []
  );
  appendChunk(chunkList[0]);
  if (scrollTo && document.querySelector(".list").scrollHeight >= scrollTo) {
    document.querySelector(".list").scrollTo(0, scrollTo);
  } else {
    document.querySelector(".list").scrollTo(0, 0);
  }

  lazyLoadHandleList = [];
  document.querySelector(".progress").style.visibility = "visible";
  for (const chunk of chunkList.slice(1)) {
    await new Promise((resolve) =>
      lazyLoadHandleList.push(
        setTimeout(() => {
          appendChunk(chunk);
          if (scrollTo && document.querySelector(".list").scrollHeight >= scrollTo) {
            document.querySelector(".list").scrollTo(0, scrollTo);
          }
          resolve();
        }, 0)
      )
    );
  }
  document.querySelector(".progress").style.visibility = "hidden";

  renderFileSizeStyle();
};

const renderRetryButton = async (error) => {
  const div15 = document.createElement("div");
  div15.classList.add("error");
  div15.onclick = render;
  div15.appendChild(document.createTextNode(`無法連線至伺服器 📶`));
  div15.appendChild(document.createElement("br"));
  div15.appendChild(document.createTextNode(`(${error})`));
  div15.appendChild(document.createElement("br"));
  div15.appendChild(document.createElement("br"));
  div15.appendChild(document.createTextNode("按這裡重試"));
  document.querySelector(".list").appendChild(div15);
};

const renderSearchResult = async function (results) {
  for (const { season, title } of results) {
    if (!localStorage.getItem("nsfw") && season === "Sukebei") {
      continue;
    }
    const div1 = document.createElement("div");
    div1.className = "folder";
    const a1 = document.createElement("a");
    a1.href = `/${season}/${encodeURIComponent(title)}/`;
    a1.appendChild(document.createTextNode(`📁 ${title}`));
    div1.appendChild(a1);
    div1.appendChild(document.createElement("br"));
    const span1 = document.createElement("span");
    span1.className = "details_title";
    span1.innerText = season;
    div1.appendChild(span1);
    document.querySelector(".list").appendChild(div1);
  }
  document.querySelectorAll(".folder").forEach((each) => {
    each.onmouseup = function (event) {
      if (event.button !== 0) {
        return;
      }
      history.pushState(null, null, this.querySelector("a").pathname);
      render();
    };
  });
  document.querySelectorAll(".folder a").forEach((each) => {
    each.onclick = (event) => {
      if (event.button === 0) {
        event.preventDefault();
      }
    };
  });
};

const renderBackButton = async (season, title) => {
  const div4 = document.createElement("div");
  div4.className = "folder";
  div4.onclick = (event) => {
    history.back();
  };
  div4.appendChild(document.createTextNode("🔙 上一頁"));
  document.querySelector(".list").appendChild(div4);
};

render();

window.onpopstate = async () => {
  await render(scrollTop[window.location.pathname.split("/").length - 2] || 0);
};

let typing = null;
document.querySelector(".search").oninput = (e) => {
  clearTimeout(typing);
  if (!e.target.value) {
    history.pushState(null, null, "/");
    render();
    return;
  }
  history.replaceState(null, null, `/search/${encodeURIComponent(e.target.value)}/`);
  typing = setTimeout(render, 300);
};

document.querySelector(".search").onfocus = (e) => {
  if (e.target.value) {
    history.pushState(null, null, `/search/${encodeURIComponent(e.target.value)}/`);
    render();
  }
};

const openMenu = async () => {
  document.querySelector(".overlay").classList.remove("hidden");
  document.querySelector(".menu").classList.remove("hidden");
  await new Promise((resolve) => setTimeout(resolve, 300));
  document.querySelector(".bar").classList.add("blur");
  document.querySelector(".list").classList.add("blur");
};

document.querySelector(".bar .icon").onclick = openMenu;
document.querySelector(".edge").onclick = openMenu;

let startTouchX = 0;
let startTouchY = 0;
let touchStartTime = 0;
document.addEventListener("touchstart", function (e) {
  startTouchX = e.touches[0].screenX;
  startTouchY = e.touches[0].screenY;
  touchStartTime = e.timeStamp;
});
document.addEventListener("touchend", async (e) => {
  if (
    e.changedTouches[0].screenX - startTouchX > 100 &&
    Math.abs(e.changedTouches[0].screenY - startTouchY) < 100 &&
    e.timeStamp - touchStartTime < 300
  ) {
    await openMenu();
  }
});

document.querySelector(".overlay").onclick = async (e) => {
  if (e.target !== document.querySelector(".overlay")) return;
  document.querySelector(".bar").classList.remove("blur");
  document.querySelector(".list").classList.remove("blur");
  document.querySelector(".overlay").classList.add("hidden");
  document.querySelector(".menu").classList.add("hidden");
};

document.querySelector(".home").onclick = () => {
  location.href = "/";
};
document.querySelector(".toDesktop").onclick = () => {
  location.href = "/?view=desktop";
};

document.querySelector(".fullList").onclick = () => {
  window.open("/list", "_blank");
};

document.querySelector(".telegram").onclick = () => {
  window.open(document.querySelector("meta[name=telegram-url]").getAttribute("content"), "_blank");
};

document.querySelector(".donate").onclick = () => {
  window.open(document.querySelector("meta[name=donate-url]").getAttribute("content"), "_blank");
};

document.querySelector(".logout").onclick = () => {
  location.href = "/logout";
};

if (document.body.requestFullscreen) {
  let isOrientationLocked = false;
  document.querySelector(".fullscreen").classList.remove("hidden");
  document.querySelector(".orientation").classList.remove("hidden");
  document.querySelector(".fullscreen").innerText = "⬜ 全螢幕";
  document.querySelector(".orientation").innerText = "🔓 固定此螢幕方向";
  document.addEventListener("fullscreenchange", (event) => {
    if (document.fullscreenElement) {
      document.querySelector(".fullscreen").innerText = "✅ 全螢幕";
      document.querySelector(".orientation").innerText = isOrientationLocked
        ? "🔒 螢幕方向已固定"
        : "🔓 固定此螢幕方向";
    } else {
      document.querySelector(".fullscreen").innerText = "⬜ 全螢幕";
      document.querySelector(".orientation").innerText = "🔓 固定此螢幕方向";
      isOrientationLocked = false;
    }
  });
  document.querySelector(".fullscreen").onclick = async () => {
    if (!document.fullscreenElement) {
      await document.body.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };
  document.querySelector(".orientation").onclick = async () => {
    if (isOrientationLocked) {
      screen.orientation.unlock();
      isOrientationLocked = false;
      document.querySelector(".orientation").innerText = "🔓 固定此螢幕方向";
    } else {
      if (!document.fullscreenElement) {
        await document.body.requestFullscreen();
      }
      screen.orientation.lock(screen.orientation.type);
      isOrientationLocked = true;
      document.querySelector(".orientation").innerText = "🔒 螢幕方向已固定";
    }
  };
}

let beforeInstallPromptEvent;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  beforeInstallPromptEvent = e;
  document.querySelector(".install").classList.remove("hidden");
});

document.querySelector(".install").onclick = () => {
  beforeInstallPromptEvent.prompt();
};

document.querySelector(".history").innerText = `🗑️ 清除播放紀錄 (${
  Object.entries(localStorage).filter((e) => e[0].startsWith("/")).length
} 個)`;
document.querySelector(".history").onclick = (event) => {
  if (confirm("你確定要刪除所有播放紀錄嗎？")) {
    for (const key in localStorage) {
      if (key.startsWith("/")) {
        localStorage.removeItem(key);
      }
    }
    event.target.innerText = `🗑️ 清除播放紀錄 (${
      Object.entries(localStorage).filter((e) => e[0].startsWith("/")).length
    } 個)`;
  }
};

document.querySelector(".sukebei").innerText = localStorage.getItem("nsfw")
  ? "🛐 我有罪並且已懺悔"
  : "🔞 我了解並且要繼續";

document.querySelector(".sukebei").onclick = async (event) => {
  if (localStorage.getItem("nsfw")) {
    localStorage.removeItem("nsfw");
    event.target.innerText = "🔞 我了解並且要繼續";
  } else {
    localStorage.setItem("nsfw", "nsfw");
    event.target.innerText = "🛐 我有罪並且已懺悔";
  }
  await render();
};

const supportedPlayers = [["external", "外部應用程式"]];
if (/(Android)/g.test(navigator.userAgent)) {
  supportedPlayers.push(["com.mxtech.videoplayer.ad", "MXPlayer"]);
  supportedPlayers.push(["com.mxtech.videoplayer.pro", "MXPlayer Pro"]);
}
for (const supportedPlayer of supportedPlayers) {
  const option = document.createElement("option");
  option.value = supportedPlayer[0];
  option.innerText = supportedPlayer[1];
  option.selected = localStorage.getItem("player") === supportedPlayer[0];
  document.querySelector(".defaultPlayer select").appendChild(option);
}

document.querySelector(".defaultPlayer select").onchange = (e) => {
  const selectedPlayer = e.target.options[e.target.selectedIndex].value;
  if (selectedPlayer) {
    localStorage.setItem("player", selectedPlayer);
  } else {
    localStorage.removeItem("player");
  }
};

const subscribe = async (event) => {
  event.target.innerText = "🔔 正在嘗試啟用推送通知...";
  const registration = await navigator.serviceWorker.ready;
  if (!registration) {
    event.target.innerText = "🔔 無法啟用推送通知";
    return;
  }
  const subscription =
    (await registration?.pushManager?.getSubscription()) ??
    (await registration?.pushManager
      ?.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          document.querySelector("meta[name=webpush-public-key]").getAttribute("content")
        ),
      })
      .catch(async (e) => {
        await registration.unregister();
        alert(e);
      }));
  if (!subscription) {
    event.target.innerText = "🔔 無法啟用推送通知";
    return;
  }
  const res = await fetch("/subscribe/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });
  if (res.status >= 400) {
    event.target.innerText = "🔔 無法啟用推送通知";
  } else {
    document.querySelector(".notification").onclick = unsubscribe;
    event.target.innerText = "🔕 停用推送通知";
  }
};

const unsubscribe = async (event) => {
  event.target.innerText = "🔕 正在停用推送通知...";
  const registration = await navigator.serviceWorker.ready;
  if (!registration) {
    event.target.innerText = "🔕 無法停用推送通知";
    return;
  }
  const subscription = await registration?.pushManager?.getSubscription();
  if (!subscription) {
    event.target.innerText = "🔕 無法停用推送通知";
    return;
  }
  const res = await fetch("/unsubscribe/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });
  if (res.status >= 400) {
    event.target.innerText = "🔕 無法停用推送通知";
  } else {
    document.querySelector(".notification").onclick = subscribe;
    event.target.innerText = "🔔 啟用推送通知";
  }
};

(async () => {
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
        document.querySelector(".notification").onclick = unsubscribe;
        document.querySelector(".notification").innerText = "🔕 停用推送通知";
        return;
      }
    }
  }
  document.querySelector(".notification").onclick = subscribe;
  document.querySelector(".notification").innerText = "🔔 啟用推送通知";
})();

navigator.serviceWorker.register("/sw.js");
