import React  from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getMe } from '../../WebServer/services/auth/fuctionsAuth';

export default function RoleGuard({ allow = "" }) {
  
  console.lo
  const roles = localStorage.getItem('roles') || localStorage.getItem('role');
  console.log("RoleGuard roles", roles, "allow", allow);
  if (!roles.includes(allow)) {
    return <Navigate to="/dashboard/get" replace />;
    //return navigate("/dashboard/get")
  }
  return <Outlet />;
}
