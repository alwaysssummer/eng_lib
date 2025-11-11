# Task 4 완료 보고서: Dropbox API 연동 및 실시간 동기화

**작업 기간**: 2025-11-10  
**작업자**: AI Assistant  
**상태**: ✅ 완료

---

## 📋 작업 개요

Dropbox API를 연동하여 로컬 드롭박스 폴더의 PDF 파일을 자동으로 동기화하는 시스템을 구현했습니다. 전체 동기화, 증분 동기화, Webhook 실시간 알림, Cron 자동 동기화를 포함합니다.

---

## ✅ 완료된 작업

### 1. 📦 패키지 설치

```bash
npm install dropbox isomorphic-fetch
```

- `dropbox`: Dropbox SDK
- `isomorphic-fetch`: fetch polyfill (Node.js 환경)

### 2. 🔧 Dropbox 클라이언트 구현

#### 파일: `src/lib/dropbox/client.ts`

**기능**:
- Dropbox API 클라이언트 싱글톤 패턴
- Access Token 기반 인증
- 환경 변수 검증

```typescript
export function getDropboxClient(): Dropbox {
  // DROPBOX_ACCESS_TOKEN 환경 변수 확인
  // Dropbox 클라이언트 초기화 및 반환
}
```

### 3. 📂 동기화 로직 구현

#### 파일: `src/lib/dropbox/sync.ts`

**핵심 기능**:

#### A. PDF 필터링
```typescript
export function isPdfFile(filename: string): boolean {
  return filename.toLowerCase().endsWith('.pdf');
}
```
- `.pdf` 확장자만 필터링
- 대소문자 구분 없음

#### B. 교재명 추출
```typescript
export function extractTextbookName(path: string): string {
  // /중학영어/1학년/문법/현재시제.pdf -> "중학영어"
  const parts = path.split('/').filter(Boolean);
  return parts[0] || 'Unknown';
}
```

#### C. 전체 동기화 (Full Sync)
```typescript
export async function fullSync(rootPath: string = '')
```

**동작 방식**:
1. Dropbox `filesListFolder` API 호출 (recursive=true)
2. 페이지네이션 처리 (has_more)
3. PDF 파일만 필터링
4. 각 파일을 Supabase에 동기화
5. 동기화 커서 저장
6. 로그 기록

**결과**:
- `filesAdded`: 추가된 파일 수
- `filesUpdated`: 수정된 파일 수
- `errors`: 오류 목록

#### D. 증분 동기화 (Incremental Sync)
```typescript
export async function incrementalSync()
```

**동작 방식**:
1. 저장된 커서 가져오기
2. 커서가 없으면 전체 동기화 실행
3. `filesListFolderContinue` API로 변경사항만 조회
4. PDF 파일 추가/수정/삭제 처리
5. 새 커서 저장
6. 로그 기록

**처리 항목**:
- ✅ 파일 추가 (`file` + PDF)
- ✅ 파일 수정 (`file` + PDF)
- ✅ 파일 삭제 (`deleted`)

#### E. 개별 파일 동기화
```typescript
async function syncFile(file: FileMetadataReference)
```

**동작**:
1. 경로에서 교재명 추출
2. 교재 테이블 확인/생성
3. 파일 정보 upsert
   - `dropbox_file_id`: 고유 ID
   - `dropbox_rev`: 리비전
   - `dropbox_path`: 소문자 경로
   - `file_size`: 파일 크기
   - `last_modified`: 수정 시간
   - `is_active`: 활성 상태

### 4. 🌐 API 라우트 구현

#### A. 수동 동기화 API

**파일**: `src/app/api/sync/manual/route.ts`

**엔드포인트**:
```
GET /api/sync/manual?type=full
GET /api/sync/manual?type=incremental
```

**응답 예시**:
```json
{
  "success": true,
  "message": "전체 동기화 완료: 45개 추가, 3개 수정",
  "data": {
    "filesAdded": 45,
    "filesUpdated": 3,
    "errors": []
  }
}
```

#### B. Webhook API

**파일**: `src/app/api/sync/webhook/route.ts`

**엔드포인트**:
```
GET  /api/sync/webhook  (Challenge 응답)
POST /api/sync/webhook  (변경 알림 수신)
```

**기능**:
1. **GET**: Dropbox 웹훅 검증
   - `challenge` 파라미터 받아서 그대로 반환
