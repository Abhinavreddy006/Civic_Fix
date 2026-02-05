
import React, { useState, useRef, useEffect } from 'react';
import { Layout } from './components/Layout';
import { AuditResult } from './components/AuditResult';
import { analyzeCivicIssue } from './services/geminiService';
import { CivicAudit, LocationKey } from './types';
import { LOCATIONS, MAX_IMAGE_WIDTH } from './constants';

interface SavedReport {
  id: string;
  audit: CivicAudit;
  image: string;
  location: LocationKey;
  timestamp: number;
}

const ServiceModal: React.FC<{ title: string; children: React.ReactNode; onClose: () => void }> = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#333]/60 backdrop-blur-md animate-in fade-in duration-300">
    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full p-12 animate-in zoom-in-95 duration-300 border border-gray-100">
      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-[10px] font-black text-[#2ECC71] uppercase tracking-[0.4em] mb-2">Technical Deep-Dive</p>
          <h3 className="text-2xl font-black text-[#333] tracking-tighter uppercase">{title}</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-[#333] transition-colors p-2 hover:bg-gray-50 rounded-full">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5" /></svg>
        </button>
      </div>
      <div className="text-gray-500 font-medium leading-relaxed mb-8">
        {children}
      </div>
      <button 
        onClick={onClose}
        className="w-full py-5 bg-[#333] rounded-full font-black text-xs uppercase tracking-widest text-white hover:bg-[#2ECC71] transition-all shadow-lg shadow-gray-200"
      >
        Dismiss Technical View
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('civic_fix_session') === 'active';
  });
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [activeInputTab, setActiveInputTab] = useState<'camera' | 'gallery'>('camera');
  const [image, setImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [audit, setAudit] = useState<CivicAudit | null>(null);
  const [sources, setSources] = useState<any[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationKey>("");
  const [manualLocation, setManualLocation] = useState<string>("");
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [history, setHistory] = useState<SavedReport[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [activeServiceModal, setActiveServiceModal] = useState<'vision' | 'pricing' | 'routing' | null>(null);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadingMessages = [
    "⚡ Initializing Gemini Flash Pipeline...",
    "🚀 Compressing evidence for instant audit...",
    "🔍 Neural scanning architectural metrics...",
    "💰 Calculating real-time cost projections...",
    "✍️ Finalizing structural disclosure..."
  ];

  useEffect(() => {
    const saved = localStorage.getItem('civic_fix_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('civic_fix_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingPhase((prev) => (prev + 1) % loadingMessages.length);
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLocationDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resizeImage = (file: File): Promise<{full: string, b64: string}> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_WIDTH) {
            if (width > height) {
              height = Math.round((height * MAX_IMAGE_WIDTH) / width);
              width = MAX_IMAGE_WIDTH;
            } else {
              width = Math.round((width * MAX_IMAGE_WIDTH) / height);
              height = MAX_IMAGE_WIDTH;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const full = canvas.toDataURL('image/jpeg', 0.85);
          const b64 = full.split(',')[1];
          resolve({ full, b64 });
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { full, b64 } = await resizeImage(file);
        setImage(full);
        setImageBase64(b64);
        setAudit(null);
        setError(null);
      } catch (err) {
        setError("LOAD FAILURE: Could not process image evidence.");
      }
    }
  };

  const runInstantAudit = async () => {
    const finalLocation = selectedLocation === "Other (Type Manually)" ? manualLocation : selectedLocation;
    
    if (!finalLocation) {
        setError("Please select or enter an incident location first.");
        return;
    }

    if (!imageBase64) {
        setError("No image data available for audit.");
        return;
    }

    setLoading(true);
    setError(null);
    setAudit(null);
    try {
      const { audit: result, sources: searchSources } = await analyzeCivicIssue(imageBase64, finalLocation);
      if (!result.isCivicIssue) {
        setError(result.error || "GATEKEEPER REJECTION: No infrastructure failure detected.");
      } else {
        setAudit(result);
        setSources(searchSources);
        setHistory(prev => [{ id: Date.now().toString(), audit: result, image: image!, location: finalLocation, timestamp: Date.now() }, ...prev].slice(0, 10));
      }
    } catch (err) {
      setError("AUDIT FAILURE: Neural link failed. Check municipal connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
    localStorage.setItem('civic_fix_session', 'active');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('civic_fix_session');
    reset();
  };

  const reset = () => { 
    setImage(null); 
    setImageBase64(null);
    setAudit(null); 
    setError(null); 
    setSources(undefined); 
    setLocationSearch(""); 
    setSelectedLocation(""); 
  };

  const handleStartAudit = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    const element = document.getElementById('report-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredLocations = LOCATIONS.filter(loc => 
    loc.toLowerCase().includes(locationSearch.toLowerCase())
  );

  if (!isLoggedIn) {
    return (
      <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
        <div className="max-w-md mx-auto py-12 px-6">
          <div className="bg-white border border-gray-100 p-10 rounded-3xl shadow-2xl shadow-gray-100">
            <h2 className="text-3xl font-black text-[#333] mb-2">Member Access</h2>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-8">Civic Fix Studio</p>
            <form onSubmit={handleLogin} className="flex flex-col gap-6">
              <input 
                type="email" 
                placeholder="EMAIL ADDRESS" 
                defaultValue="studio@civicfix.com"
                className="w-full bg-[#F8F9FA] border-0 border-b border-gray-200 p-4 text-xs font-bold tracking-widest focus:outline-none focus:border-[#2ECC71] transition-all"
                required
              />
              <input 
                type="password" 
                placeholder="SECURE PASSWORD" 
                defaultValue="password"
                className="w-full bg-[#F8F9FA] border-0 border-b border-gray-200 p-4 text-xs font-bold tracking-widest focus:outline-none focus:border-[#2ECC71] transition-all"
                required
              />
              <button 
                type="submit" 
                className="w-full mint-button py-5 px-6 rounded-full font-black text-xs uppercase tracking-widest mt-4"
              >
                Sign In to Studio
              </button>
            </form>
          </div>
        </div>
      </Layout>
    );
  }

  const renderHome = () => (
    <div className="max-w-7xl mx-auto px-6 md:px-12">
      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-white border border-gray-100 shadow-2xl rounded-full px-8 py-4 animate-in slide-in-from-top-4 duration-300 flex items-center gap-3">
          <span className="text-xl">🚀</span>
          <p className="text-xs font-bold uppercase tracking-widest text-[#333]">System Online! Please upload your evidence below. 👇</p>
        </div>
      )}

      {!image && !loading && !error && (
        <>
          <div className="flex flex-col md:flex-row gap-16 items-center mb-24">
            <div className="md:w-[55%] flex flex-col gap-8 animate-in slide-in-from-left-8 duration-700">
              <h2 className="text-5xl md:text-7xl font-black text-[#333] leading-[1.1] tracking-tighter">
                AI-POWERED <br/> <span className="text-[#2ECC71]">CIVIC AUDITOR</span>
              </h2>
              <p className="text-gray-500 text-lg md:text-xl font-medium max-w-lg leading-relaxed">
                Don't just report problems—audit them. Instantly identify issues, calculate fair repair costs, and demand accountability with AI precision.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={handleStartAudit}
                  className="mint-button px-10 py-5 rounded-full font-black text-xs uppercase tracking-widest text-center shadow-lg shadow-[#2ECC71]/20 active:scale-95 transition-transform"
                >
                  Start Audit
                </button>
                <button 
                  onClick={() => onPageChange('about')}
                  className="bg-white border border-gray-200 text-[#333] px-10 py-5 rounded-full font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95"
                >
                  How it works
                </button>
              </div>
            </div>
            <div className="md:w-[45%] relative animate-in slide-in-from-right-8 duration-1000">
              <div className="organic-curve overflow-hidden w-full aspect-[4/5] bg-gray-100 shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" 
                  alt="City Architecture" 
                  className="w-full h-full object-cover grayscale-[0.5] hover:grayscale-0 transition-all duration-700"
                />
              </div>
              <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4">
                <div className="w-12 h-12 bg-[#2ECC71]/10 rounded-full flex items-center justify-center text-[#2ECC71]">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2.5" /></svg>
                </div>
                <div>
                  <p className="text-[#333] font-black text-xs uppercase tracking-widest">Active Status</p>
                  <p className="text-gray-400 text-[10px] font-bold">Systems Verified</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            <div className="float-card p-10 flex flex-col gap-5">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-[#2ECC71]">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth="2" /></svg>
              </div>
              <h4 className="text-[#333] font-black text-sm uppercase tracking-widest">Instant Analysis</h4>
              <p className="text-gray-500 text-sm leading-relaxed font-medium">Instantly spots potholes, broken lighting, and sewage leaks with neural vision.</p>
            </div>
            <div className="float-card p-10 flex flex-col gap-5">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-[#2ECC71]">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" /></svg>
              </div>
              <h4 className="text-[#333] font-black text-sm uppercase tracking-widest">Fair Price Calculator</h4>
              <p className="text-gray-500 text-sm leading-relaxed font-medium">Calculates fair market price based on current schedule of rates and materials.</p>
            </div>
            <div className="float-card p-10 flex flex-col gap-5">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-[#2ECC71]">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2" /></svg>
              </div>
              <h4 className="text-[#333] font-black text-sm uppercase tracking-widest">Auto-Draft Complaints</h4>
              <p className="text-gray-500 text-sm leading-relaxed font-medium">Auto-drafts legal complaints and viral social broadcasts for rapid response.</p>
            </div>
          </div>
        </>
      )}

      <div id="report-section" className="scroll-mt-32">
        {image || loading || error ? (
          <div className="animate-in fade-in duration-500 py-12">
            {loading && (
              <div className="flex flex-col items-center justify-center py-24 gap-8">
                <div className="w-12 h-12 border-4 border-gray-100 border-t-[#2ECC71] rounded-full animate-spin"></div>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">{loadingMessages[loadingPhase]}</p>
              </div>
            )}
            
            {error && !loading && (
              <div className="max-w-xl mx-auto text-center py-12 px-6">
                <div className="w-16 h-16 bg-red-50 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth="2.5" /></svg>
                </div>
                <h3 className="text-[#333] font-black text-xl mb-4">Studio Rejection</h3>
                <p className="text-gray-500 mb-8 font-medium">{error}</p>
                <button onClick={reset} className="bg-[#333] text-white px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest">Re-upload Evidence</button>
              </div>
            )}

            {!loading && image && !audit && !error && (
              <div className="max-w-3xl mx-auto flex flex-col items-center gap-12 animate-in zoom-in-95 duration-500">
                <div className="relative group overflow-hidden rounded-[2.5rem] shadow-2xl border-4 border-white">
                  <img src={image} alt="Preview" className="w-full h-auto object-cover max-h-[60vh]" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <p className="text-white text-xs font-black uppercase tracking-widest">Evidence Staged</p>
                  </div>
                </div>
                <div className="flex flex-col gap-4 w-full max-sm px-6">
                   <button 
                    onClick={runInstantAudit}
                    className="mint-button w-full py-6 rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-[#2ECC71]/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                   >
                    🚀 Run Instant Audit
                   </button>
                   <button 
                    onClick={reset}
                    className="w-full py-4 bg-gray-50 text-gray-400 rounded-full font-black text-[10px] uppercase tracking-widest hover:text-red-400 transition-colors"
                   >
                    Cancel / Replace
                   </button>
                </div>
              </div>
            )}

            {audit && image && !loading && <AuditResult audit={audit} image={image} location={selectedLocation === "Other (Type Manually)" ? manualLocation : selectedLocation} sources={sources} onReset={reset} />}
          </div>
        ) : (
          <div id="project-start" className="bg-[#F8F9FA] rounded-[3rem] p-8 md:p-20 text-center mb-24">
            <h3 className="text-3xl md:text-4xl font-black text-[#333] mb-4 tracking-tighter uppercase">REPORT A CIVIC ISSUE</h3>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-12">SELECT LOCATION & EVIDENCE COLLECTION METHOD</p>
            
            <div className="max-w-xl mx-auto flex flex-col gap-8">
              <div className="flex flex-col gap-2 text-left relative" ref={dropdownRef}>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                    📍 Incident Location
                </label>
                
                <div className="relative">
                  <input 
                    type="text"
                    className="w-full bg-white border border-gray-100 p-5 pl-12 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#2ECC71]/20 shadow-sm transition-all"
                    placeholder="🔍 Search or Select Area (e.g. Uppal, Gachibowli...)"
                    value={isLocationDropdownOpen ? locationSearch : (selectedLocation || "")}
                    onFocus={() => {
                        setIsLocationDropdownOpen(true);
                        setLocationSearch("");
                    }}
                    onChange={(e) => setLocationSearch(e.target.value)}
                  />
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>

                {isLocationDropdownOpen && (
                  <div className="absolute top-full left-0 w-full z-50 bg-white border border-gray-100 shadow-xl max-h-60 overflow-y-auto mt-1 animate-in slide-in-from-top-2 duration-200">
                    {filteredLocations.length > 0 ? (
                      filteredLocations.map(loc => (
                        <div 
                          key={loc}
                          className="p-4 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-[#2ECC71] cursor-pointer border-b border-gray-50 last:border-0"
                          onClick={() => {
                            setSelectedLocation(loc);
                            setIsLocationDropdownOpen(false);
                            setLocationSearch(loc);
                          }}
                        >
                          {loc}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-xs text-gray-400 italic">No locations found. Use "Other" to specify.</div>
                    )}
                  </div>
                )}
              </div>

              {selectedLocation === "Other (Type Manually)" && (
                <div className="flex flex-col gap-2 text-left animate-in slide-in-from-top-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">✍️ ENTER CUSTOM LOCATION</label>
                   <input 
                    type="text"
                    placeholder="e.g. Near Main Gate, Street No. 4"
                    className="w-full bg-white border border-gray-100 p-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#2ECC71]/20 shadow-sm"
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                   />
                </div>
              )}

              <div className="mt-4">
                <div className="flex p-1 bg-white border border-gray-100 rounded-full mb-8 shadow-sm">
                  <button 
                    onClick={() => setActiveInputTab('camera')}
                    className={`flex-1 py-3 px-6 rounded-full font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeInputTab === 'camera' ? 'bg-[#333] text-white shadow-lg' : 'text-gray-400 hover:text-[#333]'}`}
                  >
                    📸 Take Picture
                  </button>
                  <button 
                    onClick={() => setActiveInputTab('gallery')}
                    className={`flex-1 py-3 px-6 rounded-full font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeInputTab === 'gallery' ? 'bg-[#333] text-white shadow-lg' : 'text-gray-400 hover:text-[#333]'}`}
                  >
                    📂 Import Gallery
                  </button>
                </div>

                <div className="animate-in fade-in duration-300">
                  {activeInputTab === 'camera' ? (
                    <div className="flex flex-col gap-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Live Field Audit Capture</p>
                      <button 
                        onClick={() => {
                          if (!selectedLocation || (selectedLocation === "Other (Type Manually)" && !manualLocation)) {
                            setError("Please specify a location before proceeding.");
                            return;
                          }
                          cameraInputRef.current?.click();
                        }}
                        className="mint-button w-full py-6 rounded-3xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#2ECC71]/20 flex items-center justify-center gap-3"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeWidth="2.5"/><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2.5"/></svg>
                        Tap to Capture Evidence
                      </button>
                      <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Architectural Proof Gallery</p>
                      <button 
                        onClick={() => {
                          if (!selectedLocation || (selectedLocation === "Other (Type Manually)" && !manualLocation)) {
                            setError("Please specify a location before proceeding.");
                            return;
                          }
                          galleryInputRef.current?.click();
                        }}
                        className="bg-white border border-gray-200 text-[#333] w-full py-6 rounded-3xl font-black text-xs uppercase tracking-widest hover:border-[#2ECC71] hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
                      >
                        <svg className="w-5 h-5 text-[#2ECC71]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2.5"/></svg>
                        Upload from Gallery
                      </button>
                      <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderServices = () => (
    <div className="max-w-4xl mx-auto px-6 py-12 animate-in fade-in duration-500">
      <h2 className="text-4xl font-black text-[#333] mb-12 text-center tracking-tighter uppercase">Our Civic Services</h2>
      
      <div className="flex flex-col gap-10">
        <div className="bg-[#F8F9FA] p-10 rounded-[2rem] flex flex-col md:flex-row items-center gap-10 group hover:bg-white hover:shadow-2xl hover:shadow-gray-100 transition-all duration-500">
          <div className="w-24 h-24 shrink-0 bg-white rounded-[1.5rem] flex items-center justify-center text-4xl shadow-sm group-hover:scale-110 transition-transform">
            👁️
          </div>
          <div className="flex-grow">
            <h4 className="text-xl font-black text-[#333] mb-2 uppercase tracking-tight">AI Forensic Detection</h4>
            <p className="text-gray-500 font-medium leading-relaxed mb-6">Our computer vision engine is trained on thousands of infrastructure failure patterns to identify structural compromise instantly.</p>
            <button 
              onClick={() => setActiveServiceModal('vision')}
              className="text-[#2ECC71] font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all"
            >
              See How It Works ➜
            </button>
          </div>
        </div>

        <div className="bg-[#F8F9FA] p-10 rounded-[2rem] flex flex-col md:flex-row items-center gap-10 group hover:bg-white hover:shadow-2xl hover:shadow-gray-100 transition-all duration-500">
          <div className="w-24 h-24 shrink-0 bg-white rounded-[1.5rem] flex items-center justify-center text-4xl shadow-sm group-hover:scale-110 transition-transform">
            ⚖️
          </div>
          <div className="flex-grow">
            <h4 className="text-xl font-black text-[#333] mb-2 uppercase tracking-tight">Fair Market Cost Audit</h4>
            <p className="text-gray-500 font-medium leading-relaxed mb-6">Cross-referencing national Schedule of Rates and current market prices for raw materials to provide budget baseline.</p>
            <button 
              onClick={() => setActiveServiceModal('pricing')}
              className="text-[#2ECC71] font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all"
            >
              See How It Works ➜
            </button>
          </div>
        </div>

        <div className="bg-[#F8F9FA] p-10 rounded-[2rem] flex flex-col md:flex-row items-center gap-10 group hover:bg-white hover:shadow-2xl hover:shadow-gray-100 transition-all duration-500">
          <div className="w-24 h-24 shrink-0 bg-white rounded-[1.5rem] flex items-center justify-center text-4xl shadow-sm group-hover:scale-110 transition-transform">
            📢
          </div>
          <div className="flex-grow">
            <h4 className="text-xl font-black text-[#333] mb-2 uppercase tracking-tight">Viral Reporting Bot</h4>
            <p className="text-gray-500 font-medium leading-relaxed mb-6">Democratizing accountability through automated legal and social drafts optimized for visibility.</p>
            <button 
              onClick={() => setActiveServiceModal('routing')}
              className="text-[#2ECC71] font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all"
            >
              See How It Works ➜
            </button>
          </div>
        </div>
      </div>

      {activeServiceModal === 'vision' && (
        <ServiceModal title="Computer Vision Pipeline" onClose={() => setActiveServiceModal(null)}>
          <p className="mb-6">We utilize <strong>Google Gemini</strong>'s Multimodal Vision Transformer. The model does not just 'see' the image; it performs <strong>Semantic Segmentation</strong> to isolate the damaged area (e.g., the specific pothole) from the background environment.</p>
          <div className="bg-[#1e1e1e] p-6 rounded-2xl overflow-x-auto border border-gray-800">
            <code className="text-[#2ECC71] text-xs font-mono">
              {`{ "detected_object": "pothole", "confidence": 0.98, "severity": "high" }`}
            </code>
          </div>
        </ServiceModal>
      )}

      {activeServiceModal === 'pricing' && (
        <ServiceModal title="Algorithmic Cost Estimation" onClose={() => setActiveServiceModal(null)}>
          <p className="mb-6">The AI performs <strong>Pixel-to-Metric Conversion</strong>. It estimates the square footage of the damage based on reference objects in the frame. It then queries a database of <strong>CPWD Rates</strong>.</p>
        </ServiceModal>
      )}

      {activeServiceModal === 'routing' && (
        <ServiceModal title="RAG & Authority Routing" onClose={() => setActiveServiceModal(null)}>
          <p className="mb-6">We use <strong>Retrieval-Augmented Generation (RAG)</strong>. The AI takes the location tag, maps it to the correct municipal ward, retrieves the specific Commissioner's contact details, and injects them into a formal template.</p>
        </ServiceModal>
      )}
    </div>
  );

  const renderAbout = () => (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-in fade-in duration-700">
      <div className="text-center mb-24">
        <h2 className="text-5xl font-black text-[#333] mb-4 tracking-tighter uppercase">Our Mission: Transparency</h2>
        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Bridging the gap between citizens and municipal efficiency</p>
      </div>

      <div className="flex flex-col gap-32">
        {/* Section 1: The Problem */}
        <div className="flex flex-col md:flex-row items-center gap-16">
          <div className="md:w-1/2">
            <img 
              src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" 
              className="rounded-[3rem] shadow-2xl grayscale hover:grayscale-0 transition-all duration-700 aspect-video object-cover" 
              alt="The Problem"
            />
          </div>
          <div className="md:w-1/2">
            <h3 className="text-3xl font-black text-[#333] mb-6 tracking-tight uppercase">The Problem</h3>
            <p className="text-xl text-gray-500 font-medium leading-relaxed">Infrastructure fails because no one audits the cost. Broken streets and leaked pipes persist because there is a lack of technical oversight and transparent reporting.</p>
          </div>
        </div>

        <div className="h-px bg-gray-100 w-full" />

        {/* Section 2: The Solution */}
        <div className="flex flex-col md:flex-row-reverse items-center gap-16">
          <div className="md:w-1/2">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71" 
                className="rounded-[3rem] shadow-2xl aspect-video object-cover" 
                alt="The Solution"
              />
              <p className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-[#333] shadow-sm">
                Data-Driven Transparency
              </p>
            </div>
          </div>
          <div className="md:w-1/2">
            <h3 className="text-3xl font-black text-[#333] mb-6 tracking-tight uppercase">⚡ The Solution: AI Governance</h3>
            <p className="text-xl text-gray-500 font-medium leading-relaxed">
              Civic-Fix replaces manual inspections with <strong>Computer Vision</strong>. We provide instant, mathematically accurate repair audits that force transparency. We don't just report problems; we engineer the solution.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-40 text-center bg-[#F8F9FA] p-20 rounded-[4rem]">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-4">Development Team</h4>
        <h3 className="text-4xl font-black text-[#333] mb-8 tracking-tighter uppercase">Created by Team OG</h3>
        <p className="text-gray-500 max-w-lg mx-auto font-medium">Combining engineering excellence with modern software design to fix our cities one audit at a time.</p>
      </div>
    </div>
  );

  const onPageChange = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Layout isLoggedIn={true} onLogout={handleLogout} currentPage={currentPage} onPageChange={onPageChange}>
      {currentPage === 'home' && renderHome()}
      {currentPage === 'services' && renderServices()}
      {currentPage === 'about' && renderAbout()}
    </Layout>
  );
};

export default App;
