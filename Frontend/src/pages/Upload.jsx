import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import ThemeToggle from "../components/ThemeToggle";

export default function Upload() {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const allFiles = Array.from(e.dataTransfer.files);
      const validFiles = allFiles.filter(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
      if (validFiles.length !== allFiles.length) {
        alert("Only PDF files are allowed.");
      }
      setFiles(validFiles);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const allFiles = Array.from(e.target.files);
      const validFiles = allFiles.filter(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
      if (validFiles.length !== allFiles.length) {
        alert("Only PDF files are allowed.");
      }
      setFiles(validFiles);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setLoading(true);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append("resumes", files[i]);
    }

    try {
        await api.post("/resume/upload", formData);
        alert("Resumes Uploaded Successfully!");
        setFiles([]);
        navigate("/dashboard");
    } catch (error) {
        alert("Upload failed.");
    } finally {
        setLoading(false);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-gray-50 to-white dark:from-indigo-900 dark:via-gray-950 dark:to-black font-sans text-gray-900 dark:text-gray-200 pb-12 relative overflow-x-hidden flex flex-col items-center pt-24 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <ThemeToggle className="absolute top-6 right-6 z-50" />
      {/* Decorative animated background elements */}
      <div className="absolute top-[10%] left-[-5%] w-[400px] h-[400px] bg-purple-400/20 dark:bg-purple-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-pulse-slow pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-5%] w-[500px] h-[500px] bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] animate-pulse-slow pointer-events-none" style={{ animationDelay: '2s' }}></div>
      
      <div className="w-full max-w-3xl glass-card rounded-[2rem] p-10 shadow-2xl animate-fade-in-up">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight font-display transition-colors">Upload Resumes</h1>
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 max-w-md transition-colors">Drag and drop candidate resumes here to securely process and match them against your job descriptions using our AI.</p>
            </div>
            <button 
                onClick={() => navigate("/dashboard")}
                className="px-5 py-2.5 text-sm font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-500/10 hover:bg-indigo-200 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/20 rounded-xl transition-all duration-300 shadow-sm flex items-center gap-2 group hover:text-indigo-800 dark:hover:text-white"
            >
                <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Dashboard
            </button>
        </div>

        {/* Upload Area */}
        <div 
            className={`mt-6 relative overflow-hidden flex flex-col items-center justify-center px-6 pt-12 pb-14 border-2 outline-dashed outline-2 outline-offset-[-2px] rounded-3xl transition-all duration-300 shadow-inner group
                ${isDragging ? 'outline-indigo-500 border-indigo-500/50 bg-indigo-50 dark:bg-indigo-500/10 scale-[1.02]' : 'outline-gray-300 dark:outline-white/10 border-transparent bg-gray-50/50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 hover:outline-indigo-500/50'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
          {isDragging && <div className="absolute inset-0 bg-indigo-500/10 animate-pulse"></div>}

          <div className="space-y-5 text-center relative z-10 w-full max-w-sm">
            
            {/* Upload Icon */}
            <div className={`mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-white dark:bg-white/10 backdrop-blur-md shadow-lg transition-all duration-300 text-indigo-500 dark:text-indigo-400 border border-gray-200 dark:border-white/10
                ${isDragging ? 'scale-110 shadow-indigo-500/30' : 'group-hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]'}`}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" className={`w-10 h-10 ${isDragging ? 'animate-bounce' : ''}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
            </div>

            <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-300 justify-center items-center transition-colors">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer bg-white dark:bg-white/10 px-6 py-2.5 rounded-full font-bold text-gray-800 dark:text-white shadow-sm border border-gray-300 dark:border-white/20 hover:text-indigo-600 dark:hover:text-indigo-200 hover:border-indigo-400 dark:hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-white/20 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 focus-within:ring-offset-gray-900 transition-all duration-200"
              >
                <span>Select files to upload</span>
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
              <p className="font-medium text-gray-500 dark:text-gray-400 mt-2 transition-colors">or drag and drop them here</p>
            </div>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-widest bg-gray-200 dark:bg-black/30 inline-block px-3 py-1 rounded-md border border-gray-300 dark:border-white/5 transition-colors">
              PDF limits up to 5MB
            </p>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
            <div className="mt-10 animate-fade-in-up">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider font-display transition-colors">Selected Files <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md ml-2 border border-indigo-200 dark:border-indigo-500/30">{files.length}</span></h3>
                    <button onClick={() => setFiles([])} className="text-xs font-bold text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 transition-colors">Clear All</button>
                </div>
                <ul className="bg-white/50 dark:bg-black/20 backdrop-blur-md shadow-inner rounded-2xl border border-gray-200 dark:border-white/10 divide-y divide-gray-200 dark:divide-white/5 max-h-72 overflow-y-auto pr-1 transition-colors">
                    {files.map((file, index) => (
                        <li key={index} className="pl-5 pr-4 py-4 flex items-center justify-between text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                            <div className="flex items-center flex-1 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                    <svg className="h-4 w-4 text-indigo-500 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3 flex-1 w-0 truncate">
                                    <span className="font-semibold text-gray-800 dark:text-gray-200 truncate block transition-colors">{file.name}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-500 font-medium transition-colors">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => removeFile(index)}
                                className="ml-4 flex-shrink-0 text-gray-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 bg-gray-100 dark:bg-white/5 hover:bg-rose-100 dark:hover:bg-rose-500/10 p-2 rounded-xl transition-all duration-200 shadow-sm border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20 opacity-0 group-hover:opacity-100"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </li>
                    ))}
                </ul>
                
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleUpload}
                        disabled={loading}
                        className={`inline-flex items-center px-8 py-3.5 border border-indigo-500/50 text-base font-bold rounded-xl shadow-lg text-white transition-all duration-300 relative overflow-hidden group
                            ${loading ? 'bg-indigo-400 dark:bg-indigo-900/50 cursor-not-allowed shadow-none opacity-50' : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600/80 dark:hover:bg-indigo-500 hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] hover:-translate-y-0.5'}`}
                    >
                        {!loading && <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>}
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-200" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Uploading...
                            </>
                        ) : 'Process Resumes →'}
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}