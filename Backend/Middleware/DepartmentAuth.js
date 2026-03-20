function departmentAuthorize(allowedDepartments) {
  return (req, res, next) => {
    const userDept = req.user.dept;
    if (allowedDepartments.includes(userDept)) {
      return next();
    }
    return res.status(403).json({ message: "Access denied: Not authorized for this form" });
  };
}

export default departmentAuthorize;

