window.vjs = null;
var player = null;
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let mediaSource = null;
let compressor = null;
let supportAVIF = false;

const avifImg = new Image();
avifImg.onload = function () {
  supportAVIF = Boolean(avifImg.width > 0 && avifImg.height > 0);
};
avifImg.src =
  "data:image/avif;base64,AAAAHGZ0eXBtaWYxAAAAAG1pZjFhdmlmbWlhZgAAAPJtZXRhAAAAAAAAACtoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAZ28tYXZpZiB2MAAAAAAOcGl0bQAAAAAAAQAAAB5pbG9jAAAAAARAAAEAAQAAAAABFgABAAAAFgAAAChpaW5mAAAAAAABAAAAGmluZmUCAAAAAAEAAGF2MDFJbWFnZQAAAABnaXBycAAAAEhpcGNvAAAAFGlzcGUAAAAAAAAAAQAAAAEAAAAQcGFzcAAAAAEAAAABAAAADGF2MUOBAAwAAAAAEHBpeGkAAAAAAwgICAAAABdpcG1hAAAAAAAAAAEAAQQBAoOEAAAAHm1kYXQSAAoFGAAOwCAyCxAAAAAHx1IMokpg";

const center = (element) => {
  element.style.position = "absolute";
  element.style.top = `${(window.innerHeight - element.clientHeight) / 2 + window.scrollY}px`;
  element.style.left = `${(window.innerWidth - element.clientWidth) / 2 + window.scrollX}px`;
};

const toggleFullScreen = (element) => {
  const fullscreenElement =
    document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;

  if (fullscreenElement) {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  } else if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
};

const captureScreen = () => {
  if (player.readyState >= 4) {
    window.vjs.userActive(true);
    let canvas = document.createElement("canvas");
    canvas.setAttribute("crossorigin", "anonymous");
    canvas.width = player.videoWidth;
    canvas.height = player.videoHeight;
    canvas.getContext("2d").scale(1.00001, 1.00001);
    canvas.getContext("2d").drawImage(player, 0, 0, canvas.width, canvas.height);

    const download = document.getElementById("download_captured");
    const filename = decodeURI(
      window.vjs
        .src()
        .replace(/^.*[\\/]/, "")
        .replace(".mp4", "")
    );
    download.download = `${filename}_${player.currentTime}.jpg`;
    download.target = "_blank";
    const image = canvas.toDataURL("image/jpeg", 0.92);
    download.href = image;
    if (!/^((?!chrome).)*safari/i.test(navigator.userAgent)) {
      download.click();
    }
    canvas = null;
  }
};

const help = () => {
  center(document.querySelector("#messagebox"));
  center(document.querySelector("#blind"));
  document.querySelector("#blind").style.visibility = "visible";
  document.querySelector("#blind").style.opacity = 0.5;
  document.querySelector("#messagebox").style.visibility = "visible";
  document.querySelector("#messagebox").style.opacity = 0.9;
  document.querySelector("#blind").onclick = function () {
    document.querySelector("#messagebox").style.visibility = "hidden";
    document.querySelector("#messagebox").style.opacity = 0;
    document.querySelector("#blind").style.visibility = "hidden";
    document.querySelector("#blind").style.opacity = 0;
    document.querySelector("#blind").onclick = null;
  };
};

const playmodeChange = () => {
  if (window.playmode === "Default") {
    window.playmode = "Auto";
  } else if (window.playmode === "Auto") {
    window.playmode = "Loop";
  } else if (window.playmode === "Loop") {
    window.playmode = "Default";
  }
  document.querySelector(".vjs-playmode-control").dataset.content = window.playmode;
};

let hidingOSD = null;
const hideOSD = function () {
  document.querySelector("#osd").style.visibility = "hidden";
  document.querySelector("#osd").style.opacity = 0;
};
const showOSD = function (icon, msg, timeout = 1000) {
  clearTimeout(hidingOSD);
  document.querySelector("#osd i").className = "";
  if (icon) {
    document.querySelector("#osd i").className = `fa ${icon}`;
  }
  document.querySelector("#osd span").innerText = ` ${msg}`;
  document.querySelector("#osd").style.visibility = "visible";
  document.querySelector("#osd").style.opacity = 1;
  hidingOSD = setTimeout(hideOSD, timeout);
};

const playpause = () => {
  if (window.vjs.paused()) {
    window.vjs.play();
    showOSD("fa-play", "Play");
  } else {
    window.vjs.pause();
    showOSD("fa-pause", "Paused");
  }
};

const stepForward = () => {
  window.vjs.pause();
  window.vjs.play();
  setTimeout(() => {
    window.vjs.pause();
  }, 41.7);
  showOSD("fa-step-forward", "1 Frame");
};

const stepBackward = () => {
  window.vjs.pause();
  window.vjs.currentTime(
    window.vjs.currentTime() - 0.0417 > 0 ? window.vjs.currentTime() - 0.0417 : 0
  );
  showOSD("fa-step-backward", "1 Frame");
};

const fastForward = (seek) => {
  window.vjs.currentTime(
    window.vjs.duration() - window.vjs.currentTime() < seek
      ? window.vjs.duration()
      : window.vjs.currentTime() + seek
  );
  showOSD("fa-forward", `00:${seek.toString().padStart(2, "0")}`);
};

const fastBackward = (seek) => {
  window.vjs.currentTime(window.vjs.currentTime() < seek ? 0 : window.vjs.currentTime() - seek);
  showOSD("fa-backward", `00:${seek.toString().padStart(2, "0")}`);
};

const toggleVolumeCompress = () => {
  const { active } = document.querySelector(".vjs-compressVolume-control").dataset;
  if (active === "false") {
    showOSD("fa-assistive-listening-systems", "Easy Listening On", 3000);
    document.querySelector(".vjs-compressVolume-control").dataset.active = true;
    document.querySelector(".vjs-compressVolume-control").dataset.content = "\uf2a4";
    if (audioCtx) {
      mediaSource.disconnect(audioCtx.destination);
      mediaSource.connect(compressor);
      compressor.connect(audioCtx.destination);
    }
  } else {
    showOSD("fa-deaf", "Easy Listening Off", 3000);
    document.querySelector(".vjs-compressVolume-control").dataset.active = false;
    document.querySelector(".vjs-compressVolume-control").dataset.content = "\uf2a2";
    if (audioCtx) {
      mediaSource.disconnect(compressor);
      compressor.disconnect(audioCtx.destination);
      mediaSource.connect(audioCtx.destination);
    }
  }
};

