import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AshaLoginPage from './pages/AshaLoginPage';
import AshaWorkerPage from './pages/AshaWorkerPage';
import ScanPrescriptionPage from './pages/ScanPrescriptionPage';
import MedVerificationPage from './pages/MedVerificationPage';
import HealthChatPage from './pages/HealthChatPage';
import NearestAshaPage from './pages/NearestAshaPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/asha-login" element={<AshaLoginPage />} />
        <Route path="/asha-worker" element={<AshaWorkerPage />} />
        <Route path="/scan-prescription" element={<ScanPrescriptionPage />} />
        <Route path="/med-verification" element={<MedVerificationPage />} />
        <Route path="/health-chat" element={<HealthChatPage />} />
        <Route path="/nearest-asha" element={<NearestAshaPage />} />
        {/* Redirect old HTML paths to React routes */}
        <Route path="/features/home.html" element={<Navigate to="/" replace />} />
        <Route path="/features/asha_login.html" element={<Navigate to="/asha-login" replace />} />
        <Route path="/features/asha_worker.html" element={<Navigate to="/asha-worker" replace />} />
        <Route path="/features/scan_prescription.html" element={<Navigate to="/scan-prescription" replace />} />
        <Route path="/features/med_verification.html" element={<Navigate to="/med-verification" replace />} />
        <Route path="/features/health_assist_chat.html" element={<Navigate to="/health-chat" replace />} />
        <Route path="/features/nearest_ash_worker.html" element={<Navigate to="/nearest-asha" replace />} />
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
