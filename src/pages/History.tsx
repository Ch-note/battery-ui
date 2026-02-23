import { useState, useEffect } from "react";
import { Download, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { apiFetch } from "../config/api";

interface StatsData {
  abnormal_count: number;
  normal_count: number;
}

interface DefectItem {
  cell_id: string;
  label: number; // 1: DEFECT, 0: NORMAL
  decision: string | null;
  created_at: string;
  camera_id: number;
}

interface ListResponse {
  total: number;
  page: number;
  size: number;
  items: DefectItem[];
}

interface Camera {
  camera_id: number;
  camera_name: string;
}

// 한국 시간 기준 YYYY-MM-DD 반환
const toKSTDateString = (date: Date): string => {
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).replace(/\. /g, "-").replace(/\./g, "");
};

const todayKST = toKSTDateString(new Date());
const threeDaysAgoKST = toKSTDateString(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));

const History = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [historyData, setHistoryData] = useState<DefectItem[]>([]);
  const [cameras, setCameras] = useState<Record<number, string>>({});
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, listData, cameraData] = await Promise.all([
          apiFetch<StatsData>("/analysis/stats/1/1"),
          apiFetch<ListResponse>("/analysis/list/1/1"),
          apiFetch<Camera[]>("/factory/1/cameras"),
        ]);

        setStats(statsData);
        setHistoryData(listData.items);

        // 카메라 ID -> 이름 매핑 생성
        const camMap: Record<number, string> = {};
        cameraData.forEach(cam => {
          camMap[cam.camera_id] = cam.camera_name;
        });
        setCameras(camMap);
      } catch (error) {
        console.error("데이터 조회 실패:", error);
      }
    };
    fetchData();
  }, []);

  const totalPages = Math.ceil(historyData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = historyData.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="bg-[#1e293b] rounded-xl border border-gray-700 p-5 flex justify-between items-center shadow-lg">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-3 bg-gray-900/50 px-4 py-2 rounded border border-gray-700">
            <span className="text-xs font-bold text-gray-400 uppercase">
              From
            </span>
            <input
              type="date"
              defaultValue={threeDaysAgoKST}
              className="bg-transparent text-sm text-white outline-none font-mono"
            />
          </div>
          <span className="text-gray-600 font-bold">-</span>
          <div className="flex items-center gap-3 bg-gray-900/50 px-4 py-2 rounded border border-gray-700">
            <span className="text-xs font-bold text-gray-400 uppercase">
              To
            </span>
            <input
              type="date"
              defaultValue={todayKST}
              className="bg-transparent text-sm text-white outline-none font-mono"
            />
          </div>

          {stats && (
            <div className="flex gap-3 ml-2">
              <span className="bg-blue-900/30 text-blue-400 border border-blue-800/50 px-3 py-1.5 rounded text-xs font-bold font-mono">
                NORMAL {stats.normal_count.toLocaleString()}
              </span>
              <span className="bg-red-900/30 text-red-400 border border-red-800/50 px-3 py-1.5 rounded text-xs font-bold font-mono">
                DEFECT {stats.abnormal_count.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-emerald-900/20">
          <Download size={16} /> CSV DOWNLOAD
        </button>
      </div>
      <div className="bg-[#1e293b] rounded-xl border border-gray-700 shadow-xl overflow-hidden flex-1 flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-800/80 text-gray-400 uppercase font-bold sticky top-0 backdrop-blur-sm z-10">
              <tr>
                <th className="p-5 border-b border-gray-700 w-32">Camera</th>
                <th className="p-5 border-b border-gray-700">Battery ID</th>
                <th className="p-5 border-b border-gray-700">Date</th>
                <th className="p-5 border-b border-gray-700">Photo ID</th>
                <th className="p-5 border-b border-gray-700">Defect Type</th>
                <th className="p-5 border-b border-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {currentData.map((item, i) => (
                <tr
                  key={i}
                  className="hover:bg-blue-900/10 transition-colors cursor-pointer group"
                >
                  <td className="p-5 font-mono text-gray-400">
                    {cameras[item.camera_id] || `Cam ${item.camera_id}`}
                  </td>
                  <td className="p-5 font-mono font-bold text-blue-300 group-hover:text-blue-400 transition-colors">
                    {item.cell_id}
                  </td>
                  <td className="p-5 text-gray-400 font-mono">
                    {new Date(item.created_at).toLocaleString("ko-KR")}
                  </td>
                  <td className="p-5 text-gray-500 font-mono">
                    {/* Photo ID는 기획에 따라 비워둠 */}
                    -
                  </td>
                  <td className="p-5">
                    {item.decision ? (
                      <span className="bg-red-900/30 text-red-400 border border-red-900/50 px-3 py-1 rounded text-xs font-bold uppercase">
                        {item.decision}
                      </span>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                  <td className="p-5">
                    <div
                      className={`w-3 h-3 rounded-full ${item.label === 0 ? "bg-blue-500" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"}`}
                    ></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-700 bg-gray-800/50 flex justify-center items-center gap-3">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-400"
          >
            <ChevronLeft size={20} />
          </button>

          {totalPages > 0 && Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`w-8 h-8 rounded text-xs font-bold transition-colors ${currentPage === page
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                : "text-gray-400 hover:bg-gray-700"
                }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-400"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default History;
