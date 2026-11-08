import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const ScrollToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-40">
      <button
        onClick={scrollToTop}
        className="w-10 h-10 rounded-xl bg-dark-900/90 hover:bg-dark-850 border border-dark-750 flex items-center justify-center text-dark-300 hover:text-white transition-all duration-150 shadow-xl backdrop-blur-md"
        title="Наверх"
      >
        <ArrowUp className="w-4 h-4" />
      </button>
    </div>
  );
};

