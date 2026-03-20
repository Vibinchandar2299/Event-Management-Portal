import { createSlice } from "@reduxjs/toolkit";

// Check if there's an active event and if it's a new event or existing event
const getInitialState = () => {
  const currentEventId = localStorage.getItem('currentEventId');
  const endformId = localStorage.getItem('endformId');
  
  // If no currentEventId, return empty state
  if (!currentEventId) {
    return {
      event: {
        basicEvent: {},
        communicationdata: {},
        transport: [],
        foodform: {},
        guestform: {},
        end: {}
      }
    };
  }
  
  // If we have currentEventId but no endformId, this is a new event - return empty state
  if (currentEventId && !endformId) {
    return {
      event: {
        basicEvent: {},
        communicationdata: {},
        transport: [],
        foodform: {},
        guestform: {},
        end: {}
      }
    };
  }
  
  // If we have both currentEventId and endformId, this is an existing event
  // Return the current state (will be populated by setEventData)
  return {
    event: {
      basicEvent: {},
      communicationdata: {},
      transport: [],
      foodform: {},
      guestform: {},
      end: {}
    }
  };
};

const initialState = {
  event: {
    basicEvent: {},
    communicationdata: {},
    transport: [],
    foodform: {},
    guestform: {},
    end: {}
  }
};

const eventSlice = createSlice({
  name: "event",
  initialState: getInitialState(),
  reducers: {
    setEventData: (state, action) => {
      console.log("setEventData - Payload received:", action.payload);
      // Always merge with initialState.event to ensure all keys are present
      state.event = {
        ...initialState.event,
        ...state.event,
        ...action.payload
      };
      console.log("setEventData - New state.event:", state.event);
    },
    clearEventData: (state) => {
      console.log("clearEventData - Clearing event state");
      state.event = initialState.event;
    },
    resetEventState: () => initialState,
  },
});

export const { setEventData, clearEventData, resetEventState } = eventSlice.actions;
export default eventSlice.reducer;
