import React from "react";

export default (props) => {
  return (
    <div className="menu dragging hidden">
      <div className="logo">
        <div className="nsfw"></div>
        <div className="sfw"></div>
      </div>
      <div className="item home">🏠 主頁面</div>
      <div className="category">偏好設定</div>
      <label className="item notification switch hidden">
        <input type="checkbox" />
        <div className="label">🔔 推送通知</div>
        <div className="slider"></div>
      </label>
      <label className="item sukebei switch">
        <input type="checkbox" />
        <div className="label">🔞 顯示裏番</div>
        <div className="slider"></div>
      </label>
      <label className="item fullscreen switch hidden">
        <input type="checkbox" />
        <div className="label">👀 全螢幕</div>
        <div className="slider"></div>
      </label>
      <div className="item defaultPlayer">
        <div>📽️ 影片播放器</div>
        <select></select>
      </div>
      <div className="item history"></div>
      <div className="item toDesktop">💻 切換至桌面版網頁</div>
      <div className="item install hidden">📲 安裝應用程式</div>
      <div className="category">相關資訊</div>
      <div className="item msg">📢 系統資訊</div>
      <div className="item fullList">📄 完整動畫列表</div>
      <div className="item telegram">💬 Telegram 群組</div>
      <div className="item donate">💖 PayMe 捐助</div>
      <div className="category">結月ゆかり</div>
      <div className="item logout">💨 登出</div>
    </div>
  );
};
