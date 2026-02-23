import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  LayoutDashboard,
  Search,
  History as HistoryIcon,
  Settings,
} from "lucide-react";
import { apiFetch } from "../config/api";

interface Camera {
  camera_id: number;
  factory_id: number;
  camera_name: string;
  purchased_at: string;
}

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [modelLabel, setModelLabel] = useState("v1.4.2");

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [camData, modelData] = await Promise.all([
          apiFetch<Camera[]>("/factory/1/cameras"),
          apiFetch<{ model_name: string; model_version: number }>("/model/latest"),
        ]);
        setCameras(camData);
        if (camData.length > 0) {
          setSelectedCamera(camData[0].camera_name);
        }
        setModelLabel(`${modelData.model_name} v${modelData.model_version}`);
      } catch (error) {
        console.error("초기 데이터 조회 실패:", error);
      }
    };
    fetchInit();
  }, []);

  // 라우팅 제어부
  const navigate = useNavigate();
  const location = useLocation();

  // 오늘 날짜 계산 (한국 기준 YYYY-MM-DD)
  const currentDate = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).replace(/\. /g, "-").replace(/\./g, "");

  // 메뉴 설정
  const menuItems = [
    { path: "/live", icon: LayoutDashboard, label: "실시간 검사" },
    { path: "/detail", icon: Search, label: "검사결과 상세" },
    { path: "/history", icon: HistoryIcon, label: "검증이력" },
    { path: "/settings", icon: Settings, label: "환경설정" },
  ];

  return (
    <div className="flex h-screen w-full bg-[#0f172a] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${isOpen ? "w-72" : "w-[76px]"} bg-[#1e293b] transition-all duration-300 border-r border-gray-700 flex flex-col z-20 shrink-0`}
      >
        <div className="p-5 flex justify-center border-b border-gray-700 h-20 items-center">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="hover:text-blue-400 transition-colors p-2"
          >
            <Menu size={28} />
          </button>
        </div>
        <nav className="flex-1 mt-6">
          {menuItems.map((item) => (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center p-5 cursor-pointer hover:bg-blue-600/30 transition-colors border-l-4 ${location.pathname === item.path
                ? "border-blue-500 bg-blue-900/20 text-blue-400"
                : "border-transparent text-gray-400"
                }`}
            >
              <item.icon size={24} />
              {isOpen && (
                <span className="ml-5 text-base font-bold whitespace-nowrap opacity-100 transition-opacity duration-300">
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-[#1e293b] border-b border-gray-700 flex items-center justify-between px-8 shadow-md z-10 shrink-0">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-black tracking-wider text-white">
              AI INSPECTION SYSTEM
            </h1>
          </div>

          {/* 공정 정보 표시 영역 */}
          <div className="flex items-center gap-8 font-mono">
            {/* 카메라 선택 Select Box */}
            <div className="flex flex-col items-end">
              <span className="text-gray-400 text-xs uppercase mb-1">
                Camera
              </span>
              <select
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                className="bg-gray-900 border border-gray-600 text-blue-400 text-base font-bold rounded px-2 py-0.5 outline-none focus:border-blue-500 hover:bg-gray-800 transition-colors cursor-pointer appearance-none text-center"
                style={{ textAlignLast: "center" }}
              >
                {cameras.length > 0 ? (
                  cameras.map((cam) => (
                    <option key={cam.camera_id} value={cam.camera_name}>
                      {cam.camera_name}
                    </option>
                  ))
                ) : (
                  <option value="">로딩 중...</option>
                )}
              </select>
            </div>

            <div className="w-px h-10 bg-gray-700"></div>
            <div className="flex flex-col items-end">
              <span className="text-gray-400 text-xs uppercase mb-1">
                Model
              </span>
              <span className="font-bold text-yellow-500 text-base">
                {modelLabel}
              </span>
            </div>

            <div className="w-px h-10 bg-gray-700"></div>
            <div className="flex flex-col items-end">
              <span className="text-gray-400 text-xs uppercase mb-1">Date</span>
              <span className="font-bold text-gray-200 text-base">
                {currentDate}
              </span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8 bg-[#0f172a]">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