const fullscreenChange = (e) => {
  const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
  if (fullscreenElement) {
    document.querySelector(".vjs-fullScreen-control").dataset.content = "\uf066";
  } else {
    document.querySelector(".vjs-fullScreen-control").dataset.content = "\uf065";
  }
};

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

let hidingMenu = null;
let hidingInfoBtn = null;
const showInfo = function () {
  document.querySelector("#info").style.visibility = "visible";
  document.querySelector("#info").style.opacity = 1;
};
const hideList = function () {
  document.querySelector("#list").style.visibility = "hidden";
  document.querySelector("#list").style.opacity = 0;
  document.querySelector("#info").style.visibility = "hidden";
  document.querySelector("#info").style.opacity = 0;
};
const showMenu = function () {
  document.querySelector("#menu").style.visibility = "visible";
  document.querySelector("#menu").style.opacity = 1;
};
const hideMenu = function () {
  document.querySelector("#menu").style.visibility = "hidden";
  document.querySelector("#menu").style.opacity = 0;
};
const showInfoBtn = function () {
  document.querySelector("#infoBtn").style.visibility = "visible";
  document.querySelector("#infoBtn").style.opacity = 1;
};
const hideInfoBtn = function () {
  document.querySelector("#infoBtn").style.visibility = "hidden";
  document.querySelector("#infoBtn").style.opacity = 0;
};
const showList = function () {
  hideMenu();
  document.querySelector("#list").style.visibility = "visible";
  document.querySelector("#list").style.opacity = 1;
  if (document.querySelector("#info").innerText !== "") {
    document.querySelector("#info").style.visibility = "visible";
    document.querySelector("#info").style.opacity = 1;
  }
};
const checkCursor = function () {
  showMenu();
  showInfoBtn();
  clearTimeout(hidingMenu);
  clearTimeout(hidingInfoBtn);
  hidingMenu = setTimeout(hideMenu, 3000);
  hidingInfoBtn = setTimeout(hideInfoBtn, 3000);
};

if (
  false &&
  window.CSS &&
  CSS.supports &&
  (CSS.supports("backdrop-filter", "blur()") || CSS.supports("-webkit-backdrop-filter", "blur()"))
) {
  document.querySelector("#list").classList.add("glass");
  document.querySelector("#info").classList.add("glass");
}
if (window.matchMedia("(display-mode: standalone)").matches) {
  if (window.screen.width > 1366 && window.screen.height > 800) {
    window.resizeTo(
      window.outerWidth - window.innerWidth + 1280,
      window.outerHeight - window.innerHeight + 720
    );
  } else {
    window.resizeTo(
      window.outerWidth - window.innerWidth + 1024,
      window.outerHeight - window.innerHeight + 576
    );
  }
}
document.body.style.backgroundColor = "rgb(0, 0, 0)";
document.querySelector("#player").style.display = "block";
document.querySelector("#list").style.display = "block";

document.querySelector("#menu").onclick = showList;
document.querySelector("#infoBtn").onclick = showInfo;
showList();
document.querySelector("#player").onclick = hideList;
document.querySelector("#player").onmousemove = checkCursor;
document.body.onmouseleave = function () {
  clearTimeout(hidingMenu);
  clearTimeout(hidingInfoBtn);
  hidingMenu = setTimeout(hideMenu, 3000);
  hidingInfoBtn = setTimeout(hideInfoBtn, 3000);
};
document.body.onkeypress = function (event) {
  if (event.code === "Backquote") {
    document.querySelector("#menu").style.display =
      document.querySelector("#menu").style.display === "block" ? "none" : "block";
    document.querySelector("#infoBtn").style.display =
      document.querySelector("#infoBtn").style.display === "block" ? "none" : "block";
    document.querySelector(".vjs-control-bar").style.visibility =
      document.querySelector(".vjs-control-bar").style.visibility === "visible"
        ? "hidden"
        : "visible";
  }
};

window.playmode = "Default";

