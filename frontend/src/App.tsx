import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Layout from "./components/Layout";
import LandingPage from "./pages/Landing";
import AnalyzePage from "./pages/Analyze";
import DashboardPage from "./pages/Dashboard";
import CommentsPage from "./pages/Comments";
import ModelExplainPage from "./pages/ModelExplain";

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    if (window.location.pathname === "/") {
      navigate("/landing", { replace: true });
    }
  }, [navigate]);

  return (
    <Layout>
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/analyze" element={<AnalyzePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/comments" element={<CommentsPage />} />
        <Route path="/model" element={<ModelExplainPage />} />
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;

