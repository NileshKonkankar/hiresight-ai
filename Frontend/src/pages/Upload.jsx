import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";
import ThemeToggle from "../components/ThemeToggle";

export default function Upload() {
  const [files, setFiles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [notice, setNotice] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const res = await api.get("/jobs");
        const loadedJobs = res.data;
        setJobs(loadedJobs);

        const requestedJobId = searchParams.get("jobId");
        const selectedJob = loadedJobs.find((job) => job._id === requestedJobId) || loadedJobs[0];

        if (selectedJob) {
          setSelectedJobId(selectedJob._id);
        }
      } catch {
        setNotice("Could not load roles. Create a role on the dashboard first.");
      }
    };

    loadJobs();
  }, [searchParams]);

  const selectValidFiles = (incomingFiles) => {
    const allFiles = Array.from(incomingFiles);
    const validFiles = allFiles.filter(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));

    if (validFiles.length !== allFiles.length) {
      setNotice("Only PDF files are allowed.");
    } else {
      setNotice("");
    }

    setFiles(validFiles);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      selectValidFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      selectValidFiles(e.target.files);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    if (!selectedJobId) {
      setNotice("Select a role before uploading resumes.");
      return;
    }

    setLoading(true);
    setNotice("");

    const formData = new FormData();
    formData.append("jobId", selectedJobId);
    for (let i = 0; i < files.length; i++) {
      formData.append("resumes", files[i]);
    }

    try {
      await api.post("/resume/upload", formData);
      setFiles([]);
      navigate(`/dashboard?jobId=${selectedJobId}`);
    } catch (error) {
      setNotice(error.response?.data?.message || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="page-shell">
      <header className="app-header">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-xs font-bold text-white dark:bg-white dark:text-slate-950">
              HS
            </div>
            <div>
              <h1 className="text-base font-semibold leading-5">HireSight AI</h1>
              <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">Resume intake</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => navigate(selectedJobId ? `/dashboard?jobId=${selectedJobId}` : "/dashboard")}
              className="secondary-button"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Upload Resumes</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Add candidate PDFs to a specific role for scoped review and ranking.
          </p>
        </div>

        {notice && (
          <div role="status" className="mb-5 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            {notice}
          </div>
        )}

        <section className="glass-card rounded-lg p-5">
          <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="job-select">
                Role / Job Description
              </label>
              <select
                id="job-select"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="glass-input w-full rounded-md px-3 py-2.5 text-sm font-medium"
              >
                <option value="">Select a role</option>
                {jobs.map((job) => (
                  <option key={job._id} value={job._id}>{job.title}</option>
                ))}
              </select>
            </div>
            <button type="button" onClick={() => navigate("/dashboard")} className="secondary-button">
              Create Role
            </button>
          </div>

          <div
            className={`flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center transition ${
              isDragging
                ? "border-slate-950 bg-slate-100 dark:border-slate-300 dark:bg-slate-800"
                : "border-slate-300 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 16V4m0 0 4 4m-4-4-4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
              </svg>
            </div>

            <h3 className="text-base font-semibold text-slate-950 dark:text-white">Select PDF resumes</h3>
            <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
              Drag files here or browse from your computer. Each PDF must be 5MB or smaller.
            </p>

            <label htmlFor="file-upload" className="secondary-button mt-5 cursor-pointer">
              Browse Files
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                multiple
                accept=".pdf,application/pdf"
                className="sr-only"
                ref={fileInputRef}
                onChange={handleFileSelect}
              />
            </label>
          </div>

          {files.length > 0 && (
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  Selected Files ({files.length})
                </h3>
                <button onClick={() => setFiles([])} className="text-sm font-semibold text-red-700 hover:text-red-800 dark:text-red-300">
                  Clear All
                </button>
              </div>

              <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                {files.map((file, index) => (
                  <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{file.name}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <button onClick={() => removeFile(index)} className="danger-button px-3 py-1.5 text-xs">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex justify-end">
                <button onClick={handleUpload} disabled={loading || !selectedJobId} className="primary-button">
                  {loading ? "Uploading..." : "Upload Resumes"}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
