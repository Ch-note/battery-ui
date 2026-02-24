import React, { createContext, useContext, useState } from "react";

export interface Camera {
    camera_id: number;
    factory_id: number;
    camera_name: string;
    purchased_at: string;
}

interface CameraContextType {
    selectedCamera: Camera | null;
    setSelectedCamera: (cam: Camera) => void;
}

export const CameraContext = createContext<CameraContextType | undefined>(undefined);

export const CameraProvider = ({ children }: { children: React.ReactNode }) => {
    const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);

    return (
        <CameraContext.Provider value={{ selectedCamera, setSelectedCamera }}>
            {children}
        </CameraContext.Provider>
    );
};

export const useCamera = () => {
    const context = useContext(CameraContext);
    if (!context) {
        throw new Error("비판적 오류: useCamera는 반드시 CameraProvider 내부에서 호출되어야 하오.");
    }
    return context;
};