import React from "react";
import { Ø } from "./lib";
import { closeMenu } from "./Menu";
export default (props) => {
  return (
    <div
      className="overlay dragging hidden"
      onClick={async (e) => {
        if (e.target !== Ø(".overlay")) return;
        await closeMenu();
      }}
    ></div>
  );
};
