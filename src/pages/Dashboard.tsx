import React, { useState, useEffect } from "react";
import { Camera, AlertCircle, HelpCircle, CheckCircle } from "lucide-react";
import { apiFetch, API_BASE_URL } from "../config/api";
import { useCamera } from "../context/CameraContext";

interface StatsData {
  abnormal_count: number;
  normal_count: number;
}

interface DefectItem {
  cell_id: string;
  vision_model_label: number | boolean | string;
  vision_model_decision: string | null;
  llm_model_name: string | null;
  llm_analysis_text: Record<string, string> | null;
  created_at: string;
  standard_id: number | null;
  standard_name: string | null;
  regulatory_id: number | null;
  regulatory_name: string | null;
  started_at: string | null;
  camera_id: number | null;
  camera_name: string | null;
}

interface ListResponse {
  total: number;
  page: number;
  size: number;
  items: DefectItem[];
}

interface DetailData {
  cell_id: string;
  vision_model_confidence: number;
  vision_model_decision: string;
  vision_raw_result: object;
}

const Dashboard = () => {
  const { selectedCamera } = useCamera();

  const [stats, setStats] = useState<StatsData>({
    abnormal_count: 0,
    normal_count: 0,
  });

  const [detailData, setDetailData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [imageError, setImageError] = useState<boolean>(false);

  useEffect(() => {
    setImageError(false);
  }, [detailData?.cell_id]);

  useEffect(() => {
    if (!selectedCamera) return;

    setLoading(true);

    const fetchAllData = async () => {
      try {
        const [statsResult, listResult] = await Promise.all([
          apiFetch<StatsData>(`/analysis/stats/1/${selectedCamera.camera_id}`),
          apiFetch<ListResponse>(
            `/analysis/list/1/${selectedCamera.camera_id}`,
          ),
        ]);

        setStats(statsResult);

        if (listResult && listResult.items && listResult.items.length > 0) {
          const latestCellId = listResult.items[0].cell_id;
          const detailResult = await apiFetch<DetailData>(
            `/analysis/detail/${latestCellId}`,
          );
          setDetailData(detailResult);
        } else {
          console.warn(
            `[판독 경고] 카메라 ID ${selectedCamera.camera_id}에 해당하는 데이터가 없습니다.`,
          );
          setDetailData(null);
        }
      } catch (error) {
        console.error("[오류] 데이터 동기화 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();

    // 30초마다 갱신
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [selectedCamera]);

  if (loading || !selectedCamera)
    return <div className="text-white p-10 font-mono">데이터 동기화 중...</div>;

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

          {/* 변경된 원본 이미지 렌더링 영역 */}
          <div className="flex-1 bg-black rounded-lg border border-gray-800 flex items-center justify-center relative overflow-hidden group">
            {detailData?.cell_id && !imageError ? (
              <img
                src={`${API_BASE_URL}/images/${detailData.cell_id}/original`}
                alt={`Original capture for ${detailData.cell_id}`}
                className="w-full h-full object-contain relative z-10"
                onError={() => {
                  console.error(
                    `[판독 오류] ${detailData.cell_id}.png 원본 이미지를 찾을 수 없다.`,
                  );
                  setImageError(true);
                }}
              />
            ) : (
              <>
                <Camera
                  size={80}
                  className={`text-gray-700 opacity-50 ${imageError ? "text-red-900" : ""}`}
                />
                <span className="absolute mt-32 text-gray-600 text-sm font-mono tracking-widest flex flex-col items-center">
                  <span>
                    {imageError
                      ? "ORIGINAL IMAGE NOT FOUND"
                      : "LIVE STREAM PLACEHOLDER"}
                  </span>
                  {imageError && (
                    <span className="text-red-800 mt-2 text-xs border border-red-900/50 bg-red-900/20 px-2 py-1 rounded">
                      ID: {detailData?.cell_id || "UNKNOWN"}
                    </span>
                  )}
                </span>
              </>
            )}
          </div>
        </div>

        {/* 상세 데이터 매핑 영역 */}
        <div className="bg-[#1e293b] p-6 rounded-xl border border-gray-700 shadow-lg flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <span className="text-base font-bold text-gray-300 uppercase">
              Detected Product Analysis
            </span>
            <span className="text-sm font-mono text-red-400 border border-red-900/50 bg-red-900/20 px-3 py-1.5 rounded font-bold">
              {detailData?.vision_model_decision === "정상"
                ? "Normal"
                : "Defect Found"}
            </span>
          </div>

          <div className="flex-1 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-gray-700 mb-6 flex flex-col items-center justify-center relative p-4 overflow-auto">
            {detailData?.vision_raw_result ? (
              <div className="text-xs font-mono text-green-300 w-full">
                <p className="mb-2 text-yellow-500 font-bold">
                  RAW ANALYSIS RESULT:
                </p>
                <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-black/30 rounded-lg border border-gray-800 font-mono text-xs">
                  {/* Anomaly Score 구역 */}
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-500 font-bold uppercase tracking-tighter">
                      Anomaly Score
                    </span>
                    <span className="text-yellow-500 text-lg font-black">
                      {(
                        detailData?.vision_raw_result as any
                      )?.anomaly_score?.toFixed(4) || "0.0000"}
                    </span>
                  </div>

                  {/* Defect Type 구역 */}
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-500 font-bold uppercase tracking-tighter">
                      Defect Type
                    </span>
                    <span className="text-red-400 text-lg font-black">
                      {(detailData?.vision_raw_result as any)?.defect_type ||
                        "Unknown"}
                    </span>
                  </div>
                </div>

                <pre className="mt-4 p-2 bg-black/40 rounded border border-gray-800">
                  {JSON.stringify(detailData.vision_raw_result, null, 2)}
                </pre>
              </div>
            ) : (
              <span className="text-gray-600">NO RAW DATA</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-5 text-sm">
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
                {detailData?.vision_model_confidence
                  ? `${detailData.vision_model_confidence}`
                  : "0"}
              </p>
            </div>
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