let prev_scrollTop = 0;

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
  if (navigator.connection.type === "cellular") {
    document.querySelectorAll(".details_filesize").forEach((each) => {
      each.style.visibility = "visible";
      each.style.opacity = 1;
    });
  } else {
    document.querySelectorAll(".details_filesize").forEach((each) => {
      each.style.visibility = "hidden";
      each.style.opacity = 0;
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
  const formatedDate = `${lastModified.getFullYear()}-${(lastModified.getMonth() + 1)
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

let ambient_need = false;
let ambient_left = null;
let ambient_right = null;
let ambient_top = null;
let ambient_bottom = null;
let ambient_center = null;
let ambient_middle = null;
const ambient = document.createElement("canvas");
ambient.id = "ambient";
let ambient_request = null;
let ambient_heartbeat = null;

const sampleScreen = function () {
  let sampleSize = 3;
  ambient_heartbeat = window.requestAnimationFrame(sampleScreen);
  if (window.innerWidth / window.innerHeight > player.videoWidth / player.videoHeight) {
    sampleSize = 3;
    ambient
      .getContext("2d")
      .drawImage(player, 3, 0, 3, player.videoHeight, 0, 0, ambient_left, ambient.height);
    ambient
      .getContext("2d")
      .drawImage(
        player,
        player.videoWidth - 6,
        0,
        3,
        player.videoHeight,
        ambient_left + ambient_center,
        0,
        ambient_right,
        ambient.height
      );
    ambient
      .getContext("2d")
      .drawImage(
        player,
        0,
        0,
        player.videoWidth,
        player.videoHeight,
        ambient_left,
        0,
        ambient_center,
        ambient.height
      );
  } else {
    sampleSize = 1;
    ambient
      .getContext("2d")
      .drawImage(
        player,
        0,
        sampleSize,
        player.videoWidth,
        sampleSize,
        0,
        0,
        ambient.width,
        ambient_top
      );
    ambient
      .getContext("2d")
      .drawImage(
        player,
        0,
        player.videoHeight - sampleSize,
        player.videoWidth,
        sampleSize,
        0,
        ambient_top + ambient_middle,
        ambient.width,
        ambient_bottom
      );
    ambient
      .getContext("2d")
      .drawImage(
        player,
        0,
        0,
        player.videoWidth,
        player.videoHeight,
        0,
        ambient_top,
        ambient.width,
        ambient_middle
      );
  }
};

const ambient_fill = function () {
  window.cancelAnimationFrame(ambient_heartbeat);
  if (
    ambient_need &&
    Math.abs(window.innerWidth / window.innerHeight - player.videoWidth / player.videoHeight) >
      0.001
  ) {
    ambient_heartbeat = window.requestAnimationFrame(sampleScreen);
    player.style.display = "none";
    // ambient.style.display = "block";
  } else {
    player.style.display = "block";
    // ambient.style.display = "none";
    ambient.getContext("2d").fillRect(0, 0, ambient.width, ambient.height);
  }
};

const ambient_resize = function () {
  ambient_left =
    (window.innerWidth - (player.videoWidth / player.videoHeight) * window.innerHeight) / 2;
  ambient_right =
    (window.innerWidth - (player.videoWidth / player.videoHeight) * window.innerHeight) / 2;
  ambient_top =
    (window.innerHeight - (player.videoHeight / player.videoWidth) * window.innerWidth) / 2;
  ambient_bottom =
    (window.innerHeight - (player.videoHeight / player.videoWidth) * window.innerWidth) / 2;
  ambient_center = window.innerWidth - ambient_left - ambient_right;
  ambient_middle = window.innerHeight - ambient_top - ambient_bottom;
  ambient.width = window.innerWidth;
  ambient.height = window.innerHeight;
};

const fillBorder = function () {
  ambient_need = !ambient_need;
  ambient_resize();
  ambient_fill();
};

const playfile = function (event, file = null) {
  if (event && event.button !== 0) {
    return;
  }
  const href =
    file === null
      ? this.querySelector("a").getAttribute("href")
      : file.querySelector("a").getAttribute("href");
  const url = file === null ? this.querySelector("a").href : file.querySelector("a").href;
  document.querySelectorAll(".file").forEach((each) => {
    each.classList.remove("highlight");
  });
  if (file === null) {
    this.classList.add("highlight");
    this.classList.add("watched");
  } else {
    file.classList.add("highlight");
    file.classList.add("watched");
  }
  localStorage.setItem(href, 1);

  if (href.slice(-4) === ".txt" || href.slice(-4) === ".ass" || href.slice(-5) === "/list") {
    window.open(href, "_blank");
  } else {
    if (document.querySelector("#vjs-tip")) {
      document.querySelector("#vjs-tip").remove();
    }
    if (document.querySelector(".vjs-thumbnail")) {
      document.querySelector(".vjs-thumbnail").remove();
    }
    if (!window.vjs) {
      document.querySelector("#player").style.backgroundImage = "url()";
      window.vjs = videojs(
        "player",
        {
          techOrder: ["html5"],
          playbackRates: [1, 1.15, 1.25, 1.5, 2, 3, 4, 5, 10],
          inactivityTimeout: 3000,
          children: {
            controlBar: {
              children: {
                volumeControl: true,
                muteToggle: true,
                liveDisplay: false,
              },
            },
          },
        },
        function () {
          player = document.getElementById("player_html5_api");
          player.setAttribute("crossorigin", "anonymous");
          player.crossOrigin = "anonymous";
          this.progressTips();
          this.controlBar.show();

          if (audioCtx) {
            audioCtx = AudioContext ? new AudioContext() : null;
            mediaSource = audioCtx.createMediaElementSource(player);

            compressor = audioCtx.createDynamicsCompressor();
            compressor.threshold.setValueAtTime(-50, audioCtx.currentTime);
            compressor.knee.setValueAtTime(40, audioCtx.currentTime);
            compressor.ratio.setValueAtTime(20, audioCtx.currentTime);
            compressor.reduction.value = -20;
            compressor.attack.setValueAtTime(0, audioCtx.currentTime);
            compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

            mediaSource.connect(audioCtx.destination);
          }
        }
      );

      document
        .getElementById("player")
        .insertBefore(ambient, document.getElementById("player").firstChild);
      document.querySelector("#ambient").onclick = hideList;

      window.vjs.on("loadedmetadata", () => {
        clearTimeout(ambient_request);
        if (ambient_need) {
          ambient_resize();
          ambient_fill();
        }
        window.vjs.play();
      });

      window.vjs.on("ended", () => {
        if (window.playmode === "Default") {
          // do nothing
        }
        if (window.playmode === "Auto") {
          if (document.querySelector(".file.highlight").nextSibling) {
            showOSD(
              "fa-toggle-right",
              document.querySelector(".file.highlight").nextSibling.querySelector("a").innerText,
              3000
            );
            playfile(null, document.querySelector(".file.highlight").nextSibling);
          } else {
            showOSD("", "This is the last file in folder", 3000);
          }
        }
        if (window.playmode === "Loop") {
          showOSD("fa-toggle-right", document.querySelector(".file.highlight a").innerText, 3000);
          playfile(null, document.querySelector(".file.highlight"));
        }
      });

      window.onresize = function () {
        center(document.querySelector("#messagebox"));
        clearTimeout(ambient_request);
        if (ambient_need) {
          ambient_request = setTimeout(() => {
            ambient_resize();
            ambient_fill();
          }, 50);
        }

        window.vjs.width(window.innerWidth);
        window.vjs.height(window.innerHeight);
      };
      window.vjs.width(window.innerWidth);
      window.vjs.height(window.innerHeight);

      const fullScreenBtn = window.vjs.controlBar.addChild("button", {
        text: "Full Screen",
      });
      fullScreenBtn.addClass("vjs-fullScreen-control");
      document.querySelector(".vjs-fullScreen-control").title = "FullScreen";
      document.querySelector(".vjs-fullScreen-control").style.float = "right";
      document.querySelector(".vjs-fullScreen-control").dataset.content = "\uf065";
      document.querySelector(".vjs-fullScreen-control").onclick = () => {
        toggleFullScreen(document.documentElement);
      };
      document
        .querySelector(".vjs-control-bar")
        .insertBefore(
          document.querySelector(".vjs-fullScreen-control"),
          document.querySelector(".vjs-play-control")
        );

      const prevBtn = window.vjs.controlBar.addChild("button", {
        text: "Prev",
      });
      prevBtn.addClass("vjs-prev-control");
      document.querySelector(".vjs-prev-control").title = "Prev File";
      document.querySelector(".vjs-prev-control").style.float = "left";
      document.querySelector(".vjs-prev-control").onclick = window.playPrev;

      const fastBackwardBtn = window.vjs.controlBar.addChild("button", {
        text: "Fast Backward",
      });
      fastBackwardBtn.addClass("vjs-fastBackward-control");
      document.querySelector(".vjs-fastBackward-control").title = "Fast Backward";
      document.querySelector(".vjs-fastBackward-control").style.float = "left";
      document.querySelector(".vjs-fastBackward-control").onclick = () => {
        fastBackward(30);
      };

      const fastForwardBtn = window.vjs.controlBar.addChild("button", {
        text: "Fast Forward",
      });
      fastForwardBtn.addClass("vjs-fastForward-control");
      document.querySelector(".vjs-fastForward-control").title = "Fast Forward";
      document.querySelector(".vjs-fastForward-control").style.float = "left";
      document.querySelector(".vjs-fastForward-control").onclick = () => {
        fastForward(30);
      };

      const nextBtn = window.vjs.controlBar.addChild("button", {
        text: "Next",
      });
      nextBtn.addClass("vjs-next-control");
      document.querySelector(".vjs-next-control").title = "Next File";
      document.querySelector(".vjs-next-control").style.float = "left";
      document.querySelector(".vjs-next-control").onclick = window.playNext;

      const stepBackwardBtn = window.vjs.controlBar.addChild("button", {
        text: "Step Backward",
      });
      stepBackwardBtn.addClass("vjs-stepBackward-control");
      document.querySelector(".vjs-stepBackward-control").title = "Step Backward";
      document.querySelector(".vjs-stepBackward-control").style.float = "left";
      document.querySelector(".vjs-stepBackward-control").onclick = stepBackward;

      const stepForwardBtn = window.vjs.controlBar.addChild("button", {
        text: "Step Forward",
      });
      stepForwardBtn.addClass("vjs-stepForward-control");
      document.querySelector(".vjs-stepForward-control").title = "Step Forward";
      document.querySelector(".vjs-stepForward-control").style.float = "left";
      document.querySelector(".vjs-stepForward-control").onclick = stepForward;

      const a5 = document.createElement("a");
      a5.id = "downloadLink";
      a5.href = "#";
      a5.download = "";
      a5.target = "_blank";
      const div14 = document.createElement("div");
      div14.className = "vjs-control vjs-download-control";
      div14.setAttribute("role", "button");
      div14.setAttribute("aria-live", "polite");
      div14.setAttribute("tabindex", "0");
      div14.setAttribute("title", "Download");
      div14.style.float = "right";
      const div15 = document.createElement("div");
      div15.className = "vjs-control-content";
      const span5 = document.createElement("span5");
      span5.className = "vjs-control-text";
      span5.innerText = "Need Text";
      div15.appendChild(span5);
      div14.appendChild(div15);
      a5.appendChild(div14);

      document
        .querySelector(".vjs-control-bar")
        .insertBefore(a5, document.querySelector(".vjs-stepForward-control").nextSibling);

      const volAssistBtn = window.vjs.controlBar.addChild("button", {
        text: "Volume Assist",
      });
      volAssistBtn.addClass("vjs-compressVolume-control");
      document.querySelector(".vjs-compressVolume-control").title = "Volume Assist";
      document.querySelector(".vjs-compressVolume-control").style.float = "right";
      document.querySelector(".vjs-compressVolume-control").dataset.content = "\uf2a2";
      document.querySelector(".vjs-compressVolume-control").dataset.active = "false";
      document.querySelector(".vjs-compressVolume-control").onclick = toggleVolumeCompress;

      const playModeBtn = window.vjs.controlBar.addChild("button", {
        text: "Play Mode",
      });
      playModeBtn.addClass("vjs-playmode-control");
      document.querySelector(".vjs-playmode-control").title = "Play Mode";
      document.querySelector(".vjs-playmode-control").style.float = "right";
      document.querySelector(".vjs-playmode-control").style.width = "60px";
      document.querySelector(".vjs-playmode-control").onclick = playmodeChange;
      document.querySelector(".vjs-playmode-control").dataset.content = window.playmode;

      const capscreenBtn = window.vjs.controlBar.addChild("button", {
        text: "Capture Screen",
      });
      capscreenBtn.addClass("vjs-capscreen-control");
      document.querySelector(".vjs-capscreen-control").title = "CapScreen";
      document.querySelector(".vjs-capscreen-control").style.float = "right";
      document.querySelector(".vjs-capscreen-control").onclick = captureScreen;

      const downloadcapscreenBtn = window.vjs.controlBar.addChild("button", {
        text: "Download Capture Screen",
      });
      downloadcapscreenBtn.addClass("vjs-downloadcapscreen-control");
      document.querySelector(".vjs-downloadcapscreen-control").style.float = "right";
      document.querySelector(".vjs-downloadcapscreen-control").style.width = "70px";
      document.querySelector(".vjs-downloadcapscreen-control").style.display = "none";
      document.querySelector(".vjs-downloadcapscreen-control").innerHTML =
        '<a id="download_captured"></a>';
      // }

      const helpBtn = window.vjs.controlBar.addChild("button", {
        text: "Help",
      });
      helpBtn.addClass("vjs-help-control");
      document.querySelector(".vjs-help-control").title = "Help";
      document.querySelector(".vjs-help-control").style.float = "right";
      document.querySelector(".vjs-help-control").onclick = help;

      const fillBtn = window.vjs.controlBar.addChild("button", {
        text: "Fill Border",
      });
      fillBtn.addClass("vjs-fill-control");
      document.querySelector(".vjs-fill-control").title = "Fill Border";
      document.querySelector(".vjs-fill-control").style.float = "right";
      document.querySelector(".vjs-fill-control").onclick = fillBorder;

      document.querySelector("#player_html5_api").ondblclick = playpause;
      document.querySelector("#ambient").ondblclick = playpause;
      document.querySelector("#player_html5_api").onmouseup = (evt) => {
        if (evt.button === 1) {
          toggleFullScreen(document.documentElement);
        }
      };
      document.querySelector("#ambient").onmouseup = (evt) => {
        if (evt.button === 1) {
          toggleFullScreen(document.documentElement);
        }
      };
      document.querySelector("#player").onmousemove = checkCursor;

      document.body.onkeyup = (e) => {
        if (e.target.id !== "search") {
          if (e.ctrlKey) {
            if (e.code === "ArrowLeft") {
              fastBackward(30);
            }
            if (e.code === "ArrowRight") {
              fastForward(30);
            }
          } else {
            if (e.code === "Space") {
              playpause();
            }
            if (e.code === "ArrowLeft") {
              fastBackward(5);
            }
            if (e.code === "ArrowRight") {
              fastForward(5);
            }
            if (e.code === "ArrowUp") {
              window.vjs.volume(window.vjs.volume() > 0.9 ? 1 : window.vjs.volume() + 0.1);
              showOSD("fa-volume-up", (window.vjs.volume() * 100).toFixed(0));
            }
            if (e.code === "ArrowDown") {
              window.vjs.volume(window.vjs.volume() < 0.1 ? 0 : window.vjs.volume() - 0.1);
              showOSD("fa-volume-up", (window.vjs.volume() * 100).toFixed(0));
            }
            if (e.code === "PageUp") {
              window.playPrev();
            }
            if (e.code === "PageDown") {
              window.playNext();
            }
            if (e.code === "Enter") {
              toggleFullScreen(document.documentElement);
            }
            if (e.code === "KeyM") {
              window.vjs.volume(window.vjs.volume() > 0 ? 0 : 1);
            }
            if (e.code === "KeyC") {
              captureScreen();
            }
            if (e.code === "KeyB") {
              fillBorder();
            }
          }
        }
      };
      document.body.onkeydown = (e) => {
        if (e.target.id !== "search") {
          if (["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"].includes(e.code)) {
            e.preventDefault();
          }
          if (e.code === "Space") {
            e.preventDefault();
          }
          if (e.code === "PageUp") {
            e.preventDefault();
          }
          if (e.code === "PageDown") {
            e.preventDefault();
          }
          if (e.code === "Enter") {
            e.preventDefault();
          }
        }
      };

      document.querySelector("#player").onwheel = function (e) {
        if (e.deltaY < 0) {
          window.vjs.volume(window.vjs.volume() > 0.9 ? 1 : window.vjs.volume() + 0.1);
          showOSD("fa-volume-up", (window.vjs.volume() * 100).toFixed(0));
        } else {
          window.vjs.volume(window.vjs.volume() < 0.1 ? 0 : window.vjs.volume() - 0.1);
          showOSD("fa-volume-up", (window.vjs.volume() * 100).toFixed(0));
        }
      };

      window.vjs.on("volumechange", () => {
        showOSD("fa-volume-up", (window.vjs.volume() * 100).toFixed(0));
      });
    }
    window.vjs.src(href);
    document.querySelector("#info").style.visibility = "hidden";
    document.querySelector("#info").style.opacity = 0;
    document.querySelector("#downloadLink").href = href;
    document.querySelector("#downloadLink").download = decodeURIComponent(href).split("/")[2];
    showOSD("fa-play", decodeURIComponent(href).split("/")[2], 3000);
    if (
      document.querySelector(".file.highlight a").dataset.avif ||
      document.querySelector(".file.highlight a").dataset.webp
    ) {
      const map = [];
      const size = 12;
      for (let i = 0; i < size * size; i++) {
        const row = Math.floor(i / size);
        const col = i % size;
        const x = col * 160;
        const y = row * 90;
        map[i] = `-${x}px -${y}px`;
      }
      const thumbDIV = document.createElement("div");
      thumbDIV.className = "vjs-thumbnail";
      if (supportAVIF && Boolean(document.querySelector(".file.highlight a").dataset.avif)) {
        thumbDIV.style.backgroundImage = `url("${
          document.querySelector(".file.highlight a").dataset.avif
        }")`;
      } else if (Boolean(document.querySelector(".file.highlight a").dataset.webp)) {
        thumbDIV.style.backgroundImage = `url("${
          document.querySelector(".file.highlight a").dataset.webp
        }")`;
      }
      setTimeout(() => {
        thumbDIV.style.display = "none";
      }, 0);
      thumbDIV.style.position = "absolute";
      thumbDIV.style.width = "160px";
      thumbDIV.style.height = "90px";
      thumbDIV.style.bottom = "6em";
      thumbDIV.style.boxShadow = "0 0 1em #000";
      window.vjs.controlBar.el().appendChild(thumbDIV);

      window.div = thumbDIV;

      const moveListener = function (e) {
        const clientRect = document.querySelector(".vjs-control-bar").getBoundingClientRect();
        const clientRectX = clientRect.x || 0;
        const progressRect = document
          .querySelector(".vjs-progress-control.vjs-control")
          .getBoundingClientRect();
        let left = e.pageX;
        const progressRectX = progressRect.x || 0;
        let i = Math.round(((left - progressRectX) / progressRect.width) * size * size);

        if (i < 0) {
          i = 0;
        }
        if (i > size * size - 1) {
          i = size * size - 1;
        }

        if (map[i] && thumbDIV.style.backgroundPosition !== map[i]) {
          thumbDIV.style.backgroundPosition = map[i];
        }
        const width = 160;
        left -= width / 2;

        if (left < clientRectX) {
          left = clientRectX;
        } else if (left > clientRectX + clientRect.width - width) {
          left = clientRectX + clientRect.width - width;
        }
        left -= clientRectX;
        thumbDIV.style.display = "block";
        thumbDIV.style.left = `${left}px`;
      };

      window.vjs.controlBar.progressControl.on("mousemove", moveListener);

      const moveCancel = function () {
        thumbDIV.style.display = "none";
      };

      document.querySelector(".vjs-control-bar").addEventListener("mouseout", moveCancel);
      window.vjs.on("userinactive", moveCancel);
    }
  }
};

