import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function getBackendOriginFromApiUrl(apiUrl) {
  if (!apiUrl) return "";
  return String(apiUrl).replace(/\/?api\/?$/i, "").replace(/\/+$/g, "");
}

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

  const backendOrigin = getBackendOriginFromApiUrl(import.meta.env.VITE_API_URL);
  const heroImageSrc = `${backendOrigin}/uploads/Gemini_Generated_Image_rldd7frldd7frldd.png`;

  const GreenBubbleBackdrop = ({ roundedClassName = "" }) => (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${roundedClassName}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-white/60" />
      <div className="absolute inset-0 bg-emerald-50/35" />
      <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-emerald-200/40 blur-2xl" />
      <div className="absolute -bottom-10 -right-10 h-44 w-44 rounded-full bg-emerald-300/30 blur-2xl" />
    </div>
  );

  const HeroIllustration = () => (
    <div className="relative h-full w-full overflow-hidden rounded-3xl bg-emerald-50/40">
      <img
        src={heroImageSrc}
        alt="Login illustration"
        className="h-full w-full object-contain"
        loading="lazy"
        draggable={false}
      />
    </div>
  );

  const AnimatedHero = () => (
    <div className="relative h-full w-full">
      <div className="relative flex h-full flex-col p-0">
        <div className="mx-auto flex h-full w-full max-w-md flex-col px-2 py-2">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-emerald-700/90">
              Event requests • Department coordination
            </p>
            <h3 className="mt-2 text-[22px] font-extrabold tracking-tight text-slate-900">
              Plan together. Approve faster.
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
              One portal to review requests, align departments, and finalize the event flow.
            </p>
          </div>

          <div className="mt-6 flex flex-1 items-start">
            <div className="relative h-[320px] w-full">
              <div className="absolute inset-0 rounded-3xl bg-white/70" aria-hidden="true" />
              <div className="absolute inset-0 p-2">
                <HeroIllustration />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
    <div className="min-h-screen px-4 py-10 sm:py-14">
      <ToastContainer />
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl glass-surface !border-x-0">
        <div className="relative border-b border-slate-200/60 px-6 py-6 sm:px-10">
          <GreenBubbleBackdrop roundedClassName="rounded-t-3xl" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <img
                src="https://sece.ac.in/wp-content/uploads/2024/05/clg-logo2-scaled.webp"
                alt="Sri Eshwar College of Engineering"
                className="h-20 w-auto sm:h-24"
                loading="lazy"
              />
              <div className="leading-tight">
                <p className="text-[11px] font-semibold tracking-wide text-slate-500 sm:text-[12px]">
                  Sri Eshwar College of Engineering
                </p>
                <h1 className="mt-1 text-[18px] font-extrabold tracking-tight text-slate-900 sm:text-[24px]">
                  Sri Eshwar Event Management Portal
                </h1>
              </div>
            </div>
          </div>
        </div>

        <div className="relative grid grid-cols-1 lg:grid-cols-2">
          <GreenBubbleBackdrop roundedClassName="rounded-b-3xl" />

          <div className="relative p-6 sm:p-10">
            <div className="max-w-md">
              <h2 className="text-[28px] font-extrabold tracking-tight text-slate-900 sm:text-[34px]">Welcome back</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
                Login using your official email. If you don’t have login access, contact IQAC.
              </p>

              <form onSubmit={handleSubmit} className="forms-uniform mt-8 space-y-5">
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="name@sece.ac.in"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="username"
                    inputMode="email"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="current-password"
                      className="pr-12"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <FaEyeSlash className="h-4 w-4" />
                      ) : (
                        <FaEye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
                >
                  Login
                </button>
              </form>
            </div>
          </div>

          <div className="hidden lg:block p-6 sm:p-10">
            <div className="h-full">
              <AnimatedHero />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;


