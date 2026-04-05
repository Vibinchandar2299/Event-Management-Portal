import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
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

  const HeroIllustration = () => (
    <svg
      viewBox="0 0 560 520"
      role="img"
      aria-label="People discussing an event request"
      className="h-full w-full"
    >
      <defs>
        <linearGradient id="seceBrand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--bg-accent)" />
          <stop offset="1" stopColor="var(--bg)" />
        </linearGradient>
      </defs>

      <rect x="40" y="40" width="480" height="440" rx="36" fill="url(#seceBrand)" />

      {/* Title */}
      <text x="120" y="110" fill="var(--text)" opacity="0.78" fontSize="18" fontWeight="700">
        Event Discussion
      </text>
      <text x="120" y="136" fill="var(--text)" opacity="0.5" fontSize="12" fontWeight="600">
        Request • Plan • Approve
      </text>

      {/* Central event card */}
      <g>
        <rect x="120" y="160" width="320" height="150" rx="28" fill="var(--surface)" opacity="0.88" />
        <rect x="144" y="184" width="220" height="14" rx="7" fill="var(--text)" opacity="0.16" />
        <text x="144" y="198" fill="var(--text)" opacity="0.78" fontSize="12" fontWeight="700">
          Event Request
        </text>

        <rect x="144" y="214" width="254" height="10" rx="5" fill="var(--text)" opacity="0.1" />
        <rect x="144" y="236" width="210" height="10" rx="5" fill="var(--text)" opacity="0.08" />
        <rect x="144" y="258" width="170" height="10" rx="5" fill="var(--text)" opacity="0.08" />

        {/* Mini calendar icon */}
        <g transform="translate(360 196)" fill="none" stroke="var(--brand)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
          <rect x="0" y="0" width="52" height="52" rx="16" fill="var(--surface)" opacity="0.75" />
          <path d="M12 18h28" />
          <path d="M16 28h0" />
          <path d="M26 28h0" />
          <path d="M36 28h0" />
          <path d="M18 38h0" />
          <path d="M28 38h0" />
        </g>
      </g>

      {/* People */}
      <g>
        {/* Left person */}
        <circle cx="160" cy="350" r="22" fill="var(--surface)" opacity="0.92" />
        <path d="M128 412c6-24 22-38 32-38s26 14 32 38" fill="var(--surface)" opacity="0.86" />
        <circle cx="160" cy="350" r="22" fill="none" stroke="var(--brand)" strokeWidth="10" opacity="0.6" />

        {/* Middle person */}
        <circle cx="280" cy="340" r="26" fill="var(--surface)" opacity="0.96" />
        <path d="M238 420c8-30 28-46 42-46s34 16 42 46" fill="var(--surface)" opacity="0.9" />
        <circle cx="280" cy="340" r="26" fill="none" stroke="var(--brand)" strokeWidth="10" opacity="0.7" />

        {/* Right person */}
        <circle cx="400" cy="350" r="22" fill="var(--surface)" opacity="0.92" />
        <path d="M368 412c6-24 22-38 32-38s26 14 32 38" fill="var(--surface)" opacity="0.86" />
        <circle cx="400" cy="350" r="22" fill="none" stroke="var(--brand)" strokeWidth="10" opacity="0.6" />
      </g>

      {/* Speech bubbles with animated dots */}
      <g>
        {/* bubble 1 */}
        <g transform="translate(120 300)">
          <rect x="0" y="0" width="120" height="54" rx="18" fill="var(--surface)" opacity="0.9" />
          <path d="M22 54l14-10" fill="var(--surface)" opacity="0.9" />
          <text x="16" y="22" fill="var(--text)" opacity="0.6" fontSize="11" fontWeight="700">Discuss</text>
          <g fill="var(--brand)" opacity="0.65">
            <circle cx="24" cy="36" r="4">
              <animate attributeName="opacity" values="0.25;0.75;0.25" dur="1.6s" repeatCount="indefinite" />
            </circle>
            <circle cx="42" cy="36" r="4">
              <animate attributeName="opacity" values="0.25;0.75;0.25" dur="1.6s" begin="0.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="60" cy="36" r="4">
              <animate attributeName="opacity" values="0.25;0.75;0.25" dur="1.6s" begin="0.4s" repeatCount="indefinite" />
            </circle>
          </g>
        </g>

        {/* bubble 2 */}
        <g transform="translate(300 292)">
          <rect x="0" y="0" width="140" height="60" rx="20" fill="var(--surface)" opacity="0.9" />
          <path d="M100 60l18-12" fill="var(--surface)" opacity="0.9" />
          <text x="16" y="24" fill="var(--text)" opacity="0.6" fontSize="11" fontWeight="700">Finalize</text>
          <g fill="var(--brand)" opacity="0.65">
            <circle cx="26" cy="40" r="4">
              <animate attributeName="opacity" values="0.25;0.75;0.25" dur="1.6s" begin="0.1s" repeatCount="indefinite" />
            </circle>
            <circle cx="44" cy="40" r="4">
              <animate attributeName="opacity" values="0.25;0.75;0.25" dur="1.6s" begin="0.3s" repeatCount="indefinite" />
            </circle>
            <circle cx="62" cy="40" r="4">
              <animate attributeName="opacity" values="0.25;0.75;0.25" dur="1.6s" begin="0.5s" repeatCount="indefinite" />
            </circle>
          </g>
        </g>
      </g>

      {/* Subtle base */}
      <path d="M110 438c58 40 280 46 360 0" fill="none" stroke="var(--text)" opacity="0.12" strokeWidth="18" strokeLinecap="round" />
    </svg>
  );

  const AnimatedHero = () => (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 rounded-3xl bg-white/60" />

      <div
        className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-emerald-200/40 blur-2xl"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-10 -right-10 h-44 w-44 rounded-full bg-emerald-300/30 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative flex h-full items-center justify-center p-8">
        <div className="w-full">
          <div className="mx-auto aspect-square w-full max-w-md">
            <div className="relative h-full w-full">
              <div
                className="absolute inset-0 rounded-3xl border border-slate-200/60 bg-white/70"
                aria-hidden="true"
              />

              <div className="absolute inset-0 p-8">
                <div className="absolute right-8 top-8">
                  <div
                    className="h-16 w-16 rounded-full border border-emerald-200/70 bg-white/80"
                    aria-hidden="true"
                  />
                  <div
                    className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-400/50 animate-spin"
                    style={{ animationDuration: "16s" }}
                    aria-hidden="true"
                  />
                </div>

                <div className="absolute left-8 top-10 h-3 w-3 rounded-full bg-emerald-500/70 animate-pulse" aria-hidden="true" />
                <div
                  className="absolute left-14 top-16 h-2.5 w-2.5 rounded-full bg-emerald-600/50 animate-pulse"
                  style={{ animationDelay: "180ms" }}
                  aria-hidden="true"
                />
                <div
                  className="absolute left-10 top-24 h-2 w-2 rounded-full bg-emerald-700/40 animate-pulse"
                  style={{ animationDelay: "360ms" }}
                  aria-hidden="true"
                />

                <div className="h-full w-full animate-pulse" style={{ animationDuration: "3.2s" }}>
                  <HeroIllustration />
                </div>
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
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl glass-surface">
        <div className="border-b border-slate-200/60 px-6 py-6 sm:px-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="p-6 sm:p-10">
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

          <div className="hidden lg:block border-l border-slate-200/60 p-6 sm:p-10">
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


