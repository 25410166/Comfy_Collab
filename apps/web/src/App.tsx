import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootLayout } from './layouts/RootLayout.js';
import { Dashboard } from './pages/Dashboard.js';
import { Workflows } from './pages/Workflows.js';
import { WorkflowDetail } from './pages/WorkflowDetail.js';
import { ModelHub } from './pages/ModelHub.js';
import { Downloads } from './pages/Downloads.js';
import { Outputs } from './pages/Outputs.js';
import { Runtime } from './pages/Runtime.js';
import { DriveSync } from './pages/DriveSync.js';
import { Settings } from './pages/Settings.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5000
    }
  }
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="workflows" element={<Workflows />} />
            <Route path="workflows/:id" element={<WorkflowDetail />} />
            <Route path="models" element={<ModelHub />} />
            <Route path="downloads" element={<Downloads />} />
            <Route path="outputs" element={<Outputs />} />
            <Route path="runtime" element={<Runtime />} />
            <Route path="drive" element={<DriveSync />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
export default App;