window.playPrev = () => {
  if (document.querySelector(".file.highlight").previousSibling) {
    if (document.querySelector(".file.highlight").previousSibling.id === "back") {
      showOSD("", "This is the first file in folder", 3000);
    } else {
      playfile(null, document.querySelector(".file.highlight").previousSibling);
    }
  }
};

window.playNext = () => {
  if (document.querySelector(".file.highlight").nextSibling) {
    playfile(null, document.querySelector(".file.highlight").nextSibling);
  } else {
    showOSD("", "This is the last file in folder", 3000);
  }
};

document.onfullscreenchange = fullscreenChange;
document.onwebkitfullscreenchange = fullscreenChange;

center(document.querySelector("#messagebox"));
window.onresize = () => {
  center(document.querySelector("#messagebox"));
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

const getInfo = async function (dirEntries) {
  if (
    window.location.pathname.split("/").length === 4 &&
    window.location.pathname.split("/")[1] === "search"
  ) {
    document.querySelector("#info").innerHTML = "";
    document.querySelector("#info").style.visibility = "hidden";
    document.querySelector("#info").style.opacity = 0;
  } else if (window.location.pathname.split("/").length === 4) {
    // anime
    document.querySelector("#info").innerHTML = "";
    const season = window.location.pathname.split("/")[1];
    const title = window.location.pathname.split("/")[2];
    const data = await fetch(`/info?season=${season}&title=${encodeURIComponent(title)}`).then(
      (res) => res.json()
    );
    if (data.found) {
      displayInfo(data._source);
    }
    document.querySelector("#info").style.visibility = "visible";
    document.querySelector("#info").style.opacity = 1;
  } else if (window.location.pathname.split("/").length === 3) {
    // season
    document.querySelector("#info").innerHTML = "";
    const season = window.location.pathname.split("/")[1];
    const info = await fetch(`/info?season=${season}`).then((res) => res.json());
    if (info.length > 0) {
      displayRanking(info, dirEntries);
      document.querySelector("#info").style.visibility = "visible";
      document.querySelector("#info").style.opacity = 1;
    }
  } else if (window.location.pathname.split("/").length === 2) {
    const data = await fetch("/motd", {
      cache: "no-cache",
    }).then((res) => res.text());
    document.querySelector("#info").innerHTML = "";
    const messageDIV = document.createElement("div");
    let items = data.replace(/[\r]/g, "").split("\n\n");
    items.reverse();
    items = items.slice(0, 100);
    items.forEach((item) => {
      const entry = item.split("\n");
      const datetime = entry.shift();
      const title = entry.shift();
      let url = entry.shift();
      url = `/${url}/`;
      const div = document.createElement("div");
      const span = document.createElement("span");
      span.onmouseup = function (event) {
        if (event.button === 0) {
          document.querySelector("#info div span a").onmouseup = null;
          history.pushState(null, null, `${url + encodeURIComponent(title)}/`);
          window.getListing(0);
        }
      };
      const a = document.createElement("a");
      a.href = `${url + encodeURIComponent(title)}/`;
      a.innerText = title;
      span.appendChild(a);
      div.appendChild(span);
      div.appendChild(document.createElement("br"));
      const tmp = document.createElement("span");
      tmp.className = "small";
      const span2 = document.createElement("span");
      span2.onmouseup = function (event) {
        if (event.button === 0) {
          // document.querySelector("#info div span a").onmouseup = null;
          history.pushState(null, null, url);
          window.getListing(0);
        }
      };
      const aa = document.createElement("a");
      aa.href = url;
      aa.innerText = url.replace(/\//g, "");
      span2.appendChild(aa);
      tmp.appendChild(span2);
      tmp.appendChild(document.createTextNode(" - "));
      const span3 = document.createElement("span");
      span3.className = "details_modified";
      span3.dataset.modified = datetime;
      span3.style.opacity = getDateTimeOpacity(datetime);
      span3.innerText = formatDateTime(datetime);
      tmp.appendChild(span3);
      div.appendChild(tmp);
      div.appendChild(document.createElement("br"));
      const span4 = document.createElement("span");
      span4.className = "smallest";
      span4.innerHTML = entry.join("<br>");
      div.appendChild(span4);
      messageDIV.appendChild(div);
      messageDIV.appendChild(document.createElement("br"));
    });
    document.querySelector("#info").appendChild(messageDIV);

    document.querySelectorAll("#info div span a").forEach((each) => {
      each.onclick = (event) => {
        if (event.button === 0) {
          event.preventDefault();
        }
      };
    });
    document.querySelector("#info").style.visibility = "visible";
    document.querySelector("#info").style.opacity = 1;
  }
};

const navfolder = function (event) {
  if (event.button !== 0) {
    return;
  }
  document.querySelectorAll(".folder").forEach((each) => {
    each.onmouseup = null;
  });
  history.pushState(
    null,
    null,
    `${window.location.pathname + encodeURIComponent(this.querySelector("a").innerText)}/`
  );

  if (event.target.id === "back") {
    window.getListing(prev_scrollTop);
  } else {
    prev_scrollTop = document.querySelector("#list").scrollTop;
    window.getListing(0);
  }
};

window.getListing = async (scroll) => {
  window.animeID = 0;
  if (window.location.pathname.split("/").length <= 2) {
    document.title = "カリ(仮)";
  } else {
    document.title = decodeURIComponent(
      window.location.pathname.split("/")[window.location.pathname.split("/").length - 2]
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
    const i2 = document.createElement("i");
    i2.className = "fa fa-repeat fa-spin";
    i2.style = "display:inline;margin-left:-10px;margin-right:12px";
    div3.appendChild(i2);
    div3.appendChild(document.createTextNode("Loading..."));
    document.querySelector("#list").appendChild(div3);
    document.querySelector(".progress").style.visibility = "visible";
  }, 300);
  if (window.location.pathname.indexOf("/search/") === 0) {
    clearTimeout(slowload);
    document.querySelector(".progress").style.visibility = "hidden";
    document.querySelector("#search").value = decodeURIComponent(
      window.location.pathname.split("/")[2]
    );
    window.search();
  } else {
    let dirEntries =
      window.location.pathname === "/setting/"
        ? []
        : await fetch(`/ls?path=${encodeURIComponent(window.location.pathname)}`).then((res) =>
            res.json()
          );
    getInfo(dirEntries);
    clearTimeout(slowload);
    document.querySelector(".progress").style.visibility = "hidden";
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
      dirEntries = dirEntries.filter((e) => e.name !== "Latest");
      dirEntries.reverse();
      document.querySelector("#list .search").style.display = "";

      const div18 = document.createElement("div");
      div18.className = "item";
      div18.onclick = (event) => {
        event.preventDefault();
        history.pushState(null, null, "/setting/");
        window.getListing(0);
      };
      const i13 = document.createElement("i");
      i13.className = "fa fa-cogs";
      div18.appendChild(i13);
      div18.appendChild(document.createTextNode("設定"));
      document.querySelector("#list").appendChild(div18);
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
        div5.innerText = " ";
        div4.appendChild(div5);
        document.querySelector("#list").appendChild(div4);
      }
      dirEntries.sort();
    }

    if (window.location.pathname === "/setting/") {
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

      const div17 = document.createElement("div");
      div17.className = "item";
      div17.onclick = (event) => {
        event.preventDefault();
        location.href = `/?view=mobile`;
      };
      const i12 = document.createElement("i");
      i12.className = "fa fa-mobile";
      i12.style.textIndent = "-7px";
      div17.appendChild(i12);
      div17.appendChild(document.createTextNode("切換至手機版網頁"));
      document.querySelector("#list").appendChild(div17);

      const div16 = document.createElement("div");
      div16.className = "item";
      div16.onclick = (event) => {
        event.preventDefault();
        if (confirm("你確定要刪除所有播放紀錄嗎？")) {
          for (const key in localStorage) {
            if (key.startsWith("/")) {
              localStorage.removeItem(key);
            }
          }
          event.target.childNodes[1].textContent = `清除播放紀錄 (${
            Object.entries(localStorage).filter((e) => e[0].startsWith("/")).length
          } 個)`;
        }
      };
      const i11 = document.createElement("i");
      i11.className = "fa fa-trash";
      div16.appendChild(i11);
      div16.appendChild(
        document.createTextNode(
          `清除播放紀錄 (${
            Object.entries(localStorage).filter((e) => e[0].startsWith("/")).length
          } 個)`
        )
      );
      document.querySelector("#list").appendChild(div16);

      const div14 = document.createElement("div");
      div14.className = "item";
      div14.onclick = (event) => {
        event.preventDefault();
        help();
      };
      const i10 = document.createElement("i");
      i10.className = "fa fa-heart";
      div14.appendChild(i10);
      div14.appendChild(document.createTextNode("PayMe 捐助"));
      document.querySelector("#list").appendChild(div14);

      const div6 = document.createElement("div");
      div6.className = "item";
      div6.onclick = (event) => {
        event.preventDefault();
        window.open("/list", "_blank");
      };
      const i4 = document.createElement("i");
      i4.className = "fa fa-file-text";
      div6.appendChild(i4);
      div6.appendChild(document.createTextNode("動畫列表"));
      document.querySelector("#list").appendChild(div6);

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
            const div19 = document.createElement("div");
            div19.className = "item";
            div19.onclick = async (event) => {
              event.target.childNodes[1].textContent = "正在停用推送通知...";
              const res = await fetch("/unsubscribe/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(subscription),
              });
              if (res.status >= 400) {
                event.target.childNodes[1].textContent = "無法停用推送通知";
              } else {
                await getListing();
              }
            };
            const i14 = document.createElement("i");
            i14.className = "fa fa-bell-slash";
            div19.appendChild(i14);
            div19.appendChild(document.createTextNode("停用推送通知"));
            document.querySelector("#list").appendChild(div19);

            document.querySelectorAll(".folder").forEach((each) => {
              each.onmouseup = navfolder;
            });
            document.querySelectorAll(".folder a").forEach((each) => {
              each.onclick = (event) => {
                if (event.button === 0) {
                  event.preventDefault();
                }
              };
            });
            return;
          }
        }
      }
      const div18 = document.createElement("div");
      div18.className = "item";
      div18.onclick = async (event) => {
        event.preventDefault();
        event.target.childNodes[1].textContent = "正在嘗試啟用推送通知...";
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
          event.target.childNodes[1].textContent = "無法啟用推送通知";
          return;
        }
        const res = await fetch("/subscribe/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        });
        if (res.status >= 400) {
          event.target.childNodes[1].textContent = "無法啟用推送通知";
        } else {
          await getListing();
        }
      };
      const i15 = document.createElement("i");
      i15.className = "fa fa-bell";
      div18.appendChild(i15);
      div18.appendChild(document.createTextNode("啟用推送通知"));
      document.querySelector("#list").appendChild(div18);
    }

    if (
      window.location.pathname === "/Movie/" ||
      window.location.pathname === "/OVA/" ||
      window.location.pathname === "/Sukebei/" ||
      window.location.pathname === "/2021-07/" ||
      window.location.pathname === "/2021-04/"
    ) {
      dirEntries.sort((a, b) => (b.modified > a.modified ? 1 : b.modified < a.modified ? -1 : 0));
    } else if (window.location.pathname === "/") {
      dirEntries.sort((a, b) => (b.name > a.name ? 1 : b.name < a.name ? -1 : 0));
    } else {
      dirEntries.sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0));
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
        if (localStorage.getItem(`/${entry.anime_id}/${encodeURIComponent(entry.name)}`)) {
          watched = "watched";
        }
        div7.className = `file ${watched}`;
        a4.href = `/${entry.anime_id}/${encodeURIComponent(entry.name)}`;
        if (entry.webp) {
          a4.dataset.webp = `/${entry.anime_id}/${encodeURIComponent(entry.webp)}`;
        }
        if (entry.avif) {
          a4.dataset.avif = `/${entry.anime_id}/${encodeURIComponent(entry.avif)}`;
        }
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
      } else if (entry.name.slice(-4) === ".txt" || entry.name.slice(-4) === ".ass") {
        div7.className = "file";
        a4.href = `/${entry.anime_id}/${encodeURIComponent(entry.name)}`;
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

    if (navigator.connection) {
      toggleFileSizeDisplay();
    }
    document.querySelector("#list").scrollTo(0, scroll);
    document.querySelectorAll(".folder").forEach((each) => {
      each.onmouseup = navfolder;
    });
    document.querySelectorAll(".folder a").forEach((each) => {
      each.onclick = (event) => {
        if (event.button === 0) {
          event.preventDefault();
        }
      };
    });
    document.querySelectorAll(".file").forEach((each) => {
      each.onmouseup = playfile;
    });
    document.querySelectorAll(".file a").forEach((each) => {
      each.onclick = (event) => {
        if (event.button === 0) {
          event.preventDefault();
        }
      };
    });
    if (window.vjs) {
      document.querySelectorAll(".file a").forEach((entry) => {
        if (entry.href === window.vjs.src()) {
          entry.parentNode.classList.add("highlight");
        }
      });

      document.querySelectorAll(".folder a").forEach((entry) => {
        if (
          window.location.pathname.split("/").length === 3 &&
          window.vjs.src().split("/")[3] === entry.dataset.anime_id
        ) {
          entry.parentNode.classList.add("highlight");
        }
      });
    }
  }
};

