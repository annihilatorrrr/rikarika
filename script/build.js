import esbuild from "esbuild";

esbuild.build({
  entryPoints: ["./src/mobile.js"],
  outfile: "./www/js/mobile.es2016.js",
  minify: process.argv.includes("--release"),
  bundle: true,
  sourcemap: true,
  target: ["es2016"],
  watch: !process.argv.includes("--watch")
    ? null
    : {
        onRebuild(error, result) {
          if (error) console.error("watch build failed:", error);
          else console.log("watch build succeeded:", result);
        },
      },
});

esbuild.build({
  entryPoints: ["./www/js/desktop.js"],
  outfile: "./www/js/desktop.es2016.js",
  minify: process.argv.includes("--release"),
  bundle: true,
  sourcemap: true,
  target: ["es2016"],
  watch: !process.argv.includes("--watch")
    ? null
    : {
        onRebuild(error, result) {
          if (error) console.error("watch build failed:", error);
          else console.log("watch build succeeded:", result);
        },
      },
});
