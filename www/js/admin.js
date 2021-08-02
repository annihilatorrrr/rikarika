var ruTorrentHost = document.querySelector("meta[name=rutorrent-host]").getAttribute("content");
var ruTorrentHost2 = document.querySelector("meta[name=rutorrent-host-2]").getAttribute("content");
var app = angular.module("myAniList", []);
app.controller("searchAniList", function ($scope, $http, $filter) {
  var d = new Date();
  $scope.start_from_year = d.getFullYear();
  $scope.start_to_year = d.getFullYear();
  $scope.start_from_month = 1;
  $scope.start_to_month = 12;
  $scope.score = -1;
  $scope.popularity = -1;
  $scope.isAdult = "any";
  $scope.types = [
    { value: "*" },
    { value: "TV*" },
    { value: "TV" },
    { value: "TV_SHORT" },
    { value: "MOVIE" },
    { value: "SPECIAL" },
    { value: "OVA" },
    { value: "ONA" },
    { value: "MUSIC" },
  ];
  $scope.type = $scope.types[0];
  $scope.sorts = [
    { value: "id" },
    { value: "format" },
    { value: "title.native" },
    { value: "title.romaji" },
    { value: "startDate" },
    { value: "averageScore" },
    { value: "popularity" },
  ];
  $scope.sort = $scope.sorts[6];
  $scope.orders = [{ value: "asc" }, { value: "desc" }];
  $scope.order = $scope.orders[1];
  var handle;
  $scope.searching_anilist = function () {
    clearTimeout(handle);
    handle = setTimeout(function () {
      $scope.search("anilist");
    }, 0);
  };
  $scope.searching_anime = function () {
    clearTimeout(handle);
    handle = setTimeout(function () {
      $scope.search("anime");
    }, 0);
  };
  $scope.searching = function () {
    clearTimeout(handle);
    handle = setTimeout(function () {
      $scope.search();
    }, 500);
  };
  $scope.search = async function (type, path) {
    var request = {
      size: 500,
      from: 0,
    };
    if (type === "rss") {
      request.query = {
        ids: {
          values: (
            await $http.get(`https://${ruTorrentHost}/plugins/rss/action.php?mode=getfilters`)
          ).data.map((rule) => rule.name),
        },
      };
    } else if (type === "sola") {
      request.query = {
        ids: {
          values: (
            await $http.get(`https://${ruTorrentHost2}/plugins/rss/action.php?mode=getfilters`)
          ).data.map((rule) => rule.name),
        },
      };
    } else if (type === "path") {
      request.query = {
        ids: {
          values: (await $http.get(`/ls?path=%2F${path}%2F`)).data.map((e) => e.anilist_id),
        },
      };
    } else if (type === "filter") {
      const must = [
        {
          wildcard: {
            "format.keyword": $scope.type,
          },
        },
        {
          range: {
            "startDate.year": {
              gte: $scope.start_from_year,
              lte: $scope.start_to_year,
            },
          },
        },
        {
          range: {
            "startDate.month": {
              gte: $scope.start_from_month,
              lte: $scope.start_to_month,
            },
          },
        },
      ];
      if ($scope.popularity >= 0) {
        must.push({
          range: {
            popularity: {
              gte: $scope.popularity,
            },
          },
        });
      }
      if ($scope.score >= 0) {
        must.push({
          range: {
            averageScore: {
              gte: $scope.score,
            },
          },
        });
      }
      request.query = {
        bool: {
          must: must,
          filter:
            $scope.isAdult === "any" ? [] : [{ match: { isAdult: $scope.isAdult === "true" } }],
        },
      };
      request.sort = {};
      request.sort[$scope.sort.value] = { order: $scope.order.value };
    } else if (type === "anime") {
      const anilistID = (await $http.get(`/admin/get_anilist?id=${$scope.search_anime}`)).data;
      request.size = 5;
      request.query = {
        ids: {
          values: [Number(anilistID)],
        },
      };
    } else if (type === "anilist") {
      request.size = 5;
      request.query = {
        ids: {
          values: [$scope.search_anilist],
        },
      };
    } else {
      history.replaceState(null, null, `?q=${$scope.query}`);
      request.size = 50;
      request.query = {
        multi_match: {
          query: $scope.query,
          fields: [
            "title.native",
            "title.romaji",
            "title.english",
            "title.chinese",
            "synonyms",
            "synonyms_chinese",
          ],
          type: "phrase_prefix",
          //"fuzziness" : "AUTO",
          prefix_length: 2,
        },
      };
    }
    request._source = [
      "id",
      "title.*",
      "synonyms",
      "synonyms_chinese",
      "format",
      "episodes",
      "isAdult",
      "startDate.*",
      "endDate.*",
      "averageScore",
      "popularity",
    ];
    const anilist = (await $http.post("anilist/anime/_search", request)).data.hits.hits.map(
      (e) => e._source
    );
    const anime = (
      await $http.get("/admin/get_series?anilist_id=" + anilist.map((e) => e.id).join(","))
    ).data;
    const rss = (await $http.get(`https://${ruTorrentHost}/plugins/rss/action.php?mode=getfilters`))
      .data;
    const sola = (
      await $http.get(`https://${ruTorrentHost2}/plugins/rss/action.php?mode=getfilters`)
    ).data;
    $scope.hits = anilist
      .map((a) => {
        var directory = null;
        var sub_directory = null;
        var anime_id = null;
        if (anime) {
          anime.forEach((b) => {
            if (b.anilist_id === a.id) {
              directory = b.season;
              sub_directory = b.title;
              anime_id = b.anime_id;
            }
          });
        }
        if (anime_id && directory && sub_directory) {
          return Object.assign(a, { anime_id, directory, sub_directory });
        }
        return a;
      })
      .map((entry) => {
        var name = null;
        var pattern = null;
        var exclude = null;
        var name2 = null;
        var pattern2 = null;
        var exclude2 = null;
        if (rss.some((rule) => Number(rule.name) === entry.id)) {
          var rule = rss.find((rule) => Number(rule.name) === entry.id);
          name = rule.name;
          pattern = rule.pattern.replace(/\/(.*)\/i/, "$1");
          exclude = rule.exclude.replace(/\/(.*)\/i/, "$1");
        }
        if (sola.some((rule) => Number(rule.name) === entry.id)) {
          var rule2 = sola.find((rule) => Number(rule.name) === entry.id);
          name2 = rule2.name;
          pattern2 = rule2.pattern.replace(/\/(.*)\/i/, "$1");
          exclude2 = rule2.exclude.replace(/\/(.*)\/i/, "$1");
        }
        return Object.assign(entry, {
          name,
          pattern,
          exclude,
          name2,
          pattern2,
          exclude2,
        });
      })
      .sort((a, b) => {
        if (type === "rss" || type === "path") {
          return `${a.directory}/${a.sub_directory}` < `${b.directory}/${b.sub_directory}` ? -1 : 1;
        } else {
          return 0;
        }
      });
    $scope.$apply();
  };
  $scope.saveRSS = async function (index) {
    const rss = (await $http.get(`https://${ruTorrentHost}/plugins/rss/action.php?mode=getfilters`))
      .data;
    if (!rss.some((rule) => Number(rule.name) === $scope.hits[index].id)) {
      rss.push({ name: $scope.hits[index].id });
    }
    const params = new URLSearchParams();
    params.append("mode", "setfilters");
    rss
      .sort((a, b) => Number(a.name) - Number(b.name))
      .forEach((rule) => {
        if (Number(rule.name) === $scope.hits[index].id) {
          params.append("name", $scope.hits[index].id);
          params.append("pattern", `/${$scope.hits[index].pattern}/i`);
          params.append("enabled", "1");
          params.append("chktitle", "1");
          params.append("chklink", "0");
          params.append("chkdesc", "0");
          params.append("exclude", `/${$scope.hits[index].exclude}/i`);
          params.append("hash", "");
          params.append("start", "1");
          params.append("addPath", "0");
          params.append("dir", `/download/${$scope.hits[index].anime_id}/`);
          params.append(
            "label",
            `${$scope.hits[index].directory}/${$scope.hits[index].sub_directory}`
          );
          params.append("interval", "-1");
          params.append("no", "1");
          params.append("throttle", "");
          params.append("ratio", "rat_0");
        } else {
          params.append("name", rule.name);
          params.append("pattern", rule.pattern);
          params.append("enabled", rule.enabled);
          params.append("chktitle", rule.chktitle);
          params.append("chklink", rule.chklink);
          params.append("chkdesc", rule.desc);
          params.append("exclude", rule.exclude);
          params.append("hash", rule.hash);
          params.append("start", rule.start);
          params.append("addPath", rule.addPath);
          params.append("dir", rule.dir);
          params.append("label", rule.label);
          params.append("interval", rule.interval);
          params.append("no", rule.no);
          params.append("throttle", rule.throttle);
          params.append("ratio", rule.ratio);
        }
      });
    await fetch(`https://${ruTorrentHost}/plugins/rss/action.php`, {
      credentials: "include",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      body: params.toString().replace(/\+/g, "%20"),
    });
  };

  $scope.saveSola = async function (index) {
    const sola = (
      await $http.get(`https://${ruTorrentHost2}/plugins/rss/action.php?mode=getfilters`)
    ).data;
    if (!sola.some((rule) => Number(rule.name) === $scope.hits[index].id)) {
      sola.push({ name: $scope.hits[index].id });
    }
    const params = new URLSearchParams();
    params.append("mode", "setfilters");
    sola
      .sort((a, b) => Number(a.name) - Number(b.name))
      .forEach((rule) => {
        if (Number(rule.name) === $scope.hits[index].id) {
          params.append("name", $scope.hits[index].id);
          params.append("pattern", `/${$scope.hits[index].pattern2}/i`);
          params.append("enabled", "1");
          params.append("chktitle", "1");
          params.append("chklink", "0");
          params.append("chkdesc", "0");
          params.append("exclude", `/${$scope.hits[index].exclude2}/i`);
          params.append("hash", "");
          params.append("start", "1");
          params.append("addPath", "0");
          params.append("dir", `/download/${$scope.hits[index].id}/`);
          params.append(
            "label",
            `${$scope.hits[index].directory}/${$scope.hits[index].sub_directory}`
          );
          params.append("interval", "-1");
          params.append("no", "1");
          params.append("throttle", "");
          params.append("ratio", "rat_0");
        } else {
          params.append("name", rule.name);
          params.append("pattern", rule.pattern);
          params.append("enabled", rule.enabled);
          params.append("chktitle", rule.chktitle);
          params.append("chklink", rule.chklink);
          params.append("chkdesc", rule.desc);
          params.append("exclude", rule.exclude);
          params.append("hash", rule.hash);
          params.append("start", rule.start);
          params.append("addPath", rule.addPath);
          params.append("dir", rule.dir);
          params.append("label", rule.label);
          params.append("interval", rule.interval);
          params.append("no", rule.no);
          params.append("throttle", rule.throttle);
          params.append("ratio", rule.ratio);
        }
      });
    await fetch(`https://${ruTorrentHost2}/plugins/rss/action.php`, {
      credentials: "include",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      body: params.toString().replace(/\+/g, "%20"),
    });
  };

  $scope.deleteRSS = async function (index) {
    const rss = (await $http.get(`https://${ruTorrentHost}/plugins/rss/action.php?mode=getfilters`))
      .data;
    const params = new URLSearchParams();
    params.append("mode", "setfilters");
    rss
      .sort((a, b) => Number(a.name) - Number(b.name))
      .forEach((rule) => {
        if (Number(rule.name) !== $scope.hits[index].id) {
          params.append("name", rule.name);
          params.append("pattern", rule.pattern);
          params.append("enabled", rule.enabled);
          params.append("chktitle", rule.chktitle);
          params.append("chklink", rule.chklink);
          params.append("chkdesc", rule.desc);
          params.append("exclude", rule.exclude);
          params.append("hash", rule.hash);
          params.append("start", rule.start);
          params.append("addPath", rule.addPath);
          params.append("dir", rule.dir);
          params.append("label", rule.label);
          params.append("interval", rule.interval);
          params.append("no", rule.no);
          params.append("throttle", rule.throttle);
          params.append("ratio", rule.ratio);
        }
      });
    await fetch(`https://${ruTorrentHost}/plugins/rss/action.php`, {
      credentials: "include",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      body: params.toString().replace(/\+/g, "%20"),
    });
    $scope.hits[index].name = null;
    $scope.hits[index].pattern = null;
    $scope.hits[index].exclude = null;
    $scope.$apply();
  };

  $scope.deleteSola = async function (index) {
    const rss = (
      await $http.get(`https://${ruTorrentHost2}/plugins/rss/action.php?mode=getfilters`)
    ).data;
    const params = new URLSearchParams();
    params.append("mode", "setfilters");
    rss
      .sort((a, b) => Number(a.name) - Number(b.name))
      .forEach((rule) => {
        if (Number(rule.name) !== $scope.hits[index].id) {
          params.append("name", rule.name);
          params.append("pattern", rule.pattern);
          params.append("enabled", rule.enabled);
          params.append("chktitle", rule.chktitle);
          params.append("chklink", rule.chklink);
          params.append("chkdesc", rule.desc);
          params.append("exclude", rule.exclude);
          params.append("hash", rule.hash);
          params.append("start", rule.start);
          params.append("addPath", rule.addPath);
          params.append("dir", rule.dir);
          params.append("label", rule.label);
          params.append("interval", rule.interval);
          params.append("no", rule.no);
          params.append("throttle", rule.throttle);
          params.append("ratio", rule.ratio);
        }
      });
    await fetch(`https://${ruTorrentHost2}/plugins/rss/action.php`, {
      credentials: "include",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      body: params.toString().replace(/\+/g, "%20"),
    });
    $scope.hits[index].name2 = null;
    $scope.hits[index].pattern2 = null;
    $scope.hits[index].exclude2 = null;
    $scope.$apply();
  };

  $scope.update = function (index, field) {
    if (field == "title.chinese" || field == "synonyms_chinese") {
      var anilist_id = $scope.hits[index].id;
      var entry = {
        title: {
          chinese: $scope.hits[index].title.chinese,
        },
        synonyms_chinese: Array.isArray($scope.hits[index].synonyms_chinese)
          ? $scope.hits[index].synonyms_chinese
          : [],
      };
      $http.post("add_anilist_chinese?anilist_id=" + anilist_id, entry);
      $http.post("anilist/anime/" + anilist_id + "/_update", { doc: entry });
    }
  };
  $scope.getAnimeID = function (index) {
    var request = {};
    request.kari_id = $scope.hits[index].anime_id;
    request.anilist_id = $scope.hits[index].id;
    request.season = $scope.hits[index].directory;
    request.title = $scope.hits[index].sub_directory;
    $http.post("/admin/add_series", request).then(function (response) {
      var anime_id = parseInt(response.data, 10);
      if (parseInt(response.data, 10)) {
        $scope.hits[index].anime_id = anime_id;
      }
    });
  };
  $scope.autoFill = function (index, field) {
    if (!$scope.hits[index][field]) {
      if (field == "pattern") {
        $scope.hits[index].pattern = Array.from(
          new Set(
            [
              $scope.hits[index].title.chinese,
              $scope.hits[index].title.romaji.replace(/[\W]+/g, ".*").replace(/\.\*$/, ""),
            ].map((e) => e.toLowerCase().replace(/ /g, ".*"))
          )
        ).join("|");
        return;
      }

      if (field == "pattern2") {
        $scope.hits[index].pattern2 = $scope.hits[index].title.romaji
          .toLowerCase()
          .replace(/ /g, ".*")
          .replace(/[\W]+/g, ".*")
          .replace(/\.\*$/, "");
        return;
      }

      if (field == "exclude") {
        if (
          $scope.hits[index].format == "OVA" ||
          $scope.hits[index].format == "ONA" ||
          $scope.hits[index].format == "SPECIAL"
        ) {
          $scope.hits[index].exclude =
            "4K|2160|HEVC|x265|10bit|10-bit|Hi10P|ASS|外挂|外掛|Movie|劇場|剧场|1~|1-";
        } else if ($scope.hits[index].format == "MOVIE") {
          $scope.hits[index].exclude =
            "4K|2160|HEVC|x265|10bit|10-bit|Hi10P|ASS|外挂|外掛|OVA|OAD|1~|1-";
        } else {
          $scope.hits[index].exclude =
            "4K|2160|HEVC|x265|10bit|10-bit|Hi10P|ASS|外挂|外掛|BD|Movie|劇場|剧场|OVA|OAD|1~|1-";
        }
        return;
      }

      if (field == "exclude2") {
        $scope.hits[index].exclude2 = "MKV|HEVC|x265|10bit|10-bit|Hi10P|1~|1-";
        return;
      }

      if (field == "sub_directory") {
        $scope.hits[index].sub_directory = $scope.hits[index].title.chinese;
      }
      if (field == "directory") {
        if ($scope.hits[index].isAdult) {
          $scope.hits[index].directory = "Sukebei";
        } else if ($scope.hits[index].format == "SPECIAL" || $scope.hits[index].format == "OVA") {
          $scope.hits[index].directory = "OVA";
        } else if ($scope.hits[index].format == "MOVIE") {
          $scope.hits[index].directory = "Movie";
        } else if (
          $scope.hits[index].format == "TV" ||
          $scope.hits[index].format == "TV_SHORT" ||
          $scope.hits[index].format == "ONA"
        ) {
          $scope.hits[index].directory = `${$scope.hits[index].startDate.year}-${$scope.hits[
            index
          ].startDate.month
            .toString()
            .padStart(2, "0")}`;
        }
      }
      $scope.getAnimeID(index);
    }
  };
  if (window.location.search) {
    var searchParams = new URLSearchParams(window.location.search.substr(1));
    if (searchParams.has("q")) {
      $scope.query = decodeURIComponent(searchParams.get("q"));
      $scope.search();
    } else if (searchParams.has("rss")) {
      $scope.search("rss");
    } else if (searchParams.has("sola")) {
      $scope.search("sola");
    } else if (searchParams.has("path")) {
      $scope.search("path", searchParams.get("path"));
    }
  }
});
