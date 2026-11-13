import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { message, Spin } from "antd";
import axios from "axios";
import { BASE_API } from "../api/api.js";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  ArrowRight,
  Zap,
  Boxes,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const SLIDES = [
  {
    image: "/login-bg-1.webp",
    heading: (
      <>
        Run Your Business <span className="text-[#4F46E5] !font-bold">Smarter</span>
      </>
    ),
    supportingText:
      "Fast billing, real-time inventory and complete sales control — all in one place.",
    activeFeature: "quick-billing",
  },
  {
    image: "/login-bg-2.webp",
    heading: (
      <>
        Run Your Business <span className="text-[#4F46E5] !font-bold">Smarter</span>
      </>
    ),
    supportingText:
      "Fast billing, real-time inventory and complete sales control — all in one place.",
    activeFeature: "inventory-control",
  },
  {
    image: "/login-bg-3.webp",
    heading: (
      <>
        Run Your Business <span className="text-[#4F46E5] !font-bold">Smarter</span>
      </>
    ),
    supportingText:
      "Fast billing, real-time inventory and complete sales control — all in one place.",
    activeFeature: "sales-reports",
  },
];

const FEATURES = [
  {
    id: "quick-billing",
    label: "Quick Billing",
    mobileLabel: ["Quick", "Billing"],
    icon: Zap,
    slideIndex: 0,
  },
  {
    id: "inventory-control",
    label: "Inventory Control",
    mobileLabel: ["Inventory", "Control"],
    icon: Boxes,
    slideIndex: 1,
  },
  {
    id: "sales-reports",
    label: "Sales Reports",
    mobileLabel: ["Sales", "Reports"],
    icon: BarChart3,
    slideIndex: 2,
  },
];

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [isMobileLogin, setIsMobileLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const [emailError, setEmailError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginError, setLoginError] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto rotate slides every 5.5 seconds unless user hovers
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isHovered]);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidMobile = (mobile) => /^\d{10}$/.test(mobile);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError("");
    setMobileError("");
    setPasswordError("");
    setLoginError("");

    let hasError = false;

    if (isMobileLogin) {
      if (!mobile.trim()) {
        setMobileError("Mobile number is required");
        hasError = true;
      } else if (!isValidMobile(mobile)) {
        setMobileError("Enter a valid 10-digit mobile number");
        hasError = true;
      }
    } else {
      if (!email.trim()) {
        setEmailError("Email address is required");
        hasError = true;
      } else if (!isValidEmail(email)) {
        setEmailError("Enter a valid email address");
        hasError = true;
      }
    }

    if (!password) {
      setPasswordError("Password is required");
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);

    try {
      const identifier = isMobileLogin ? mobile.trim() : email.trim();
      const payload = {
        identifier,
        email: isMobileLogin ? undefined : email.trim(),
        mobile: isMobileLogin ? mobile.trim() : undefined,
        password,
      };

      // Try /user/login first, with automatic fallback to /auth/login
      let res;
      try {
        res = await axios.post(`${BASE_API}/user/login`, payload, {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        if (err.response?.status === 404) {
          res = await axios.post(`${BASE_API}/auth/login`, payload, {
            headers: { "Content-Type": "application/json" },
          });
        } else {
          throw err;
        }
      }

      const resData = res.data;
      const userData = resData?.user || resData?.data;
      const token = resData?.token || resData?.data?.token;
      const refreshToken = resData?.refreshToken || resData?.data?.refreshToken;

      if (userData && token) {
        // Save tokens and user session
        localStorage.setItem("token", token);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(userData));

        if (!rememberMe) {
          sessionStorage.setItem("token", token);
        }

        setUser(userData);
        message.success(resData.message || "Login successful!");

        const userRole = userData?.role?.role_name?.toLowerCase();
        if (userRole === "admin" || userRole === "super admin") {
          navigate("/dashboard");
        } else if (userRole === "billing" || userRole === "cashier") {
          navigate("/billing/pos");
        } else if (userRole === "kitchen" || userRole === "chef") {
          navigate("/billing/kitchen");
        } else if (userRole === "order taker" || userRole === "waiter") {
          navigate("/billing/waiter");
        } else {
          navigate("/dashboard");
        }
      } else {
        throw new Error(resData?.message || "Invalid login response");
      }
    } catch (error) {
      const respData = error.response?.data;
      const errorMessage =
        respData?.message ||
        respData?.error ||
        (typeof respData === "string" ? respData : null) ||
        error.message ||
        "Login failed! Please check your credentials.";
      setLoginError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleLoginMode = () => {
    setIsMobileLogin(!isMobileLogin);
    setEmail("");
    setMobile("");
    setLoginError("");
    setEmailError("");
    setMobileError("");
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    message.info(
      "Please contact your store administrator to reset your password.",
      5
    );
  };

  return (
    <div className="w-full font-sans ">
      {/* Main Container Card */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full bg-white overflow-hidden !min-h-screen sm:min-h-0 grid grid-cols-1 md:grid-cols-12 relative z-10"
      >
        {/* ================= LEFT PANEL (FORM) ================= */}
        <div className="md:col-span-6 lg:col-span-5 p-6 sm:p-8 md:p-8 lg:p-11 flex flex-col justify-between bg-white relative z-20">
          <div>
            {/* Top Branding (Pozhuthu POS) */}
            <div className="flex items-center justify-center md:justify-start gap-3 mb-6 sm:mb-8">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#FAF5EE] border border-[#F3E8D8] flex items-center justify-center shadow-xs shrink-0 overflow-hidden p-1.5">
                <img
                  src="/favicon/android-chrome-192x192.webp"
                  alt="Pozhuthu POS"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "/favicon/android-chrome-512x512.webp";
                  }}
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-extrabold text-lg sm:text-[19px] tracking-tight text-slate-900 leading-tight">
                  Pozhuthu POS
                </span>
                <span className="text-[11px] sm:text-xs font-medium text-slate-400">
                  Point of Sale Web Application
                </span>
              </div>
            </div>

            {/* Welcome Heading */}
            <div className="mb-6 text-center md:text-left">
              <h1 className="text-2xl sm:text-[28px] !font-extrabold text-slate-900 tracking-tight">
                Welcome Back
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 font-normal">
                Sign in to your POS account
              </p>
            </div>

            {/* Login Error Alert */}
            <AnimatePresence>
              {loginError && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium"
                >
                  {loginError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email / Mobile Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {isMobileLogin ? "Mobile Number" : "Email Address"}
                </label>

                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    {isMobileLogin ? <Phone size={17} /> : <Mail size={17} />}
                  </div>

                  <input
                    type={isMobileLogin ? "tel" : "text"}
                    value={isMobileLogin ? mobile : email}
                    onChange={(e) =>
                      isMobileLogin ? setMobile(e.target.value) : setEmail(e.target.value)
                    }
                    placeholder={
                      isMobileLogin ? "Enter mobile number" : "Enter your email"
                    }
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:border-[#4F46E5] focus:ring-4 focus:ring-indigo-100/60 text-slate-800 text-sm transition-all duration-200 outline-none"
                  />

                  {/* Toggle button inside input */}
                  <button
                    type="button"
                    onClick={toggleLoginMode}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                    title={isMobileLogin ? "Use Email" : "Use Phone"}
                  >
                    {isMobileLogin ? <Mail size={17} /> : <Phone size={17} />}
                  </button>
                </div>

                {isMobileLogin && mobileError && (
                  <p className="text-red-500 text-xs font-medium mt-1">{mobileError}</p>
                )}
                {!isMobileLogin && emailError && (
                  <p className="text-red-500 text-xs font-medium mt-1">{emailError}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>

                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Lock size={17} />
                  </div>

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:border-[#4F46E5] focus:ring-4 focus:ring-indigo-100/60 text-slate-800 text-sm transition-all duration-200 outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                {passwordError && (
                  <p className="text-red-500 text-xs font-medium mt-1">{passwordError}</p>
                )}
              </div>

              {/* Keep me logged in & Forgot password Row */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5] cursor-pointer accent-[#4F46E5]"
                  />
                  <span>Keep me logged in</span>
                </label>

                <a
                  href="#forgot-password"
                  onClick={handleForgotPassword}
                  className="font-medium text-[#4F46E5] hover:text-[#4338CA] transition"
                >
                  Forgot password?
                </a>
              </div>

              {/* Sign In Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 mt-2 text-sm sm:text-base font-bold rounded-2xl text-white bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:from-[#4338CA] hover:to-[#4F46E5] shadow-lg shadow-indigo-500/25 active:shadow-md transition-all duration-200 disabled:opacity-70 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading && <Spin size="small" />}
                <ArrowRight size={17} />
                <span>{loading ? "Signing In..." : "Sign In"}</span>
              </motion.button>
            </form>

            {/* ================= MOBILE SLIDER CARD (VISIBLE ONLY ON MOBILE < md) ================= */}
            <div className="block md:hidden mt-6 pt-5 border-t border-slate-100">
              <div
                className="relative bg-gradient-to-b from-[#F5F4FE] via-[#EFEBFD] to-[#E6E1FA]/80 bg-cover bg-right bg-no-repeat rounded-3xl p-4 sm:p-5 border border-indigo-100/60 shadow-xs overflow-hidden"
                style={{
                  backgroundImage: `url('${SLIDES[currentSlide].image}')`,
                }}
              >
                {/* Backdrop Overlay for enhanced text readability and contrast */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/10 to-transparent backdrop-blur-[1px] pointer-events-none" />

                <div className="relative z-10">
                  {/* Heading & Supporting Text */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25 }}
                      className="text-center mt-1"
                    >
                      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
                        {SLIDES[currentSlide].heading}
                      </h2>
                      <p className="text-slate-700 text-xs mt-1 font-semibold max-w-xs mx-auto leading-relaxed">
                        {SLIDES[currentSlide].supportingText}
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  {/* 3 Feature Cards (Quick Billing, Inventory Control, Sales Reports) */}
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {FEATURES.map((feat) => {
                      const Icon = feat.icon;
                      const isActive = SLIDES[currentSlide].activeFeature === feat.id;
                      return (
                        <button
                          key={feat.id}
                          type="button"
                          onClick={() => setCurrentSlide(feat.slideIndex)}
                          className={`flex flex-col items-center justify-center py-3 px-1.5 rounded-2xl transition-all duration-300 cursor-pointer ${isActive
                            ? "bg-[#4F46E5] text-white shadow-md shadow-indigo-500/25 scale-[1.02]"
                            : "bg-white/95 text-slate-800 border border-slate-200/90 shadow-2xs hover:bg-white"
                            }`}
                        >
                          <Icon
                            size={18}
                            className={`mb-1.5 ${isActive ? "text-white" : "text-[#4F46E5]"
                              }`}
                          />
                          <span
                            className={`text-[11px] font-bold leading-tight text-center ${isActive ? "text-white" : "text-slate-800"
                              }`}
                          >
                            {feat.mobileLabel ? (
                              <>
                                {feat.mobileLabel[0]}
                                <br />
                                {feat.mobileLabel[1]}
                              </>
                            ) : (
                              feat.label
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Centered Pagination Dots */}
                  <div className="flex items-center justify-center gap-1.5 mt-4">
                    {SLIDES.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentSlide(idx)}
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${currentSlide === idx
                          ? "w-6 bg-[#4F46E5]"
                          : "w-2 bg-slate-300 hover:bg-slate-400"
                          }`}
                        aria-label={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile Footer */}
              <div className="mt-6 text-center">
                <p className="text-xs text-slate-400 font-normal">
                  Application Developed and maintained by
                </p>
                <p className="text-xs font-bold text-slate-800 mt-0.5 tracking-tight">
                  Atelier Technology Solutions
                </p>
              </div>
            </div>
          </div>

          {/* Desktop/Tablet Footer Notice (hidden on mobile, visible on tablet & desktop) */}
          <div className="hidden md:block mt-10 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-normal">
              Application Developed and maintained by
            </p>
            <p className="text-xs font-bold text-slate-800 mt-0.5 tracking-tight">
              Atelier Technology Solutions
            </p>
          </div>
        </div>

        {/* ================= RIGHT PANEL SLIDER (TABLET & DESKTOP md:) ================= */}
        <div
          className="hidden md:flex md:col-span-6 lg:col-span-7 relative overflow-hidden flex-col justify-end min-h-[580px] lg:min-h-[640px] border-l border-slate-100 select-none p-5 sm:p-6 lg:p-7 bg-[#F4F3FF]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Animated Background Slides */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url('${SLIDES[currentSlide].image}')`,
              }}
            />
          </AnimatePresence>

          {/* Floating Glassmorphism Content Card at the bottom */}
          <div className="relative z-10 p-5 lg:p-6 rounded-3xl bg-white/92 backdrop-blur-xl border border-white/80 shadow-2xl shadow-indigo-950/15">
            {/* Heading & Supporting Text */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <h2 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                  {SLIDES[currentSlide].heading}
                </h2>
                <p className="text-slate-600 text-xs sm:text-[13px] mt-1 font-medium max-w-md mx-auto leading-relaxed">
                  {SLIDES[currentSlide].supportingText}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Feature Highlights Pills */}
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              {FEATURES.map((feat) => {
                const Icon = feat.icon;
                const isActive = SLIDES[currentSlide].activeFeature === feat.id;
                return (
                  <button
                    key={feat.id}
                    type="button"
                    onClick={() => setCurrentSlide(feat.slideIndex)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${isActive
                      ? "bg-[#4F46E5] text-white shadow-md shadow-indigo-500/25 scale-[1.02]"
                      : "bg-white text-slate-700 border border-slate-200/90 shadow-2xs hover:bg-slate-50"
                      }`}
                  >
                    <Icon size={13} className={isActive ? "text-white" : "text-[#4F46E5]"} />
                    <span>{feat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Controls: Dots & Navigation Arrows */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
              {/* Pagination Dots */}
              <div className="flex items-center gap-1.5">
                {SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${currentSlide === idx
                      ? "w-6 bg-[#4F46E5]"
                      : "w-2 bg-slate-300 hover:bg-slate-400"
                      }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Prev / Next Arrows */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentSlide((prev) =>
                      prev === 0 ? SLIDES.length - 1 : prev - 1
                    )
                  }
                  className="w-8 h-8 rounded-full bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:border-indigo-300 active:scale-95 transition cursor-pointer"
                  aria-label="Previous slide"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentSlide((prev) => (prev + 1) % SLIDES.length)
                  }
                  className="w-8 h-8 rounded-full bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:border-indigo-300 active:scale-95 transition cursor-pointer"
                  aria-label="Next slide"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
