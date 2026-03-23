import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function Dashboard() {
  const [jd, setJd] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const total = results.length;
  const shortlisted = results.filter((r) => r.status === "shortlisted").length;
  const rejected = results.filter((r) => r.status === "rejected").length;

  const updateStatus = async (id, status) => {
    try {
      await api.post("/resume/status", { id, status });
      setResults(results.map(r => r._id === id ? { ...r, status } : r));
    } catch (e) {
      alert("Failed to update status");
    }
  };

  const handleRank = async () => {
    if (!jd.trim()) return alert("Please enter a job description.");
    setLoading(true);
    try {
      const res = await api.post("/ai/rank", { jobDescription: jd });
      const sorted = res.data.sort((a, b) => b.aiScore - a.aiScore);
      setResults(sorted);
    } catch (e) {
      alert("Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    window.open(`${import.meta.env.VITE_API_URL || 'https://hiresight-ai.onrender.com'}/api/export/csv`);
  };

  const handleSort = (e) => {
    const value = e.target.value;
    let sorted = [...results];
    if (value === "high") {
      sorted.sort((a, b) => b.aiScore - a.aiScore);
    } else {
      sorted.sort((a, b) => a.aiScore - b.aiScore);
    }
    setResults(sorted);
  };

  return (
    <div className="min-h-screen bg-gray-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-gray-950 to-black font-sans text-gray-200 pb-12 relative overflow-x-hidden">
      {/* Decorative animated background elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse-slow pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full mix-blend-screen filter blur-[120px] animate-pulse-slow pointer-events-none" style={{ animationDelay: '2s' }}></div>

      {/* Top Navbar */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/50 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-black text-sm font-display tracking-tighter">AI</span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white font-display">HireSight<span className="text-indigo-400">.</span></h1>
          </div>
          <div className="flex gap-4 items-center">
            {total > 0 && (
                <div className="hidden md:flex gap-4 text-sm font-semibold mr-2 bg-white/5 shadow-inner shadow-white/5 px-5 py-2 rounded-full border border-white/10 backdrop-blur-md">
                    <span className="text-gray-400">Total: <span className="text-white font-bold">{total}</span></span>
                    <span className="text-white/20">|</span>
                    <span className="text-emerald-400">Got: <span className="font-bold">{shortlisted}</span></span>
                    <span className="text-white/20">|</span>
                    <span className="text-rose-400">Dropped: <span className="font-bold">{rejected}</span></span>
                </div>
            )}
            <button 
                onClick={() => navigate("/upload")}
                className="text-sm font-semibold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-4 py-2 rounded-xl transition-all duration-200"
            >
                Upload Resumes
            </button>
            <button 
                onClick={() => {
                    localStorage.removeItem("token");
                    navigate("/");
                }}
                className="text-sm font-semibold text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 px-4 py-2 rounded-xl transition-all duration-200"
            >
                Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* Job Description Input Section */}
        <div className="glass-card-dark rounded-[2rem] p-8 mb-10 animate-slide-in-right">
          <h2 className="text-2xl font-bold mb-4 font-display text-white">Target Profile Criteria</h2>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <textarea
              className="relative w-full p-5 rounded-2xl glass-input min-h-[140px]"
              placeholder="Paste your detailed job description here. The AI will semantically analyze resumes against these specific requirements..."
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            />
          </div>

          <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <button
              onClick={handleRank}
              disabled={loading || !jd.trim()}
              className={`px-8 py-3.5 rounded-xl font-bold text-white shadow-lg transition-all duration-300 flex items-center gap-2 group border border-indigo-500/50
                ${loading || !jd.trim() ? 'opacity-50 cursor-not-allowed bg-indigo-900/50 shadow-none' : 'bg-indigo-600/80 hover:bg-indigo-500 hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] hover:-translate-y-0.5'}`}
            >
                {loading ? (
                    <>
                    <svg className="animate-spin -ml-1 h-5 w-5 text-indigo-200" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing Resumes...
                    </>
                ) : (
                    <>
                    <svg className="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    Rank Candidates
                    </>
                )}
            </button>

            {total > 0 && (
                <div className="flex gap-3 w-full sm:w-auto">
                    <select
                        onChange={handleSort}
                        className="flex-1 sm:flex-none glass-input rounded-xl px-4 py-3 text-sm font-semibold shadow-sm transition-all cursor-pointer"
                    >
                        <option value="high" className="bg-gray-900">Score: High to Low</option>
                        <option value="low" className="bg-gray-900">Score: Low to High</option>
                    </select>
                    <button
                        onClick={downloadCSV}
                        className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2 hover:-translate-y-0.5"
                        >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Export
                    </button>
                </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {!loading && results.length === 0 && (
          <div className="text-center py-20 px-4 rounded-[2rem] glass-card-dark animate-fade-in-up">
             <div className="bg-indigo-500/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner relative border border-indigo-500/20">
                <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl animate-ping opacity-20"></div>
                <svg className="w-10 h-10 text-indigo-400 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
             </div>
             <h3 className="text-xl font-bold text-white font-display">No Candidates Analyzed</h3>
             <p className="mt-2 text-sm text-gray-400 max-w-sm mx-auto font-medium">Upload resumes and enter a job description to see AI-ranked candidates appear here automatically.</p>
             <button onClick={() => navigate("/upload")} className="mt-6 text-sm font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-6 py-2.5 rounded-full transition-colors">Go to Upload Page &rarr;</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {results.map((r, i) => (
            <div 
                key={r._id} 
                className="glass-card-dark rounded-[1.5rem] hover:shadow-2xl hover:shadow-indigo-500/20 hover:border-indigo-500/30 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group animate-fade-in-up"
                style={{ animationDelay: `${i * 0.05}s` }}
            >
              {/* Card Header (Score / Status) */}
              <div className="px-6 py-5 border-b border-white/10 flex justify-between items-start bg-white/5">
                  <div className="truncate pr-4 flex-1">
                      <h3 className="font-bold text-white truncate font-display text-lg" title={r.fileName}>{r.fileName || 'Unknown File'}</h3>
                      <p className="text-xs font-semibold text-gray-400 mt-1 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          Analyzed recently
                      </p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className={`px-3 py-1.5 rounded-xl text-xs font-black border flex items-center gap-1.5 shadow-sm
                          ${r.aiScore >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 
                            r.aiScore >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 
                            'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}
                      >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                          {r.aiScore} pts
                      </div>

                      {/* Status Badge */}
                      {r.status !== "pending" && (
                          <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md border
                              ${r.status === 'shortlisted' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}
                          >
                              {r.status}
                          </span>
                      )}
                  </div>
              </div>

              {/* Summary Body */}
              <div className="p-6 flex-1 relative bg-transparent">
                 <h4 className="text-[11px] font-bold text-indigo-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                     AI Summary
                     <div className="h-px bg-white/10 flex-1"></div>
                 </h4>
                 <div className="text-sm text-gray-300 leading-relaxed font-medium" 
                      style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 4,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                      }}
                      title={r.aiData?.summary}
                  >
                    {r.aiData?.summary || "No summary available."}
                 </div>
              </div>

              {/* Action Footer */}
              <div className="p-4 bg-white/5 border-t border-white/10 flex gap-3 backdrop-blur-sm">
                <button
                    onClick={() => updateStatus(r._id, "shortlisted")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 border
                        ${r.status === 'shortlisted' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-white/5 text-gray-300 border-white/10 hover:border-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                >
                    Shortlist
                </button>
                <button
                    onClick={() => updateStatus(r._id, "rejected")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 border
                        ${r.status === 'rejected' ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'bg-white/5 text-gray-300 border-white/10 hover:border-rose-500/50 hover:text-rose-400 hover:bg-rose-500/10'}`}
                >
                    Reject
                </button>
              </div>

            </div>
          ))}
        </div>

      </main>
    </div>
  );
}