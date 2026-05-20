import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Heart, Shield, Award } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      {/* Top Footer */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500 font-bold text-white text-lg">
                M
              </span>
              <span className="font-extrabold text-xl tracking-tight text-white">
                Medi<span className="text-teal-400">ease</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400">
              Leading the digital transformation of patient care with state-of-the-art teleconsultations, instant prescription dispatches, and secure clinical schedules.
            </p>
            <div className="flex space-x-4 pt-2">
              <div className="flex items-center space-x-1.5 text-xs">
                <Heart className="h-4 w-4 text-teal-400 animate-pulse" />
                <span>NABL Accredited</span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs">
                <Shield className="h-4 w-4 text-teal-400" />
                <span>HIPAA Compliant</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4">Portal Nav</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/doctors" className="hover:text-teal-400 transition-colors">Find Doctors</Link></li>
              <li><Link to="/services" className="hover:text-teal-400 transition-colors">Medical Services</Link></li>
              <li><Link to="/about" className="hover:text-teal-400 transition-colors">Clinical Profile</Link></li>
              <li><Link to="/contact" className="hover:text-teal-400 transition-colors">Support Center</Link></li>
            </ul>
          </div>

          {/* Specializations */}
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4">Specialties</h3>
            <ul className="space-y-2.5 text-sm">
              <li><span className="hover:text-teal-400 cursor-pointer transition-colors">Cardiology</span></li>
              <li><span className="hover:text-teal-400 cursor-pointer transition-colors">Dermatology</span></li>
              <li><span className="hover:text-teal-400 cursor-pointer transition-colors">Pediatrics</span></li>
              <li><span className="hover:text-teal-400 cursor-pointer transition-colors">Orthopedics</span></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4">Emergency Desk</h3>
            <ul className="space-y-3.5 text-sm">
              <li className="flex items-start">
                <Phone className="h-5 w-5 text-teal-400 mr-2 shrink-0" />
                <div>
                  <span className="block font-bold text-slate-200">1800-456-9000</span>
                  <span className="text-[11px] text-teal-500 font-semibold">24/7 Priority Emergency Hotline</span>
                </div>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 text-teal-400 mr-2 shrink-0" />
                <span>support@mediease.com</span>
              </li>
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-teal-400 mr-2 shrink-0" />
                <span>SRM Health Tech City, Complex Block B, Chennai, TN</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="bg-slate-950/70 py-6 border-t border-slate-800/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Mediease Portal Systems. All rights reserved.</p>
          <div className="flex space-x-6 mt-3 md:mt-0">
            <span className="hover:text-teal-400 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-teal-400 cursor-pointer transition-colors">Terms & Operations</span>
            <span className="hover:text-teal-400 cursor-pointer transition-colors">System Status</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
