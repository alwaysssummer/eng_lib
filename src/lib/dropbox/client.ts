import { Dropbox } from 'dropbox';

// Dropbox 클라이언트 싱글톤
let dropboxClient: Dropbox | null = null;

/**
 * Dropbox 클라이언트 초기화 및 반환
 * 서버 사이드에서만 사용 (Access Token 필요)
 */
export function getDropboxClient(): Dropbox {
  if (!dropboxClient) {
    const accessToken = process.env.DROPBOX_ACCESS_TOKEN;
    
    if (!accessToken) {
      throw new Error('DROPBOX_ACCESS_TOKEN 환경 변수가 설정되지 않았습니다.');
    }

    dropboxClient = new Dropbox({
      accessToken,
      fetch: fetch.bind(globalThis), // Next.js 전역 fetch를 명시적으로 바인딩
    });
  }

  return dropboxClient;
}

/**
 * Dropbox 클라이언트 재설정 (테스트용)
 */
export function resetDropboxClient() {
  dropboxClient = null;
}

