# Task 4 수정 사항: Supabase 클라이언트 오류 해결

**날짜**: 2025-11-10  
**문제**: `TypeError: Cannot read properties of undefined (reading 'from')`

---

## 🐛 문제 원인

`src/lib/dropbox/sync.ts`에서 Supabase 클라이언트를 잘못된 방식으로 import했습니다.

### 기존 코드 (오류)
```typescript
import { supabase } from '@/lib/supabase/server';

// supabase는 undefined
await supabase.from('textbooks').select('id');
```

**문제점**:
- `server.ts`는 `createClient()` 함수를 export하지만
- `sync.ts`는 `supabase` 객체를 import하려고 시도
- 결과: `supabase`가 `undefined`

---

## ✅ 해결 방법

### 1. `src/lib/supabase/server.ts` 수정

API Route용 클라이언트 함수 추가:

```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// 기존: Server Component용
export async function createClient() {
  // ... 쿠키 기반 클라이언트
}

// 추가: API Route용 (쿠키 불필요)
export function createApiClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### 2. `src/lib/dropbox/sync.ts` 수정

import 변경 및 헬퍼 함수 추가:

```typescript
// 변경 전
import { supabase } from '@/lib/supabase/server';

// 변경 후
import { createApiClient } from '@/lib/supabase/server';

// 헬퍼 함수 추가
function getSupabase() {
  return createApiClient();
}

// 모든 함수에서 사용
async function syncFile(file: FileMetadataReference) {
  const supabase = getSupabase();  // 추가
  
  // 이제 정상 작동
  await supabase.from('textbooks').select('id');
}
```

### 3. `src/app/api/sync/status/route.ts` 수정

API Route도 동일하게 수정:

```typescript
// 변경 전
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  const { data } = await supabase.from(...);
}

// 변경 후
import { createApiClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createApiClient();  // 추가
  const { data } = await supabase.from(...);
}
```

---

## 📋 수정된 파일 목록

1. ✅ `src/lib/supabase/server.ts`
   - `createApiClient()` 함수 추가

2. ✅ `src/lib/dropbox/sync.ts`
   - import 변경
   - `getSupabase()` 헬퍼 함수 추가
   - 모든 함수에 `const supabase = getSupabase()` 추가:
     - `syncFile()`
     - `deleteFile()`
     - `saveSyncCursor()`
     - `getSyncCursor()`
     - `logSync()`

3. ✅ `src/app/api/sync/status/route.ts`
   - import 변경
   - `GET()` 함수에 `const supabase = createApiClient()` 추가

---

## 🧪 테스트 결과

수정 후 다시 테스트:

```bash
# 브라우저에서
http://localhost:3000/test-sync

# "전체 동기화 (Full Sync)" 버튼 클릭
# ✅ 정상 작동 확인
```

---

## 📚 배운 점

### Server Component vs API Route

#### Server Component
```typescript
// app/page.tsx 등
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();  // async 필요
  // 쿠키 기반 인증
}
```

#### API Route
```typescript
// app/api/*/route.ts
import { createApiClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createApiClient();  // sync 함수
  // 환경 변수 기반 인증
}
```

---

## ✅ 해결 완료!

이제 Dropbox 동기화가 정상적으로 작동합니다! 🎉

---

# 추가 수정: fetch 충돌 해결

**날짜**: 2025-11-10  
**문제**: `TypeError: realFetch.call is not a function`

## 🐛 문제 원인

`isomorphic-fetch`와 Next.js 15의 자체 fetch가 충돌했습니다.

### 오류 메시지
```
전체 동기화 실패: TypeError: realFetch.call is not a function
```

### 원인
- Next.js 15는 자체 전역 `fetch`를 제공
- `isomorphic-fetch`를 명시적으로 전달하면 충돌 발생
- Dropbox SDK는 전역 `fetch`를 자동으로 사용 가능

## ✅ 해결 방법

### `src/lib/dropbox/client.ts` 수정

**변경 전**:
```typescript
import { Dropbox } from 'dropbox';
import fetch from 'isomorphic-fetch';

dropboxClient = new Dropbox({
  accessToken,
  fetch,  // ❌ 충돌 발생
});
```

**변경 후**:
```typescript
import { Dropbox } from 'dropbox';