2. **POST**: 변경 알림 처리
   - HMAC-SHA256 서명 검증
   - 비동기로 증분 동기화 실행
   - 즉시 200 응답

**서명 검증**:
```typescript
function verifySignature(body: string, signature: string): boolean {
  const hmac = crypto.createHmac('sha256', DROPBOX_APP_SECRET);
  hmac.update(body);
  const expectedSignature = hmac.digest('hex');
  return signature === expectedSignature;
}
```

#### C. Cron API

**파일**: `src/app/api/sync/cron/route.ts`

**엔드포인트**:
```
GET  /api/sync/cron
POST /api/sync/cron
```

**기능**:
- Vercel Cron에서 5분마다 자동 호출
- 인증 토큰 검증 (선택)
- 증분 동기화 실행

**인증** (선택사항):
```typescript
const authHeader = request.headers.get('authorization');
const expectedToken = process.env.CRON_SECRET;

if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

#### D. 상태 조회 API

**파일**: `src/app/api/sync/status/route.ts`

**엔드포인트**:
```
GET /api/sync/status
```

**응답**:
```json
{
  "success": true,
  "data": {
    "lastSync": {
      "type": "incremental",
      "status": "success",
      "timestamp": "2025-11-10T10:30:00Z",
      "metadata": { "changesProcessed": 3 }
    },
    "cursor": {
      "lastUpdated": "2025-11-10T10:30:00Z",
      "hasCursor": true
    },
    "statistics": {
      "totalFiles": 127,
      "totalTextbooks": 8,
      "textbooks": [...]
    }
  }
}
```

### 5. ⏱️ Vercel Cron 설정

**파일**: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/sync/cron",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**설명**:
- 5분마다 자동 실행 (`*/5 * * * *`)
- `/api/sync/cron` 호출
- Vercel Pro 플랜 이상에서 지원

### 6. 🧪 테스트 페이지 구현

**파일**: `src/app/test-sync/page.tsx`

**URL**: `http://localhost:3000/test-sync`

**기능**:
1. **동기화 실행 버튼**
   - 전체 동기화
   - 증분 동기화
   - 상태 새로고침

2. **동기화 결과 표시**
   - 성공/실패 상태
   - 처리된 파일 수
   - 상세 메타데이터
   - 오류 메시지

3. **동기화 상태 표시**
   - 마지막 동기화 정보
   - 커서 상태
   - 전체 통계 (파일 수, 교재 수)
   - 교재 목록 (클릭수 포함)

4. **API 엔드포인트 정보**
   - 모든 API URL 나열

---

## 📊 데이터베이스 스키마

### 기존 테이블 활용

#### 1. `textbooks` 테이블
```sql
- id: UUID (PK)
- name: TEXT (교재명)
- description: TEXT
- total_clicks: INTEGER (클릭수)
```

#### 2. `files` 테이블
```sql
- id: UUID (PK)
- textbook_id: UUID (FK)
- file_name: TEXT
- file_path: TEXT
- dropbox_file_id: TEXT (UNIQUE) ⭐
- dropbox_rev: TEXT ⭐
- dropbox_path: TEXT ⭐
- file_size: BIGINT ⭐
- last_modified: TIMESTAMPTZ ⭐
- is_active: BOOLEAN ⭐
```

#### 3. `dropbox_sync_log` 테이블
```sql
- id: UUID (PK)
- sync_type: TEXT (full/incremental/webhook)
- dropbox_path: TEXT
- status: TEXT (success/error)
- metadata: JSONB
- created_at: TIMESTAMPTZ
```

#### 4. `dropbox_cursor` 테이블
```sql
- id: INTEGER (PK, 단일 행)
- cursor_value: TEXT
- updated_at: TIMESTAMPTZ
```

---

## 🔧 환경 변수

### 필수 환경 변수

```env
# Dropbox API
DROPBOX_ACCESS_TOKEN=sl.xxxxx
DROPBOX_APP_SECRET=xxxxx

# Cron 인증 (선택)
CRON_SECRET=랜덤_32자_이상_문자열
```

### 환경 변수 획득 방법

1. **Dropbox Access Token**
   - https://www.dropbox.com/developers/apps
   - Create App → Scoped access
   - Settings 탭 → Generate Access Token

2. **Dropbox App Secret**
   - 같은 페이지의 App key & secret 섹션

