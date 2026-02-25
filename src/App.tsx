import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Detail from "./pages/Detail";

function App() {
  return (
    <BrowserRouter>
      {/* Layout은 더 이상 상태(State)를 Props로 받지 않는다 */}
      <Layout>
        <Routes>
          {/* 초기 진입 시 실시간 검사(/live)로 리다이렉트 */}
          <Route path="/" element={<Navigate to="/live" replace />} />
          <Route path="/live" element={<Dashboard />} />
          <Route path="/detail" element={<Detail />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
