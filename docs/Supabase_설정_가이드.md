# Supabase 설정 가이드

## 📋 Supabase 프로젝트 생성 및 설정

### 1단계: Supabase 프로젝트 생성

1. **Supabase 웹사이트 접속**
   - https://supabase.com 방문
   - "Start your project" 클릭

2. **새 프로젝트 생성**
   - Organization 선택 또는 생성
   - Project name: `eng-lib` (또는 원하는 이름)
   - Database Password: 강력한 비밀번호 생성 (저장 필수!)
   - Region: `Northeast Asia (Seoul)` 선택 (한국 서버)
   - Pricing Plan: `Free` 선택

3. **프로젝트 생성 대기**
   - 약 2-3분 소요
   - 데이터베이스 초기화 완료까지 대기

---

### 2단계: API 키 확인

프로젝트 대시보드에서:

1. 좌측 메뉴 → **Project Settings** (톱니바퀴 아이콘)
2. **API** 탭 클릭
3. 다음 값들을 복사:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ 비밀!

---

### 3단계: 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Dropbox (나중에 설정)
DROPBOX_ACCESS_TOKEN=
DROPBOX_ROOT_PATH=/교재자료
DROPBOX_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **주의**: `.env.local` 파일은 절대 Git에 커밋하지 마세요!

---

### 4단계: 데이터베이스 스키마 생성

1. **SQL Editor 열기**
   - Supabase 대시보드 → 좌측 메뉴 → **SQL Editor**
   - "New query" 클릭

2. **스키마 실행**
   - 프로젝트의 `supabase/schema.sql` 파일 내용 복사
   - SQL Editor에 붙여넣기
   - **RUN** 버튼 클릭 (또는 Ctrl+Enter)

3. **실행 결과 확인**
   ```
   ✅ 데이터베이스 스키마 생성 완료!
   📊 총 9개 테이블 생성됨
   🔒 RLS 정책 적용됨
   🔄 트리거 및 함수 생성됨
   ```

---

### 5단계: 테이블 확인

1. **Table Editor 열기**
   - 좌측 메뉴 → **Table Editor**

2. **생성된 테이블 확인**
   - ✅ textbooks (교재)
   - ✅ chapters (단원)
   - ✅ files (PDF 파일)
   - ✅ textbook_requests (교재 요청)
   - ✅ notices (공지사항)
   - ✅ user_analytics (사용자 분석)
   - ✅ file_clicks (파일 클릭 로그)
   - ✅ dropbox_sync_log (동기화 로그)
   - ✅ dropbox_cursor (드롭박스 커서)

3. **뷰 확인**
   - textbook_stats (교재 통계 뷰)

---

### 6단계: Row Level Security (RLS) 확인

각 테이블의 RLS가 활성화되었는지 확인:

1. Table Editor에서 테이블 선택
2. 우측 상단 3점 메뉴 → **Edit table**
3. **Enable Row Level Security (RLS)** 확인 (체크됨)
4. **View policies** 클릭하여 정책 확인

---

### 7단계: Realtime 활성화 (선택)

실시간 업데이트를 위해:

1. **Database** → **Replication** 메뉴
2. 테이블 선택:
   - `files`
   - `textbooks`
   - `file_clicks`
3. **Enable** 버튼 클릭

---

## 🧪 연결 테스트

### 로컬 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

### 연결 테스트 페이지 생성 (선택)

`src/app/test-db/page.tsx` 파일 생성:

```tsx
import { supabase } from '@/lib/supabase/client';

export default async function TestPage() {
  // 테이블 존재 확인
  const { data, error } = await supabase
    .from('textbooks')
    .select('count');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase 연결 테스트</h1>
      
      {error ? (
        <div className="text-red-600">
          <p>❌ 연결 실패</p>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      ) : (
        <div className="text-green-600">
          <p>✅ 연결 성공!</p>
          <p>테이블이 정상적으로 조회됩니다.</p>
        </div>
      )}
    </div>
  );
}
```

---

## 📊 데이터베이스 구조

### 테이블 관계도

```
textbooks (교재)
    ↓ 1:N
chapters (단원)
    ↓ 1:N
files (PDF 파일)
    ↓ 1:N
file_clicks (클릭 로그)
```

### 주요 기능

#### 1. 자동 클릭수 증가
파일 클릭 시 자동으로:
- `files.click_count` +1
- `textbooks.click_count` +1 (해당 교재)

#### 2. 자동 updated_at 업데이트
데이터 수정 시 `updated_at` 자동 갱신

#### 3. PDF 파일 제약
`files` 테이블은 PDF 파일만 저장 가능

---

## 🔒 보안 정책 (RLS)

### 공개 읽기 (Public Read)
- `textbooks`, `chapters`, `files`, `notices`
- 모든 사용자가 읽을 수 있음
- `files`는 `is_active=true`인 것만
- `notices`는 `is_active=true`인 것만

### 인증 사용자 쓰기 (Authenticated Write)
- `textbook_requests` - 교재 요청
- `file_clicks` - 파일 클릭 로그
- `user_analytics` - 사용자 분석

### 서비스 역할 전용 (Service Role Only)
- 모든 테이블의 관리 작업
- `dropbox_sync_log` - 동기화 로그
- `dropbox_cursor` - 커서 관리

---

## 🚨 문제 해결

### 1. "relation does not exist" 오류
→ SQL 스키마가 실행되지 않았습니다. 4단계 다시 수행

### 2. "anon key is invalid" 오류
→ `.env.local` 파일의 API 키 확인

### 3. RLS 정책 오류
→ SQL Editor에서 RLS 정책 재실행

### 4. 연결 실패
→ 프로젝트 URL이 올바른지 확인
→ API 키가 올바른지 확인

---

## 📈 다음 단계

Task 2 완료 후:
- ✅ Supabase 프로젝트 생성
- ✅ 9개 테이블 생성
- ✅ RLS 정책 적용
- ✅ 클라이언트 설정
- ✅ 환경 변수 설정

**다음**: Task 3 - shadcn/ui 설치

---

## 📝 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Next.js + Supabase 가이드](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime 가이드](https://supabase.com/docs/guides/realtime)

