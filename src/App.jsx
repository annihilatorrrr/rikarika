import React, { useState } from "react";
import { reducer, initialState } from "./reducer";

import Menu from "./Menu";
import Bar from "./Bar";
import Player from "./Player";
import List from "./List";
import Progress from "./Progress";
import Overlay from "./Overlay";
import Reload from "./Reload";

export const AppContext = React.createContext({
  state: initialState,
  dispatch: () => null,
});

export default () => {
  const [state, dispatch] = React.useReducer(reducer, initialState);

  return (
    <AppContext.Provider value={[state, dispatch]}>
      <List></List>
      <Bar></Bar>
      <Player></Player>
      <Reload></Reload>
      <Overlay></Overlay>
      <Menu></Menu>
      <Progress></Progress>
    </AppContext.Provider>
  );
};
