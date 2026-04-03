function departmentAuthorize(allowedDepartments) {
  return (req, res, next) => {
    const normalize = (value) => String(value ?? "").trim().toLowerCase();
    const canonicalize = (dept) => {
      const d = normalize(dept);
      if (!d) return "";

      if (d === "systemadmin") return "system admin";
      if (d === "admin") return "system admin";

      if (d === "guest deparment" || d === "guest department" || d === "guestroom" || d === "guest room") {
        return "guestroom";
      }

      if (d === "media" || d === "communication") return "media";

      return d;
    };

    if (!Array.isArray(allowedDepartments) || allowedDepartments.length === 0) {
      return res.status(500).json({
        message: "Access control misconfigured for this route",
      });
    }

    const userDept = canonicalize(req.user?.dept);
    if (!userDept) {
      return res.status(403).json({ message: "Access denied: Department missing" });
    }

    const allowed = allowedDepartments.map(canonicalize).filter(Boolean);
    if (allowed.includes(userDept)) {
      return next();
    }

    return res.status(403).json({ message: "Access denied: Not authorized for this form" });
  };
}

export default departmentAuthorize;

