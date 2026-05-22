import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";
import ThemeToggle from "../components/ThemeToggle";

const emptyJd = { title: "", description: "" };
const emptyRequisition = { title: "", status: "open" };

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [jobDescriptions, setJobDescriptions] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [activeJdId, setActiveJdId] = useState("");
  const [isEditingJd, setIsEditingJd] = useState(false);
  const [isCreatingRequisition, setIsCreatingRequisition] = useState(false);
  
  const [jdDraft, setJdDraft] = useState(emptyJd);
  const [requisitionDraft, setRequisitionDraft] = useState(emptyRequisition);
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

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [jobsRes, jdsRes] = await Promise.all([
          api.get("/jobs"),
          api.get("/job-descriptions")
        ]);
        
        const loadedJobs = jobsRes.data;
        const loadedJds = jdsRes.data;
        
        setJobs(loadedJobs);
        setJobDescriptions(loadedJds);

        // Try to select initial job/requisition
        const requestedJobId = new URLSearchParams(window.location.search).get("jobId");
        const firstJob = loadedJobs.find((job) => job._id === requestedJobId) || loadedJobs[0];

        if (firstJob) {
          setSelectedJobId(firstJob._id);
          setRequisitionDraft({ title: firstJob.title, status: firstJob.status || "open" });
          setSearchParams({ jobId: firstJob._id });
        } else if (loadedJds.length > 0) {
          setActiveJdId(loadedJds[0]._id);
          setJdDraft({ title: loadedJds[0].title, description: loadedJds[0].description });
          setIsEditingJd(true);
        } else {
          setIsEditingJd(true);
          setJdDraft({ title: "", description: "" });
        }
      } catch {
        setNotice("Could not load dashboard data. Please refresh and try again.");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [setSearchParams]);

  // Load candidates for selected requisition
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
    setIsEditingJd(false);
    setIsCreatingRequisition(false);
    setRequisitionDraft({ title: job.title, status: job.status || "open" });
    setSearchParams({ jobId: job._id });
  };

  const startNewJd = () => {
    setSelectedJobId("");
    setActiveJdId("");
    setIsEditingJd(true);
    setIsCreatingRequisition(false);
    setJdDraft(emptyJd);
  };

  const editJd = (jd) => {
    setSelectedJobId("");
    setActiveJdId(jd._id);
    setIsEditingJd(true);
    setIsCreatingRequisition(false);
    setJdDraft({ title: jd.title, description: jd.description });
  };

  const saveJd = async () => {
    if (!jdDraft.title.trim() || !jdDraft.description.trim()) {
      setNotice("Add a role title and description first.");
      return null;
    }

    setSavingJob(true);
    setNotice("");

    try {
      if (activeJdId) {
        // Update Job Description
        const res = await api.patch(`/job-descriptions/${activeJdId}`, jdDraft);
        setJobDescriptions((current) => current.map((jd) => jd._id === activeJdId ? res.data : jd));
        
        // Sync local Requisitions under this JD
        setJobs((current) => current.map((job) => {
          const isAssoc = job.jobDescription && (job.jobDescription._id === activeJdId || job.jobDescription === activeJdId);
          return isAssoc ? { ...job, title: res.data.title, description: res.data.description } : job;
        }));
        
        setNotice("Role criteria updated successfully.");
        setIsEditingJd(false);
        return res.data;
      } else {
        // Create Job Description
        const res = await api.post("/job-descriptions", jdDraft);
        setJobDescriptions((current) => [res.data, ...current]);
        setActiveJdId(res.data._id);
        setNotice("Role criteria saved. Now you can create Requisitions under it!");
        setIsEditingJd(false);
        return res.data;
      }
    } catch (error) {
      setNotice(error.response?.data?.message || "Could not save role criteria.");
      return null;
    } finally {
      setSavingJob(false);
    }
  };

  const deleteJd = async (jdId) => {
    if (!window.confirm("Are you sure you want to delete this role template? This will also delete all associated requisitions and parsing results!")) {
      return;
    }
    setNotice("");
    try {
      await api.delete(`/job-descriptions/${jdId}`);
      setJobDescriptions(current => current.filter(jd => jd._id !== jdId));
      setJobs(current => current.filter(job => {
        const isAssoc = job.jobDescription && (job.jobDescription._id === jdId || job.jobDescription === jdId);
        return !isAssoc;
      }));
      if (selectedJob && (selectedJob.jobDescription === jdId || selectedJob.jobDescription?._id === jdId)) {
        setSelectedJobId("");
      }
      setNotice("Role template and associated requisitions deleted.");
    } catch {
      setNotice("Failed to delete role criteria.");
    }
  };

  const startNewRequisition = (jdId) => {
    setSelectedJobId("");
    setActiveJdId(jdId);
    setIsEditingJd(false);
    setIsCreatingRequisition(true);
    const parentJd = jobDescriptions.find(jd => jd._id === jdId);
    setRequisitionDraft({ title: `${parentJd ? parentJd.title : ""} - Requisition`, status: "open" });
  };

  const saveRequisition = async () => {
    if (!requisitionDraft.title.trim()) {
      setNotice("Please add a requisition title.");
      return null;
    }

    setSavingJob(true);
    setNotice("");

    try {
      if (selectedJobId) {
        // Update existing Requisition
        const res = await api.patch(`/jobs/${selectedJobId}`, {
          title: requisitionDraft.title.trim(),
          status: requisitionDraft.status
        });
        setJobs((current) => current.map((job) => job._id === selectedJobId ? res.data : job));
        setNotice("Requisition updated.");
        return res.data;
      } else {
        // Create new Requisition under activeJdId
        const res = await api.post("/jobs", {
          title: requisitionDraft.title.trim(),
          jobDescriptionId: activeJdId
        });
        setJobs((current) => [res.data, ...current]);
        selectJob(res.data);
        setNotice("Requisition created successfully.");
        return res.data;
      }
    } catch (error) {
      setNotice(error.response?.data?.message || "Could not save requisition.");
      return null;
    } finally {
      setSavingJob(false);
    }
  };

  const deleteRequisition = async (reqId) => {
    if (!window.confirm("Are you sure you want to delete this requisition and all its candidate results?")) {
      return;
    }
    setNotice("");
    try {
      await api.delete(`/jobs/${reqId}`);
      setJobs(current => current.filter(job => job._id !== reqId));
      if (selectedJobId === reqId) {
        setSelectedJobId("");
      }
      setNotice("Requisition deleted.");
    } catch {
      setNotice("Failed to delete requisition.");
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
    if (!selectedJobId) return;

    setLoading(true);
    setNotice("");

    try {
      const res = await api.post("/ai/rank", { jobId: selectedJobId });
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
            {selectedJobId && (
              <button onClick={() => navigate(uploadPath)} className="secondary-button hidden sm:inline-flex">
                Upload
              </button>
            )}
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
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Workspace</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage your role templates, requisitions, and track recruiter decisions.
            </p>
          </div>

          {selectedJobId && (
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
          )}
        </div>

        {notice && (
          <div role="status" className="mb-5 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            {notice}
          </div>
        )}

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
          {/* SIDEBAR: Job Descriptions & Requisitions Library */}
          <aside className="glass-card rounded-lg p-4 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Roles & Requisitions
              </h3>
              <button onClick={startNewJd} className="secondary-button px-2.5 py-1 text-xs">
                + New Role
              </button>
            </div>

            <div className="space-y-4">
              {jobDescriptions.length === 0 && (
                <div className="rounded-md bg-slate-50 p-3 text-center dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Create a role template to get started.
                  </p>
                </div>
              )}

              {jobDescriptions.map((jd) => {
                const associatedRequisitions = jobs.filter(
                  (job) => job.jobDescription?._id === jd._id || job.jobDescription === jd._id
                );

                return (
                  <div
                    key={jd._id}
                    className={`rounded-lg border p-3 transition ${
                      activeJdId === jd._id && isEditingJd
                        ? "border-indigo-500 bg-indigo-50/10"
                        : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-950 dark:text-white" title={jd.title}>
                          {jd.title}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {associatedRequisitions.length} {associatedRequisitions.length === 1 ? "requisition" : "requisitions"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => editJd(jd)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                          title="Edit Role Template"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteJd(jd._id)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800 dark:hover:text-red-400"
                          title="Delete Role Template"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 pl-3 space-y-2 border-l border-slate-200 dark:border-slate-800">
                      {associatedRequisitions.map((req) => (
                        <div key={req._id} className="group flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => selectJob(req)}
                            className={`flex-1 text-left px-2.5 py-1.5 rounded-md text-xs transition truncate ${
                              selectedJobId === req._id
                                ? "bg-slate-900 text-white font-semibold dark:bg-white dark:text-slate-950"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <span className="block truncate">{req.title}</span>
                            <span className="block text-[9px] opacity-70 mt-0.5 capitalize">{req.status}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteRequisition(req._id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 rounded dark:hover:text-red-400 transition"
                            title="Delete Requisition"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => startNewRequisition(jd._id)}
                        className="w-full text-left px-2.5 py-1.5 rounded-md text-[11px] font-medium text-slate-400 hover:text-slate-950 dark:hover:text-white transition flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-950"
                      >
                        <span>+ Add Requisition</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Legacy Orphans without parent JD */}
              {jobs.filter((j) => !j.jobDescription).length > 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Unclassified Pipelines</span>
                  <div className="space-y-1.5">
                    {jobs
                      .filter((j) => !j.jobDescription)
                      .map((req) => (
                        <div key={req._id} className="group flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => selectJob(req)}
                            className={`flex-1 text-left px-2.5 py-1.5 rounded-md text-xs transition truncate ${
                              selectedJobId === req._id
                                ? "bg-slate-900 text-white font-semibold dark:bg-white dark:text-slate-950"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <span className="block truncate">{req.title}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteRequisition(req._id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 rounded dark:hover:text-red-400 transition"
                            title="Delete Requisition"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* MAIN PANE: Dynamic Action Workspace */}
          <div className="space-y-5">
            
            {/* STATE 1: Editing / Creating Job Description (Role Template) */}
            {isEditingJd && (
              <section className="glass-card rounded-lg p-5">
                <div className="mb-5">
                  <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                    {activeJdId ? "Edit Role Template" : "New Role Template"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Define the core job requirements. You can create multiple requisitions under this template.
                  </p>
                </div>

                <div className="grid gap-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="jd-title">
                      Role Title
                    </label>
                    <input
                      id="jd-title"
                      className="glass-input w-full rounded-md px-3 py-2.5 text-sm"
                      placeholder="e.g., Senior Backend Engineer"
                      value={jdDraft.title}
                      onChange={(e) => setJdDraft({ ...jdDraft, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="jd-description">
                      Requirements & Description
                    </label>
                    <textarea
                      id="jd-description"
                      className="glass-input min-h-64 w-full rounded-md px-3 py-2.5 text-sm leading-6"
                      placeholder="Paste job responsibilities, must-have requirements, nice-to-have skills..."
                      value={jdDraft.description}
                      onChange={(e) => setJdDraft({ ...jdDraft, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mt-5 flex gap-2">
                  <button onClick={saveJd} disabled={savingJob} className="primary-button">
                    {savingJob ? "Saving..." : "Save Role Template"}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingJd(false);
                      if (jobs.length > 0) {
                        selectJob(jobs[0]);
                      }
                    }}
                    className="secondary-button"
                  >
                    Cancel
                  </button>
                </div>
              </section>
            )}

            {/* STATE 2: Creating a Requisition under a JD */}
            {isCreatingRequisition && (
              <section className="glass-card rounded-lg p-5">
                <div className="mb-5">
                  <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                    Add Requisition
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Create a new review and ranking pipeline under the role template.
                  </p>
                </div>

                {activeJdId && (
                  <div className="mb-5 rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Inherited Criteria Template</span>
                    <span className="block mt-1 font-semibold text-sm text-slate-900 dark:text-white">
                      {jobDescriptions.find(jd => jd._id === activeJdId)?.title}
                    </span>
                    <p className="mt-1 text-xs text-slate-500 truncate max-w-xl">
                      {jobDescriptions.find(jd => jd._id === activeJdId)?.description}
                    </p>
                  </div>
                )}

                <div className="grid gap-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="req-title">
                      Requisition Name
                    </label>
                    <input
                      id="req-title"
                      className="glass-input w-full rounded-md px-3 py-2.5 text-sm"
                      placeholder="e.g., APAC Team Hire Q2"
                      value={requisitionDraft.title}
                      onChange={(e) => setRequisitionDraft({ ...requisitionDraft, title: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mt-5 flex gap-2">
                  <button onClick={saveRequisition} disabled={savingJob} className="primary-button">
                    {savingJob ? "Saving..." : "Create Requisition"}
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingRequisition(false);
                      if (jobs.length > 0) {
                        selectJob(jobs[0]);
                      }
                    }}
                    className="secondary-button"
                  >
                    Cancel
                  </button>
                </div>
              </section>
            )}

            {/* STATE 3: Viewing and ranking a selected Requisition */}
            {!isEditingJd && !isCreatingRequisition && selectedJob && (
              <>
                <section className="glass-card rounded-lg p-5">
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Requisition: {selectedJob.title}</h3>
                        <span className="rounded-md border border-slate-300 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                          {selectedJob.status}
                        </span>
                      </div>
                      {selectedJob.jobDescription && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Inherits requirements from template: <span className="font-semibold">{selectedJob.jobDescription.title || "Selected Role"}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Requisition Settings/Edit Panel */}
                  <div className="grid gap-3 border-t border-slate-100 pt-4 mt-2 sm:grid-cols-[2fr_1fr_auto] items-end dark:border-slate-800">
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500" htmlFor="req-edit-title">
                        Rename Requisition
                      </label>
                      <input
                        id="req-edit-title"
                        className="glass-input w-full rounded-md px-3 py-1.5 text-xs font-medium"
                        value={requisitionDraft.title}
                        onChange={(e) => setRequisitionDraft({ ...requisitionDraft, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500" htmlFor="req-edit-status">
                        Pipeline Status
                      </label>
                      <select
                        id="req-edit-status"
                        className="glass-input w-full rounded-md px-3 py-1.5 text-xs font-medium"
                        value={requisitionDraft.status}
                        onChange={(e) => setRequisitionDraft({ ...requisitionDraft, status: e.target.value })}
                      >
                        <option value="open">Open</option>
                        <option value="paused">Paused</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <button onClick={saveRequisition} disabled={savingJob} className="primary-button px-4 py-2 text-xs">
                      {savingJob ? "Saving..." : "Update"}
                    </button>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Active Requirements Criteria</h4>
                    <div className="rounded-md border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                      <p className="text-xs leading-6 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {selectedJob.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleRank}
                        disabled={loading || !selectedJob.description}
                        className="primary-button"
                      >
                        {loading ? "Analyzing..." : "Rank Candidates"}
                      </button>
                      <button onClick={() => navigate(uploadPath)} className="secondary-button">
                        Upload Resumes
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

                {/* Candidate Results */}
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
                        Upload resumes for this requisition and click Rank Candidates to analyze pipelines.
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
              </>
            )}

            {/* EMPTY STATE (No selected job, not editing/creating anything) */}
            {!isEditingJd && !isCreatingRequisition && !selectedJobId && (
              <section className="glass-card rounded-lg p-8 text-center">
                <h3 className="text-lg font-semibold text-slate-950 dark:text-white">No requisition active</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Select a requisition from the sidebar, or create a new Role Template to start hiring.
                </p>
                <button onClick={startNewJd} className="primary-button mt-5">
                  + Create Role Template
                </button>
              </section>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