const navSearchFolder = function (event) {
  if (event.button !== 0) {
    return;
  }
  document.querySelectorAll(".folder").forEach((each) => {
    each.onmouseup = null;
  });
  history.pushState(null, null, this.querySelector("a").href.replace(window.location.origin, ""));
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

    document.querySelector("#list .search").style.display = "flex";

    const anime_list = await fetch(`/search?q=${keyword}`).then((res) => res.json());
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
        if (event.button === 0) {
          event.preventDefault();
        }
      };
    });
    if (window.vjs) {
      document.querySelectorAll(".file a").forEach((entry) => {
        if (entry.href === window.vjs.src()) {
          entry.parent.classList.add("highlight");
        }
      });
      document.querySelectorAll(".folder a").forEach((entry) => {
        // highlight folder if currently playing video is inside
      });
    }
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

const popStateHandler = function (event) {
  if (document.querySelector("#search").value.length > 0) {
    prepareSearch();
  } else {
    window.getListing();
  }
  showList();
};
window.onpopstate = popStateHandler;

let typing = null;
document.querySelector("#search").oninput = () => {
  clearTimeout(typing);
  if (document.querySelector("#search").value.length > 0) {
    typing = setTimeout(prepareSearch, 300);
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

videojs.plugin("progressTips", function (options) {
  const init = () => {
    const arrow = document.createElement("div");
    arrow.id = "vjs-tip-arrow";
    const inner = document.createElement("div");
    inner.id = "vjs-tip-inner";
    const tip = document.createElement("div");
    tip.id = "vjs-tip";
    tip.appendChild(arrow);
    tip.appendChild(inner);
    document.querySelector(".vjs-control-bar").appendChild(tip);
    document.querySelector(".vjs-progress-control").onmousemove = (event) => {
      const { seekBar } = window.vjs.controlBar.progressControl;
      const mousePosition =
        (event.pageX - window.vjs.controlBar.progressControl.el().offsetLeft) / seekBar.width();
      let timeInSeconds = mousePosition * window.vjs.duration();
      if (timeInSeconds === window.vjs.duration()) {
        timeInSeconds -= 0.1;
      }
      const sec_num = parseInt(timeInSeconds, 10);
      const hours = Math.floor(sec_num / 3600)
        .toString()
        .padStart(2, "0");
      const minutes = Math.floor((sec_num - hours * 3600) / 60)
        .toString()
        .padStart(2, "0");
      const seconds = (sec_num - hours * 3600 - minutes * 60).toString().padStart(2, "0");

      let left = event.pageX;
      const width = 65;
      left -= width / 2;
      const clientRect = document.querySelector(".vjs-control-bar").getBoundingClientRect();
      const clientRectX = clientRect.x || 0;
      if (left < clientRectX) {
        left = clientRectX;
      } else if (left > clientRectX + clientRect.width - width) {
        left = clientRectX + clientRect.width - width;
      }
      left -= clientRectX;
      document.querySelector("#vjs-tip-inner").innerText = `${hours}:${minutes}:${seconds}`;
      const barHeight = document.querySelector(".vjs-control-bar").clientHeight;
      document.querySelector("#vjs-tip").style.bottom = `${barHeight + 20}px`;
      document.querySelector("#vjs-tip").style.left = `${left}px`;
      document.querySelector("#vjs-tip").style.visibility = "visible";
      document.querySelector(".vjs-progress-control").onmouseout = () => {
        document.querySelector("#vjs-tip").style.visibility = "hidden";
      };
      document.querySelector(".vjs-play-control").onmouseout = () => {
        document.querySelector("#vjs-tip").style.visibility = "hidden";
      };
    };
  };
  this.on("loadedmetadata", init);
});

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
});

navigator.serviceWorker.register("/sw.js");
