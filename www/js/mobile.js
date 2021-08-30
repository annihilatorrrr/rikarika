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
  document.querySelector(".list").append(
    ...chunk.map(({ season, name, modified, size, anime_id }) => {
      const div0 = document.createElement("div0");
      div0.classList.add("item");
      const div1 = document.createElement("div");
      if ([".mp4", ".txt", ".ass"].includes(name.slice(-4))) {
        if (localStorage.getItem(`/${anime_id}/${name}`)) {
          div0.classList.add("watched");
        }
        div0.addEventListener(
          "click",
          async (event) => {
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
                const url = new URL(href, document.baseURI).href;
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
          },
          { once: true }
        );
        div0.href = `/${anime_id}/${encodeURIComponent(name)}`;
        div1.innerText = name.slice(0, -4);
      } else {
        div0.addEventListener(
          "click",
          async (event) => {
            scrollTop[window.location.pathname.split("/").length - 2] =
              document.querySelector(".list").scrollTop;
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
      div3.innerText = size ? formatFileSize(size) : "";
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

  if (season === "search") {
    if (title) {
      document.querySelector("input").value = title;
      document.querySelector("button").disabled = false;
    } else {
      history.replaceState(null, null, "/");
      render();
      return;
    }
  }

  document.title = title || "カリ(仮)";

  const loadingTimer = setTimeout(
    () => document.querySelector(".progress").classList.remove("hidden"),
    300
  );
  const dirEntries = await fetch(
    season === "search" ? `/search?q=${title}` : `/ls?path=${encodeURIComponent(location.pathname)}`
  )
    .then((res) => res.json())
    .catch((e) => e);
  clearTimeout(loadingTimer);

  document.querySelector(".list").innerHTML = "";
  if (!Array.isArray(dirEntries)) {
    document.querySelector(".progress").classList.add("hidden");
    const div15 = document.createElement("div");
    div15.classList.add("error");
    div15.onclick = render;
    div15.append(
      document.createTextNode(`無法連線至伺服器 📶`),
      document.createElement("br"),
      document.createTextNode(`(${dirEntries})`),
      document.createElement("br"),
      document.createElement("br"),
      document.createTextNode("按一下頁面重試")
    );
    document.querySelector(".list").appendChild(div15);
    return;
  }

  if (season === "search") {
    renderSearchResult(dirEntries);
    return;
  } else if (season) {
    const div1 = document.createElement("div");
    div1.classList.add("item");
    const div2 = document.createElement("div");
    div2.className = "details";
    const div3 = document.createElement("div");
    div3.innerText = "🔙 上一頁";
    div1.append(div3, div2);
    div1.onclick = (event) => history.back();
    document.querySelector(".list").appendChild(div1);
  }

  const filteredEntries = localStorage.getItem("nsfw")
    ? dirEntries
    : dirEntries.filter((e) => e.name !== "Sukebei" && e.season !== "Sukebei");
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
  document.querySelector(".progress").classList.remove("hidden");
  for (const chunk of chunkList.slice(1)) {
    await new Promise((resolve) =>
      lazyLoadHandleList.push(
        setTimeout(() => {
          appendChunk(chunk);
          if (scrollTo && document.querySelector(".list").scrollHeight >= scrollTo) {
            document.querySelector(".list").scrollTo(0, scrollTo);
          }
          resolve();
        }, 50)
      )
    );
  }
  document.querySelector(".progress").classList.add("hidden");
};

const renderSearchResult = async (results) => {
  document.querySelector(".list").scrollTo(0, 0);
  for (const { season, title } of results) {
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
    div4.innerText = season;
    div2.append(div3, div4);
    div0.append(div1, div2);
    document.querySelector(".list").appendChild(div0);
  }
};

render();

window.onpopstate = async () => {
  await render(scrollTop[window.location.pathname.split("/").length - 2] || 0);
};

let typing = null;
document.querySelector(".search").oninput = (e) => {
  clearTimeout(typing);
  document.querySelector("button").disabled = !e.target.value;
  if (!e.target.value) {
    history.pushState(null, null, "/");
    render();
    return;
  }
  history.replaceState(null, null, `/search/${encodeURIComponent(e.target.value)}/`);
  typing = setTimeout(render, 300);
};
document.querySelector("button").onclick = () => {
  clearTimeout(typing);
  document.querySelector("button").disabled = true;
  document.querySelector(".search").value = "";
  history.pushState(null, null, "/");
  render();
  return;
};

document.querySelector(".search").onfocus = (e) => {
  if (e.target.value) {
    history.pushState(null, null, `/search/${encodeURIComponent(e.target.value)}/`);
    render();
  }
};

let startTouchX = 0;
let startTouchY = 0;
let touchStartTime = 0;
document.addEventListener("touchstart", (e) => {
  startTouchX = e.touches[0].screenX;
  startTouchY = e.touches[0].screenY;
  touchStartTime = e.timeStamp;
});
document.addEventListener("touchend", async (e) => {
  if (
    e.changedTouches[0].screenX - startTouchX > 50 &&
    Math.abs(e.changedTouches[0].screenY - startTouchY) < 50 &&
    e.timeStamp - touchStartTime < 300
  ) {
    document.querySelector(".overlay").classList.remove("hidden");
    document.querySelector(".menu").classList.remove("hidden");
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
});

document.querySelector(".overlay").onclick = async (e) => {
  if (e.target !== document.querySelector(".overlay")) return;
  document.querySelector(".overlay").classList.add("hidden");
  document.querySelector(".menu").classList.add("hidden");
};

document.querySelector(".bar .icon").onclick = () => (location.href = "/");
document.querySelector(".home").onclick = () => (location.href = "/");
document.querySelector(".toDesktop").onclick = () => (location.href = "/?view=desktop");
document.querySelector(".fullList").onclick = () => window.open("/list", "_blank");
document.querySelector(".telegram").onclick = () =>
  window.open(document.querySelector("meta[name=telegram-url]").getAttribute("content"), "_blank");
document.querySelector(".donate").onclick = () =>
  window.open(document.querySelector("meta[name=donate-url]").getAttribute("content"), "_blank");
document.querySelector(".logout").onclick = () => (location.href = "/logout");

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

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  document.querySelector(".install").classList.remove("hidden");
  document.querySelector(".install").onclick = () => e.prompt();
});

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
    document.querySelectorAll(".watched").forEach((each) => {
      each.classList.remove("watched");
    });
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
