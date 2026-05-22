import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";
import ThemeToggle from "../components/ThemeToggle";

const emptyRole = { title: "", description: "" };

export default function Dashboard() {
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  
  const [roleDraft, setRoleDraft] = useState(emptyRole);
  const [results, setResults] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [notice, setNotice] = useState("");
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const selectedRole = useMemo(
    () => roles.find((role) => role._id === selectedRoleId),
    [roles, selectedRoleId]
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
        const res = await api.get("/jobs");
        const loadedRoles = res.data;
        setRoles(loadedRoles);

        const requestedRoleId = new URLSearchParams(window.location.search).get("jobId");
        const firstRole = loadedRoles.find((role) => role._id === requestedRoleId) || loadedRoles[0];

        if (firstRole) {
          setSelectedRoleId(firstRole._id);
          setRoleDraft({ title: firstRole.title, description: firstRole.description });
          setSearchParams({ jobId: firstRole._id });
        } else {
          setIsCreatingRole(true);
          setRoleDraft(emptyRole);
        }
      } catch {
        setNotice("Could not load roles. Please refresh and try again.");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [setSearchParams]);

  // Load candidates for selected role
  useEffect(() => {
    if (!selectedRoleId) {
      setResults([]);
      return;
    }

    loadCandidates(selectedRoleId);
  }, [selectedRoleId]);

  const loadCandidates = async (roleId) => {
    try {
      const res = await api.get("/resume", { params: { jobId: roleId } });
      setResults(res.data.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0)));
    } catch {
      setNotice("Could not load candidates for this role.");
    }
  };

  const selectRole = (role) => {
    setSelectedRoleId(role._id);
    setIsEditingRole(false);
    setIsCreatingRole(false);
    setRoleDraft({ title: role.title, description: role.description });
    setSearchParams({ jobId: role._id });
  };

  const startNewRole = () => {
    setSelectedRoleId("");
    setIsCreatingRole(true);
    setIsEditingRole(false);
    setRoleDraft(emptyRole);
    setResults([]);
  };

  const startEditRole = () => {
    if (!selectedRole) return;
    setIsEditingRole(true);
    setIsCreatingRole(false);
    setRoleDraft({ title: selectedRole.title, description: selectedRole.description });
  };

  const saveRole = async () => {
    if (!roleDraft.title.trim() || !roleDraft.description.trim()) {
      setNotice("Add a role title and description first.");
      return null;
    }

    setSavingRole(true);
    setNotice("");

    try {
      if (selectedRoleId) {
        // Update existing Role
        const res = await api.patch(`/jobs/${selectedRoleId}`, roleDraft);
        setRoles((current) => current.map((role) => role._id === selectedRoleId ? res.data : role));
        setRoleDraft({ title: res.data.title, description: res.data.description });
        setIsEditingRole(false);
        setNotice("Role updated successfully.");
        return res.data;
      } else {
        // Create new Role
        const res = await api.post("/jobs", roleDraft);
        setRoles((current) => [res.data, ...current]);
        selectRole(res.data);
        setNotice("Role created successfully. You can now upload and rank resumes!");
        return res.data;
      }
    } catch (error) {
      setNotice(error.response?.data?.message || "Could not save role.");
      return null;
    } finally {
      setSavingRole(false);
    }
  };

  const deleteRole = async (roleId) => {
    if (!window.confirm("Are you sure you want to delete this role and all its candidates?")) {
      return;
    }
    setNotice("");
    try {
      await api.delete(`/jobs/${roleId}`);
      const remainingRoles = roles.filter(role => role._id !== roleId);
      setRoles(remainingRoles);
      
      if (selectedRoleId === roleId) {
        if (remainingRoles.length > 0) {
          selectRole(remainingRoles[0]);
        } else {
          setSelectedRoleId("");
          startNewRole();
        }
      }
      setNotice("Role deleted.");
    } catch {
      setNotice("Failed to delete role.");
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
    if (!selectedRoleId) return;

    setLoading(true);
    setNotice("");

    try {
      const res = await api.post("/ai/rank", { jobId: selectedRoleId });
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
    if (!selectedRoleId) {
      setNotice("Select a role before exporting candidates.");
      return;
    }

    try {
      const res = await api.get("/export/csv", {
        params: { jobId: selectedRoleId },
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

  const uploadPath = selectedRoleId ? `/upload?jobId=${selectedRoleId}` : "/upload";

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
            {selectedRoleId && (
              <button onClick={() => navigate(uploadPath)} className="secondary-button hidden sm:inline-flex">
                Upload Resumes
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
              Select or create a Role, upload resumes, and let AI score them against your requirements.
            </p>
          </div>

          {selectedRoleId && (
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

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
          
          {/* SIDEBAR: Saved Roles/JDs */}
          <aside className="glass-card rounded-lg p-4 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Roles & JDs
              </h3>
              <button onClick={startNewRole} className="secondary-button px-2.5 py-1 text-xs">
                + New Role
              </button>
            </div>

            <div className="space-y-2">
              {roles.length === 0 && (
                <p className="rounded-md bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-950 dark:text-slate-400 text-center">
                  No roles saved yet. Create a new role template.
                </p>
              )}

              {roles.map((role) => (
                <div
                  key={role._id}
                  className={`group flex items-center justify-between gap-2 rounded-md border p-3 transition ${
                    selectedRoleId === role._id
                      ? "border-slate-950 bg-slate-100 dark:border-slate-300 dark:bg-slate-800"
                      : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectRole(role)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <span className="block truncate text-sm font-semibold text-slate-950 dark:text-white">
                      {role.title}
                    </span>
                    <span className="block text-[10px] uppercase tracking-wide text-slate-400 mt-0.5 capitalize">
                      {role.status || "open"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteRole(role._id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 rounded dark:hover:text-red-400 transition shrink-0"
                    title="Delete Role"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </aside>

          {/* MAIN PANEL */}
          <div className="space-y-5">
            
            {/* VIEW 1: Create or Edit Role */}
            {(isCreatingRole || isEditingRole) && (
              <section className="glass-card rounded-lg p-5">
                <div className="mb-5">
                  <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                    {isCreatingRole ? "Create New Role" : `Edit Role Criteria: ${selectedRole?.title}`}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Define the core title and requirements. Resumes will be evaluated directly against this text.
                  </p>
                </div>

                <div className="grid gap-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="role-title">
                      Job / Role Title
                    </label>
                    <input
                      id="role-title"
                      className="glass-input w-full rounded-md px-3 py-2.5 text-sm"
                      placeholder="e.g., Lead Full Stack Architect"
                      value={roleDraft.title}
                      onChange={(e) => setRoleDraft({ ...roleDraft, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="role-description">
                      Job Description & Requirements
                    </label>
                    <textarea
                      id="role-description"
                      className="glass-input min-h-64 w-full rounded-md px-3 py-2.5 text-sm leading-6"
                      placeholder="Paste responsibilities, experience constraints, required tech stacks..."
                      value={roleDraft.description}
                      onChange={(e) => setRoleDraft({ ...roleDraft, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mt-5 flex gap-2">
                  <button onClick={saveRole} disabled={savingRole} className="primary-button">
                    {savingRole ? "Saving..." : isCreatingRole ? "Create Role" : "Save Changes"}
                  </button>
                  <button
                    onClick={() => {
                      if (roles.length > 0) {
                        const fallBackRole = selectedRoleId ? selectedRole : roles[0];
                        selectRole(fallBackRole);
                      } else {
                        setIsCreatingRole(true);
                        setIsEditingRole(false);
                      }
                    }}
                    className="secondary-button"
                  >
                    Cancel
                  </button>
                </div>
              </section>
            )}

            {/* VIEW 2: Selected Role Dashboard */}
            {!isCreatingRole && !isEditingRole && selectedRole && (
              <>
                {/* Role Details and Configuration */}
                <section className="glass-card rounded-lg p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{selectedRole.title}</h3>
                        <span className="rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs font-semibold capitalize text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                          {selectedRole.status || "open"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Active Screening Workspace
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={startEditRole}
                        className="secondary-button px-3 py-1 text-xs"
                      >
                        Edit JD / Role
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Job Description (JD)</h4>
                    <div className="rounded-md border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                      <p className="text-xs leading-6 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {selectedRole.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleRank}
                        disabled={loading}
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
                          Export CSV
                        </button>
                      </div>
                    )}
                  </div>
                </section>

                {/* Candidate Screening Results list */}
                <section className="glass-card rounded-lg">
                  <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Screening Pipeline Results</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      AI compatibility scores based on the active role's requirements.
                    </p>
                  </div>

                  {results.length === 0 && !loading ? (
                    <div className="px-5 py-12 text-center">
                      <h4 className="text-base font-semibold text-slate-950 dark:text-white">No candidates in this role yet</h4>
                      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                        Upload candidate resumes (PDFs) and click Rank Candidates to see them analyzed against your JD!
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
                                <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Match Evidence</h5>
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
                                <h5 className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Missing Requirements</h5>
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

            {/* EMPTY STATE */}
            {!isCreatingRole && !isEditingRole && !selectedRoleId && (
              <section className="glass-card rounded-lg p-8 text-center">
                <h3 className="text-lg font-semibold text-slate-950 dark:text-white">No active role selected</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Select a role from the sidebar, or create a new Role template to start analyzing candidate resumes.
                </p>
                <button onClick={startNewRole} className="primary-button mt-5">
                  + Create New Role
                </button>
              </section>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
