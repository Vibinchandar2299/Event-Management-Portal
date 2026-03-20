import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  events: [],
  loading: false,
  error: null
};

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    setEvents: (state, action) => {
      state.events = action.payload;
    },
    updateEvent: (state, action) => {
      const index = state.events.findIndex(event => event._id === action.payload._id);
      if (index !== -1) {
        state.events[index] = action.payload;
      }
    },
    addEvent: (state, action) => {
      state.events.push(action.payload);
    },
    deleteEvent: (state, action) => {
      state.events = state.events.filter(event => event._id !== action.payload);
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const { 
  setEvents, 
  updateEvent, 
  addEvent, 
  deleteEvent, 
  setLoading, 
  setError 
} = eventsSlice.actions;

export default eventsSlice.reducer; 