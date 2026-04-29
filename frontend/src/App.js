import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Transfusions from "@/pages/Transfusions";
import TransfusionDetail from "@/pages/TransfusionDetail";
import Ferritin from "@/pages/Ferritin";
import Symptoms from "@/pages/Symptoms";
import Diet from "@/pages/Diet";
import Documents from "@/pages/Documents";
import SettingsPage from "@/pages/Settings";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transfusions" element={<Transfusions />} />
          <Route path="/transfusions/:id" element={<TransfusionDetail />} />
          <Route path="/ferritin" element={<Ferritin />} />
          <Route path="/symptoms" element={<Symptoms />} />
          <Route path="/diet" element={<Diet />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
