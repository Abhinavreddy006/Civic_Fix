
import React, { useState } from 'react';
import { CivicAudit, LocationKey } from '../types';
import { ROUTING_MAP } from '../constants';

interface AuditResultProps {
  audit: CivicAudit;
  image: string;
  location: LocationKey;
  sources?: any[];
  onReset: () => void;
}

export const AuditResult: React.FC<AuditResultProps> = ({ audit, image, location, sources, onReset }) => {
  const [showDraft, setShowDraft] = useState(false);
  const [editedEmail, setEditedEmail] = useState(audit.formalEmail);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const tweetIntent = () => {
    const handle = ROUTING_MAP[location] || ROUTING_MAP["default"];
    const text = `${handle} ${audit.viralTweet} #CivicHub #UrbanAudit`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([editedEmail], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `CivicFix_Report_${audit.issueName.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedEmail);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const emailSubject = `URGENT: Safety Hazard Report - ${audit.issueName} at ${location}`;
  const mailtoLink = `mailto:${audit.authorityEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(editedEmail)}`;

  return (
    <div className="flex flex-col gap-12 animate-in fade-in duration-700 max-w-7xl mx-auto px-6 pb-20">
      <div className="flex flex-col md:flex-row gap-16">
        {/* Col 1: Visual Evidence */}
        <div className="md:w-1/2 flex flex-col gap-6">
          <div className="bg-white p-4 rounded-[2rem] shadow-2xl shadow-gray-100 border border-gray-50">
            <img src={image} alt="Audit Evidence" className="w-full aspect-square object-cover rounded-[1.5rem]" />
          </div>
          <div className="px-4">
            <p className="text-[10px] font-black text-[#2ECC71] uppercase tracking-[0.4em] mb-2">Subject identification</p>
            <h2 className="text-3xl font-black text-[#333] tracking-tighter mb-2 uppercase">{audit.issueName}</h2>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Ref. Area: {location}</p>
          </div>
        </div>

        {/* Col 2: Studio Audit */}
        <div className="md:w-1/2 flex flex-col gap-8">
          <div className="bg-[#F8F9FA] p-12 rounded-[2rem] flex flex-col items-center text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Estimated repair valuation</p>
            <h3 className="text-7xl font-black text-[#2ECC71] tracking-tighter">
              ₹{audit.costINR.toLocaleString()}
            </h3>
            <p className="mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Market standard professional rate</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="border border-gray-100 p-8 rounded-2xl">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Impact Severity</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-[#333]">{audit.severity}</span>
                <span className="text-gray-300 font-black mb-1">/ 10</span>
              </div>
            </div>
            <div className="border border-gray-100 p-8 rounded-2xl">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Routing Authority</p>
              <span className="text-xs font-black text-[#333] uppercase leading-tight block">{audit.targetAuthority}</span>
              <p className="text-[8px] text-gray-400 font-mono mt-1 break-all">{audit.authorityEmail}</p>
            </div>
          </div>

          <div className="p-8 bg-white border border-gray-100 rounded-2xl">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Technical Specs</p>
            <div className="flex flex-col gap-2">
              <p className="text-gray-600 font-medium text-sm"><strong>Dimensions:</strong> {audit.dimensions}</p>
              <p className="text-gray-600 font-medium text-sm"><strong>Materials:</strong> {audit.materialNeeded}</p>
              <p className="text-gray-600 font-medium text-sm"><strong>ETA:</strong> {audit.timeToFix}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Suite */}
      <div className="bg-[#333] text-white p-12 md:p-16 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="max-w-md">
          <h4 className="text-2xl font-black mb-4 tracking-tighter uppercase">Automated Disclosure</h4>
          <p className="text-gray-400 text-sm leading-relaxed font-medium">Assigning to: <span className="text-white">{audit.targetAuthority}</span>. Finalize the official complaint draft below.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <a href={tweetIntent()} target="_blank" className="bg-white text-[#333] px-10 py-5 rounded-full font-black text-[11px] uppercase tracking-widest text-center hover:bg-[#2ECC71] hover:text-white transition-all">Broadcast Social</a>
          <button onClick={() => setShowDraft(!showDraft)} className="mint-button px-10 py-5 rounded-full font-black text-[11px] uppercase tracking-widest text-center">{showDraft ? 'Close Draft' : '📢 Official Report'}</button>
        </div>
      </div>

      {showDraft && (
        <div className="bg-[#F8F9FA] p-12 rounded-[2rem] animate-in slide-in-from-top-4 border border-[#2ECC71]/20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
            <div>
              <h5 className="text-[10px] font-black text-[#2ECC71] uppercase tracking-[0.3em] mb-1">Official Complaint Draft</h5>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Target: {audit.authorityEmail}</p>
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
              <button 
                onClick={handleDownload} 
                className="flex-1 sm:flex-none text-[10px] font-black text-[#333] uppercase tracking-widest bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                📥 Download TXT
              </button>
              <a 
                href={mailtoLink}
                className="flex-1 sm:flex-none text-[10px] font-black text-white uppercase tracking-widest bg-[#2ECC71] px-6 py-3 rounded-lg shadow-lg shadow-[#2ECC71]/20 hover:scale-105 transition-all inline-block text-center"
              >
                🚀 Open Mail App & Send
              </a>
            </div>
          </div>
          
          <div className="relative">
            <textarea 
              value={editedEmail}
              onChange={(e) => setEditedEmail(e.target.value)}
              className="w-full h-96 bg-white border-0 border-l-4 border-[#2ECC71] p-8 text-gray-600 font-mono text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#2ECC71]/20 rounded-r-xl shadow-inner"
              placeholder="Drafting official communication..."
            />
            {copyStatus === 'copied' && (
              <div className="absolute top-4 right-4 bg-[#333] text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full animate-in fade-in zoom-in-90">
                Copied to clipboard!
              </div>
            )}
          </div>
          
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex gap-6">
              <button 
                onClick={handleCopy} 
                className="text-[#333] font-black text-[10px] uppercase tracking-widest underline decoration-[#2ECC71] decoration-2 underline-offset-4 hover:text-[#2ECC71] transition-colors"
              >
                {copyStatus === 'copied' ? 'Data Copied!' : 'Copy Technical Data'}
              </button>
              <button 
                onClick={onReset} 
                className="text-red-400 font-black text-[10px] uppercase tracking-widest underline decoration-red-100 decoration-2 underline-offset-4 hover:text-red-600 transition-colors"
              >
                Discard Audit
              </button>
            </div>
            <p className="text-[10px] font-bold text-gray-400 italic">Verify all details before official submission.</p>
          </div>
        </div>
      )}

      {/* Persistent Reset Option */}
      <div className="flex justify-center mt-12">
        <button 
          onClick={onReset}
          className="flex items-center gap-3 px-12 py-6 bg-gray-50 border border-gray-100 rounded-full text-gray-400 font-black text-xs uppercase tracking-widest hover:bg-[#F8F9FA] hover:text-[#333] hover:border-gray-200 transition-all shadow-sm active:scale-95 group"
        >
          <span className="group-hover:rotate-180 transition-transform duration-500">🔄</span>
          Start New Audit (Go Back)
        </button>
      </div>
    </div>
  );
};
