import React, { useState, useEffect } from "react";
import {
  FolderOpen,
  Cpu,
  Database,
  Save,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { apiFetch } from "../config/api";

interface ModelInfo {
  model_name: string;
  model_version: number;
  accuracy: number | null;
  is_active: boolean;
}

const Settings = () => {
  const [modelInfo, setModelInfo] = useState<{
    version: string;
    accuracy: string;
  }>({
    version: "V.1.4.2 (PROD)",
    accuracy: "99.8%",
  });

  useEffect(() => {
    const fetchModelInfo = async () => {
      try {
        const data = await apiFetch<ModelInfo[]>(
          "/model/battery_defect_classifier/1?only_active=true&limit=1"
        );
        if (data && data.length > 0) {
          const model = data[0];
          setModelInfo({
            version: `V.${model.model_version} ${model.is_active ? "(PROD)" : "(INACTIVE)"}`,
            accuracy: model.accuracy !== null ? `${model.accuracy}%` : "N/A",
          });
        }
      } catch (error) {
        console.error("모델 정보 조회 실패, 기본값 유지:", error);
      }
    };
    fetchModelInfo();
  }, []);

  return (
    <div className="w-full space-y-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black text-white tracking-tight">
          Configuration
        </h2>
        <div className="px-4 py-2 bg-green-900/30 border border-green-800 rounded-full flex items-center gap-3 shadow-lg">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
          <span className="text-xs font-bold text-green-400 uppercase tracking-widest">
            System Active
          </span>
        </div>
      </div>

      <div className="bg-[#1e293b] p-8 rounded-xl border border-gray-700 shadow-xl">
        <div className="flex items-center gap-3 mb-8 border-b border-gray-700 pb-5">
          <div className="bg-blue-500/10 p-3 rounded-lg">
            <Save className="text-blue-500" size={24} />
          </div>
          <h3 className="font-bold text-white text-base uppercase tracking-widest">
            Storage Path Configuration
          </h3>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-3">
            <label className="text-sm text-gray-400 font-bold uppercase ml-1">
              Image Save Directory
            </label>
            <div className="flex gap-4">
              <input
                type="text"
                readOnly
                value="C:\SmartFactory\Data\Image"
                className="flex-1 bg-gray-950 border border-gray-600 rounded-xl px-5 py-4 text-sm text-blue-200 font-mono focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button className="bg-gray-700 hover:bg-gray-600 px-8 py-4 rounded-xl text-sm font-bold text-white flex items-center gap-3 transition-all active:scale-95 shadow-md">
                <FolderOpen size={18} /> BROWSE
              </button>
            </div>
            <p className="text-xs text-gray-500 ml-1 mt-1">
              * Select the local directory where inspection images will be
              archived.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#1e293b] p-8 rounded-xl border border-gray-700 shadow-xl">
        <div className="flex items-center gap-3 mb-8 border-b border-gray-700 pb-5">
          <div className="bg-purple-500/10 p-3 rounded-lg">
            <Cpu className="text-purple-500" size={24} />
          </div>
          <h3 className="font-bold text-white text-base uppercase tracking-widest">
            AI Model Information
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-8 text-sm">
          <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-700/50 flex flex-col gap-3 shadow-inner">
            <div className="flex items-center gap-2 text-gray-500 font-bold">
              <Activity size={18} />
              <span>Active Model</span>
            </div>
            <p className="font-black text-2xl text-white font-mono mt-2">
              {modelInfo.version}
            </p>
          </div>

          <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-700/50 flex flex-col gap-3 shadow-inner">
            <div className="flex items-center gap-2 text-gray-500 font-bold">
              <CheckCircle2 size={18} />
              <span>Accuracy</span>
            </div>
            <p className="font-black text-2xl text-emerald-400 font-mono mt-2">
              {modelInfo.accuracy}
            </p>
          </div>

          <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-700/50 flex flex-col gap-3 shadow-inner">
            <div className="flex items-center gap-2 text-gray-500 font-bold">
              <Database size={18} />
              <span>Usage (30d)</span>
            </div>
            <p className="font-black text-2xl text-blue-400 font-mono mt-2">
              1.2 TB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
