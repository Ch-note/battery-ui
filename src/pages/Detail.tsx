import { useState, useEffect } from "react";
import {
  Search,
  ZoomIn,
  Download,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import { apiFetch } from "../config/api";

interface StatsData {
  abnormal_count: number;
  normal_count: number;
}

// [핵심 교정] 백엔드에서 날아오는 실제 Key 이름과 100% 동기화된 엄격한 규격
interface DefectItem {
  cell_id: string;
  vision_model_label: number | boolean | string; // 1: DEFECT (불량), 0: NORMAL (정상)
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

const Detail = () => {
  const [selectedId, setSelectedId] = useState<string>("");
  const [stats, setStats] = useState<StatsData>({
    abnormal_count: 0,
    normal_count: 0,
  });
  const [defectItems, setDefectItems] = useState<DefectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, listData] = await Promise.all([
          apiFetch<StatsData>("/analysis/stats/1/1"),
          apiFetch<ListResponse>("/analysis/list/1/1"),
        ]);
        setStats(statsData);
        setDefectItems(listData.items);
        if (listData.items.length > 0) {
          setSelectedId(listData.items[0].cell_id);
        }
      } catch (error) {
        console.error("데이터 조회 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const selectedItem = defectItems.find((item) => item.cell_id === selectedId) ?? null;

  // [핵심 로직] 철저하게 vision_model_label 값을 검증하는 판독기
  const isDefect = (label: number | boolean | string | undefined) => {
    return label === 1 || label === true || String(label) === "1";
  };

  return (
    <div className="flex flex-col h-full gap-8 text-white font-sans">
      <div className="flex justify-center gap-6">
        <SummaryCard label="CRITICAL DEFECTS" count={stats.abnormal_count} color="bg-red-500" />
        <SummaryCard label="GOOD PRODUCTS" count={stats.normal_count} color="bg-blue-500" />
      </div>

      <div className="grid grid-cols-12 gap-8 flex-1 min-h-0">
        {/* 좌측: 검사 리스트 */}
        <div className="col-span-3 bg-[#1e293b] rounded-xl border border-gray-700 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-base font-bold uppercase tracking-wider mb-4">
              검사 리스트
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {defectItems.map((item) => (
              <div
                key={item.cell_id}
                onClick={() => setSelectedId(item.cell_id)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedId === item.cell_id
                  ? "bg-blue-600 border-white shadow-lg"
                  : "bg-gray-800 border-gray-700 hover:bg-gray-700"
                  }`}
              >
                <div className="flex justify-between items-center text-sm">
                  <div className="space-y-1">
                    <p className="font-bold text-base text-gray-100">ID: {item.cell_id}</p>
                    {/* 데이터명 교체 완료 */}
                    <p className="text-gray-400 font-mono text-xs">
                      {item.vision_model_decision ? `Type: ${item.vision_model_decision}` : "Normal"}
                    </p>
                  </div>
                  {/* 데이터명 교체 완료 */}
                  <div
                    className={`w-3 h-3 rounded-full shadow-lg ${isDefect(item.vision_model_label) ? "bg-red-500 shadow-red-500/50" : "bg-blue-500 shadow-blue-500/50"}`}
                    title={isDefect(item.vision_model_label) ? "DEFECT" : "NORMAL"}
                  ></div>
                </div>
              </div>
            ))}
            {defectItems.length === 0 && !loading && (
              <div className="text-center text-gray-500 py-10">데이터가 없습니다.</div>
            )}
          </div>
        </div>

        {/* 중앙: 이미지 확인 영역 */}
        <div className="col-span-5 bg-[#1e293b] rounded-xl border border-gray-700 flex flex-col p-6 relative">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold uppercase tracking-wider flex items-center gap-3">
              <Search size={20} /> 검사 이미지
            </h3>
            {selectedItem && (
              <span className={`text-sm font-mono font-bold px-3 py-1.5 rounded border ${isDefect(selectedItem.vision_model_label)
                ? "text-red-400 border-red-900/50 bg-red-900/20"
                : "text-blue-400 border-blue-900/50 bg-blue-900/20"
                }`}>
                {isDefect(selectedItem.vision_model_label) ? "DEFECT FOUND" : "NORMAL"}
              </span>
            )}
          </div>
          <div className="flex-1 bg-black rounded-xl border border-gray-800 flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-sm font-bold tracking-widest">
              PHOTO AREA (BATTERY: {selectedId || "N/A"})
            </div>

            {selectedItem && isDefect(selectedItem.vision_model_label) && (
              <div className="w-32 h-32 border-4 border-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_30px_rgba(239,68,68,0.5)]"></div>
            )}
          </div>
        </div>

        {/* 우측: LLM 분석 및 판단 기준 */}
        <div className="col-span-4 flex flex-col gap-6">
          <div className="flex-1 bg-[#1e293b] rounded-xl border border-gray-700 p-6 flex flex-col">
            <h3 className="text-base font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-blue-400">
              LLM 분석 결과
              {selectedItem?.llm_model_name && (
                <span className="text-xs text-gray-500 font-mono ml-auto">
                  {selectedItem.llm_model_name}
                </span>
              )}
            </h3>
            <div className="bg-gray-900/50 p-6 rounded-xl text-sm leading-relaxed border border-gray-800 flex-1 overflow-y-auto custom-scrollbar">
              {selectedItem ? (
                <>
                  <p className="font-bold text-blue-300 mb-3 text-base">
                    [분석 대상 — {selectedItem.cell_id}]
                  </p>
                  {selectedItem.llm_analysis_text ? (
                    <p className="text-gray-200 mb-4 whitespace-pre-wrap">
                      {selectedItem.llm_analysis_text.ai_critic ?? JSON.stringify(selectedItem.llm_analysis_text, null, 2)}
                    </p>
                  ) : (
                    <p className="text-gray-500 italic mb-4">LLM 분석 데이터가 존재하지 않습니다.</p>
                  )}

                  <div className={`mt-auto pt-4 border-t border-gray-800 font-bold text-base ${isDefect(selectedItem.vision_model_label) ? "text-red-400" : "text-blue-400"}`}>
                    ▶ 최종 판정: {isDefect(selectedItem.vision_model_label) ? "불량 (DEFECT)" : "정상 (NORMAL)"}
                  </div>
                </>
              ) : (
                <p className="text-gray-500 italic">왼쪽 리스트에서 항목을 선택하십시오.</p>
              )}
            </div>
          </div>

          <div className="bg-[#1e293b] rounded-xl border border-gray-700 p-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase">
                판단 기준
              </h3>
              {selectedItem ? (
                <ul className="text-sm text-gray-300 space-y-3 bg-gray-900/50 p-4 rounded-lg">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-500 w-20">국제 기준:</span>
                    <span className="font-mono">{selectedItem.regulatory_name ?? "N/A"}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-500 w-20">내부 기준:</span>
                    <span className="font-mono">{selectedItem.standard_name ?? "N/A"}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <span className="text-gray-500 w-20">검사 일시:</span>
                    <span className="font-mono">{selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleString("ko-KR") : "N/A"}</span>
                  </li>
                  {isDefect(selectedItem.vision_model_label) && (
                    <li className="flex items-center gap-3 pt-2 border-t border-gray-800">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-400/80 w-20 font-bold">결함 유형:</span>
                      <span className="text-red-400 font-bold font-mono">{selectedItem.vision_model_decision || "Unknown"}</span>
                    </li>
                  )}
                </ul>
              ) : (
                <div className="text-sm text-gray-500 bg-gray-900/50 p-4 rounded-lg italic text-center">
                  데이터 대기 중
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SummaryCardProps {
  label: string;
  count: number;
  color: string;
}

const SummaryCard = ({ label, count, color }: SummaryCardProps) => (
  <div className="flex flex-col items-center min-w-[180px] bg-[#1e293b] p-4 rounded-xl border border-gray-700 shadow-md">
    <div
      className={`w-14 h-14 ${color} rounded-full flex items-center justify-center text-xl font-black mb-3 shadow-lg text-white`}
    >
      {count}
    </div>
    <span className="text-sm text-gray-400 font-bold uppercase tracking-wider">
      {label}
    </span>
  </div>
);

export default Detail;