import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";
import ThemeToggle from "../components/ThemeToggle";

const emptyJob = { title: "", description: "" };

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [jobDraft, setJobDraft] = useState(emptyJob);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [notice, setNotice] = useState("");
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const selectedJob = useMemo(
    () => jobs.find((job) => job._id === selectedJobId),
    [jobs, selectedJobId]
  );

  const total = results.length;
  const shortlisted = results.filter((r) => r.status === "shortlisted").length;
  const rejected = results.filter((r) => r.status === "rejected").length;

  useEffect(() => {
    const loadInitialJobs = async () => {
      try {
        const res = await api.get("/jobs");
        const loadedJobs = res.data;
        setJobs(loadedJobs);

        const requestedJobId = new URLSearchParams(window.location.search).get("jobId");
        const firstJob = loadedJobs.find((job) => job._id === requestedJobId) || loadedJobs[0];

        if (firstJob) {
          setSelectedJobId(firstJob._id);
          setJobDraft({ title: firstJob.title, description: firstJob.description });
          setSearchParams({ jobId: firstJob._id });
        }
      } catch {
        setNotice("Could not load jobs. Please refresh and try again.");
      }
    };

    loadInitialJobs();
  }, [setSearchParams]);

  useEffect(() => {
    if (!selectedJobId) {
      setResults([]);
      return;
    }

    loadCandidates(selectedJobId);
  }, [selectedJobId]);

  const loadCandidates = async (jobId) => {
    try {
      const res = await api.get("/resume", { params: { jobId } });
      setResults(res.data.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0)));
    } catch {
      setNotice("Could not load candidates for this job.");
    }
  };

  const selectJob = (job) => {
    setSelectedJobId(job._id);
    setJobDraft({ title: job.title, description: job.description });
    setSearchParams({ jobId: job._id });
  };

  const startNewJob = () => {
    setSelectedJobId("");
    setJobDraft(emptyJob);
    setResults([]);
    setSearchParams({});
  };

  const saveJob = async () => {
    if (!jobDraft.title.trim() || !jobDraft.description.trim()) {
      setNotice("Add a job title and job description first.");
      return null;
    }

    setSavingJob(true);
    setNotice("");

    try {
      if (selectedJobId) {
        const res = await api.patch(`/jobs/${selectedJobId}`, jobDraft);
        setJobs((current) => current.map((job) => job._id === selectedJobId ? res.data : job));
        setJobDraft({ title: res.data.title, description: res.data.description });
        return res.data;
      }

      const res = await api.post("/jobs", jobDraft);
      setJobs((current) => [res.data, ...current]);
      selectJob(res.data);
      return res.data;
    } catch (error) {
      setNotice(error.response?.data?.message || "Could not save this job.");
      return null;
    } finally {
      setSavingJob(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.post("/resume/status", { id, status });
      setResults(results.map(r => r._id === id ? { ...r, status } : r));
    } catch (error) {
      setNotice(error.response?.data?.message || "Failed to update status.");
    }
  };

  const handleRank = async () => {
    const job = await saveJob();
    if (!job) return;

    setLoading(true);
    setNotice("");

    try {
      const res = await api.post("/ai/rank", { jobId: job._id });
      const sorted = res.data.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
      setResults(sorted);
      setNotice("Ranking complete. Review AI scores as decision support, not final decisions.");
    } catch (error) {
      setNotice(error.response?.data?.message || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    if (!selectedJobId) {
      setNotice("Select a job before exporting candidates.");
      return;
    }

    try {
      const res = await api.get("/export/csv", {
        params: { jobId: selectedJobId },
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "candidates.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setNotice("Export failed.");
    }
  };

  const handleSort = (e) => {
    const sorted = [...results];
    sorted.sort((a, b) => e.target.value === "high"
      ? (b.aiScore || 0) - (a.aiScore || 0)
      : (a.aiScore || 0) - (b.aiScore || 0)
    );
    setResults(sorted);
  };

  const uploadPath = selectedJobId ? `/upload?jobId=${selectedJobId}` : "/upload";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-200 pb-12 transition-colors duration-300">
      <header className="bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 sticky top-0 z-20 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-black text-sm font-display tracking-tighter">AI</span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white font-display transition-colors">HireSight<span className="text-indigo-500 dark:text-indigo-400">.</span></h1>
          </div>
          <div className="flex gap-3 items-center">
            {total > 0 && (
              <div className="hidden lg:flex gap-4 text-sm font-semibold mr-2 bg-gray-100 dark:bg-white/5 px-5 py-2 rounded-full border border-gray-200 dark:border-white/10 transition-colors">
                <span>Total: <span className="font-bold">{total}</span></span>
                <span className="text-emerald-600 dark:text-emerald-400">Shortlisted: {shortlisted}</span>
                <span className="text-rose-600 dark:text-rose-400">Rejected: {rejected}</span>
              </div>
            )}
            <ThemeToggle />
            <button onClick={() => navigate(uploadPath)} className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-500/10 hover:bg-indigo-200 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/20 px-4 py-2 rounded-xl transition-all">
              Upload
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem("token");
                navigate("/");
              }}
              className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 px-4 py-2 rounded-xl transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {notice && (
          <div role="status" className="mb-6 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-3 text-sm font-semibold text-indigo-800 dark:text-indigo-200">
            {notice}
          </div>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 mb-8">
          <aside className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-gray-700 dark:text-gray-200">Jobs</h2>
              <button onClick={startNewJob} className="text-xs font-bold text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-white">
                New
              </button>
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto">
              {jobs.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">Create your first requisition to start a scoped candidate review.</p>
              )}
              {jobs.map((job) => (
                <button
                  key={job._id}
                  type="button"
                  onClick={() => selectJob(job)}
                  className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${selectedJobId === job._id ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10" : "border-gray-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/40"}`}
                >
                  <span className="block text-sm font-bold text-gray-900 dark:text-white truncate">{job.title}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">{job.status}</span>
                </button>
              ))}
            </div>
          </aside>

          <section className="glass-card rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Target Profile Criteria</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Save the job, upload resumes to it, then run an auditable AI review.</p>
              </div>
              {selectedJob && (
                <span className="inline-flex w-fit rounded-full border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  Scoped to {selectedJob.title}
                </span>
              )}
            </div>

            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2" htmlFor="job-title">Job Title</label>
            <input
              id="job-title"
              className="w-full px-4 py-3 rounded-xl glass-input mb-4"
              placeholder="Senior Backend Engineer"
              value={jobDraft.title}
              onChange={(e) => setJobDraft({ ...jobDraft, title: e.target.value })}
            />

            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2" htmlFor="job-description">Job Description</label>
            <textarea
              id="job-description"
              className="w-full p-5 rounded-2xl glass-input min-h-[180px]"
              placeholder="Paste job responsibilities, must-have requirements, nice-to-have skills, location constraints, and seniority expectations..."
              value={jobDraft.description}
              onChange={(e) => setJobDraft({ ...jobDraft, description: e.target.value })}
            />

            <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={saveJob}
                  disabled={savingJob}
                  className="px-5 py-3 rounded-xl font-bold border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
                >
                  {savingJob ? "Saving..." : selectedJobId ? "Save Job" : "Create Job"}
                </button>
                <button
                  onClick={handleRank}
                  disabled={loading || !jobDraft.title.trim() || !jobDraft.description.trim()}
                  className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all border border-indigo-500/50 ${loading || !jobDraft.title.trim() || !jobDraft.description.trim() ? "opacity-50 cursor-not-allowed bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"}`}
                >
                  {loading ? "Analyzing..." : "Rank Candidates"}
                </button>
              </div>

              {total > 0 && (
                <div className="flex gap-3 w-full sm:w-auto">
                  <select onChange={handleSort} className="flex-1 sm:flex-none glass-input rounded-xl px-4 py-3 text-sm font-semibold cursor-pointer">
                    <option value="high">Score: High to Low</option>
                    <option value="low">Score: Low to High</option>
                  </select>
                  <button onClick={downloadCSV} className="bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 border border-gray-300 dark:border-white/10 px-5 py-3 rounded-xl text-sm font-semibold transition-all">
                    Export
                  </button>
                </div>
              )}
            </div>
          </section>
        </section>

        {!loading && results.length === 0 && (
          <div className="text-center py-16 px-4 rounded-2xl glass-card">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display">No Candidates In This Job Yet</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto font-medium">Create or select a job, upload resumes to that job, then run the ranking workflow.</p>
            <button onClick={() => navigate(uploadPath)} className="mt-6 text-sm font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-6 py-2.5 rounded-full transition-colors">
              Upload Resumes
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {results.map((r) => (
            <article key={r._id} className="glass-card rounded-2xl overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-start bg-gray-50/70 dark:bg-white/5">
                <div className="min-w-0 pr-4">
                  <h3 className="font-bold text-gray-900 dark:text-white truncate" title={r.fileName}>{r.fileName || "Unknown File"}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">AI decision support</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-xl text-xs font-black border ${r.aiScore >= 80 ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30" : r.aiScore >= 50 ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30" : "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30"}`}>
                    {r.aiScore ?? "--"} pts
                  </span>
                  <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Conf: {r.aiData?.confidence ?? "--"}</span>
                </div>
              </div>

              <div className="p-5 flex-1 space-y-5">
                <section>
                  <h4 className="text-[11px] font-bold text-indigo-600 dark:text-indigo-300 uppercase tracking-widest mb-2">Rationale</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{r.aiData?.selectionRationale || r.aiData?.summary || "No rationale available."}</p>
                </section>

                {r.aiData?.matchHighlights?.length > 0 && (
                  <section>
                    <h4 className="text-[11px] font-bold text-emerald-600 dark:text-emerald-300 uppercase tracking-widest mb-2">Evidence</h4>
                    <div className="space-y-2">
                      {r.aiData.matchHighlights.slice(0, 3).map((match, idx) => (
                        <div key={idx} className="rounded-xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/5 p-3 text-xs">
                          <div className="font-bold text-gray-900 dark:text-white">{match.requirement}</div>
                          <div className="text-gray-600 dark:text-gray-400 mt-1 italic">"{match.candidateHighlight}"</div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {r.aiData?.missingRequirements?.length > 0 && (
                  <section>
                    <h4 className="text-[11px] font-bold text-amber-600 dark:text-amber-300 uppercase tracking-widest mb-2">Missing Evidence</h4>
                    <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                      {r.aiData.missingRequirements.slice(0, 4).map((item, idx) => (
                        <li key={idx}>- {item}</li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>

              <div className="p-4 bg-gray-50/70 dark:bg-white/5 border-t border-gray-200 dark:border-white/10 flex gap-3">
                <button onClick={() => updateStatus(r._id, "shortlisted")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${r.status === "shortlisted" ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/50" : "bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-emerald-300"}`}>
                  Shortlist
                </button>
                <button onClick={() => updateStatus(r._id, "rejected")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${r.status === "rejected" ? "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/50" : "bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-rose-300"}`}>
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
