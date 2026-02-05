
import React, { useState, useEffect } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  isLoggedIn?: boolean;
  onLogout?: () => void;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Modal: React.FC<{ title: string; children: React.ReactNode; onClose: () => void }> = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#333]/40 backdrop-blur-sm animate-in fade-in duration-300">
    <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-10 animate-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-[#333] tracking-tighter uppercase">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-[#333] transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5" /></svg>
        </button>
      </div>
      <div className="text-gray-500 font-medium leading-relaxed">
        {children}
      </div>
      <button 
        onClick={onClose}
        className="w-full mt-8 py-4 bg-[#F8F9FA] rounded-full font-black text-[10px] uppercase tracking-widest text-[#333] hover:bg-gray-100 transition-all"
      >
        Close
      </button>
    </div>
  </div>
);

export const Layout: React.FC<LayoutProps> = ({ children, isLoggedIn, onLogout, currentPage, onPageChange }) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showBalloons, setShowBalloons] = useState(false);

  const handlePressClick = () => {
    setActiveModal('press');
    setShowBalloons(true);
    setTimeout(() => setShowBalloons(false), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Balloon/Confetti Effect Mock */}
      {showBalloons && (
        <div className="fixed inset-0 pointer-events-none z-[110] flex items-center justify-center overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className="absolute animate-bounce text-3xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                transition: 'all 2s ease-out'
              }}
            >
              🎈
            </div>
          ))}
        </div>
      )}

      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100 px-6 md:px-12 py-5 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <div 
            className="text-xl font-black tracking-widest text-[#333] cursor-pointer"
            onClick={() => onPageChange('home')}
          >
            CIVIC <span className="text-[#2ECC71]">FIX</span>
          </div>
          
          <div className="hidden md:flex gap-8 items-center">
            <button 
              onClick={() => onPageChange('home')}
              className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${currentPage === 'home' ? 'text-[#2ECC71]' : 'text-gray-400 hover:text-[#2ECC71]'}`}
            >
              Home
            </button>
            <button 
              onClick={() => onPageChange('services')}
              className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${currentPage === 'services' ? 'text-[#2ECC71]' : 'text-gray-400 hover:text-[#2ECC71]'}`}
            >
              Services
            </button>
            <button 
              onClick={() => onPageChange('about')}
              className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${currentPage === 'about' ? 'text-[#2ECC71]' : 'text-gray-400 hover:text-[#2ECC71]'}`}
            >
              About
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <button 
              onClick={onLogout}
              className="text-[11px] font-bold uppercase tracking-widest text-red-400 border border-red-100 px-4 py-2 rounded-full hover:bg-red-50"
            >
              Sign Out
            </button>
          ) : (
            <button className="text-[11px] font-bold uppercase tracking-widest text-[#333] border border-gray-200 px-6 py-2 rounded-full">
              Contact
            </button>
          )}
        </div>
      </nav>

      <main className="flex-grow pt-24">
        {children}
      </main>

      <footer className="bg-[#F8F9FA] py-16 px-12 border-t border-gray-100 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-xl font-black tracking-widest text-[#333]">
            CIVIC FIX
          </div>
          <div className="flex gap-8">
            <button 
              onClick={() => setActiveModal('privacy')}
              className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-[#2ECC71] transition-colors"
            >
              Privacy
            </button>
            <button 
              onClick={() => setActiveModal('terms')}
              className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-[#2ECC71] transition-colors"
            >
              Terms
            </button>
            <button 
              onClick={handlePressClick}
              className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-[#2ECC71] transition-colors"
            >
              Press
            </button>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">© 2025 AI INFRASTRUCTURE STUDIO</p>
        </div>
      </footer>

      {/* Modals */}
      {activeModal === 'privacy' && (
        <Modal title="Privacy Policy" onClose={() => setActiveModal(null)}>
          <p>We value your privacy. Your data (uploaded images) is processed by Google's Gemini API and is not stored permanently on our servers. This is a prototype for civic transparency. We do not track personal identifying information beyond what is necessary for the audit functionality.</p>
        </Modal>
      )}

      {activeModal === 'terms' && (
        <Modal title="Terms of Service" onClose={() => setActiveModal(null)}>
          <p className="mb-4">This is a Hackathon Prototype (Vibe-Coding). Not for commercial use. Use at your own risk. This tool is intended to demonstrate AI capabilities in civic auditing.</p>
          <p>By using this service, you acknowledge that repair estimates and material calculations are AI-generated approximations and should be verified by professional engineers before any official action.</p>
        </Modal>
      )}

      {activeModal === 'press' && (
        <Modal title="Press Kit" onClose={() => setActiveModal(null)}>
          <div className="flex flex-col gap-4">
            <p className="text-2xl mb-2">🎈</p>
            <p>For media inquiries, contact the <strong>Anurag University Student Team</strong>.</p>
            <p>Project: <strong>Civic-Fix AI</strong></p>
            <p>Our mission is to democratize urban maintenance oversight through neural vision technology. We provide high-resolution assets and documentation for research and reporting purposes.</p>
          </div>
        </Modal>
      )}
    </div>
  );
};
