const android = /(Android)/g.test(navigator.userAgent);
// const iOS = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);

const updatePlayerSettingUI = function () {
  Array.from(document.querySelectorAll(".item"))
    .filter((each) => typeof each.dataset.app === "string")
    .forEach((item) => {
      if (
        item.dataset.app.indexOf(localStorage.getItem("player")) >= 0 ||
        (item.dataset.app === "" && !localStorage.getItem("player"))
      ) {
        item.querySelector("i").classList.add("fa-check");
      } else {
        item.querySelector("i").classList.remove("fa-check");
      }
    });
};

const changePlayer = function () {
  if (this.dataset.app) {
    window.localStorage.setItem("player", this.dataset.app);
  } else {
    window.localStorage.removeItem("player");
  }
  updatePlayerSettingUI();
};

const formatFilesize = function (bytes) {
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

const toggleFileSizeDisplay = function () {
  if (navigator.connection && navigator.connection.type === "cellular") {
    document.querySelectorAll(".details_filesize").forEach((each) => {
      each.style.visibility = "visible";
    });
  } else {
    document.querySelectorAll(".details_filesize").forEach((each) => {
      each.style.visibility = "hidden";
    });
  }
};
if (navigator.connection) {
  navigator.connection.ontypechange = toggleFileSizeDisplay;
}

const getDateTimeOpacity = function (timestringUTC) {
  const lastModified = new Date(timestringUTC);
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

const formatDateTime = function (timestringUTC) {
  const lastModified = new Date(timestringUTC);
  const formatedDate = `${lastModified.getFullYear()}-${(
    lastModified.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}-${lastModified.getDate().toString().padStart(2, "0")}`;
  const seconds = Math.floor((new Date() - lastModified) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return formatedDate;
  }
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return formatedDate;
  }
  interval = Math.floor(seconds / 86400);
  if (interval >= 10) {
    return formatedDate;
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

const playfile = function (event) {
  if (event && event.which !== 1) {
    return;
  }
  const href = this.querySelector("a").getAttribute("href");
  this.classList.add("watched");
  localStorage.setItem(href, 1);

  if (
    android &&
    window.localStorage.getItem("player") &&
    href.slice(-4) === ".mp4"
  ) {
    const url = this.querySelector("a").href;
    const a = document.createElement("a");
    a.href = `intent:${url}#Intent;package=${window.localStorage.getItem(
      "player"
    )};S.browser_fallback_url=${url};end`;
    a.click();
  } else {
    window.location.href = href;
  }
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const navfolder = function (event) {
  if (event.which !== 1) {
    return;
  }
  document.querySelectorAll(".folder").forEach((each) => {
    each.onmouseup = null;
  });
  history.pushState(
    null,
    null,
    `${
      window.location.pathname +
      encodeURIComponent(this.querySelector("a").innerText)
    }/`
  );
  window.getListing();
};

window.getListing = async () => {
  window.animeID = 0;
  if (window.location.pathname.split("/").length <= 2) {
    document.title = "カリ(仮)";
  } else {
    document.title = decodeURIComponent(
      window.location.pathname.split("/")[
        window.location.pathname.split("/").length - 2
      ]
    );
  }

  const slowload = setTimeout(() => {
    document.querySelectorAll("#list .item").forEach((each) => {
      each.remove();
    });
    document.querySelectorAll("#list .folder").forEach((each) => {
      each.remove();
    });
    document.querySelectorAll("#list .file").forEach((each) => {
      each.remove();
    });
    if (document.querySelector("#search").value.length === 0) {
      document.querySelector("#list .search").style.display = "none";
    }
    const div3 = document.createElement("div");
    div3.className = "folder";
    div3.appendChild(document.createTextNode("Loading..."));
    document.querySelector("#list").appendChild(div3);
  }, 300);
  if (window.location.pathname.indexOf("/search/") === 0) {
    clearTimeout(slowload);
    document.querySelector("#search").value = decodeURIComponent(
      window.location.pathname.split("/")[2]
    );
    window.search();
    document.querySelector("#list .search").style.display = "inherit";
  } else {
    const dirEntries = await fetch(
      `/ls?path=${encodeURIComponent(window.location.pathname)}`
    ).then((res) => res.json());

    clearTimeout(slowload);
    document.querySelectorAll("#list .item").forEach((each) => {
      each.remove();
    });
    document.querySelectorAll("#list .folder").forEach((each) => {
      each.remove();
    });
    document.querySelectorAll("#list .file").forEach((each) => {
      each.remove();
    });
    if (document.querySelector("#search").value.length === 0) {
      document.querySelector("#list .search").style.display = "none";
    }
    if (window.location.pathname === "/") {
      dirEntries.reverse();
      document.querySelector("#list .search").style.display = "inherit";
    } else {
      if (document.querySelector("#search").value.length === 0) {
        const div4 = document.createElement("div");
        div4.className = "folder";
        div4.id = "back";
        const a2 = document.createElement("a");
        a2.href = `${window.location.pathname.slice(
          0,
          window.location.pathname
            .slice(0, window.location.pathname.lastIndexOf("/"))
            .lastIndexOf("/")
        )}/`;
        const i3 = document.createElement("i");
        i3.className = "fa fa-level-up";
        i3.style =
          "transform: scale(-1.3, 1); transform-origin:-30% 50%;-webkit-transform: scale(-1.3, 1); -webkit-transform-origin:-50% 50%";
        a2.appendChild(i3);
        a2.appendChild(document.createTextNode(".."));
        div4.appendChild(a2);
        div4.appendChild(document.createElement("br"));
        const div5 = document.createElement("div");
        div5.className = "details";
        div5.innerText = decodeURIComponent(
          window.location.pathname.split("/").slice(-2, -1)
        );
        div4.appendChild(div5);
        document.querySelector("#list").appendChild(div4);
      }
      dirEntries.sort();
    }

    if (
      window.location.pathname === "/2019-10/" ||
      window.location.pathname === "/2020-01/" ||
      window.location.pathname === "/2020-04/"
    ) {
      dirEntries.sort((a, b) =>
        b.modified > a.modified ? 1 : b.modified < a.modified ? -1 : 0
      );
    } else if (window.location.pathname === "/") {
      dirEntries.sort((a, b) =>
        b.name > a.name ? 1 : b.name < a.name ? -1 : 0
      );
    } else {
      dirEntries.sort((a, b) =>
        a.name > b.name ? 1 : a.name < b.name ? -1 : 0
      );
    }
    if (window.location.pathname === "/") {
      const div6 = document.createElement("div");
      div6.className = "file";
      const a3 = document.createElement("a");
      a3.href = "/list.txt";
      const i4 = document.createElement("i");
      i4.className = "fa fa-file-text";
      a3.appendChild(i4);
      a3.appendChild(document.createTextNode("動畫列表"));
      div6.appendChild(a3);
      div6.appendChild(document.createElement("br"));
      document.querySelector("#list").appendChild(div6);
    }
    dirEntries.forEach((entry) => {
      const div7 = document.createElement("div");
      const a4 = document.createElement("a");
      const i5 = document.createElement("i");
      const div8 = document.createElement("div");
      div8.className = "details_modified";
      div8.dataset.modified = entry.modified;
      div8.style.opacity = getDateTimeOpacity(entry.modified);
      div8.innerText = formatDateTime(entry.modified);
      if (entry.name.slice(-4) === ".mp4") {
        let watched = "";
        if (
          localStorage.getItem(
            `/${entry.anime_id}/${encodeURIComponent(entry.name)}`
          )
        ) {
          watched = "watched";
        }
        div7.className = `file ${watched}`;
        a4.href = `/${entry.anime_id}/${encodeURIComponent(entry.name)}`;
        a4.dataset.thumb = `/${entry.anime_id}/${encodeURIComponent(
          entry.thumb
        )}`;
        i5.className = "fa fa-toggle-right";
        a4.appendChild(i5);
        a4.appendChild(document.createTextNode(entry.name.slice(0, -4)));
        div7.appendChild(a4);
        div7.appendChild(document.createElement("br"));
        div7.appendChild(div8);
        const div9 = document.createElement("div");
        div9.className = "details_filesize";
        div9.innerText = formatFilesize(entry.size);
        div7.appendChild(div9);
      } else if (entry.name.slice(-4) === ".txt") {
        div7.className = "file";
        a4.href = encodeURIComponent(entry.name);
        i5.className = "fa fa-file-text";
        a4.appendChild(i5);
        a4.appendChild(document.createTextNode(entry.name.slice(0, -4)));
        div7.appendChild(a4);
        div7.appendChild(document.createElement("br"));
        div7.appendChild(div8);
        const div9 = document.createElement("div");
        div9.className = "details_filesize";
        div9.innerText = formatFilesize(entry.size);
        div7.appendChild(div9);
      } else {
        div7.className = "folder";
        a4.href = `${encodeURIComponent(entry.name)}/`;
        a4.dataset.anime_id = entry.anime_id;
        i5.className = "fa fa-folder";
        a4.appendChild(i5);
        a4.appendChild(document.createTextNode(entry.name));
        div7.appendChild(a4);
        div7.appendChild(document.createElement("br"));
        div7.appendChild(div8);
      }
      document.querySelector("#list").appendChild(div7);
    });

    if (window.location.pathname === "/") {
      if (android) {
        const div10 = document.createElement("div");
        div10.className = "item";
        div10.dataset.app = "";
        div10.onclick = changePlayer;
        const i6 = document.createElement("i");
        i6.className = "fa";
        div10.appendChild(i6);
        div10.appendChild(document.createTextNode("使用預設播放器"));
        document.querySelector("#list").appendChild(div10);

        const div11 = document.createElement("div");
        div11.className = "item";
        div11.dataset.app = "com.mxtech.videoplayer.ad";
        div11.onclick = changePlayer;
        const i7 = document.createElement("i");
        i7.className = "fa";
        div11.appendChild(i7);
        div11.appendChild(document.createTextNode("使用 MXPlayer"));
        document.querySelector("#list").appendChild(div11);

        const div12 = document.createElement("div");
        div12.className = "item";
        div12.dataset.app = "com.mxtech.videoplayer.pro";
        div12.onclick = changePlayer;
        const i8 = document.createElement("i");
        i8.className = "fa";
        div12.appendChild(i8);
        div12.appendChild(document.createTextNode("使用 MXPlayer Pro"));
        document.querySelector("#list").appendChild(div12);
        updatePlayerSettingUI();
      }

      const div13 = document.createElement("div");
      div13.className = "item";
      div13.onclick = (event) => {
        event.preventDefault();
        window.location.href = "/logout";
      };
      const i9 = document.createElement("i");
      i9.className = "fa fa-sign-out";
      div13.appendChild(i9);
      div13.appendChild(document.createTextNode("登出"));
      document.querySelector("#list").appendChild(div13);
    }
    toggleFileSizeDisplay();

    document.querySelectorAll(".folder").forEach((each) => {
      each.onmouseup = navfolder;
    });
    document.querySelectorAll(".folder a").forEach((each) => {
      each.onclick = (event) => {
        if (event.which === 1) {
          event.preventDefault();
        }
      };
    });
    document.querySelectorAll(".file").forEach((each) => {
      each.onmouseup = playfile;
    });
    document.querySelectorAll(".file a").forEach((each) => {
      each.onclick = (event) => {
        if (event.which === 1) {
          event.preventDefault();
        }
      };
    });
  }
};

const navSearchFolder = function (event) {
  if (event.which !== 1) {
    return;
  }
  document.querySelectorAll(".folder").forEach((each) => {
    each.onmouseup = null;
  });
  history.pushState(
    null,
    null,
    this.querySelector("a").href.replace(window.location.origin, "")
  );
  window.getListing();
};

window.search = async function () {
  const keyword = document.querySelector("#search").value;
  if (keyword.length > 0) {
    document.querySelectorAll(".folder").forEach((each) => {
      each.onmouseup = null;
    });
    document.querySelectorAll("#list .item").forEach((each) => {
      each.remove();
    });
    document.querySelectorAll("#list .folder").forEach((each) => {
      each.remove();
    });
    document.querySelectorAll("#list .file").forEach((each) => {
      each.remove();
    });

    const anime_list = await fetch(`/search?q=${keyword}`).then((res) =>
      res.json()
    );
    anime_list.forEach((entry) => {
      if (entry.season !== "Sukebei") {
        const div1 = document.createElement("div");
        div1.className = "folder";
        const a1 = document.createElement("a");
        a1.href = `/${entry.season}/${encodeURIComponent(entry.title)}/`;
        const i1 = document.createElement("i");
        i1.className = "fa fa-folder";
        a1.appendChild(i1);
        a1.appendChild(document.createTextNode(entry.title));
        div1.appendChild(a1);
        div1.appendChild(document.createElement("br"));
        const div2 = document.createElement("div");
        div2.className = "details";
        div2.innerText = entry.season;
        div1.appendChild(div2);
        document.querySelector("#list").appendChild(div1);
      }
    });
    document.querySelectorAll(".folder").forEach((each) => {
      each.onmouseup = navSearchFolder;
    });
    document.querySelectorAll(".folder a").forEach((each) => {
      each.onclick = (event) => {
        if (event.which === 1) {
          event.preventDefault();
        }
      };
    });
  }
};

window.getListing();

const prepareSearch = function () {
  if (document.querySelector("#search").value.length > 0) {
    window.search();
    history.replaceState(
      null,
      null,
      `/search/${encodeURIComponent(document.querySelector("#search").value)}/`
    );
  } else {
    history.replaceState(null, null, "/");
    window.getListing();
  }
};

window.onpopstate = function (event) {
  if (document.querySelector("#search").value.length > 0) {
    prepareSearch();
  } else {
    window.getListing();
  }
};

let typing = null;
document.querySelector("#search").oninput = () => {
  clearTimeout(typing);
  if (document.querySelector("#search").value.length > 0) {
    typing = setTimeout(prepareSearch, 500);
  } else {
    history.replaceState(null, null, "/");
    window.getListing();
  }
};

document.querySelector("#search").onclick = () => {
  clearTimeout(typing);
  if (document.querySelector("#search").value.length > 0) {
    typing = setTimeout(prepareSearch, 30);
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
