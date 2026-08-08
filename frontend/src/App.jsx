import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="min-h-screen bg-[#F8FAF9] text-gray-900 flex flex-col justify-between font-['Kanit',sans-serif]">
        <header className="bg-white border-b border-gray-100 px-6 py-4 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-[#0B5D2D] text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-sm">
                ⚽
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900">
                SPORT <span className="text-[#0B5D2D]">COMPLEX</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs bg-[#ECFDF5] text-[#0B5D2D] font-medium px-3 py-1 rounded-full border border-[#0B5D2D]/20">
                Phase 1: Project Setup Ready
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto p-6">
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center my-12">
            <div className="w-16 h-16 bg-[#ECFDF5] text-[#0B5D2D] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              🚀
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ระบบจองสนามกีฬาออนไลน์ (Sport Complex System)
            </h1>
            <p className="text-gray-600 max-w-xl mx-auto mb-6">
              ตั้งค่าโครงสร้างโปรเจกต์ (Phase 1) สำเร็จแล้ว! พร้อมสำหรับการพัฒนา Phase 2 (ระบบยืนยันตัวตน และ Navigation)
            </p>
            <div className="inline-flex items-center gap-2 bg-[#0B5D2D] text-white px-6 py-3 rounded-xl font-medium shadow-md">
              <span>Theme Color: Primary Forest Green (#0B5D2D)</span>
            </div>
          </div>
        </main>

        <footer className="bg-white border-t border-gray-100 py-6 text-center text-sm text-gray-500">
          © 2026 Sport Complex System. All rights reserved.
        </footer>
      </div>
    </Router>
  );
}

export default App;
