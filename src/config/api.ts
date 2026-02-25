// src/config/api.ts
// API Base URL 중앙 관리 - 이 파일 하나만 수정하면 모든 페이지에 반영됩니다.

// export const API_BASE_URL = "http://localhost:8000";
// export const API_BASE_URL = "https://battery-cfardbaresa3g3h2.koreacentral-01.azurewebsites.net";
export const API_BASE_URL = "https://battery-server-ch.azurewebsites.net";

/**
 * 공통 API fetch 헬퍼
 * @param path - API 경로 (예: "/analysis/stats/1/1")
 * @returns 파싱된 JSON 응답
 */
export async function apiFetch<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`);
    if (!response.ok) {
        throw new Error(`API 응답 오류: ${response.status} ${response.statusText}`);
    }
    return response.json();
}
