import { Route, Routes } from 'react-router';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Trade from './pages/Trade';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/trade" element={<Trade />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
