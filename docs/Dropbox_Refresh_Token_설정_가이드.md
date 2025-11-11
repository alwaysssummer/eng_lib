# Dropbox Refresh Token 설정 가이드

## 📋 개요

Dropbox Access Token의 4시간 만료 문제를 해결하기 위해 **Refresh Token 자동 갱신 방식**을 구현했습니다.

이제 **영구적으로** Dropbox API에 접근할 수 있으며, 토큰이 자동으로 갱신됩니다! 🎉

---

## ✅ 이미 완료된 작업

### 1. Refresh Token 발급 완료
```
DROPBOX_REFRESH_TOKEN=rZj1wvVjl4oAAAAAAAAAAa4Gwrig7tLKqiEGmrbIEMelmmCoG1t9ISxEGj-c_iDx
```

### 2. 로컬 환경 변수 설정 완료
`.env.local` 파일에 다음 환경 변수가 추가되었습니다:
```env
DROPBOX_APP_KEY=cuer3304kloz6ef
DROPBOX_APP_SECRET=y6guxpzvxff97p7
DROPBOX_REFRESH_TOKEN=rZj1wvVjl4oAAAAAAAAAAa4Gwrig7tLKqiEGmrbIEMelmmCoG1t9ISxEGj-c_iDx
```

### 3. 코드 자동 갱신 구현 완료
- `src/lib/dropbox/client.ts`: 자동 토큰 갱신 로직
- 모든 Dropbox API 호출에 자동 갱신 적용
- 캐시된 토큰 재사용으로 성능 최적화

### 4. 로컬 테스트 성공 ✅
```bash
전체 동기화 성공: 1681개 파일 추가
```

---

## 🚀 다음 단계: Vercel 환경 변수 설정

### 1. Vercel 대시보드 접속

https://vercel.com → 프로젝트 선택 → **Settings** → **Environment Variables**

### 2. 다음 환경 변수 추가/수정

#### ✅ 추가할 환경 변수 (3개)

| Key | Value | Environment |
|-----|-------|-------------|
| `DROPBOX_APP_KEY` | `cuer3304kloz6ef` | Production, Preview, Development |
| `DROPBOX_APP_SECRET` | `y6guxpzvxff97p7` | Production, Preview, Development |
| `DROPBOX_REFRESH_TOKEN` | `rZj1wvVjl4oAAAAAAAAAAa4Gwrig7tLKqiEGmrbIEMelmmCoG1t9ISxEGj-c_iDx` | Production, Preview, Development |

#### ⚠️ 기존 환경 변수 처리

- `DROPBOX_ACCESS_TOKEN`: **삭제하거나 유지** (더 이상 사용하지 않음)
- 다른 환경 변수들은 그대로 유지

### 3. 저장 및 재배포

1. 각 환경 변수 저장 후 **"Save"** 클릭
2. Vercel이 자동으로 재배포를 시작합니다
3. 배포 완료 후 테스트

---

## 🧪 배포 후 테스트

### 1. 동기화 API 테스트

```bash
curl https://eng-lib.vercel.app/api/sync/manual?type=full
```

**예상 결과:**
```json
{
  "success": true,
  "message": "전체 동기화 완료: 추가 1681개, 수정 0개, 삭제 0개"
}
```

### 2. 파일 트리 API 테스트

```bash
curl https://eng-lib.vercel.app/api/files/tree
```

**예상 결과:**
```json
{
  "success": true,
  "data": [ ... ]
}
```

### 3. 메인 페이지 접속

https://eng-lib.vercel.app

- 교재 목록 정상 표시
- PDF 뷰어 정상 작동
- "Dropbox 연동이 끊어졌다" 에러 없음 ✅

---

## 🔍 작동 원리

### Before (Access Token 방식)
```
Access Token → 4시간 후 만료 → 수동 재생성 필요 ❌
```

### After (Refresh Token 방식)
```
Refresh Token (영구) → 자동으로 Access Token 생성 (4시간 유효)
→ 만료 5분 전 자동 갱신 → 무한 반복 ✅
```

### 자동 갱신 로직
```typescript
// 1. 캐시된 토큰이 유효하면 재사용
if (cachedAccessToken && Date.now() < tokenExpiry) {
  return cachedAccessToken;
}

// 2. 만료되었으면 Refresh Token으로 새 Access Token 발급
const response = await fetch('https://api.dropbox.com/oauth2/token', {
  method: 'POST',
  body: new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: appKey,
    client_secret: appSecret,
  }),
});

// 3. 새 토큰 캐시 (만료 5분 전으로 설정)
cachedAccessToken = data.access_token;
tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
```

---

## 📊 적용된 파일

### 핵심 파일
- `src/lib/dropbox/client.ts`: 토큰 자동 갱신 로직
- `src/lib/dropbox/sync.ts`: 동기화 함수
- `src/app/api/files/download/route.ts`: PDF 다운로드
- `src/app/api/files/proxy/route.ts`: PDF 프록시

### 환경 변수
- `.env.local`: 로컬 개발 환경
- Vercel: 프로덕션 환경

---

## ⚠️ 주의사항

### 1. Refresh Token 보안
- **절대 Git에 커밋하지 마세요!**
- `.env.local`은 `.gitignore`에 포함됨
- Vercel 환경 변수만 사용

### 2. App Secret 보안
- App Secret도 민감한 정보입니다
- 외부에 노출하지 마세요

### 3. 토큰 만료
- Refresh Token은 **영구**입니다
- 단, Dropbox 앱이 삭제되면 무효화됩니다
- 권한이 변경되면 새로 발급 필요

---

## 🆘 문제 해결

### "토큰 갱신 실패: 400 Bad Request"

**원인:** 환경 변수가 잘못 설정됨

**해결:**
1. Vercel 환경 변수 확인
2. `DROPBOX_APP_KEY`, `DROPBOX_APP_SECRET`, `DROPBOX_REFRESH_TOKEN` 재확인
3. 공백이나 줄바꿈 없이 정확히 입력

### "토큰 갱신 실패: 401 Unauthorized"

**원인:** App Secret이 잘못됨

**해결:**
1. Dropbox Settings 페이지에서 App Secret 재확인
2. "Show" 버튼 클릭해서 정확한 값 복사
3. Vercel 환경 변수 업데이트

### "Dropbox 연동이 끊어졌다" 에러

**원인:** 환경 변수가 Vercel에 설정되지 않음

**해결:**
1. Vercel 대시보드에서 환경 변수 확인
2. 3개 모두 설정되었는지 확인
3. 재배포 (Deployments → ... → Redeploy)

---

## 📝 참고 자료

### Dropbox API 문서
- [OAuth 2.0 Guide](https://developers.dropbox.com/oauth-guide)
- [Refresh Tokens](https://developers.dropbox.com/oauth-guide#refresh-tokens)

### 관련 코드
- `src/lib/dropbox/client.ts`: 메인 구현
- `docs/API_테스트_가이드.md`: API 테스트 방법

---

## ✅ 체크리스트

배포 전 확인사항:

- [x] Refresh Token 발급 완료
- [x] 로컬 환경 변수 설정 완료
- [x] 로컬 테스트 성공
- [x] 코드 커밋 및 푸시
- [ ] **Vercel 환경 변수 설정** ← **지금 해야 할 것!**
- [ ] Vercel 재배포 확인
- [ ] 프로덕션 테스트

---

**작성일:** 2025-11-11  
**버전:** 3.1  
**상태:** Refresh Token 방식 구현 완료, Vercel 설정 대기 중

