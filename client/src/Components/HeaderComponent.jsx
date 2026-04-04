import { useEffect, useMemo, useState } from "react";
import { FiGrid, FiLayers, FiLogIn, FiLogOut, FiPlus, FiUsers } from "react-icons/fi";
import { CalendarDays } from "lucide-react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import { resetEventState } from "../redux/EventSlice";

const HeaderComponent = ({ showSidebar, children }) => {
  const [userName, setUserName] = useState("");
  const [deptKey, setDeptKey] = useState(() => {
    const dept = localStorage.getItem("user_dept");
    return dept ? String(dept) : "";
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const mapDeptToFormType = (dept) => {
    if (!dept) return "";
    const d = String(dept).toLowerCase().trim();
    if (d === "media" || d === "communication") return "communication";
    if (d === "food") return "food";
    if (d === "transport") return "transport";
    if (d === "guestroom" || d === "guest room" || d === "guest department" || d === "guest deparment") return "guestroom";
    if (d === "iqac") return "iqac";

    // Academic department aliases (match BasicEvent `academicdepartment` values)
    const alnum = d.replace(/[^a-z0-9]/g, "");
    if (alnum === "aids" || alnum === "aiandds") return "ai & ds";
    if (alnum === "aiml" || alnum === "aiandml") return "ai & ml";
    if (alnum === "cybersecurity" || alnum === "cyber") return "cyber";
    if (alnum === "csbs") return "csbs";
    if (alnum === "cse" || alnum === "computerscienceengineering") return "cse";
    if (alnum === "it" || alnum === "informationtechnology") return "it";
    if (alnum === "ece" || alnum === "electronicsandcommunicationengineering") return "ece";
    if (alnum === "eee" || alnum === "electricalandelectronicsengineering") return "eee";
    if (alnum === "mech" || alnum === "mechanicalengineering") return "mech";
    if (alnum === "cce") return "cce";

    return d;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedDept = localStorage.getItem("user_dept");

    if (!token) {
      if (location.pathname !== "/") navigate("/");
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      setUserName(decodedToken.name || "");

      const nextDept = mapDeptToFormType(storedDept || decodedToken.dept);
      if (nextDept) {
        localStorage.setItem("user_dept", nextDept);
        setDeptKey(nextDept);
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user_dept");
      navigate("/");
    }
  }, [location.pathname, navigate]);

  function initializeLocalStorage() {
    if (!localStorage.getItem("basicEvent")) localStorage.setItem("basicEvent", JSON.stringify({}));
    if (!localStorage.getItem("communicationForm")) localStorage.setItem("communicationForm", JSON.stringify({}));
    if (!localStorage.getItem("transportForm")) localStorage.setItem("transportForm", JSON.stringify([]));
    if (!localStorage.getItem("iqacno")) localStorage.setItem("iqacno", "");
    if (!localStorage.getItem("amenityForm")) localStorage.setItem("amenityForm", JSON.stringify({}));
    if (!localStorage.getItem("guestRoomForm")) localStorage.setItem("guestRoomForm", JSON.stringify({}));
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

  const handleLogout = () => {
    try {
      dispatch(resetEventState());
    } catch {
      // ignore
    }

    // Clear auth + flow state
    [
      "token",
      "user_dept",
      "basicEvent",
      "communicationForm",
      "transportForm",
      "iqacno",
      "amenityForm",
      "guestRoomForm",
      "foodForm",
      "foodFormId",
      "guestRoomFormId",
      "transportFormId",
      "communicationFormId",
      "basicEventId",
      "currentEventId",
      "currentEventData",
      "common_data",
      "endformId",
      "isEditMode",
      "activeCreateFlow",
      "activeCreateFlowAt",
      "foodFlowAccess",
      "foodFlowAccessAt",
    ].forEach((k) => localStorage.removeItem(k));

    [
      "formsFlowActive",
      "editFlowActive",
      "editFlowEndformId",
      "createFlowEventId",
      "basicDraft",
      "basicDraftOrganizers",
      "basicDraftResourcePersons",
    ].forEach((k) => sessionStorage.removeItem(k));

    navigate("/");
  };

  const isAcademicUser = useMemo(() => {
    const dept = mapDeptToFormType(deptKey);
    const d = String(dept || "").trim().toLowerCase();
    if (!d) return false;

    const collegeWide = new Set(["iqac", "admin", "system admin", "systemadmin"]);
    const serviceTeams = new Set([
      "communication",
      "media",
      "food",
      "transport",
      "guestroom",
      "guest room",
      "guest department",
      "guest deparment",
    ]);

    if (collegeWide.has(d)) return false;
    if (serviceTeams.has(d)) return false;
    if (d.includes("admin")) return false;
    return true;
  }, [deptKey]);

  const isIqacUser = useMemo(() => {
    const d = String(mapDeptToFormType(deptKey) || "").toLowerCase().trim();
    return d === "iqac";
  }, [deptKey]);

  const navItems = useMemo(() => {
    const base = [
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
        key: "pending",
        label: isAcademicUser ? "Event Management" : "Pending",
        icon: FiLayers,
        action: () => navigate("/pending"),
      },
    ];

    if (!isAcademicUser) {
      base.push(
        {
          key: "calendar",
          label: "Calendar",
          icon: CalendarDays,
          action: () => navigate("/calender"),
        },
        {
          key: "profile",
          label: "Profile",
          icon: FiUsers,
          action: () => navigate("/profile"),
        }
      );
    }

    if (isIqacUser) {
      base.push({
        key: "logins",
        label: "Create Login",
        icon: FiLogIn,
        action: () => navigate("/create-login"),
      });
    }

    return base;
  }, [isAcademicUser, isIqacUser, navigate]);

  const activeKey = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith("/dashboard")) return "dashboard";
    if (path.startsWith("/forms")) return "new";
    if (path.startsWith("/pending")) return "pending";
    if (path.startsWith("/calender")) return "calendar";
    if (path.startsWith("/profile")) return "profile";
    if (path.startsWith("/create-login")) return "logins";
    return "";
  }, [location.pathname]);

  // No-sidebar routes keep the same content padding but without sidebar/header.
  if (!showSidebar) {
    return (
      <main className="relative w-full fade-in-up">
        <div className="mx-auto w-full max-w-[1500px] px-3 py-4 md:px-6 md:py-7">
          <div className="glass-surface rounded-[26px] p-2 md:p-4">{children}</div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="fixed left-0 top-0 z-30 h-full w-64 border-r border-emerald-900/10 bg-white/90 backdrop-blur-xl">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-3 border-b border-emerald-900/10 px-4">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-500"
              title="Dashboard"
              onClick={() => navigate("/dashboard")}
              role="button"
              tabIndex={0}
            >
              <FiGrid className="text-xl text-white" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">Event Management</p>
              <p className="truncate text-xs text-slate-500">Portal</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.key === activeKey;
              return (
                <button
                  key={item.key}
                  onClick={item.action}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-emerald-100 text-emerald-800"
                      : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                      active
                        ? "border-emerald-900/10 bg-white text-emerald-700"
                        : "border-emerald-900/10 bg-white text-slate-500"
                    }`}
                  >
                    <Icon className="text-[18px]" />
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="border-t border-emerald-900/10 p-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-900/10 bg-white text-slate-500">
                <FiLogOut className="text-[18px]" />
              </span>
              <span>Logout</span>
            </button>

            <div className="mt-3 flex items-center justify-center rounded-xl bg-emerald-50/70 p-2">
              <img
                src="https://sece.ac.in/wp-content/uploads/2024/05/clg-logo2-scaled.webp"
                alt="College Logo"
                className="h-9 w-full object-contain"
                title="College Logo"
              />
            </div>
          </div>
        </div>
      </aside>

      <div className="ml-64 flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 h-16 border-b border-emerald-900/10 bg-white/85 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full max-w-[1500px] items-center justify-between px-4 md:px-6">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">Event Management Portal</p>
              <p className="truncate text-xs text-slate-500">
                {isAcademicUser ? "Request & track your department events" : "Manage requests, approvals and events"}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-900/10 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
              {userName || "User"}
            </div>
          </div>
        </header>

        <main className="relative w-full flex-1 fade-in-up">
          <div className="mx-auto w-full max-w-[1500px] px-3 py-4 md:px-6 md:py-7">
            <div className="glass-surface rounded-[26px] p-2 md:p-4">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HeaderComponent;