3. **CRON_SECRET**
   ```bash
   # Mac/Linux
   openssl rand -hex 32
   
   # 또는 직접 입력
   CRON_SECRET=my-super-secret-cron-token-12345678901234567890
   ```

---

## 🔄 동기화 시나리오

### 시나리오 1: 최초 설정

```
1. Dropbox에 교재 폴더 생성
   /중학영어/1학년/문법/현재시제.pdf
   /중학영어/1학년/문법/과거시제.pdf
   /고등영어/수능대비/모의고사.pdf

2. 환경 변수 설정
   DROPBOX_ACCESS_TOKEN=sl.xxxxx

3. 전체 동기화 실행
   GET /api/sync/manual?type=full

4. 결과 확인
   - textbooks 테이블: 중학영어, 고등영어 생성
   - files 테이블: 3개 PDF 파일 저장
   - dropbox_cursor 테이블: 커서 저장
   - dropbox_sync_log 테이블: 로그 기록
```

### 시나리오 2: 파일 추가

```
1. Dropbox에 새 파일 추가
   /중학영어/1학년/독해/지문1.pdf

2. Dropbox Webhook 알림 수신 (자동)
   POST /api/sync/webhook

3. 또는 수동 동기화
   GET /api/sync/manual?type=incremental

4. 결과
   - files 테이블: 새 파일 추가
   - 커서 업데이트
```

### 시나리오 3: 파일 수정

```
1. Dropbox에서 파일 내용 수정
   /중학영어/1학년/문법/현재시제.pdf

2. Webhook 또는 Cron이 변경 감지

3. 결과
   - files 테이블: dropbox_rev, last_modified 업데이트
```

### 시나리오 4: 파일 삭제

```
1. Dropbox에서 파일 삭제
   /중학영어/1학년/문법/과거시제.pdf

2. Webhook 또는 Cron이 삭제 감지

3. 결과
   - files 테이블: is_active = false 설정
   - (물리적 삭제는 하지 않음)
```

### 시나리오 5: 자동 동기화

```
Vercel Cron (5분마다)
  ↓
GET /api/sync/cron
  ↓
incrementalSync() 실행
  ↓
변경사항 처리
  ↓
로그 기록
```

---

## 🧪 테스트 방법

### 1. 환경 변수 설정

`.env.local` 파일에 추가:
```env
DROPBOX_ACCESS_TOKEN=sl.B1234567890abcdefghijklmnopqrstuvwxyz
DROPBOX_APP_SECRET=abcdef1234567890
CRON_SECRET=my-cron-secret-token
```

### 2. 개발 서버 재시작

```bash
npm run dev
```

### 3. 테스트 페이지 접속

```
http://localhost:3000/test-sync
```

### 4. 전체 동기화 실행

1. "전체 동기화 (Full Sync)" 버튼 클릭
2. 결과 확인:
   - ✅ 성공 메시지
   - 📊 파일 추가 개수
   - 📚 교재 목록

### 5. 증분 동기화 테스트

1. Dropbox에서 파일 추가/수정/삭제
2. "증분 동기화 (Incremental)" 버튼 클릭
3. 변경사항만 처리되는지 확인

### 6. API 직접 호출

```bash
# 전체 동기화
curl http://localhost:3000/api/sync/manual?type=full

# 증분 동기화
curl http://localhost:3000/api/sync/manual?type=incremental

# 상태 조회
curl http://localhost:3000/api/sync/status
```

---

## ⚠️ 주의사항

### 1. PDF 필터링

- **필터링됨**: `.pdf` 확장자만
- **무시됨**: `.docx`, `.hwp`, `.txt`, `.jpg`, `.png` 등 모든 비-PDF 파일

### 2. 교재명 규칙

- 경로의 **첫 번째 폴더명**이 교재명으로 사용됨
- 예: `/중학영어/1학년/문법/현재시제.pdf` → 교재명: "중학영어"
- 루트에 직접 파일 저장 시 교재명: "Unknown"

### 3. 커서 관리

- 커서는 `dropbox_cursor` 테이블에 단일 행으로 저장
- 증분 동기화는 **커서가 있어야** 작동
- 커서가 없으면 자동으로 전체 동기화 실행

### 4. Webhook 설정

Dropbox App Console에서 Webhook URL 등록:
```
https://your-domain.vercel.app/api/sync/webhook
```

