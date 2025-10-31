import React from 'react';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';
import ReservationList from './ReservationList';

/**
 * MyReservations Component
 * หน้าแสดงการจองของผู้ใช้
 */
const MyReservations = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">การจองของฉัน</h1>
          <p className="mt-2 text-gray-600">
            ดูและจัดการการจองอุปกรณ์ของคุณ
          </p>
        </div>

        <ReservationList isAdmin={false} />
      </main>
      
      <Footer />
    </div>
  );
};

export default MyReservations;