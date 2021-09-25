export const reducer = (state, action) => {
  switch (action.type) {
    case "toggle_nsfw":
      return {
        ...state,
        showNSFW: !state.showNSFW,
      };

    default:
      return state;
  }
};

export const initialState = {
  showNSFW: !!localStorage.getItem("nsfw"),
};
