import esbuild from "esbuild";

esbuild.build({
  entryPoints: ["./www/js/mobile.js"],
  outfile: "./www/js/mobile.es2016.js",
  minify: false,
  bundle: true,
  sourcemap: false,
  target: ["es2016"],
});

esbuild.build({
  entryPoints: ["./www/js/desktop.js"],
  outfile: "./www/js/desktop.es2016.js",
  minify: false,
  bundle: true,
  sourcemap: false,
  target: ["es2016"],
});
