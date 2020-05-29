const android = /(Android)/g.test(navigator.userAgent);
// const iOS = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);

const updatePlayerSettingUI = function () {
  Array.from(document.querySelectorAll(".item"))
    .filter((each) => typeof each.dataset.app === "string")
    .forEach((item) => {
      if (
        item.dataset.app.includes(localStorage.getItem("player")) ||
        (item.dataset.app === "" && !localStorage.getItem("player"))
      ) {
        item.querySelector("span").style.visibility = "visible";
      } else {
        item.querySelector("span").style.visibility = "hidden";
      }
    });
};

const changePlayer = function () {
  if (this.dataset.app) {
    localStorage.setItem("player", this.dataset.app);
  } else {
    localStorage.removeItem("player");
  }
  updatePlayerSettingUI();
};

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
  const formattedDate = `${lastModified.getFullYear()}-${(
    lastModified.getMonth() + 1
  )
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

const render = async () => {
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
    document.querySelector("#search").value = title;
  }
  document.querySelectorAll(".folder").forEach((each) => {
    each.onmouseup = null;
  });

  const loadingTimer = setTimeout(() => {
    document.querySelectorAll("#list > div:not(.search)").forEach((each) => {
      each.remove();
    });
    const div3 = document.createElement("div");
    div3.className = "folder";
    div3.appendChild(document.createTextNode("Loading..."));
    document.querySelector("#list").appendChild(div3);
  }, 300);
  const dirEntries = await fetch(
    season === "search"
      ? `/search?q=${title}`
      : `/ls?path=${encodeURIComponent(location.pathname)}`
  ).then((res) => res.json());
  clearTimeout(loadingTimer);

  document.querySelectorAll("#list > div:not(.search)").forEach((each) => {
    each.remove();
  });

  if (season === "search") {
    renderSearchResult(dirEntries);
    return;
  }

  if (
    ["2020-01", "2020-04", "Movie", "OVA", "Sukebei"].includes(season) &&
    !title
  ) {
    dirEntries.sort((a, b) => (a.modified > b.modified ? -1 : 1));
  } else if (!season) {
    dirEntries.sort((a, b) => (a.name > b.name ? -1 : 1));
  } else {
    dirEntries.sort((a, b) => (a.name > b.name ? 1 : -1));
  }

  if (season) {
    const div4 = document.createElement("div");
    div4.className = "folder";
    div4.id = "back";
    const a2 = document.createElement("a");
    a2.href = title ? `/${season}/` : "/";
    a2.appendChild(document.createTextNode("▲ .."));
    div4.appendChild(a2);
    div4.appendChild(document.createElement("br"));
    const span1 = document.createElement("span");
    span1.className = "details_title";
    span1.innerText = title || season;
    div4.appendChild(span1);
    document.querySelector("#list").appendChild(div4);
  } else {
    const div6 = document.createElement("div");
    div6.className = "file";
    const a3 = document.createElement("a");
    a3.href = "/list";
    a3.appendChild(document.createTextNode("📄 動畫列表"));
    div6.appendChild(a3);
    div6.appendChild(document.createElement("br"));
    document.querySelector("#list").appendChild(div6);
  }

  for (const { name, modified, size, anime_id } of dirEntries) {
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
        div7.className = "file";
        if (localStorage.getItem(`/${anime_id}/${name}`)) {
          div7.classList.add("watched");
        }
        a4.href = `/${anime_id}/${encodeURIComponent(name)}`;
        a4.appendChild(document.createTextNode(`▶ ${name.slice(0, -4)}`));
        break;
      case ".txt":
      case ".ass":
        div7.className = "file";
        a4.href = `/${anime_id}/${encodeURIComponent(name)}`;
        a4.appendChild(document.createTextNode(`📄 ${name.slice(0, -4)}`));
        break;
      default:
        div7.className = "folder";
        a4.href = `${encodeURIComponent(name)}/`;
        a4.appendChild(document.createTextNode(`📁 ${name}`));
    }
    div7.appendChild(a4);
    div7.appendChild(document.createElement("br"));
    div7.appendChild(span1);
    div7.appendChild(span2);
    document.querySelector("#list").appendChild(div7);
  }

  if (!season && android) {
    const div10 = document.createElement("div");
    div10.className = "item";
    div10.dataset.app = "";
    div10.onclick = changePlayer;
    const span6 = document.createElement("span");
    span6.appendChild(document.createTextNode("✅ "));
    div10.appendChild(span6);
    div10.appendChild(document.createTextNode("使用預設播放器"));
    document.querySelector("#list").appendChild(div10);

    const div11 = document.createElement("div");
    div11.className = "item";
    div11.dataset.app = "com.mxtech.videoplayer.ad";
    div11.onclick = changePlayer;
    const span7 = document.createElement("span");
    span7.appendChild(document.createTextNode("✅ "));
    div11.appendChild(span7);
    div11.appendChild(document.createTextNode("使用 MXPlayer"));
    document.querySelector("#list").appendChild(div11);

    const div12 = document.createElement("div");
    div12.className = "item";
    div12.dataset.app = "com.mxtech.videoplayer.pro";
    div12.onclick = changePlayer;
    const span8 = document.createElement("span");
    span8.appendChild(document.createTextNode("✅ "));
    div12.appendChild(span8);
    div12.appendChild(document.createTextNode("使用 MXPlayer Pro"));
    document.querySelector("#list").appendChild(div12);
    updatePlayerSettingUI();
  }
  if (!season) {
    const div14 = document.createElement("div");
    div14.className = "item";
    div14.onclick = (event) => {
      event.preventDefault();
      location.href = document
        .querySelector("meta[name=donate-url]")
        .getAttribute("content");
    };
    div14.appendChild(document.createTextNode("❤️ PayMe 捐助"));
    document.querySelector("#list").appendChild(div14);

    const div13 = document.createElement("div");
    div13.className = "item";
    div13.onclick = (event) => {
      event.preventDefault();
      location.href = "/logout";
    };
    div13.appendChild(document.createTextNode("💨 登出"));
    document.querySelector("#list").appendChild(div13);
  }
  renderFileSizeStyle();

  document.querySelectorAll(".folder").forEach((each) => {
    each.onmouseup = function (event) {
      if (event.which !== 1) {
        return;
      }
      document.querySelectorAll(".folder").forEach((each) => {
        each.onmouseup = null;
      });
      history.pushState(null, null, this.querySelector("a").pathname);
      render();
    };
  });
  document.querySelectorAll(".folder a").forEach((each) => {
    each.onclick = (event) => {
      if (event.which === 1) {
        event.preventDefault();
      }
    };
  });
  document.querySelectorAll(".file").forEach((each) => {
    each.onmouseup = function (event) {
      if (event && event.which !== 1) {
        return;
      }
      const href = this.querySelector("a").pathname;
      this.classList.add("watched");
      localStorage.setItem(decodeURIComponent(href), 1);

      if (
        android &&
        localStorage.getItem("player") &&
        href.slice(-4) === ".mp4"
      ) {
        const url = this.querySelector("a").href;
        const a = document.createElement("a");
        a.href = `intent:${url}#Intent;package=${localStorage.getItem(
          "player"
        )};S.browser_fallback_url=${url};end`;
        a.click();
      } else {
        location.href = href;
      }
    };
  });
  document.querySelectorAll(".file a").forEach((each) => {
    each.onclick = (event) => {
      if (event.which === 1) {
        event.preventDefault();
      }
    };
  });
};

const renderSearchResult = async function (results) {
  for (const { season, title } of results) {
    if (season === "Sukebei") {
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
    document.querySelector("#list").appendChild(div1);
  }
  document.querySelectorAll(".folder").forEach((each) => {
    each.onmouseup = function (event) {
      if (event.which !== 1) {
        return;
      }
      history.pushState(null, null, this.querySelector("a").pathname);
      render();
    };
  });
  document.querySelectorAll(".folder a").forEach((each) => {
    each.onclick = (event) => {
      if (event.which === 1) {
        event.preventDefault();
      }
    };
  });
};

render();

window.onpopstate = render;

let typing = null;
document.querySelector("#search").oninput = (e) => {
  clearTimeout(typing);
  if (!e.target.value) {
    history.pushState(null, null, "/");
    render();
    return;
  }
  history.replaceState(
    null,
    null,
    `/search/${encodeURIComponent(e.target.value)}/`
  );
  typing = setTimeout(render, 200);
};

document.querySelector("#search").onfocus = (e) => {
  if (e.target.value) {
    history.pushState(
      null,
      null,
      `/search/${encodeURIComponent(e.target.value)}/`
    );
    render();
  }
};

(async () => {
  await navigator.serviceWorker.register("/serviceworker.js");
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        document
          .querySelector("meta[name=webpush-public-key]")
          .getAttribute("content")
      ),
    });
  }
  fetch("/subscribe/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });
})();
