import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './ui/AppShell';
import { ProtectedRoute } from './ui/ProtectedRoute';
import { LoginPage } from './views/LoginPage';
import { DashboardPage } from './views/DashboardPage';
import { ImportPage } from './views/ImportPage';
import { KnowledgeBasePage } from './views/KnowledgeBasePage';
import { PhotoSearchPage } from './views/PhotoSearchPage';
import { ResourcesPage } from './views/ResourcesPage';
import { PlanPage } from './views/PlanPage';
import { FeynmanPage } from './views/FeynmanPage';
import { ReportsPage } from './views/ReportsPage';
import { SettingsPage } from './views/SettingsPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'import', element: <ImportPage /> },
      { path: 'kb', element: <KnowledgeBasePage /> },
      { path: 'photo-search', element: <PhotoSearchPage /> },
      { path: 'resources', element: <ResourcesPage /> },
      { path: 'plan', element: <PlanPage /> },
      { path: 'feynman', element: <FeynmanPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'settings', element: <SettingsPage /> }
    ]
  }
]);


