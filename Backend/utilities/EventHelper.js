import Signups from "../Schema/Authorization.js";

export const validateUser = async (userId) => {
  const user = await Signups.findById(userId);
  return user ? true : false; 
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
};
