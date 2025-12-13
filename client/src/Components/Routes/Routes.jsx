// src/Components/Routes/CRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

import LoginPage from '../Auth/LoginPage/LoginPage';
import RegisterPage from '../Auth/RegisterPage/RegisterPage';

import Header from '../Header/Header';

import Dashborad from '../Dashboard/Dashboard';
import RequireAuth from './RequireAuth';
import RoleGuard from './RoleGuard';
import PublicOnly from './PublicOnly';

import ViewAllStudent from '../Student/ViewAllStudent';
import EditStudent from '../Student/EditStudent';

import ViewAllUser from '../User/ViewAllUser';
import EditUser from '../User/EditUser';

import { Calendar } from '../Calendar/Calendar';
import { Library } from '../Library/Library';

import ViewAllLesson from '../Lesson/ViewAllLesson';
import EditLesson from '../Lesson/EditLesson';

function ProtectedLayout() {
  // Header רק בדפים מוגנים
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
}

export default function CRoutes() {
  return (
    <Routes>
      {/* ציבורי */}
      <Route path="/" element={<PublicOnly/>} />
      <Route path="/login" element={<PublicOnly/>} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/parent-register" element={<EditStudent parent={true} />} />
      {/* מוגן */}
      <Route element={<RequireAuth />}>
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard/get" element={<Dashborad />} />

          {/* ادارة בלבד */}
          <Route element={<RoleGuard allow={'ادارة'} />}>
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/calendar/:id" element={<Calendar />} />
            <Route path="/library" element={<Library />} />
            <Route path="/students" element={<ViewAllStudent />} />
            <Route path="/students/:id" element={<EditStudent/>} />

            <Route path="/users" element={<ViewAllUser />} />
            <Route path="/users/:id" element={<EditUser/>} />

            <Route path="/lessons" element={<ViewAllLesson/>} />
            <Route path="/lessons/:id" element={<EditLesson/>} />
          </Route>

          {/* ברירת מחדל פנימית – אם נכנסו ל-root בעודך מחובר */}
          <Route path="" element={<Navigate to="/dashboard/get" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
