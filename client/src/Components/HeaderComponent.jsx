import { useState, useEffect } from "react";
import {
  FiMenu,
  FiBell,
  FiSettings,
  FiGrid,
  FiPlus,
  FiLogIn,
  FiLayers,
  FiUsers,
} from "react-icons/fi";
import { useDispatch } from "react-redux";
import { resetEventState } from "../redux/EventSlice";
import { CalendarDays } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

const HeaderComponent = ({ showSidebar }) => {
  const [userName, setUserName] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Header component mounted.");
    const token = localStorage.getItem("token");
    const userDept = localStorage.getItem("user_dept");
    
    console.log("HeaderComponent - Token:", token ? 'Present' : 'Missing');
    console.log("HeaderComponent - userDept:", userDept);
    
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        console.log("Decoded token:", decodedToken);
        setUserName(decodedToken.name || "");
        
        // Store department if not already stored
        if (!userDept && decodedToken.dept) {
          localStorage.setItem("user_dept", decodedToken.dept);
        }
        
        console.log("HeaderComponent - Authentication successful, userName:", decodedToken.name);
      } catch (error) {
        console.error("Error decoding token:", error);
        // Clear invalid token
        localStorage.removeItem("token");
        navigate("/");
      }
    } else {
      // Redirect to login if no token
      navigate("/");
    }
  }, [navigate]);

  function initializeLocalStorage() {
    if (!localStorage.getItem("basicEvent")) {
      localStorage.setItem("basicEvent", JSON.stringify({}));
    }
    if (!localStorage.getItem("communicationForm")) {
      localStorage.setItem("communicationForm", JSON.stringify({}));
    }
    if (!localStorage.getItem("transportForm")) {
      localStorage.setItem("transportForm", JSON.stringify([]));
    }
    if (!localStorage.getItem("iqacno")) {
      localStorage.setItem("iqacno", "");
    }

    if (!localStorage.getItem("amenityForm")) {
      localStorage.setItem("amenityForm", JSON.stringify({}));
    }

    if (!localStorage.getItem("guestRoomForm")) {
      localStorage.setItem("guestRoomForm", JSON.stringify({}));
    }

    console.log("Local storage initialized with default forms.");
  }

  function clearLocalStorage() {
    dispatch(resetEventState());
    localStorage.removeItem("basicEvent");
    localStorage.removeItem("communicationForm");
    localStorage.removeItem("transportForm");
    localStorage.removeItem("iqacno");
    localStorage.removeItem("amenityForm");
    localStorage.removeItem("guestRoomForm");
  }

  const navItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: FiGrid,
      action: () => navigate("/dashboard"),
    },
    {
      key: "new",
      label: "New Event",
      icon: FiPlus,
      action: () => {
        clearLocalStorage();
        initializeLocalStorage();
        navigate("/forms");
      },
    },
    {
      key: "calendar",
      label: "Calendar",
      icon: CalendarDays,
      action: () => navigate("/calender"),
    },
    {
      key: "pending",
      label: "Pending",
      icon: FiLayers,
      action: () => navigate("/pending"),
    },
    {
      key: "profile",
      label: "Profile",
      icon: FiUsers,
      action: () => navigate("/profile"),
    },
    {
      key: "logins",
      label: "Create Login",
      icon: FiLogIn,
      action: () => navigate("/create-login"),
    },
  ];

  return (
    <div className="flex">
      {showSidebar && (
        <aside className="fixed left-0 top-0 z-30 h-full w-[88px] border-r border-emerald-900/10 bg-white/85 shadow-lg backdrop-blur-xl">
          <div className="flex h-full flex-col items-center px-3 py-4">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-500 shadow-md">
              <FiGrid
                onClick={() => navigate("/dashboard")}
                className="cursor-pointer text-xl text-white"
                title="Dashboard"
              />
            </div>

            <nav className="flex w-full flex-1 flex-col items-center gap-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active =
                  (item.key === "dashboard" && window.location.pathname === "/dashboard") ||
                  (item.key !== "dashboard" && window.location.pathname.includes(item.key === "new" ? "forms" : item.key));

                return (
                  <button
                    key={item.key}
                    onClick={item.action}
                    title={item.label}
                    className={`group flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 ${
                      active
                        ? "bg-emerald-100 text-emerald-700 shadow-sm"
                        : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                    }`}
                  >
                    <Icon className="text-[20px]" />
                  </button>
                );
              })}
            </nav>

            <div className="mt-3 w-full border-t border-emerald-900/10 pt-3">
              <div className="mx-auto w-[72px] rounded-xl bg-emerald-50/70 p-1">
            <img
              src="https://sece.ac.in/wp-content/uploads/2024/05/clg-logo2-scaled.webp"
              alt="College Logo"
                  className="h-10 w-full object-contain"
              title="College Logo"
            />
              </div>
            </div>
          </div>
        </aside>
      )}

      <div className={`${showSidebar ? "ml-[88px]" : ""} w-full px-4 pt-4 md:px-6 md:pt-6`}>
        <div className="glass-surface mb-2 flex flex-wrap items-center justify-between gap-4 rounded-2xl px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <FiMenu className="text-lg" title="Menu" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-slate-700">
                  Good evening,
                  <span className="font-bold text-emerald-700"> {userName || "User"}</span>
                </p>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                  Event Ops Active
                </span>
              </div>
              <p className="text-xs text-slate-500">Manage requests, forms and approvals in one place.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-900/10 bg-white text-slate-500 hover:text-emerald-700">
              <FiBell className="text-lg" title="Notifications" />
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-900/10 bg-white text-slate-500 hover:text-emerald-700">
              <FiSettings className="text-lg" title="Settings" />
            </button>
            <div className="flex items-center gap-2 rounded-xl border border-emerald-900/10 bg-white px-2 py-1.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700" title="Avatar"></div>
              <span className="text-sm font-medium text-slate-700">Supervisor</span>
              <svg
                className="h-4 w-4 cursor-pointer text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                title="Expand"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderComponent;
