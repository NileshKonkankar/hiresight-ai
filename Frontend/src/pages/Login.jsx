import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import ThemeToggle from "../components/ThemeToggle";

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
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin ? { email, password } : { name, email, password };
      const res = await api.post(endpoint, payload);
      sessionStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (error) {
      const fallback = isLogin ? "Login failed" : "Registration failed";
      alert(error.response?.data?.message || fallback);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell flex items-center justify-center px-4 py-10">
      <ThemeToggle className="absolute right-6 top-6" />

      <main className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1fr_420px]">
        <section className="hidden border-r border-slate-200 bg-slate-100 p-10 dark:border-slate-800 dark:bg-slate-950 md:flex md:flex-col md:justify-between">
          <div>
            <div className="mb-8 inline-flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
              HS
            </div>
            <h1 className="max-w-md text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
              HireSight AI
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
              Structured candidate review for teams that need faster screening, defensible AI assistance, and auditable hiring workflows.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-400">
            <div className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              Job-scoped candidate pools
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              Evidence-based AI scoring
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              Recruiter action audit trail
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-8">
          <div className="mb-8">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-sm font-bold text-white dark:bg-white dark:text-slate-950 md:hidden">
              HS
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              {isLogin ? "Sign in" : "Create account"}
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {isLogin ? "Access your hiring workspace." : "Start a hiring workspace for your team."}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-md border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-950">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`rounded px-3 py-2 text-sm font-semibold transition ${isLogin ? "bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`rounded px-3 py-2 text-sm font-semibold transition ${!isLogin ? "bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="name">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className="glass-input w-full rounded-md px-3 py-2.5 text-sm"
                  onChange={(e) => setName(e.target.value)}
                  value={name}
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="admin@hiresight.ai"
                className="glass-input w-full rounded-md px-3 py-2.5 text-sm"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                className="glass-input w-full rounded-md px-3 py-2.5 text-sm"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="primary-button w-full">
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
