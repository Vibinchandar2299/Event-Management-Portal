export default function checkDepartment(requiredDepartment) {
  return (req, res, next) => {
    if (!req.user || req.user.dept !== requiredDepartment) {
      return res.status(403).json({ message: "Not authorized for this action" });
    }
    next();
  };
} 