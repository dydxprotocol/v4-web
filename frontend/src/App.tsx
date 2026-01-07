import { Route, Routes } from 'react-router';
import { DashboardLayout } from './layouts/dashboard-layout';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Trade from './pages/Trade';
import { Dashboard } from './pages/Dashboard';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trade" element={<Trade />} />
          <Route path="/home" element={<Home />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
