import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/adminlte.css';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import ClientUsers from './components/ClientUsers';
import LiveCategories from './components/LiveCategories';
import LiveStreams from './components/LiveStreams';
import VodCategories from './components/VodCategories';
import VodStreams from './components/VodStreams';
import SeriesCategories from "./components/SeriesCategories";
import SeriesStreams from "./components/SeriesStreams";
import Seasons from "./components/Seasons";
import Episodes from "./components/Episodes";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes: Accessible by both Super Admin and Admin */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client-users"
            element={
              <ProtectedRoute>
                <ClientUsers />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes: Super Admin Only (Role assignment & full user CRUD) */}
          <Route
            path="/users"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <Users />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes: Super Admin Only (Live & IPTV Management) */}
          <Route
            path="/live-categories"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <LiveCategories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/live-streams"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <LiveStreams />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes: Super Admin Only (VOD Management) */}
          <Route
            path="/vod-categories"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <VodCategories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vod-streams"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <VodStreams />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes: Super Admin Only (Series Management) */}
          <Route
            path="/series-categories"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <SeriesCategories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/series-streams"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <SeriesStreams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seasons"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <Seasons />
              </ProtectedRoute>
            }
          />
          <Route
            path="/episodes"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <Episodes />
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
