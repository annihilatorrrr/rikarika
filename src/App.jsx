import React from "react";
import Menu from "./Menu";
import Bar from "./Bar";
import Player from "./Player";
import List from "./List";
import Progress from "./Progress";
import Overlay from "./Overlay";
import Reload from "./Reload";

export default () => {
  return (
    <>
      <List></List>
      <Bar></Bar>
      <Player></Player>
      <Reload></Reload>
      <Overlay></Overlay>
      <Menu></Menu>
      <Progress></Progress>
    </>
  );
};
