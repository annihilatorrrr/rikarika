const path = require("path");
const fs = require("fs-extra");
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "db.json")));
// .filter(e => parseInt(e.format.filename.split("/")[4]) > 4000);

const formatDateTime = (timeInSeconds) => {
  const sec = parseInt(timeInSeconds, 10);
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec - days * 86400) / 3600);
  const minutes = Math.floor((sec - days * 86400 - hours * 3600) / 60);
  const seconds = sec - days * 86400 - hours * 3600 - minutes * 60;
  const time = [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    seconds.toString().padStart(2, "0"),
  ].join(":");
  return days > 0 ? `${days} days ${time}` : time;
};

const sortTable = (obj) =>
  Object.entries(obj)
    .sort()
    .reduce((o, [k, v]) => ((o[k] = v), o), {});

const totalDuration = data
  .filter((mp4) => parseFloat(mp4.format.duration))
  .reduce((total, mp4) => total + parseFloat(mp4.format.duration), 0);
const totalCount = data.filter((mp4) => parseFloat(mp4.format.duration)).length;

const averageDuration = totalDuration / totalCount;

const videoProfileList = data
  .map((each) => each.streams.find((stream) => stream.codec_type === "video"))
  .filter((each) => each)
  .reduce((map, video) => {
    map[video.profile] = map[video.profile] ? map[video.profile] + 1 : 1;
    return map;
  }, {});

const videoLevelList = data
  .map((each) => each.streams.find((stream) => stream.codec_type === "video"))
  .filter((each) => each)
  .reduce((map, video) => {
    map[video.level] = map[video.level] ? map[video.level] + 1 : 1;
    return map;
  }, {});

const videoBitRateList = data
  .map((each) => each.streams.find((stream) => stream.codec_type === "video"))
  .filter((each) => each)
  .reduce((map, video) => {
    const bitRateRange = Math.ceil(video.bit_rate / 1000 / 1000) * 1000;
    map[bitRateRange] = map[bitRateRange] ? map[bitRateRange] + 1 : 1;
    return map;
  }, {});

const audioProfileList = data
  .map((each) => each.streams.find((stream) => stream.codec_type === "audio"))
  .filter((each) => each)
  .reduce((map, audio) => {
    map[audio.profile] = map[audio.profile] ? map[audio.profile] + 1 : 1;
    return map;
  }, {});

const videoKeys = data
  .map((each) => each.streams.find((stream) => stream.codec_type === "video"))
  .filter((each) => each)
  .reduce((map, video) => {
    for (const key of Object.keys(video)) {
      map[key] = map[key] ? map[key] + 1 : 1;
    }
    return map;
  }, {});

const audioKeys = data
  .map((each) => each.streams.find((stream) => stream.codec_type === "audio"))
  .filter((each) => each)
  .reduce((map, audio) => {
    for (const key of Object.keys(audio)) {
      map[key] = map[key] ? map[key] + 1 : 1;
    }
    return map;
  }, {});

const audioBitRateList = data
  .map((each) => each.streams.find((stream) => stream.codec_type === "audio"))
  .filter((each) => each)
  .reduce((map, audio) => {
    const bitRateRange = Math.ceil(audio.bit_rate / 1000 / 10) * 10;
    map[bitRateRange] = map[bitRateRange] ? map[bitRateRange] + 1 : 1;
    return map;
  }, {});

console.log(data[0]);
console.log("Video Keys");
console.table(sortTable(videoKeys));
console.log("Video Profiles");
console.table(sortTable(videoProfileList));
console.log("Video Levels");
console.table(sortTable(videoLevelList));
console.log("Video Bit Rates (kbps)");
console.table(sortTable(videoBitRateList));

console.log("Audio Keys");
console.table(sortTable(audioKeys));
console.log("Audio Profiles");
console.table(sortTable(audioProfileList));
console.log("Audio Bit Rates (kbps)");
console.table(sortTable(audioBitRateList));

console.log("Indexed video: " + totalCount);
console.log("Average duration: " + formatDateTime(averageDuration));
console.log("Total duration: " + formatDateTime(totalDuration));
console.log("Total duration: " + formatDateTime(totalDuration));

console.log("No audio streams:");
data.forEach((each) => {
  if (!each.streams.find((stream) => stream.codec_type === "audio")) {
    console.log(each.format.filename);
  }
});
console.log("No max_bit_rate in audio streams:");
data.forEach((each) => {
  const audio = each.streams.find((stream) => stream.codec_type === "audio");
  if (audio && !audio.max_bit_rate) {
    console.log(each.format.filename);
  }
});
console.log("Audio bitrate too high:");
data.forEach((each) => {
  const audio = each.streams.find((stream) => stream.codec_type === "audio");
  if (audio && audio.bit_rate > 1000 * 320) {
    console.log(each.format.filename);
  }
});

console.log("No video streams:");
data.forEach((each) => {
  if (!each.streams.find((stream) => stream.codec_type === "video")) {
    console.log(each.format.filename);
  }
});
console.log("More than 2 streams:");
data.forEach((each) => {
  if (each.streams.length > 2) {
    console.log(each.format.filename);
  }
});
console.log("Wrong H.264 profile:");
data.forEach((each) => {
  const video = each.streams.find((stream) => stream.codec_type === "video");
  if (!["Constrained Baseline", "Main", "High"].includes(video.profile)) {
    console.log(each.format.filename);
  }
});
console.log("Video bitrate too high:");
data.forEach((each) => {
  const video = each.streams.find((stream) => stream.codec_type === "video");
  if (video.bit_rate > 1000 * 1000 * 10) {
    console.log(each.format.filename);
  }
});
