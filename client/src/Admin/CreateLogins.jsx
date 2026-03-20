import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function CreateLogins() {
  const [formData, setFormData] = useState({
    name: "",
    emailId: "",
    password: "sece@123",
    phoneNumber: "",
    designation: "",
    dept: "",
  });
  const [file, setFile] = useState(null);
  const navigate = useNavigate();
  const designations = [
    "Media",
    "Food",
    "Transport",
    "Guest Deparment",
    "System Admin",
    "IQAC",
    "Professor",
    "HOD",
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  const getallstaffs = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/sece/getallstaffs`
      );
      console.log("response on fetched the  Staffs : ", response.data);
    } catch (error) {
      console.error("Error", error);
      toast.error(error.response?.data?.message || "Signup failed!");
    }
  };
  useEffect(() => {
    getallstaffs();
  }, []);
  const handleSubmit = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/sece/signup`, formData);
      toast.success("Created the Login!");
    } catch (error) {
      console.error("Error", error);
      toast.error(error.response?.data?.message || "Signup failed!");
    }
  };
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };
  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select an Excel file.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/sece/upload-excel`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log("response : ", response.data);
      toast.success("Excel file uploaded successfully!");
    } catch (error) {
      console.error("Error uploading file", error);
      toast.error(error.response?.data?.message || "Upload failed!");
    }
  };

  return (
    <div className="flex flex-col items-center p-4 ml-20">
      <ToastContainer />
      <div className="w-full  bg-white rounded-2xl p-8 shadow-lg">
        <h1 className="text-3xl mb-6 text-center">Create Account</h1>

        <input
          type="text"
          name="name"
          placeholder="Your Name"
          className="w-full px-4 py-3 mb-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
          value={formData.name}
          onChange={handleChange}
        />
        <input
          type="text"
          name="dept"
          placeholder="Enter Department"
          className="w-full px-4 py-3 mb-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
          value={formData.dept}
          onChange={handleChange}
        />

        <input
          type="email"
          name="emailId"
          placeholder="Your Email"
          className="w-full px-4 py-3 mb-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
          value={formData.emailId}
          onChange={handleChange}
        />

        <input
          type="text"
          name="phoneNumber"
          placeholder="Phone Number"
          className="w-full px-4 py-3 mb-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
          value={formData.phoneNumber}
          onChange={handleChange}
        />

        <select
          name="designation"
          className="w-full px-4 py-3 mb-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
          value={formData.designation}
          onChange={handleChange}
        >
          {designations.map((designation) => (
            <option key={designation} value={designation}>
              {designation}
            </option>
          ))}
        </select>

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
        >
          Sign Up
        </button>

        <button
          onClick={() => navigate("/dashboard")}
          className="w-full bg-gray-600 text-white py-3 mt-4 rounded-lg font-semibold hover:bg-gray-700 transition duration-300"
        >
          Go to Dashboard
        </button>

        <div className="mt-6">
          <h2 className="text-xl mb-2 text-center">Upload Excel Sheet</h2>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="w-full px-4 py-3 mb-4 rounded-lg border border-gray-300"
          />
          <button
            onClick={handleUpload}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-300"
          >
            Upload Excel
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateLogins;