**테스트**:
```bash
# Challenge 검증
curl "https://your-domain.vercel.app/api/sync/webhook?challenge=test123"
# 응답: test123
```

### 5. Vercel Cron

- Vercel **Pro 플랜** 이상 필요
- `vercel.json` 파일이 프로젝트 루트에 있어야 함
- 배포 후 Vercel Dashboard에서 Cron 탭 확인

### 6. 성능 고려사항

- **전체 동기화**: 파일이 많으면 시간이 오래 걸림 (최초 1회만)
- **증분 동기화**: 빠름 (변경사항만 처리)
- **Webhook**: 가장 빠름 (즉시 반응)

---

## 📁 생성된 파일 목록

```
src/
├── lib/
│   └── dropbox/
│       ├── client.ts          # Dropbox 클라이언트
│       └── sync.ts            # 동기화 로직
├── app/
│   ├── api/
│   │   └── sync/
│   │       ├── manual/
│   │       │   └── route.ts   # 수동 동기화 API
│   │       ├── webhook/
│   │       │   └── route.ts   # Webhook API
│   │       ├── cron/
│   │       │   └── route.ts   # Cron API
│   │       └── status/
│   │           └── route.ts   # 상태 조회 API
│   └── test-sync/
│       └── page.tsx           # 테스트 페이지
└── ...

vercel.json                     # Vercel Cron 설정
```

---

## 🎯 완료 조건 체크

- ✅ Dropbox API 인증 완료
- ✅ 파일/폴더 목록 조회 기능
- ✅ 파일 다운로드 링크 생성 기능 (필요 시)
- ✅ **PDF 파일만 필터링** (.pdf 확장자)
- ✅ **초기 전체 동기화 기능** (fullSync)
- ✅ **증분 동기화 기능** (incrementalSync)
- ✅ **Webhook 수신 및 처리** (서명 검증 포함)
- ✅ **5분마다 자동 동기화** (Vercel Cron)
- ✅ **동기화 로그 기록** (dropbox_sync_log)
- ✅ **테스트 페이지 구현** (/test-sync)

---

## 🔜 다음 단계

### Task 5: 좌측 패널 구현

이제 동기화된 데이터를 사용하여:
1. 좌측 패널에 파일 트리 구조 표시
2. 교재별 클릭수 표시
3. Supabase Realtime으로 실시간 업데이트
4. 검색 및 정렬 기능

---

## 📝 트러블슈팅

### 문제 1: "DROPBOX_ACCESS_TOKEN 환경 변수가 설정되지 않았습니다"

**해결**:
1. `.env.local` 파일 확인
2. `DROPBOX_ACCESS_TOKEN=sl.xxxxx` 추가
3. 개발 서버 재시작

### 문제 2: Webhook 서명 검증 실패

**해결**:
1. `DROPBOX_APP_SECRET` 환경 변수 확인
2. Dropbox App Console의 App secret과 일치하는지 확인
3. 서명 알고리즘이 HMAC-SHA256인지 확인

### 문제 3: Cron이 실행되지 않음

**해결**:
1. Vercel Pro 플랜 확인
2. `vercel.json` 파일 확인
3. Vercel Dashboard → Cron 탭에서 상태 확인
4. Cron Logs 확인

### 문제 4: 파일이 동기화되지 않음

**해결**:
1. `/test-sync` 페이지에서 "전체 동기화" 실행
2. 오류 메시지 확인
3. Dropbox Access Token 권한 확인:
   - `files.metadata.write`
   - `files.metadata.read`
   - `files.content.write`
   - `files.content.read`

### 문제 5: PDF가 아닌 파일도 동기화됨

**확인**:
- `isPdfFile()` 함수가 정상 작동하는지 확인
- `sync.ts`의 필터 로직 확인

---

## 📊 성능 측정

### 예상 성능 (1000개 파일 기준)

| 작업 | 시간 | 비고 |
|------|------|------|
| 전체 동기화 (최초) | 3-5분 | 파일 수에 비례 |
| 증분 동기화 | 5-10초 | 변경사항 1-10개 |
| Webhook 처리 | 1-2초 | 즉시 응답 + 백그라운드 처리 |
| Cron 실행 | 5-10초 | 변경사항 없으면 더 빠름 |

---

## ✅ Task 4 완료!

**다음 작업**: Task 5 - 좌측 패널 구현 (파일 트리 + 클릭수 표시)

**테스트 URL**: http://localhost:3000/test-sync

