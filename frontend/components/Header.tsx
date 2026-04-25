import React from 'react';
import { MenuIcon } from './Icons';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm shadow-md z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={onMenuClick}
            className="text-dark hover:text-primary transition-colors duration-300"
            aria-label="Open menu"
          >
            <MenuIcon className="w-8 h-8" />
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-wider">
            StreetEats
          </h1>
          <div className="w-8"></div> {/* Spacer */}
        </div>
      </div>
    </header>
  );
};

export default Header;
