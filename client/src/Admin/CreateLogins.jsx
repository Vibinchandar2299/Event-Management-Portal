import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const DEFAULT_PASSWORD = "sece@123";

function CreateLogins() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const apiBase = useMemo(() => {
    const raw = import.meta.env.VITE_API_URL || "/api";
    return String(raw).replace(/\/+$/, "");
  }, []);

  const authHeaders = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  }, [token]);

  const departmentOptions = useMemo(
    () => [
      { value: "iqac", label: "IQAC" },
      { value: "system admin", label: "System Admin" },
      { value: "communication", label: "Communication" },
      { value: "food", label: "Food" },
      { value: "transport", label: "Transport" },
      { value: "guestroom", label: "Guest Room" },
      { value: "cse", label: "CSE" },
      { value: "it", label: "IT" },
      { value: "ece", label: "ECE" },
      { value: "eee", label: "EEE" },
      { value: "mech", label: "MECH" },
      { value: "csbs", label: "CSBS" },
      { value: "cce", label: "CCE" },
      { value: "ai & ds", label: "AI & DS" },
      { value: "ai & ml", label: "AI & ML" },
      { value: "cyber", label: "Cyber Security" },
    ],
    []
  );

  const designationOptions = useMemo(
    () => [
      { value: "", label: "Select designation (optional)" },
      { value: "Shared Account", label: "Shared Account" },
      { value: "HOD", label: "HOD" },
      { value: "Professor", label: "Professor" },
      { value: "Coordinator", label: "Coordinator" },
      { value: "System Admin", label: "System Admin" },
      { value: "IQAC", label: "IQAC" },
      { value: "Food", label: "Food" },
      { value: "Transport", label: "Transport" },
      { value: "Communication", label: "Communication" },
      { value: "Guest Room", label: "Guest Room" },
      { value: "Media", label: "Media" },
    ],
    []
  );

  const [createForm, setCreateForm] = useState({
    name: "",
    emailId: "",
    password: DEFAULT_PASSWORD,
    phoneNumber: "",
    designation: "",
    dept: "",
    empid: "",
  });

  const [creating, setCreating] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [search, setSearch] = useState("");
  const [rowBusyId, setRowBusyId] = useState("");
  const [removeConfirmId, setRemoveConfirmId] = useState("");

  const inputBaseClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-600";

  const surfaceClass = "bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/80";

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersError("");
    try {
      const response = await axios.get(`${apiBase}/sece/admin/users`, {
        headers: authHeaders,
      });

      const list = Array.isArray(response.data?.users) ? response.data.users : [];
      setUsers(list);
    } catch (error) {
      console.error("Error fetching users", error);
      setUsers([]);
      setUsersError(error.response?.data?.message || "Failed to load logins");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      const hay = [u.name, u.emailId, u.phoneNumber, u.dept, u.designation, u.empid]
        .map((v) => String(v || "").toLowerCase())
        .join(" | ");
      return hay.includes(q);
    });
  }, [users, search]);

  const handleCreateChange = (e) => {
    setCreateForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const payload = {
      name: String(createForm.name || "").trim(),
      emailId: String(createForm.emailId || "").trim(),
      phoneNumber: String(createForm.phoneNumber || "").trim(),
      dept: String(createForm.dept || "").trim(),
      password: String(createForm.password || DEFAULT_PASSWORD),
      designation: String(createForm.designation || "").trim(),
      empid: String(createForm.empid || "").trim(),
    };

    if (!payload.name || !payload.emailId || !payload.phoneNumber || !payload.dept) {
      toast.error("Please fill Name, Email, Phone, and Department");
      return;
    }
    if (!authHeaders) {
      toast.error("Missing login token. Please login again.");
      return;
    }

    try {
      setCreating(true);
      await axios.post(`${apiBase}/sece/admin/create-login`, payload, {
        headers: authHeaders,
      });
      toast.success("Login created successfully");
      setCreateForm({
        name: "",
        emailId: "",
        password: DEFAULT_PASSWORD,
        phoneNumber: "",
        designation: "",
        dept: "",
        empid: "",
      });
      await fetchUsers();
    } catch (error) {
      console.error("Error creating login", error);
      toast.error(error.response?.data?.message || "Failed to create login");
    } finally {
      setCreating(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select an Excel file");
      return;
    }
    if (!authHeaders) {
      toast.error("Missing login token. Please login again.");
      return;
    }

    const body = new FormData();
    body.append("file", file);

    try {
      setUploading(true);
      const response = await axios.post(`${apiBase}/sece/admin/upload-excel`, body, {
        headers: {
          ...authHeaders,
          "Content-Type": "multipart/form-data",
        },
      });

      const created = response.data?.created;
      const processed = response.data?.processedRows;
      toast.success(
        typeof created === "number" && typeof processed === "number"
          ? `Excel uploaded: ${created} created (${processed} processed)`
          : "Excel uploaded successfully"
      );
      setFile(null);
      await fetchUsers();
    } catch (error) {
      console.error("Error uploading file", error);
      toast.error(error.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleToggleBlock = async (user) => {
    if (!user?._id) return;
    if (!authHeaders) {
      toast.error("Missing login token. Please login again.");
      return;
    }

    const nextActive = user.isActive === false;

    if (rowBusyId) return;
    setRowBusyId(user._id);

    try {
      await axios.patch(
        `${apiBase}/sece/admin/users/${user._id}/status`,
        { isActive: nextActive },
        { headers: authHeaders }
      );
      toast.success(nextActive ? "Account unblocked" : "Account blocked");
      await fetchUsers();
    } catch (error) {
      console.error("Error updating status", error);
      toast.error(error.response?.data?.message || "Failed to update account status");
    } finally {
      setRowBusyId("");
    }
  };

  const handleRemoveUser = async (user) => {
    if (!user?._id) return;
    if (!authHeaders) {
      toast.error("Missing login token. Please login again.");
      return;
    }

    if (rowBusyId) return;

    if (removeConfirmId !== user._id) {
      setRemoveConfirmId(user._id);
      return;
    }

    setRowBusyId(user._id);

    try {
      await axios.delete(`${apiBase}/sece/admin/users/${user._id}`, {
        headers: authHeaders,
      });
      toast.success("Account removed");
      setRemoveConfirmId("");
      await fetchUsers();
    } catch (error) {
      console.error("Error removing user", error);
      toast.error(error.response?.data?.message || "Failed to remove account");
    } finally {
      setRowBusyId("");
    }
  };

  return (
    <main className="mx-auto w-full max-w-[1500px] px-3 py-4 md:px-6 md:py-7 fade-in-up">
      <ToastContainer />

      <div className="space-y-5">
        <section className={`${surfaceClass} p-5 md:p-6`}>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Create Login</h1>
              <p className="text-sm text-slate-600">
                IQAC can create shared logins for departments and service teams.
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className={`${surfaceClass} p-5 md:p-6`}>
            <h2 className="text-base font-semibold text-slate-900">Create a single login</h2>
            <p className="mt-1 text-sm text-slate-600">Default password is set to {DEFAULT_PASSWORD} (you can change it).</p>

            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Department</label>
                  <select
                    name="dept"
                    value={createForm.dept}
                    onChange={handleCreateChange}
                    className={inputBaseClass}
                  >
                    <option value="">Select department</option>
                    {departmentOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Designation (optional)</label>
                  <select
                    name="designation"
                    value={createForm.designation}
                    onChange={handleCreateChange}
                    className={inputBaseClass}
                  >
                    {designationOptions.map((opt) => (
                      <option key={opt.value || opt.label} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Account name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Eg: CSE Shared Login"
                  className={inputBaseClass}
                  value={createForm.name}
                  onChange={handleCreateChange}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Email</label>
                  <input
                    type="email"
                    name="emailId"
                    placeholder="Eg: cse.events@sece.ac.in"
                    className={inputBaseClass}
                    value={createForm.emailId}
                    onChange={handleCreateChange}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Phone</label>
                  <input
                    type="text"
                    name="phoneNumber"
                    placeholder="10-digit number"
                    className={inputBaseClass}
                    value={createForm.phoneNumber}
                    onChange={handleCreateChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Employee ID (optional)</label>
                  <input
                    type="text"
                    name="empid"
                    placeholder="Eg: SECE123"
                    className={inputBaseClass}
                    value={createForm.empid}
                    onChange={handleCreateChange}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Password</label>
                  <input
                    type="text"
                    name="password"
                    className={inputBaseClass}
                    value={createForm.password}
                    onChange={handleCreateChange}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {creating ? "Creating…" : "Create login"}
              </button>
            </form>
          </div>

          <div className={`${surfaceClass} p-5 md:p-6`}>
            <h2 className="text-base font-semibold text-slate-900">Bulk upload (Excel / CSV)</h2>
            <p className="mt-1 text-sm text-slate-600">
              Columns supported: <span className="font-semibold">name, emailId, dept, phoneNumber, designation, empid</span>.
              Existing emails are skipped.
            </p>

            <div className="mt-4 space-y-3">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className={inputBaseClass}
              />

              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {uploading ? "Uploading…" : "Upload Excel"}
              </button>
            </div>
          </div>
        </section>

        <section className={`${surfaceClass} overflow-hidden`}>
          <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-slate-50/70 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Existing logins</h2>
              <p className="text-sm text-slate-600">
                {usersLoading ? "Loading…" : `Showing ${filteredUsers.length} of ${users.length}`}
              </p>
            </div>

            <div className="w-full md:max-w-sm">
              <label className="sr-only">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, dept…"
                className={inputBaseClass}
              />
            </div>
          </div>

          <div className="px-5 py-4 md:px-6">
            {usersError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {usersError}
              </div>
            ) : null}

            <div className="mt-3 overflow-x-auto rounded-xl ring-1 ring-slate-200/80">
              <table className="min-w-full divide-y divide-slate-200/80 bg-white text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Designation</th>
                    <th className="px-4 py-3">Emp ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200/70">
                  {usersLoading ? (
                    <tr>
                      <td className="px-4 py-4 text-slate-600" colSpan={8}>
                        Loading logins…
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td className="px-4 py-4 text-slate-600" colSpan={8}>
                        No logins found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u._id || u.emailId} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-semibold text-slate-900">{u.dept || "—"}</td>
                        <td className="px-4 py-3 text-slate-800">{u.name || "—"}</td>
                        <td className="px-4 py-3 text-slate-800">{u.emailId || "—"}</td>
                        <td className="px-4 py-3 text-slate-700">{u.phoneNumber || "—"}</td>
                        <td className="px-4 py-3 text-slate-700">{u.designation || "—"}</td>
                        <td className="px-4 py-3 text-slate-700">{u.empid || "—"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                              u.isActive === false
                                ? "bg-rose-50 text-rose-700 ring-rose-200"
                                : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            }`}
                          >
                            {u.isActive === false ? "Blocked" : "Active"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleBlock(u)}
                              disabled={Boolean(rowBusyId)}
                              className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 transition ${
                                u.isActive === false
                                  ? "bg-white text-emerald-700 ring-emerald-200 hover:bg-emerald-50"
                                  : "bg-white text-rose-700 ring-rose-200 hover:bg-rose-50"
                              } disabled:cursor-not-allowed disabled:opacity-60`}
                            >
                              {rowBusyId === u._id
                                ? "Updating…"
                                : u.isActive === false
                                  ? "Unblock"
                                  : "Block"}
                            </button>

                            {removeConfirmId === u._id ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveUser(u)}
                                  disabled={rowBusyId === u._id}
                                  className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {rowBusyId === u._id ? "Removing…" : "Confirm Remove"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRemoveConfirmId("")}
                                  disabled={Boolean(rowBusyId)}
                                  className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRemoveUser(u)}
                                disabled={Boolean(rowBusyId)}
                                className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default CreateLogins;
