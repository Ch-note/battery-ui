import React, { useState, useEffect } from "react";
import { Camera, AlertCircle, HelpCircle, CheckCircle } from "lucide-react";
import { apiFetch } from "../config/api";
import { useCamera } from "../context/CameraContext";

// API 응답 규격의 기강을 잡는 인터페이스
interface StatsData {
  abnormal_count: number;
  normal_count: number;
}

interface DetailData {
  cell_id: string;
  vision_model_confidence: number;
  vision_model_decision: string;
}

const Dashboard = () => {
  const { selectedCamera } = useCamera();

  const [stats, setStats] = useState<StatsData>({
    abnormal_count: 0,
    normal_count: 0,
  });

  // 상세 데이터를 담을 새로운 상태
  const [detailData, setDetailData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!selectedCamera) return;

    setLoading(true);

    const fetchAllData = async () => {
      try {
        // 1. 통계 데이터 호출 (동적 camera_id 적용)
        const statsPromise = apiFetch<StatsData>(`/analysis/stats/1/${selectedCamera.camera_id}`);

        // 2. 상세 데이터 호출 (당신이 지시한 고정된 cell_id "B12345" 적용 - 매우 비판받아야 할 부분)
        const detailPromise = apiFetch<DetailData>(`/analysis/detail/B12345`);

        // 두 API를 동시에 호출하여 지연을 최소화하는 철저함
        const [statsResult, detailResult] = await Promise.all([statsPromise, detailPromise]);

        setStats(statsResult);
        setDetailData(detailResult);
      } catch (error) {
        console.error("비판적 오류 발생: 데이터 동기화 실패", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();

    // 30초마다 갱신 (하지만 B12345만 영원히 갱신될 것이오)
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [selectedCamera]);

  if (loading || !selectedCamera)
    return (
      <div className="text-white p-10 font-mono">
        데이터 동기화 중... 대기하라.
      </div>
    );

  return (
    <div className="space-y-8 w-full h-full flex flex-col p-6 bg-[#0f172a]">
      {/* 상단 통계 카드 구역 */}
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

      {/* 하단 상세 분석 구역 */}
      <div className="grid grid-cols-2 gap-8 h-[600px]">
        {/* 카메라 피드 영역 */}
        <div className="bg-[#1e293b] p-6 rounded-xl border border-gray-700 shadow-lg flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <span className="text-base font-bold text-gray-300 uppercase flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
              Capture Camera Feed
            </span>
            <span className="text-sm text-gray-500 font-mono">
              {selectedCamera.camera_name}
            </span>
          </div>
          <div className="flex-1 bg-black rounded-lg border border-gray-800 flex items-center justify-center relative overflow-hidden">
            <Camera size={80} className="text-gray-700 opacity-50" />
            <span className="absolute mt-32 text-gray-600 text-sm font-mono tracking-widest">
              LIVE STREAM PLACEHOLDER
            </span>
          </div>
        </div>

        {/* 상세 데이터 매핑 영역 */}
        <div className="bg-[#1e293b] p-6 rounded-xl border border-gray-700 shadow-lg flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <span className="text-base font-bold text-gray-300 uppercase">
              Detected Product Analysis
            </span>
            <span className="text-sm font-mono text-red-400 border border-red-900/50 bg-red-900/20 px-3 py-1.5 rounded font-bold">
              {detailData?.vision_model_decision === "정상" ? "Normal" : "Defect Found"}
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
              {detailData?.vision_model_decision || "N/A"}: {detailData?.vision_model_confidence ? `${detailData.vision_model_confidence}%` : "0%"}
              <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45"></div>
            </div>
          </div>

          {/* 지시받은 3가지 데이터로 재구성된 하단 정보 그리드 */}
          <div className="grid grid-cols-3 gap-5 text-sm">
            <div className="p-4 bg-black/20 rounded border border-gray-700/50">
              <p className="text-gray-500 mb-2 font-bold text-xs uppercase">
                Cell ID
              </p>
              <p className="font-bold text-white font-mono text-base truncate">
                {detailData?.cell_id || "데이터 없음"}
              </p>
            </div>
            <div className="p-4 bg-black/20 rounded border border-gray-700/50">
              <p className="text-gray-500 mb-2 font-bold text-xs uppercase">
                Confidence
              </p>
              <p className="font-bold text-green-400 font-mono text-base">
                {detailData?.vision_model_confidence ? `${detailData.vision_model_confidence}%` : "0%"}
              </p>
            </div>
            <div className="p-4 bg-black/20 rounded border border-gray-700/50">
              <p className="text-gray-500 mb-2 font-bold text-xs uppercase">
                Decision
              </p>
              <p className="font-bold text-white text-base truncate">
                {detailData?.vision_model_decision || "판독 대기중"}
              </p>
            </div>
            {/* Processing Time 영역은 지시대로 완벽히 제거됨 */}
          </div>
        </div>
      </div>
    </div>
  );
};

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