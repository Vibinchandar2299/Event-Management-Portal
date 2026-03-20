import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function CreateProfile() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    dept: "",
    password: "",
    phoneNumber: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/sece/signup`,
        {
          name: formData.name,
          emailId: formData.email,
          dept: formData.dept,
          password: formData.password,
          phoneNumber: formData.phoneNumber,
        }
      );
      toast.success("Profile created!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create profile"
      );
    }
  };

  return (
    <div>
      <ToastContainer />
      <h2>Create Profile</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" required />
        <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" required />
        <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Password" required />
        <input name="dept" value={formData.dept} onChange={handleChange} placeholder="Department" required />
        <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="Phone Number" required />
        <button type="submit">Create Profile</button>
      </form>
    </div>
  );
}

export default CreateProfile;
