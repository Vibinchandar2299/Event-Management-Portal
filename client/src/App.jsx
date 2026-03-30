import React, { useEffect } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { store } from './redux/store';
import { clearEventData } from './redux/EventSlice';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import InitialRouter from './Router/InitialRouter';
import HeaderComponent from './Components/HeaderComponent';

function App() {
  return (
    <>
      <Provider store={store}>
        <Router>
          <AppLayout />
        </Router>
      </Provider>
    </>
  );
}

function AppLayout() {
  const location = useLocation();
  const dispatch = useDispatch();
  const noSidebarRoutes = ['/', '/create-profile'];
  const showSidebar = !noSidebarRoutes.includes(location.pathname);

  // Global effect to clear Redux state if no active event
  useEffect(() => {
    const endformId = localStorage.getItem('endformId');
    const currentEventId = localStorage.getItem('currentEventId');
    // Only clear when there is no active create/edit flow at all.
    if (!endformId && !currentEventId) {
      console.log('App - No active event, clearing Redux state');
      dispatch(clearEventData());
    }
  }, [dispatch]);

  return (
    <div className={`min-h-screen ${showSidebar ? 'pl-[88px]' : ''}`}>
      {showSidebar && <HeaderComponent showSidebar={showSidebar} />}

      <main className="relative w-full fade-in-up">
        <div className="mx-auto w-full max-w-[1500px] px-3 py-4 md:px-6 md:py-7">
          <div className="glass-surface rounded-[26px] p-2 md:p-4">
          <InitialRouter />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