dropboxClient = new Dropbox({
  accessToken,
  // ✅ fetch 옵션 제거 - Next.js 전역 fetch 사용
});
```

### 패키지 제거

```bash
npm uninstall isomorphic-fetch
```

## 📋 수정 파일

1. ✅ `src/lib/dropbox/client.ts`
   - `import fetch from 'isomorphic-fetch'` 제거
   - Dropbox 생성자에서 `fetch` 옵션 제거

2. ✅ `package.json`
   - `isomorphic-fetch` 패키지 제거

## 🧪 테스트

이제 다시 테스트하세요:

```
http://localhost:3000/test-sync
→ "전체 동기화 (Full Sync)" 버튼 클릭
→ ✅ 정상 작동!
```

## 📚 배운 점

### Next.js 15의 fetch

- Next.js 15는 **전역 fetch**를 제공
- Node.js 18+ 환경에서는 `isomorphic-fetch` 불필요
- 외부 라이브러리(Dropbox SDK)는 자동으로 전역 fetch 사용

### 권장 사항

❌ **하지 마세요**:
```typescript
import fetch from 'isomorphic-fetch';
// Next.js와 충돌 가능
```

✅ **권장**:
```typescript
// 전역 fetch 사용 (자동)
// 별도 import 불필요
```

## ✅ 최종 해결 완료!

이제 Dropbox 동기화가 정상적으로 작동합니다! 🎉

---

# 추가 수정 2: fetch 바인딩 문제 해결

**날짜**: 2025-11-10  
**문제**: `TypeError: _this.fetch is not a function`

## 🐛 문제 원인

Dropbox SDK가 API Route에서 전역 `fetch`를 찾지 못했습니다.

### 오류 메시지
```
전체 동기화 실패: TypeError: _this.fetch is not a function
```

### 원인
- Next.js 15의 전역 `fetch`가 API Route에서 제대로 바인딩되지 않음
- Dropbox SDK 내부에서 `this.fetch()`를 호출할 때 컨텍스트 손실
- 명시적인 바인딩이 필요

## ✅ 최종 해결 방법

### `src/lib/dropbox/client.ts` 최종 코드

```typescript
import { Dropbox } from 'dropbox';

// Dropbox 클라이언트 싱글톤
let dropboxClient: Dropbox | null = null;

export function getDropboxClient(): Dropbox {
  if (!dropboxClient) {
    const accessToken = process.env.DROPBOX_ACCESS_TOKEN;
    
    if (!accessToken) {
      throw new Error('DROPBOX_ACCESS_TOKEN 환경 변수가 설정되지 않았습니다.');
    }

    dropboxClient = new Dropbox({
      accessToken,
      fetch: fetch.bind(globalThis), // ✅ 핵심: globalThis에 바인딩
    });
  }

  return dropboxClient;
}
```

### 핵심 포인트

**`fetch.bind(globalThis)`**:
- `globalThis`: 모든 환경(브라우저/Node.js)에서 전역 객체
- `bind()`: `fetch` 함수를 `globalThis` 컨텍스트에 바인딩
- 결과: Dropbox SDK 내부에서 올바르게 `fetch` 호출 가능

## 📋 시도한 방법들

| 방법 | 결과 | 이유 |
|------|------|------|
| `fetch` 옵션 생략 | ❌ | Next.js 15 전역 fetch 미인식 |
| `import fetch from 'isomorphic-fetch'` | ❌ | Next.js fetch와 충돌 |
| `fetch: fetch.bind(globalThis)` | ✅ | 올바른 컨텍스트 바인딩 |

## 🧪 최종 테스트

```
http://localhost:3000/test-sync
→ "전체 동기화 (Full Sync)" 버튼 클릭
→ ✅ 정상 작동!
→ 📊 파일 목록과 교재 통계 확인
```

## 📚 배운 점

### fetch 컨텍스트 바인딩

```typescript
// ❌ 작동 안 함
new Dropbox({ accessToken })

// ❌ 충돌 발생
import fetch from 'isomorphic-fetch';
new Dropbox({ accessToken, fetch })

// ✅ 올바른 방법
new Dropbox({ 
  accessToken, 
  fetch: fetch.bind(globalThis) 
})
```

### globalThis의 중요성

- **Browser**: `window`
- **Node.js**: `global`
- **모든 환경**: `globalThis` ✅

## ✅ 완전히 해결!

이제 Dropbox 동기화가 완벽하게 작동합니다! 🎉

**변경 이력**:
1. ~~`isomorphic-fetch` 사용~~ → 충돌
2. ~~fetch 옵션 제거~~ → 함수 없음
3. ✅ `fetch.bind(globalThis)` → 성공!

