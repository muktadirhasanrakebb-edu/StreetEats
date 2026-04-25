import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { CloseIcon, UserIcon } from './Icons';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {
  const { currentUser, navigateTo, logout, role } = useContext(AppContext);

  const handleAuthClick = () => {
    onClose();
    navigateTo('auth');
  };

  const handleDashboardClick = () => {
      onClose();
      if(role === 'USER') navigateTo('userDashboard');
      if(role === 'VENDOR') navigateTo('vendorDashboard');
      if(role === 'ADMIN') navigateTo('adminDashboard');
  }

  const handleLogoutClick = () => {
    onClose();
    logout();
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-light shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-primary">Menu</h2>
          <button onClick={onClose} className="text-dark hover:text-primary transition-colors">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <nav className="p-4">
          <ul>
            {currentUser ? (
              <>
                <li className="mb-4">
                    <div className="flex items-center p-2 rounded-lg bg-gray-200">
                        <img src={currentUser.avatar} alt={currentUser.name} className="w-12 h-12 rounded-full mr-3 border-2 border-primary"/>
                        <div>
                            <p className="font-semibold">{currentUser.name}</p>
                            <p className="text-sm text-gray-600 capitalize">{role?.toLowerCase()}</p>
                        </div>
                    </div>
                </li>
                 <li className="mb-2">
                    <button onClick={handleDashboardClick} className="w-full text-left font-semibold text-dark hover:text-primary p-2 rounded-md hover:bg-gray-200 transition-all duration-200">
                        Dashboard
                    </button>
                </li>
                <li className="mb-2">
                    <button onClick={handleLogoutClick} className="w-full text-left font-semibold text-dark hover:text-primary p-2 rounded-md hover:bg-gray-200 transition-all duration-200">
                        Logout
                    </button>
                </li>
              </>
            ) : (
              <li className="mb-2">
                <button onClick={handleAuthClick} className="flex items-center w-full text-left font-semibold text-dark hover:text-primary p-3 rounded-lg bg-primary/20 hover:bg-primary/30 transition-all duration-200">
                  <UserIcon className="w-6 h-6 mr-3"/>
                  Sign In / Sign Up
                </button>
              </li>
            )}
            <li className="mb-2">
              <a href="#" className="block font-semibold text-dark hover:text-primary p-2 rounded-md hover:bg-gray-200 transition-all duration-200">Invite Friends</a>
            </li>
            <li className="mb-2">
              <a href="#" className="block font-semibold text-dark hover:text-primary p-2 rounded-md hover:bg-gray-200 transition-all duration-200">FAQ</a>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default SideMenu;
