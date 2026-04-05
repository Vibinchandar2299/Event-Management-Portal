import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import events from "../assets/Website setup-rafiki.png";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Map backend department to formType
function mapDeptToFormType(dept) {
  if (!dept) return '';
  const d = String(dept).toLowerCase().trim();
  if (d === 'media' || d === 'communication') return 'communication';
  if (d === 'food') return 'food';
  if (d === 'transport') return 'transport';
  if (d === 'guestroom' || d === 'guest room' || d === 'guest department' || d === 'guest deparment') return 'guestroom';

  // Academic department aliases (match BasicEvent `academicdepartment` values)
  const alnum = d.replace(/[^a-z0-9]/g, '');
  if (alnum === 'aids' || alnum === 'aiandds') return 'ai & ds';
  if (alnum === 'aiml' || alnum === 'aiandml') return 'ai & ml';
  if (alnum === 'cybersecurity' || alnum === 'cyber') return 'cyber';
  if (alnum === 'csbs') return 'csbs';
  if (alnum === 'cse' || alnum === 'computerscienceengineering') return 'cse';
  if (alnum === 'it' || alnum === 'informationtechnology') return 'it';
  if (alnum === 'ece' || alnum === 'electronicsandcommunicationengineering') return 'ece';
  if (alnum === 'eee' || alnum === 'electricalandelectronicsengineering') return 'eee';
  if (alnum === 'mech' || alnum === 'mechanicalengineering') return 'mech';
  if (alnum === 'cce') return 'cce';

  return d; // fallback
}

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/sece/login`,
        {
          emailId: formData.email,
          password: formData.password
        }
      );
      console.log("Login response:", response.data);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user_dept", mapDeptToFormType(response.data.dept));
      console.log("Stored department:", mapDeptToFormType(response.data.dept));
      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error", error);
      if (error.response) {
        toast.error(
          error.response.data.message || "Invalid email or password!"
        );
      } else {
        toast.error("Network error. Please check your connection.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center p-4">
      <ToastContainer />
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-2xl shadow-xl">
        <div className="p-8 lg:p-12">
          <div className="mb-8 h-24">
            <img
              src="https://sece.ac.in/wp-content/uploads/2024/05/clg-logo2-scaled.webp"
              alt="College Logo"
            />
            <h1 className="text-3xl mt-3">
              Welcome to the Events Management Software
            </h1>
          </div>

          <div className="mt-24">
            <div className="mt-36 mb-4">
              <h1 className="text-3xl">Login</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.email}
                onChange={handleChange}
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FaEyeSlash className="text-gray-500" />
                  ) : (
                    <FaEye className="text-gray-500" />
                  )}
                </button>
              </div>

              <div className="mt-10">
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
                >
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="hidden lg:block bg-gradient-to-br rounded-r-2xl">
          <div className="h-[80%] flex flex-col justify-between">
            <img src={events} alt="events" className="w-[90%] h-[100%]" />
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl mt-6 p-6 shadow-lg">
              <h3 className="font-semibold text-gray-800">
                Your data, your rules
              </h3>
              <p className="text-sm text-gray-600">
                Your data belongs to you, and our encryption ensures that
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;


