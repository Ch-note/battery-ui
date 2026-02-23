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

interface DefectItem {
  cell_id: string;
  label: number; // 1: DEFECT, 0: NORMAL
  decision: string | null;
  llm_model_name: string | null;
  llm_analysis_text: Record<string, string> | null;
  created_at: string;
  standard_id: number | null;
  standard_name: string | null;
  regulatory_id: number | null;
  regulatory_name: string | null;
  started_at: string | null;
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

  // 선택된 아이템 필터
  const selectedItem = defectItems.find((item) => item.cell_id === selectedId) ?? null;

  return (
    <div className="flex flex-col h-full gap-8 text-white font-sans">
      {/* 상단 통계 바 */}
      <div className="flex justify-center gap-6">
        <SummaryCard label="Critical Defects" count={stats.abnormal_count} color="bg-red-500" />
        <SummaryCard label="Good Products" count={stats.normal_count} color="bg-blue-500" />
      </div>

      {/* 메인 작업 영역 */}
      <div className="grid grid-cols-12 gap-8 flex-1 min-h-0">
        {/* 좌측: 불량 제품 정보 (리스트) */}
        <div className="col-span-3 bg-[#1e293b] rounded-xl border border-gray-700 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-base font-bold uppercase tracking-wider mb-4">
              불량 리스트
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {defectItems.map((item) => (
              <div
                key={item.cell_id}
                onClick={() => setSelectedId(item.cell_id)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedId === item.cell_id
                  ? "bg-blue-600 border-white"
                  : "bg-gray-800 border-gray-700 hover:bg-gray-700"
                  }`}
              >
                <div className="flex justify-between items-center text-sm">
                  <div className="space-y-1">
                    <p className="font-bold text-base">ID: {item.cell_id}</p>
                    <p className="text-gray-300">Decision: {item.decision ?? "-"}</p>
                  </div>
                  <div
                    className={`w-3 h-3 rounded-full shadow-lg ${item.label === 1 ? "bg-red-500" : "bg-blue-500"}`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 중앙: 불량 이미지 확인 영역 */}
        <div className="col-span-5 bg-[#1e293b] rounded-xl border border-gray-700 flex flex-col p-6 relative">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold uppercase tracking-wider flex items-center gap-3">
              <Search size={20} /> 불량 이미지
            </h3>
            {selectedItem && (
              <span className={`text-sm font-mono font-bold px-3 py-1.5 rounded border ${selectedItem.label === 1
                ? "text-red-400 border-red-900/50 bg-red-900/20"
                : "text-blue-400 border-blue-900/50 bg-blue-900/20"
                }`}>
                {selectedItem.label === 1 ? "DEFECT" : "NORMAL"}
              </span>
            )}
          </div>
          <div className="flex-1 bg-black rounded-xl border border-gray-800 flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-sm font-bold tracking-widest">
              PHOTO AREA (BATTERY: {selectedId || "N/A"})
            </div>

            {selectedItem?.label === 1 && (
              <div className="w-32 h-32 border-4 border-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_30px_rgba(239,68,68,0.5)]"></div>
            )}

            {/* <div className="absolute bottom-6 right-6 flex gap-3">
              <button className="bg-gray-800/80 p-3 rounded-lg hover:bg-gray-700 text-white">
                <ZoomIn size={20} />
              </button>
              <button className="bg-gray-800/80 p-3 rounded-lg hover:bg-gray-700 text-white">
                <Download size={20} />
              </button>
            </div> */}
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
                    [분석 결과 — {selectedItem.cell_id}]
                  </p>
                  {selectedItem.llm_analysis_text ? (
                    <p className="text-gray-200 mb-4 whitespace-pre-wrap">
                      {selectedItem.llm_analysis_text.ai_critic ?? JSON.stringify(selectedItem.llm_analysis_text, null, 2)}
                    </p>
                  ) : (
                    <p className="text-gray-500 italic">LLM 분석 데이터가 없습니다.</p>
                  )}
                  <p className={`font-bold text-base mt-4 ${selectedItem.label === 1 ? "text-red-400" : "text-blue-400"}`}>
                    ▶ {selectedItem.label === 1 ? "품질 기준 미달 (불량 판정)" : "정상 판정"}
                  </p>
                </>
              ) : (
                <p className="text-gray-500 italic">항목을 선택해주세요.</p>
              )}
            </div>
          </div>

          <div className="bg-[#1e293b] rounded-xl border border-gray-700 p-6">
            <div className="space-y-4 mb-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase">
                판단 기준
              </h3>
              {selectedItem ? (
                <ul className="text-sm text-gray-300 space-y-2 bg-gray-900/50 p-4 rounded-lg">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    국제 기준: {selectedItem.regulatory_name ?? "N/A"}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    내부 기준: {selectedItem.standard_name ?? "N/A"}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                    검사 일시: {selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleString("ko-KR") : "N/A"}
                  </li>
                  {selectedItem.decision && (
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      결함 유형: {selectedItem.decision}
                    </li>
                  )}
                </ul>
              ) : (
                <div className="text-sm text-gray-500 bg-gray-900/50 p-4 rounded-lg italic">
                  항목을 선택하면 판단 기준이 표시됩니다.
                </div>
              )}
            </div>
            {/* <div className="flex gap-4">
              <button className="flex-1 bg-gray-700 hover:bg-gray-600 py-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                <UserCheck size={18} /> 수동 검토
              </button>
              <button className="flex-1 bg-blue-600 hover:bg-blue-500 py-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                <CheckCircle2 size={18} /> 조치 완료
              </button>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ label, count, color }: any) => (
  <div className="flex flex-col items-center min-w-[180px] bg-[#1e293b] p-4 rounded-xl border border-gray-700 shadow-md">
    <div
      className={`w-14 h-14 ${color} rounded-full flex items-center justify-center text-xl font-black mb-3 shadow-lg`}
    >
      {count}
    </div>
    <span className="text-sm text-gray-400 font-bold uppercase tracking-wider">
      {label}
    </span>
  </div>
);

export default Detail;
