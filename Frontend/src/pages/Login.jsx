import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const res = await api.post("/auth/login", { email, password });
        sessionStorage.setItem("token", res.data.token);
        navigate("/dashboard");
      } else {
        const res = await api.post("/auth/register", { name, email, password });
        sessionStorage.setItem("token", res.data.token);
        navigate("/dashboard");
      }
    } catch (error) {
      alert(isLogin ? "Login failed" : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-gray-950 to-black relative overflow-hidden font-sans">
      {/* Decorative animated background elements */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-purple-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[20%] right-[15%] w-72 h-72 bg-pink-500/20 rounded-full mix-blend-screen filter blur-[80px] animate-float"></div>

      <div className="glass-card-dark w-full max-w-md p-10 rounded-3xl z-10 mx-4 animate-fade-in-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 mb-6 shadow-lg shadow-indigo-500/30 relative group cursor-default">
            <span className="text-2xl font-black text-white font-display tracking-tighter absolute inset-0 flex items-center justify-center">AI</span>
            <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight mb-3 font-display">HireSight<span className="text-indigo-400">.</span></h2>
          <p className="text-gray-400 text-sm font-medium">
            {isLogin ? "Sign in to your intelligent hiring workspace" : "Create an account to begin"}
          </p>
        </div>

        {/* Toggle Tabs */}
        <div className="flex p-1 mb-8 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10 relative">
          <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-indigo-500/20 border border-indigo-500/30 rounded-xl transition-transform duration-300 ease-in-out ${isLogin ? 'translate-x-0' : 'translate-x-[calc(100%+8px)]'}`}></div>
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 relative z-10 ${isLogin ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 relative z-10 ${!isLogin ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Animated height container for Name field to smooth transitions */}
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isLogin ? 'max-h-0 opacity-0' : 'max-h-24 opacity-100'}`}>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1" htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                placeholder="John Doe"
                className="w-full px-4 py-3.5 rounded-xl glass-input"
                onChange={(e) => setName(e.target.value)}
                value={name}
                required={!isLogin}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="admin@hiresight.ai"
              className="w-full px-4 py-3.5 rounded-xl glass-input"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-3.5 rounded-xl glass-input"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 px-4 flex justify-center items-center rounded-xl text-white font-semibold text-base transition-all duration-300 mt-6 border border-indigo-500/50 relative overflow-hidden group ${loading ? 'opacity-70 cursor-not-allowed bg-indigo-600/50' : 'bg-indigo-600/80 hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] hover:-translate-y-0.5'}`}
          >
            {!loading && <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>}
            {loading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (isLogin ? "Sign In →" : "Create Account →")}
          </button>
        </form>
      </div>
    </div>
  );
}