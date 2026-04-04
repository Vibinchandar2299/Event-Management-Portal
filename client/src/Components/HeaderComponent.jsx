import { useEffect, useMemo, useState } from "react";
import { FiGrid, FiLayers, FiLogIn, FiLogOut, FiPlus, FiUsers } from "react-icons/fi";
import { CalendarDays, ClipboardList } from "lucide-react";
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
  const [logoFailed, setLogoFailed] = useState(false);

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

    // No-sidebar routes (e.g., login/create-profile) should not be forced back to login here.
    // Auth gating for app pages is handled by `ProtectedRoute`.
    if (!showSidebar) return;

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
  }, [location.pathname, navigate, showSidebar]);

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

  const deptLabel = useMemo(() => {
    const d = String(mapDeptToFormType(deptKey) || "").trim().toLowerCase();
    if (!d) return "USER";

    const labelMap = {
      "ai & ds": "AIDS",
      "ai & ml": "AIML",
      cyber: "CYBER SECURITY",
      guestroom: "GUEST ROOM",
      iqac: "IQAC",
      cse: "CSE",
      it: "IT",
      ece: "ECE",
      eee: "EEE",
      mech: "MECH",
      csbs: "CSBS",
      cce: "CCE",
      food: "FOOD",
      transport: "TRANSPORT",
      communication: "COMMUNICATION",
      media: "COMMUNICATION",
    };

    if (labelMap[d]) return labelMap[d];
    if (d.length <= 5) return d.toUpperCase();

    return d
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ");
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

  const publicLogoUrl = useMemo(() => {
    const baseUrl = import.meta.env.BASE_URL || "/";
    const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    return `${normalizedBase}portal-logo.webp`;
  }, []);

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
    <div className="min-h-screen">
      <aside className="fixed left-0 top-0 z-30 h-full w-56 bg-white shadow-sm border-r border-emerald-900/10">
        <div className="flex h-full flex-col">
          <div className="border-b border-emerald-900/10 px-3 py-5">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              title="Dashboard"
              className="flex w-full flex-col items-center justify-center gap-3"
            >
              <div className="flex w-full items-center justify-center">
                {!logoFailed ? (
                  <img
                    src={publicLogoUrl}
                    alt="Sri Eshwar Logo"
                    className="h-[72px] w-auto max-w-full object-contain"
                    loading="eager"
                    decoding="async"
                    onError={() => setLogoFailed(true)}
                  />
                ) : (
                  <ClipboardList className="h-8 w-8 text-emerald-800" strokeWidth={2.2} />
                )}
              </div>

              <p className="text-center text-[11px] font-semibold tracking-wide text-slate-900">
                Event Management Portal
              </p>
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.key === activeKey;
              return (
                <button
                  key={item.key}
                  onClick={item.action}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                    active
                      ? "bg-emerald-600/10 text-emerald-900 ring-1 ring-emerald-600/20"
                      : "text-slate-700 hover:bg-emerald-600/10 hover:text-emerald-900 hover:ring-1 hover:ring-emerald-600/20"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-900/10 bg-white transition-colors ${
                      active ? "text-emerald-700" : "text-slate-500 group-hover:text-emerald-700"
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
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-rose-50/70 hover:text-rose-700"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-900/10 bg-white text-slate-500">
                <FiLogOut className="text-[18px]" />
              </span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="ml-56 flex min-h-screen flex-col">
        <header className="fixed left-56 right-0 top-0 z-20 h-[88px] bg-white shadow-sm border-b border-emerald-900/10">
          <div className="mx-auto flex h-[88px] w-full max-w-[1500px] items-center justify-between px-4 md:px-6">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-4">
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-emerald-600/10 text-emerald-800 ring-1 ring-emerald-600/20">
                  <ClipboardList className="h-6 w-6" strokeWidth={2.2} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-slate-800 md:text-lg">Sri Eshwar Event Management Portal</p>
                  <p className="truncate text-sm text-slate-500">
                    {isAcademicUser ? "Request & track your department events" : "Manage requests, approvals and events"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-900/10 bg-emerald-50/70 px-4 py-2.5 text-sm font-bold text-emerald-900">
              <span title={userName || deptLabel}>{deptLabel}</span>
            </div>
          </div>
        </header>

        <main className="relative w-full flex-1 pt-[88px] fade-in-up">
          <div className="w-full px-3 py-4 md:px-6 md:py-7">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default HeaderComponent;
