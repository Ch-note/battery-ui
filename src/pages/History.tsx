import { useState, useEffect } from "react";
import { Download, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { apiFetch } from "../config/api";

interface StatsData {
  abnormal_count: number;
  normal_count: number;
}

interface DefectItem {
  cell_id: string;
  vision_model_label: number;
  vision_model_decision: string | null;
  vision_model_confidence: number;
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

const toKSTDateString = (date: Date): string => {
  return date
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Seoul",
    })
    .replace(/\. /g, "-")
    .replace(/\./g, "");
};

const todayKST = toKSTDateString(new Date());
const threeDaysAgoKST = toKSTDateString(
  new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
);

const History = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [historyData, setHistoryData] = useState<DefectItem[]>([]);
  const [cameras, setCameras] = useState<Record<number, string>>({});

  // 상태가 존재하지 않던 결함을 바로잡은 영역
  const [startDate, setStartDate] = useState(threeDaysAgoKST);
  const [endDate, setEndDate] = useState(todayKST);
  const [isDownloading, setIsDownloading] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 날짜 파라미터를 URL에 주입
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append("start_date", startDate);
        if (endDate) queryParams.append("end_date", endDate);
        const qString = queryParams.toString();

        // API 호출 시 쿼리 스트링 병합
        const [statsData, listData, cameraData] = await Promise.all([
          apiFetch<StatsData>(`/analysis/stats/1/1?${qString}`),
          apiFetch<ListResponse>(`/analysis/list/1/1?${qString}`),
          apiFetch<Camera[]>("/factory/1/cameras"),
        ]);

        setStats(statsData);
        setHistoryData(listData.items);

        const camMap: Record<number, string> = {};
        cameraData.forEach((cam) => {
          camMap[cam.camera_id] = cam.camera_name;
        });
        setCameras(camMap);
      } catch (error) {
        console.error("데이터 조회 실패:", error);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  // CSV 다운로드를 수행하는 날카롭고 빈틈없는 함수
  const handleDownloadCsv = async () => {
    if (startDate > endDate) {
      alert("시작일이 종료일보다 늦을 수 없다. 논리적으로 생각하라.");
      return;
    }

    setIsDownloading(true);
    try {
      // JSON 기반 apiFetch 대신 Blob 처리를 위한 순수 fetch 사용 (백엔드 포트 8000 가정)
      const response = await fetch(
        `http://localhost:8000/export/csv/1/1?start_date=${startDate}&end_date=${endDate}`,
      );

      if (!response.ok) {
        throw new Error("서버에서 CSV 데이터를 생성하지 못했다.");
      }

      // Blob 데이터를 생성하여 가상 링크로 다운로드 트리거
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `inspection_${startDate}_to_${endDate}.csv`,
      );
      document.body.appendChild(link);
      link.click();

      // 흔적 지우기
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV 다운로드 실패:", error);
      alert("다운로드 중 치명적 오류가 발생했다.");
    } finally {
      setIsDownloading(false);
    }
  };

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
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
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
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
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

        {/* 이벤트 핸들러가 연결된 다운로드 버튼 */}
        <button
          onClick={handleDownloadCsv}
          disabled={isDownloading}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 text-white px-5 py-2.5 rounded text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-emerald-900/20"
        >
          <Download size={16} />
          {isDownloading ? "DOWNLOADING..." : "CSV DOWNLOAD"}
        </button>
      </div>

      {/* --- 이하 테이블 렌더링 영역은 기존과 동일하오 --- */}
      <div className="bg-[#1e293b] rounded-xl border border-gray-700 shadow-xl overflow-hidden flex-1 flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-800/80 text-gray-400 uppercase font-bold sticky top-0 backdrop-blur-sm z-10">
              <tr>
                <th className="p-5 border-b border-gray-700 w-32">Camera</th>
                <th className="p-5 border-b border-gray-700">Battery ID</th>
                <th className="p-5 border-b border-gray-700">Date</th>
                <th className="p-5 border-b border-gray-700">Defect Type</th>
                <th className="p-5 border-b border-gray-700">Confidence</th>
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
                  <td className="p-5">
                    {item.vision_model_decision ? (
                      <span className="bg-red-900/30 text-red-400 border border-red-900/50 px-3 py-1 rounded text-xs font-bold uppercase">
                        {item.vision_model_decision}
                      </span>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                  <td className="p-5 font-bold text-green-400 font-mono text-base">
                    {item.vision_model_confidence}
                  </td>
                  <td className="p-5">
                    <div
                      className={`w-3 h-3 rounded-full ${item.vision_model_label === 0 ? "bg-blue-500" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"}`}
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

          {totalPages > 0 &&
            Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-8 h-8 rounded text-xs font-bold transition-colors ${
                  currentPage === page
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
