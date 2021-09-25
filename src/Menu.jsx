import React, { useContext, useEffect, useState } from "react";
import { Ø, ØØ, urlBase64ToUint8Array } from "./lib";
import { render } from "./mobile";
import { AppContext } from "./App";

export const openMenu = async () => {
  Ø(".menu").classList.remove("dragging");
  Ø(".menu").classList.remove("hidden");
  Ø(".overlay").classList.remove("dragging");
  Ø(".overlay").classList.remove("hidden");
  await new Promise((resolve) => setTimeout(resolve, 300));
};

export const closeMenu = async () => {
  Ø(".menu").classList.add("hidden");
  Ø(".list").classList.remove("blur");
  Ø(".bar").classList.remove("blur");
  Ø(".overlay").classList.add("hide");
  await new Promise((resolve) => setTimeout(resolve, 300));
  Ø(".overlay").classList.remove("hide");
  Ø(".overlay").classList.add("hidden");
};

if (document.body.requestFullscreen) {
  document.addEventListener("fullscreenchange", (event) => {
    if (document.fullscreenElement) {
      Ø(".fullscreen input").checked = true;
    } else {
      Ø(".fullscreen input").checked = false;
    }
  });
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  Ø(".install").classList.remove("hidden");
  Ø(".install").onclick = () => e.prompt();
});

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

export default (props) => {
  const [state, dispatch] = useContext(AppContext);
  const [selectedPlayer, setSelectedPlayer] = useState(
    localStorage.getItem("player") || supportedPlayers[0][0]
  );

  useEffect(() => {
    if (state.showNSFW) {
      localStorage.setItem("nsfw", "nsfw");
    } else {
      localStorage.removeItem("nsfw");
    }
  }, [state.showNSFW]);

  useEffect(() => {
    if (selectedPlayer) {
      localStorage.setItem("player", selectedPlayer);
    } else {
      localStorage.removeItem("player");
    }
  }, [selectedPlayer]);

  return (
    <div className="menu dragging hidden">
      <div className="logo">
        <div className="nsfw"></div>
        <div className="sfw"></div>
      </div>
      <div className="item home" onClick={() => (location.href = "/")}>
        🏠 主頁面
      </div>
      <div className="category">偏好設定</div>
      <label className="item notification switch hidden">
        <input
          type="checkbox"
          onChange={async (e) => {
            e.target.disabled = true;
            if (e.target.checked) {
              e.target.checked = await subscribe();
            } else {
              e.target.checked = !(await unsubscribe());
            }
            e.target.disabled = false;
          }}
        />
        <div className="label">🔔 推送通知</div>
        <div className="slider"></div>
      </label>
      <label className="item sukebei switch">
        <input
          type="checkbox"
          checked={state.showNSFW}
          onChange={async () => {
            dispatch({ type: "toggle_nsfw" });
            await render();
          }}
        />
        <div className="label">🔞 顯示裏番</div>
        <div className="slider"></div>
      </label>
      {document.body.requestFullscreen && (
        <label className="item fullscreen switch">
          <input
            type="checkbox"
            checked={document.fullscreenElement}
            onChange={async () => {
              if (!document.fullscreenElement) {
                await document.body.requestFullscreen();
              } else {
                document.exitFullscreen();
              }
            }}
          />
          <div className="label">👀 全螢幕</div>
          <div className="slider"></div>
        </label>
      )}
      <div className="item defaultPlayer">
        <div>📽️ 影片播放器</div>
        <select
          value={selectedPlayer}
          onChange={(e) => {
            setSelectedPlayer(e.target.value);
          }}
        >
          {supportedPlayers.map((supportedPlayer) => (
            <option key={supportedPlayer[0]} value={supportedPlayer[0]}>
              {supportedPlayer[1]}
            </option>
          ))}
        </select>
      </div>
      <div
        className="item history"
        onClick={(e) => {
          if (confirm("你確定要刪除所有播放紀錄嗎？")) {
            for (const key in localStorage) {
              if (key.startsWith("/")) {
                localStorage.removeItem(key);
              }
            }
            e.target.innerText = `🗑️ 清除播放紀錄 (${
              Object.entries(localStorage).filter((e) => e[0].startsWith("/")).length
            } 個)`;
            ØØ(".watched").forEach((each) => {
              each.classList.remove("watched");
            });
          }
        }}
      >{`🗑️ 清除播放紀錄 (${
        Object.entries(localStorage).filter((e) => e[0].startsWith("/")).length
      } 個)`}</div>
      <div className="item toDesktop" onClick={() => (location.href = "/?view=desktop")}>
        💻 切換至桌面版網頁
      </div>
      <div className="item install hidden">📲 安裝應用程式</div>
      <div className="category">相關資訊</div>
      <div
        className="item msg"
        onClick={async () => {
          ØØ(".list .item").forEach((e) => (e.onclick = null));
          Ø(".list").innerHTML = "";
          closeMenu();
          history.pushState(null, null, "/msg/");
          await render();
        }}
      >
        📢 系統資訊
      </div>
      <div
        className="item fullList"
        onClick={async () => {
          ØØ(".list .item").forEach((e) => (e.onclick = null));
          Ø(".list").innerHTML = "";
          closeMenu();
          history.pushState(null, null, "/list/");
          await render();
        }}
      >
        📄 完整動畫列表
      </div>
      <div
        className="item telegram"
        onClick={() => window.open(Ø("meta[name=telegram-url]").getAttribute("content"), "_blank")}
      >
        💬 Telegram 群組
      </div>
      <div
        className="item donate"
        onClick={() => window.open(Ø("meta[name=donate-url]").getAttribute("content"), "_blank")}
      >
        💖 PayMe 捐助
      </div>
      <div className="category">結月ゆかり</div>
      <div className="item logout" onClick={() => (location.href = "/logout")}>
        💨 登出
      </div>
    </div>
  );
};
