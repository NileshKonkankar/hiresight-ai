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
  const pending = total - shortlisted - rejected;

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
    <div className="page-shell">
      <header className="app-header">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-xs font-bold text-white dark:bg-white dark:text-slate-950">
              HS
            </div>
            <div>
              <h1 className="text-base font-semibold leading-5">HireSight AI</h1>
              <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">Recruiting operations console</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => navigate(uploadPath)} className="secondary-button hidden sm:inline-flex">
              Upload
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem("token");
                navigate("/");
              }}
              className="secondary-button"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Candidate Review</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage requisitions, run AI-assisted screening, and track recruiter decisions.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {[
              ["Total", total],
              ["Pending", pending],
              ["Shortlist", shortlisted],
              ["Reject", rejected]
            ].map(([label, value]) => (
              <div key={label} className="min-w-20 rounded-md bg-slate-50 px-3 py-2 text-center dark:bg-slate-950">
                <div className="text-lg font-semibold text-slate-950 dark:text-white">{value}</div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {notice && (
          <div role="status" className="mb-5 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            {notice}
          </div>
        )}

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
          <aside className="glass-card rounded-lg p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Requisitions</h3>
              <button onClick={startNewJob} className="secondary-button px-3 py-1.5 text-xs">
                New
              </button>
            </div>

            <div className="space-y-2">
              {jobs.length === 0 && (
                <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  Create a requisition to begin candidate review.
                </p>
              )}

              {jobs.map((job) => (
                <button
                  key={job._id}
                  type="button"
                  onClick={() => selectJob(job)}
                  className={`w-full rounded-md border px-3 py-3 text-left transition ${selectedJobId === job._id ? "border-slate-950 bg-slate-100 dark:border-slate-300 dark:bg-slate-800" : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"}`}
                >
                  <span className="block truncate text-sm font-semibold text-slate-950 dark:text-white">{job.title}</span>
                  <span className="mt-1 block text-xs capitalize text-slate-500 dark:text-slate-400">{job.status}</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="space-y-5">
            <section className="glass-card rounded-lg p-5">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Role Criteria</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Define the job once, then upload and rank candidates within this scope.
                  </p>
                </div>
                {selectedJob && (
                  <span className="w-fit rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                    Scoped: {selectedJob.title}
                  </span>
                )}
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="job-title">
                    Job Title
                  </label>
                  <input
                    id="job-title"
                    className="glass-input w-full rounded-md px-3 py-2.5 text-sm"
                    placeholder="Senior Backend Engineer"
                    value={jobDraft.title}
                    onChange={(e) => setJobDraft({ ...jobDraft, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="job-description">
                    Job Description
                  </label>
                  <textarea
                    id="job-description"
                    className="glass-input min-h-36 w-full rounded-md px-3 py-2.5 text-sm leading-6"
                    placeholder="Paste job responsibilities, must-have requirements, nice-to-have skills, location constraints, and seniority expectations..."
                    value={jobDraft.description}
                    onChange={(e) => setJobDraft({ ...jobDraft, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  <button onClick={saveJob} disabled={savingJob} className="secondary-button">
                    {savingJob ? "Saving..." : selectedJobId ? "Save Role" : "Create Role"}
                  </button>
                  <button
                    onClick={handleRank}
                    disabled={loading || !jobDraft.title.trim() || !jobDraft.description.trim()}
                    className="primary-button"
                  >
                    {loading ? "Analyzing..." : "Rank Candidates"}
                  </button>
                  <button onClick={() => navigate(uploadPath)} className="secondary-button sm:hidden">
                    Upload
                  </button>
                </div>

                {total > 0 && (
                  <div className="flex gap-2">
                    <select onChange={handleSort} className="glass-input rounded-md px-3 py-2.5 text-sm font-medium">
                      <option value="high">Score: High to Low</option>
                      <option value="low">Score: Low to High</option>
                    </select>
                    <button onClick={downloadCSV} className="secondary-button">
                      Export
                    </button>
                  </div>
                )}
              </div>
            </section>

            <section className="glass-card rounded-lg">
              <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Candidate Results</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Scores are AI-assisted recommendations and should be reviewed by a recruiter.
                </p>
              </div>

              {results.length === 0 && !loading ? (
                <div className="px-5 py-12 text-center">
                  <h4 className="text-base font-semibold text-slate-950 dark:text-white">No candidates available</h4>
                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                    Select or create a requisition, upload resumes, and run ranking to populate this review queue.
                  </p>
                  <button onClick={() => navigate(uploadPath)} className="secondary-button mt-5">
                    Upload Resumes
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {results.map((r) => (
                    <article key={r._id} className="p-5">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="truncate text-base font-semibold text-slate-950 dark:text-white" title={r.fileName}>
                              {r.fileName || "Unknown File"}
                            </h4>
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {r.status}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {r.aiData?.selectionRationale || r.aiData?.summary || "No rationale available."}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:w-56">
                          <div className="rounded-md border border-slate-200 p-3 text-center dark:border-slate-800">
                            <div className="text-xl font-semibold text-slate-950 dark:text-white">{r.aiScore ?? "--"}</div>
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Score</div>
                          </div>
                          <div className="rounded-md border border-slate-200 p-3 text-center dark:border-slate-800">
                            <div className="text-xl font-semibold text-slate-950 dark:text-white">{r.aiData?.confidence ?? "--"}</div>
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Confidence</div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        {r.aiData?.matchHighlights?.length > 0 && (
                          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                            <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Evidence</h5>
                            <div className="mt-3 space-y-3">
                              {r.aiData.matchHighlights.slice(0, 3).map((match, idx) => (
                                <div key={idx} className="text-sm">
                                  <div className="font-semibold text-slate-800 dark:text-slate-200">{match.requirement}</div>
                                  <div className="mt-1 text-slate-500 dark:text-slate-400">"{match.candidateHighlight}"</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {r.aiData?.missingRequirements?.length > 0 && (
                          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
                            <h5 className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Missing Evidence</h5>
                            <ul className="mt-3 space-y-1 text-sm text-amber-900 dark:text-amber-100">
                              {r.aiData.missingRequirements.slice(0, 4).map((item, idx) => (
                                <li key={idx}>- {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={() => updateStatus(r._id, "shortlisted")} className="secondary-button">
                          Shortlist
                        </button>
                        <button onClick={() => updateStatus(r._id, "rejected")} className="danger-button">
                          Reject
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
