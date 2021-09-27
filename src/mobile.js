import React from "react";
import ReactDOM from "react-dom";
import App from "./App.jsx";
import { Ø, ØØ, formatDateTime, getDateTimeOpacity } from "./lib.js";

ReactDOM.render(React.createElement(App), document.getElementById("root"));

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
      div4.innerText = formatDateTime(modified);
      div2.append(div3, div4);
      div0.append(div1, div2);
      return div0;
    })
  );
};

let lazyLoadHandleList = [];

export const render = async (scrollTo) => {
  Ø(".player video").src = "";
  Ø(".player").classList.add("hidden");
  Ø(".list").style.removeProperty("width");
  Ø(".bar").style.removeProperty("width");
  Ø(".list").style.removeProperty("top");
  Ø(".bar").style.removeProperty("top");
  Ø(".list").classList.remove("thin");
  Ø(".bar").classList.remove("thin");

  for (const handle of lazyLoadHandleList) {
    clearTimeout(handle);
  }
  const [season, title] = location.pathname
    .split("/")
    .filter((e) => e)
    .map((e) => decodeURIComponent(e));

  document.title = title || (season !== "search" ? season : "") || "カリ(仮)";

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
    Ø(".list").style.removeProperty("top");
    Ø(".bar").style.removeProperty("top");
    Ø(".list").classList.add("thin");
    Ø(".bar").classList.add("thin");
  } else {
    Ø(".player").style.width = "100%";
    Ø(".player").style.height = `${window.innerWidth / videoAspectRatio}px`;
    Ø(".player video").style.height = "100%";
    Ø(".player").style.left = 0;
    Ø(".list").style.removeProperty("width");
    Ø(".bar").style.removeProperty("width");
    Ø(".list").style.top = `${Math.ceil(Ø(".player").style.height.replace("px", ""))}px`;
    Ø(".bar").style.top = `${Math.ceil(Ø(".player").style.height.replace("px", ""))}px`;
    Ø(".list").classList.remove("thin");
    Ø(".bar").classList.remove("thin");
  }
  const prevWidth = playerSize.width;
  playerSize = Ø(".player").getBoundingClientRect();
  if (playerSize.width !== prevWidth) {
    Ø(".item.highlight")?.scrollIntoView();
    if (Ø(".list").scrollTop + 4.2 * 16 < Ø(".list").scrollHeight - Ø(".list").clientHeight) {
      Ø(".list").scrollBy(0, -4.2 * 16);
    }
  }
};
window.addEventListener("resize", resize);

Ø(".player video").addEventListener("loadedmetadata", () => {
  Ø(".progress").classList.add("hidden");
  resize();
});

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
    startTouchAtLeftEdge = startTouchX < 30 && startTouchY > (playerSize.height || 0) + 65;
    startTouchOnMenu = startTouchX < 250 && !Ø(".overlay").classList.contains("hidden");
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
    if (
      startTouchX >= playerSize.x &&
      startTouchX <= playerSize.x + playerSize.width &&
      startTouchY >= playerSize.y &&
      startTouchY <= playerSize.y + playerSize.height
    )
      return;
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
  } else {
    // reset everything
  }
  activatedGesture = "";
});

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
