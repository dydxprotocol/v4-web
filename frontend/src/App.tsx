import { Route, Routes } from 'react-router';
import { DashboardLayout } from './layouts/dashboard-layout';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Trade from './pages/Trade';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/trade" element={<Trade />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
