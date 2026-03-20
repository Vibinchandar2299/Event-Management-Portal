import { configureStore } from "@reduxjs/toolkit";
import EventReducer from "./EventSlice";

const store = configureStore({
  reducer: {
    event: EventReducer,
  },
});

export default store;
