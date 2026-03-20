import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import eventsReducer from './eventsSlice';
import eventReducer from './EventSlice';

// Clear Redux state if no active event on store creation
const clearStateIfNoActiveEvent = () => {
  const endformId = localStorage.getItem('endformId');
  const currentEventId = localStorage.getItem('currentEventId');
  if (!endformId || !currentEventId) {
    console.log('Store - No active event, clearing initial state');
    return {
      event: {
        event: {
          basicEvent: {},
          communicationdata: {},
          transport: [],
          foodform: {},
          guestform: {},
          end: {}
        }
      },
      auth: {
        user: null,
        token: null,
        isAuthenticated: false,
      }
    };
  }
  return undefined; // Use default state
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventsReducer,
    event: eventReducer
  },
  preloadedState: clearStateIfNoActiveEvent(),
}); 