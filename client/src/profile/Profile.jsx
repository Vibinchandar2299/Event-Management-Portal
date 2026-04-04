import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import {
  Bell,
  ClipboardList,
  KeyRound,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";

function Profile() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState({ type: "", message: "" });

  const [ownerForm, setOwnerForm] = useState({ name: "", email: "", phone: "" });
  const [notificationsForm, setNotificationsForm] = useState({ emailsText: "", whatsappsText: "" });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordStatus, setPasswordStatus] = useState({ type: "", message: "" });
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const navigate = useNavigate();

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const apiBase = useMemo(() => {
    const raw = import.meta.env.VITE_API_URL || "/api";
    return String(raw).replace(/\/+$/, "");
  }, []);

  const normalizeDeptKey = (raw) => {
    const d = String(raw || "").trim().toLowerCase();
    if (!d) return "";
    if (d === "media" || d === "communication") return "communication";
    if (d === "food") return "food";
    if (d === "transport") return "transport";
    if (d === "guestroom" || d === "guest room" || d === "guest department" || d === "guest deparment") return "guestroom";
    if (d === "iqac") return "iqac";

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

  const deptLabel = useMemo(() => {
    const key = normalizeDeptKey(account?.dept || localStorage.getItem("user_dept"));
    if (!key) return "USER";

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

    if (labelMap[key]) return labelMap[key];
    if (key.length <= 5) return key.toUpperCase();
    return key
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ");
  }, [account]);

  const accountFlags = useMemo(() => {
    const key = normalizeDeptKey(account?.dept || localStorage.getItem("user_dept"));

    const isIqac = key === "iqac";
    const isAdmin = key.includes("admin") || key === "system admin" || key === "systemadmin";
    const isService = new Set(["communication", "food", "transport", "guestroom"]).has(key);
    const isAcademic = Boolean(key) && !isIqac && !isAdmin && !isService;
    const isShared = !isIqac && !isAdmin;

    const typeLabel = isIqac
      ? "IQAC"
      : isAdmin
        ? "Admin"
        : isService
          ? "Service Department"
          : isAcademic
            ? "Academic Department"
            : "User";

    return { key, isIqac, isAdmin, isService, isAcademic, isShared, typeLabel };
  }, [account]);

  const tokenMeta = useMemo(() => {
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      const exp = decoded?.exp ? new Date(decoded.exp * 1000) : null;
      const iat = decoded?.iat ? new Date(decoded.iat * 1000) : null;
      return { exp, iat };
    } catch {
      return null;
    }
  }, [token]);

  useEffect(() => {
    const fetchAccount = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(`${apiBase}/sece/me`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        const data = response?.data || null;
        setAccount(data);

        setOwnerForm({
          name: data?.accountOwner?.name || "",
          email: data?.accountOwner?.email || "",
          phone: data?.accountOwner?.phone || "",
        });

        const emails = Array.isArray(data?.notifications?.emails) ? data.notifications.emails : [];
        const whatsapps = Array.isArray(data?.notifications?.whatsapps) ? data.notifications.whatsapps : [];
        setNotificationsForm({
          emailsText: emails.join("\n"),
          whatsappsText: whatsapps.join("\n"),
        });
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || "Failed to fetch account data";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, [apiBase, token]);

  const handleCreateEvent = () => {
    localStorage.setItem('startNewFlow', 'true');
    navigate('/forms/basic');
  };

  const handleManageEvents = () => {
    navigate('/event-requests');
  };

  const helperText = (text) => <p className="mt-1 text-sm text-slate-500">{text}</p>;

  const splitLines = (text) =>
    String(text || "")
      .split(/\r?\n/g)
      .map((v) => String(v || "").trim())
      .filter(Boolean);

  const handleSaveSettings = async () => {
    setSaveStatus({ type: "", message: "" });
    if (!token) {
      setSaveStatus({ type: "error", message: "You are not logged in" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        accountOwnerName: ownerForm.name,
        accountOwnerEmail: ownerForm.email,
        accountOwnerPhone: ownerForm.phone,
        notificationEmails: splitLines(notificationsForm.emailsText),
        notificationWhatsappNumbers: splitLines(notificationsForm.whatsappsText),
      };

      const response = await axios.put(`${apiBase}/sece/account-settings`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updated = response?.data || {};
      setSaveStatus({ type: "success", message: updated.message || "Saved" });

      setAccount((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          accountOwner: updated.accountOwner || prev.accountOwner,
          notifications: updated.notifications || prev.notifications,
          updatedAt: updated.updatedAt || prev.updatedAt,
        };
      });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to save settings";
      setSaveStatus({ type: "error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordStatus({ type: "", message: "" });
    if (!token) {
      setPasswordStatus({ type: "error", message: "You are not logged in" });
      return;
    }

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordStatus({ type: "error", message: "Enter current and new password" });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordStatus({ type: "error", message: "New password must be at least 6 characters" });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordStatus({ type: "error", message: "New password does not match" });
      return;
    }

    setChangingPassword(true);
    try {
      const response = await axios.post(
        `${apiBase}/sece/change-password`,
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPasswordStatus({ type: "success", message: response?.data?.message || "Password updated" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to update password";
      setPasswordStatus({ type: "error", message: msg });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-700">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/80 p-6 text-slate-800">
          <div className="text-lg font-semibold">Couldn’t load account</div>
          <div className="mt-1 text-sm text-slate-600">{error}</div>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/80 p-5 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Account &amp; Settings</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-600/20">
                {deptLabel}
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                {accountFlags.typeLabel}
              </span>
              {accountFlags.isShared && (
                <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                  Shared account
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleCreateEvent}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              New Event
            </button>
            <button
              type="button"
              onClick={handleManageEvents}
              className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-600/25 hover:bg-emerald-50"
            >
              Event Requests
            </button>
          </div>
        </div>

        {accountFlags.isShared && (
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700" />
              <div className="text-sm text-slate-700">
                <div className="font-semibold text-slate-900">Shared account guidance</div>
                <div className="mt-1 text-slate-600">
                  Avoid sharing the password in public groups. If the password is changed, inform the department/service owner.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Account */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/80 p-5 md:p-6">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-slate-900">Account</h2>
          </div>
          {helperText("Basic identity for this login.")}

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-slate-500">Department / Role</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{deptLabel}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">Account Type</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{accountFlags.typeLabel}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">Login Email</div>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-800">
                <Mail className="h-4 w-4 text-slate-500" />
                <span className="break-all">{account?.emailId || "—"}</span>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">Contact Number</div>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-800">
                <Phone className="h-4 w-4 text-slate-500" />
                <span>{account?.phoneNumber || "—"}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="text-xs font-semibold text-slate-500">Token</div>
            <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <div className="text-xs text-slate-500">Issued</div>
                <div className="text-sm font-semibold text-slate-800">
                  {tokenMeta?.iat ? tokenMeta.iat.toLocaleString() : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Expires</div>
                <div className="text-sm font-semibold text-slate-800">
                  {tokenMeta?.exp ? tokenMeta.exp.toLocaleString() : "—"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/80 p-5 md:p-6">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-slate-900">Permissions</h2>
          </div>
          {helperText("Read-only summary of what this account can do.")}

          <div className="mt-4 space-y-2 text-sm text-slate-700">
            {accountFlags.isAcademic && (
              <>
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-600/60" />
                  <span>Create new event requests (New Event flow)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-600/60" />
                  <span>Track status in Event Requests</span>
                </div>
              </>
            )}
            {accountFlags.isService && (
              <>
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-600/60" />
                  <span>Review and approve requests for your service department</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-600/60" />
                  <span>Use Calendar and department dashboards (where enabled)</span>
                </div>
              </>
            )}
            {accountFlags.isIqac && (
              <>
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-600/60" />
                  <span>View all event requests and approve after other departments</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-600/60" />
                  <span>Create logins (Create Login)</span>
                </div>
              </>
            )}
            {accountFlags.isAdmin && (
              <>
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-600/60" />
                  <span>System administration access (as configured)</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Owner + Notifications */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/80 p-5 md:p-6 lg:col-span-2">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-emerald-700" />
                <h2 className="text-lg font-bold text-slate-900">Owner &amp; Notifications</h2>
              </div>
              {helperText("Use this to keep shared account ownership and notification recipients up to date.")}
            </div>

            <div className="flex items-center gap-2">
              {saveStatus.message ? (
                <span
                  className={`text-sm font-semibold ${
                    saveStatus.type === "success" ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {saveStatus.message}
                </span>
              ) : null}
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveSettings}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <div className="text-sm font-semibold text-slate-900">Account Owner</div>
              {helperText("Who maintains this login (recommended for shared accounts).")}

              <div className="mt-3 space-y-3">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500">Owner Name</span>
                  <input
                    value={ownerForm.name}
                    onChange={(e) => setOwnerForm((p) => ({ ...p, name: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-600/10"
                    placeholder="e.g., Dept Coordinator"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500">Owner Email</span>
                  <input
                    value={ownerForm.email}
                    onChange={(e) => setOwnerForm((p) => ({ ...p, email: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-600/10"
                    placeholder="e.g., coordinator@sece.ac.in"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500">Owner Phone</span>
                  <input
                    value={ownerForm.phone}
                    onChange={(e) => setOwnerForm((p) => ({ ...p, phone: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-600/10"
                    placeholder="e.g., +91..."
                  />
                </label>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="text-sm font-semibold text-slate-900">Notification Recipients</div>
              {helperText("Enter one per line. These are used for alerts and escalations (if/when enabled).")}

              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500">Emails</span>
                  <textarea
                    rows={7}
                    value={notificationsForm.emailsText}
                    onChange={(e) => setNotificationsForm((p) => ({ ...p, emailsText: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-600/10"
                    placeholder="dept@sece.ac.in\ncoordinator@sece.ac.in"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500">WhatsApp Numbers</span>
                  <textarea
                    rows={7}
                    value={notificationsForm.whatsappsText}
                    onChange={(e) => setNotificationsForm((p) => ({ ...p, whatsappsText: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-600/10"
                    placeholder="+9198xxxxxxx\n+9197xxxxxxx"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/80 p-5 md:p-6 lg:col-span-2">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-slate-900">Security</h2>
          </div>
          {helperText("Change the password for this login.")}

          <form onSubmit={handleChangePassword} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="block">
              <span className="text-xs font-semibold text-slate-500">Current Password</span>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-600/10"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500">New Password</span>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-600/10"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500">Confirm New Password</span>
              <input
                type="password"
                value={passwordForm.confirmNewPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, confirmNewPassword: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-600/10"
              />
            </label>

            <div className="md:col-span-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div
                className={`text-sm font-semibold ${
                  passwordStatus.type === "success"
                    ? "text-emerald-700"
                    : passwordStatus.type === "error"
                      ? "text-rose-700"
                      : "text-slate-500"
                }`}
              >
                {passwordStatus.message || ""}
              </div>
              <button
                type="submit"
                disabled={changingPassword}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                <ShieldCheck className="h-4 w-4" />
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
