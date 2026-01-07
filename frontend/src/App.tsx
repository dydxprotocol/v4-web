import { Route, Routes } from 'react-router';
import { DashboardLayout } from './layouts/dashboard-layout';
import { Dashboard } from './pages/Dashboard';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </div>
  );
}
