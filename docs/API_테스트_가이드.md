# API 테스트 가이드

## 🔍 브라우저에서 직접 API 테스트

### 1. 통계 API 테스트
```
http://localhost:3000/api/admin/stats?period=today
```

브라우저 주소창에 입력하면 JSON 응답을 확인할 수 있습니다.

**예상 응답**:
```json
{
  "success": true,
  "stats": {
    "totalVisitors": 0,
    "todayDownloads": 0,
    "activeTextbooks": 10,
    "pendingRequests": 3
  },
  "details": {
    "period": "today",
    "todayClicks": 0,
    "weekClicks": 0,
    "monthClicks": 0
  },
  "timestamp": "2025-11-11T..."
}
```

---

### 2. 인기 교재 API 테스트
```
http://localhost:3000/api/admin/top-textbooks?limit=5
```

**예상 응답**:
```json
{
  "success": true,
  "textbooks": [
    {
      "id": "...",
      "name": "교재명",
      "totalClicks": 123,
      "fileCount": 45,
      "created_at": "..."
    }
  ],
  "count": 5,
  "period": "all",
  "timestamp": "..."
}
```

---

### 3. 시간대별 통계 API 테스트
```
http://localhost:3000/api/admin/hourly-stats?date=2025-11-11
```

**예상 응답**:
```json
{
  "success": true,
  "date": "2025-11-11",
  "hourlyData": [
    { "hour": 0, "count": 0 },
    { "hour": 1, "count": 0 },
    ...
  ],
  "summary": {
    "totalClicks": 0,
    "peakHours": [],
    "peakCount": 0
  },
  "timestamp": "..."
}
```

---

## 🚨 에러 응답 확인

### 500 에러 예시
```json
{
  "error": "교재 조회 중 오류가 발생했습니다.",
  "details": "relation \"public.chapters\" does not exist"
}
```

이런 에러가 나오면:
1. Supabase에서 테이블 구조 확인
2. 관계(Foreign Key) 설정 확인
3. 환경변수 확인

---

## 📋 문제 해결

### 1. "교재 조회 실패" 에러
**원인**: `textbooks`, `chapters`, `files` 테이블 간 관계 미설정

**해결**: Supabase Dashboard에서 확인
1. Table Editor → `chapters` 테이블
2. `textbook_id` 컬럼이 `textbooks.id`를 참조하는지 확인
3. `files` 테이블의 `chapter_id`가 `chapters.id`를 참조하는지 확인

### 2. 빈 결과 반환
**원인**: 아직 클릭 데이터가 없음

**정상**: 다음과 같이 표시됨
```
{
  "success": true,
  "textbooks": [],
  "count": 0
}
```

### 3. 환경변수 문제
**확인**: `.env.local` 파일
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🧪 빠른 테스트 순서

1. **개발 서버 실행 확인**
   ```
   http://localhost:3000
   ```

2. **통계 API 직접 호출**
   ```
   http://localhost:3000/api/admin/stats?period=today
   ```
   - 200 응답 → ✅ 정상
   - 500 에러 → 터미널 로그 확인

3. **인기 교재 API 직접 호출**
   ```
   http://localhost:3000/api/admin/top-textbooks?limit=5
   ```
   - 200 응답 → ✅ 정상
   - 500 에러 → 에러 메시지 확인

4. **관리자 대시보드 확인**
   ```
   http://localhost:3000/admin
   ```
   - 통계 카드에 숫자 표시 확인
   - 인기 교재 섹션 확인

