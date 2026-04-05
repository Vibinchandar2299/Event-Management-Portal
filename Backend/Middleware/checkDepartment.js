function normalizeDepartmentKey(value) {
  if (!value) return "";

  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  // Canonicalize common labels/aliases used across the project
  if (normalized === "media" || normalized === "communication") return "communication";
  if (normalized === "food") return "food";
  if (normalized === "transport") return "transport";
  if (
    normalized === "guestroom" ||
    normalized === "guest room" ||
    normalized === "guest department" ||
    normalized === "guest deparment"
  ) {
    return "guestroom";
  }
  if (normalized === "iqac") return "iqac";
  if (normalized === "systemadmin" || normalized === "system admin") return "system admin";

  return normalized;
}

export default function checkDepartment(requiredDepartment) {
  const requiredList = Array.isArray(requiredDepartment)
    ? requiredDepartment
    : [requiredDepartment];

  const requiredKeys = requiredList.map(normalizeDepartmentKey).filter(Boolean);

  return (req, res, next) => {
    const userKey = normalizeDepartmentKey(req?.user?.dept);
    const allowed = userKey && requiredKeys.includes(userKey);

    if (!allowed) {
      return res.status(403).json({ message: "Not authorized for this action" });
    }

    next();
  };
}