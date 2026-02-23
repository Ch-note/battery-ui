import React, { useState, useEffect } from "react";
import { Camera, AlertCircle, HelpCircle, CheckCircle } from "lucide-react";
import { apiFetch } from "../config/api";

// 심판의 엄격한 타입 정의
interface StatsData {
  abnormal_count: number;
  normal_count: number;
}

const Dashboard = () => {
  // 초기 상태는 0으로 설정하거나 로딩 상태를 고려해야 한다.
  const [stats, setStats] = useState<StatsData>({
    abnormal_count: 0,
    normal_count: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiFetch<StatsData>("/analysis/stats/1/1");
        setStats(data);
      } catch (error) {
        console.error("비판적 오류 발생:", error);
        // 오류 발생 시에도 시스템은 멈추지 말아야 한다.
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // 30초마다 데이터를 갱신하는 엄격함을 유지하라.
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading)
    return (
      <div className="text-white p-10 font-mono">
        데이터 동기화 중... 대기하라.
      </div>
    );

  return (
    <div className="space-y-8 w-full h-full flex flex-col p-6 bg-[#0f172a]">
      {/* 상단 통계 카드 - 데이터 바인딩 완료 */}
      <div className="grid grid-cols-2 gap-8">
        <StatusCard
          label="DEFECT"
          count={stats.abnormal_count}
          color="text-red-500"
          bgColor="bg-red-500/10"
          borderColor="border-red-500/30"
          icon={AlertCircle}
        />
        <StatusCard
          label="NORMAL"
          count={stats.normal_count}
          color="text-blue-500"
          bgColor="bg-blue-500/10"
          borderColor="border-blue-500/30"
          icon={CheckCircle}
        />
      </div>

      <div className="grid grid-cols-2 gap-8 h-[600px]">
        {/* 카메라 피드 */}
        <div className="bg-[#1e293b] p-6 rounded-xl border border-gray-700 shadow-lg flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <span className="text-base font-bold text-gray-300 uppercase flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
              Live Camera Feed
            </span>
            <span className="text-sm text-gray-500 font-mono">
              CAM-01 / LINE-A
            </span>
          </div>
          <div className="flex-1 bg-black rounded-lg border border-gray-800 flex items-center justify-center relative overflow-hidden">
            <Camera size={80} className="text-gray-700 opacity-50" />
            <span className="absolute mt-32 text-gray-600 text-sm font-mono tracking-widest">
              LIVE STREAM PLACEHOLDER
            </span>
          </div>
        </div>

        {/* 제품 분석 */}
        <div className="bg-[#1e293b] p-6 rounded-xl border border-gray-700 shadow-lg flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <span className="text-base font-bold text-gray-300 uppercase">
              Detected Product Analysis
            </span>
            <span className="text-sm font-mono text-red-400 border border-red-900/50 bg-red-900/20 px-3 py-1.5 rounded font-bold">
              Defect Found
            </span>
          </div>

          <div className="flex-1 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-gray-700 mb-6 flex items-center justify-center relative">
            <div className="w-80 h-32 border-4 border-gray-500 rounded-xl relative flex items-center bg-gray-700/50 shadow-inner">
              <div className="absolute -right-6 w-5 h-16 bg-gray-500 rounded-r-md"></div>
              <div className="h-full w-[80%] bg-gradient-to-r from-green-500/20 to-transparent absolute left-0"></div>

              <div className="absolute top-6 left-40 w-10 h-10 rounded-full border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-ping opacity-75"></div>
              <div className="absolute top-6 left-40 w-10 h-10 rounded-full border-2 border-red-500"></div>
            </div>

            <div className="absolute top-1/4 left-1/2 bg-white text-black text-xs font-black px-3 py-1.5 rounded shadow-lg -translate-y-8">
              Scratch: 98%
              <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45"></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5 text-sm">
            <div className="p-4 bg-black/20 rounded border border-gray-700/50">
              <p className="text-gray-500 mb-2 font-bold text-xs uppercase">
                Product ID
              </p>
              <p className="font-bold text-white font-mono text-base">
                BAT-2024-X85
              </p>
            </div>
            <div className="p-4 bg-black/20 rounded border border-gray-700/50">
              <p className="text-gray-500 mb-2 font-bold text-xs uppercase">
                Confidence
              </p>
              <p className="font-bold text-green-400 font-mono text-base">
                98.2%
              </p>
            </div>
            <div className="p-4 bg-black/20 rounded border border-gray-700/50">
              <p className="text-gray-500 mb-2 font-bold text-xs uppercase">
                Defect Location
              </p>
              <p className="font-bold text-white text-base">Top Cap</p>
            </div>
            <div className="p-4 bg-black/20 rounded border border-gray-700/50">
              <p className="text-gray-500 mb-2 font-bold text-xs uppercase">
                Processing Time
              </p>
              <p className="font-bold text-white font-mono text-base">45ms</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// StatusCard 타입 정의 - 'any'는 수용할 수 없다.
interface StatusCardProps {
  label: string;
  count: number;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
}

const StatusCard = ({
  label,
  count,
  color,
  bgColor,
  borderColor,
  icon: Icon,
}: StatusCardProps) => (
  <div
    className={`p-8 rounded-xl border ${borderColor} ${bgColor} flex items-center justify-between transition-transform hover:scale-[1.02]`}
  >
    <div>
      <p className="text-sm text-gray-400 font-bold mb-2 tracking-wider">
        {label}
      </p>
      <p className={`text-5xl font-black ${color}`}>{count.toLocaleString()}</p>
    </div>
    <div className={`p-4 rounded-full ${color.replace("text-", "bg-")}/20`}>
      <Icon size={48} className={color} />
    </div>
  </div>
);

export default Dashboard;
