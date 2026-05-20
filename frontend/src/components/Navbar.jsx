import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, User, LogOut, Menu, X, CheckSquare } from 'lucide-react';

export const Navbar = () => {
  const { user, logoutUser, notifications, markNotificationRead, markAllNotificationsRead } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'doctor') return '/doctor';
    return '/patient';
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/20 bg-white/75 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 font-bold text-white text-xl shadow-md shadow-teal-500/20">
                M
              </span>
              <span className="font-extrabold text-2xl tracking-tight text-slate-900">
                Medi<span className="text-teal-600">ease</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex space-x-8 font-medium">
            <Link to="/" className="text-slate-600 hover:text-teal-600 transition-colors">Home</Link>
            <Link to="/doctors" className="text-slate-600 hover:text-teal-600 transition-colors">Find Doctors</Link>
            <Link to="/services" className="text-slate-600 hover:text-teal-600 transition-colors">Services</Link>
            <Link to="/about" className="text-slate-600 hover:text-teal-600 transition-colors">About Us</Link>
            <Link to="/contact" className="text-slate-600 hover:text-teal-600 transition-colors">Contact</Link>
          </div>

          {/* User Operations */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-teal-600 transition-all"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-3 duration-200">
                      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                        <span className="font-bold text-slate-900">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllNotificationsRead}
                            className="flex items-center text-xs font-semibold text-teal-600 hover:text-teal-700"
                          >
                            <CheckSquare className="mr-1 h-3.5 w-3.5" />
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto px-1 py-1">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n._id}
                              onClick={() => markNotificationRead(n._id)}
                              className={`flex flex-col rounded-xl px-3 py-2 text-xs transition-colors cursor-pointer hover:bg-slate-50 ${
                                !n.isRead ? 'bg-teal-50/40 border-l-2 border-teal-500 font-medium' : 'text-slate-600'
                              }`}
                            >
                              <p className="text-slate-800">{n.message}</p>
                              <span className="mt-1 text-[10px] text-slate-400">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dashboard Shortcut & Logout */}
                <Link
                  to={getDashboardLink()}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-50 text-teal-700 font-semibold text-sm hover:bg-teal-100 transition-all"
                >
                  <User className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-rose-600 transition-all"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 font-semibold text-slate-700 text-sm hover:text-teal-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="glow-button flex items-center justify-center px-5 py-2.5 rounded-xl bg-teal-600 font-semibold text-white text-sm shadow-lg shadow-teal-500/20 hover:bg-teal-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-teal-600 focus:outline-none transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white/95 px-4 py-3 space-y-2 backdrop-blur-md">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-xl font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition-all"
          >
            Home
          </Link>
          <Link
            to="/doctors"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-xl font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition-all"
          >
            Find Doctors
          </Link>
          <Link
            to="/services"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-xl font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition-all"
          >
            Services
          </Link>
          <Link
            to="/about"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-xl font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition-all"
          >
            About Us
          </Link>
          <Link
            to="/contact"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-xl font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition-all"
          >
            Contact
          </Link>

          {user ? (
            <div className="border-t border-slate-100 pt-3 flex flex-col space-y-2">
              <Link
                to={getDashboardLink()}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center space-x-2 w-full py-2.5 rounded-xl bg-teal-600 text-white font-semibold text-sm shadow-md"
              >
                <User className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="flex items-center justify-center space-x-2 w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="border-t border-slate-100 pt-3 flex flex-col space-y-2">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center w-full py-2.5 rounded-xl bg-teal-600 text-white font-semibold text-sm shadow-md"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
