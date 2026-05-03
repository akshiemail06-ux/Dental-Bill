import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t py-12 md:py-16 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Instant Dental Bill Logo" className="h-8 w-8 object-contain" />
              <span className="text-xl font-black text-gray-900 tracking-tight">
                Instant Dental Bill
              </span>
            </Link>
            <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
              Professional dental billing software designed for speed, accuracy, and simplicity. Generate bills in 10 seconds.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">Product</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/login" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">Login</Link>
              </li>
              <li>
                <Link to="/signup" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">Sign Up</Link>
              </li>
              <li>
                <Link to="/" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">Features</Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">Blog</Link>
              </li>
              <li>
                <Link to="/dental-clinic-software-india" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">Dental Clinic Software India</Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">Legal</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/privacy" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">Terms & Conditions</Link>
              </li>
              <li>
                <Link to="/disclaimer" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">Disclaimer</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center md:items-start gap-1">
            <p className="text-xs text-gray-400 font-medium">
              © 2026 Instant Dental Bill. All rights reserved.
            </p>
            <span className="text-[10px] text-gray-300 font-mono">v1.2-build-0305</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Made for Smart Dentists</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
