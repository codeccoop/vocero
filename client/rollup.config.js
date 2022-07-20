const path = require("path");
import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import css from "rollup-plugin-import-css";

export default [
  {
    input: "src/pages/home/index.js",
    output: {
      file: path.join(__dirname, "..", "static/bundle/home.js"),
      format: "iife",
    },
    plugins: [
      resolve(),
      replace({
        "process.env.NODE_ENV": JSON.stringify("development"),
      }),
      babel({
        presets: ["@babel/preset-react"],
      }),
      commonjs(),
      css(),
    ],
  },
  {
    input: "src/pages/editor/index.js",
    output: {
      file: path.join(__dirname, "..", "static/bundle/editor.js"),
      format: "iife",
    },
    plugins: [
      resolve(),
      replace({
        "process.env.NODE_ENV": JSON.stringify("development"),
      }),
      babel({
        presets: ["@babel/preset-react"],
      }),
      commonjs(),
      css(),
    ],
  },
];