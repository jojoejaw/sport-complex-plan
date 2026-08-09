import React from 'react';

const HomePage = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center font-['Kanit',sans-serif]">
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xs text-center max-w-xl w-full">
        <div className="w-12 h-12 bg-[#ECFDF5] text-[#0B5D2D] rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
          ✨
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          หน้าหลัก (HomePage)
        </h1>
        <p className="text-gray-500 text-sm">
          ลบเนื้อหาเดิมออกเรียบร้อยแล้ว พร้อมสำหรับการเขียนและออกแบบใหม่ของคุณครับ
        </p>
      </div>
    </div>
  );
};

export default HomePage;
