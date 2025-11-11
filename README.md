# 영어 자료실 (English Library)

드롭박스 기반 영어 교재 PDF 자료실 프로젝트

## 🚀 기술 스택

- **Frontend**: Next.js 15 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Storage**: Dropbox API
- **Deployment**: Vercel
- **Language**: TypeScript

## 📦 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm build

# 프로덕션 실행
npm start
```

## 🔧 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Dropbox
DROPBOX_ACCESS_TOKEN=your_dropbox_access_token
DROPBOX_ROOT_PATH=/교재자료
DROPBOX_WEBHOOK_SECRET=your_webhook_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📁 프로젝트 구조

```
eng-lib/
├── src/
│   ├── app/                # Next.js App Router
│   ├── components/         # React 컴포넌트
│   ├── lib/               # 유틸리티 라이브러리
│   ├── hooks/             # Custom Hooks
│   └── types/             # TypeScript 타입 정의
├── docs/                  # 프로젝트 문서
└── public/               # 정적 파일
```

## 🔥 핵심 기능

- ✅ 로컬-드롭박스 실시간 동기화
- ✅ PDF 파일만 필터링
- ✅ 교재별/파일별 클릭수 표시
- ✅ 클릭수 기반 정렬
- ✅ 실시간 업데이트 (Supabase Realtime)
- ✅ PDF 미리보기
- ✅ 교재 요청 시스템
- ✅ 관리자 대시보드

## 📚 문서

- [전체 기획서](docs/전체기획서.md)
- [개발 계획서](docs/개발계획서.md)
- [좌측 패널 UI 설계](docs/좌측패널_UI_설계.md)

## 🎯 개발 로드맵

### Phase 1: 기본 셋팅 ✅
- [x] 프로젝트 초기화
- [ ] Supabase 설정
- [ ] shadcn/ui 설정
- [ ] Dropbox API 연동

### Phase 2: 핵심 기능
- [ ] 파일 트리 구현
- [ ] PDF 뷰어
- [ ] 클릭 추적

### Phase 3: 관리자 기능
- [ ] 관리자 인증
- [ ] 통계 대시보드

### Phase 4: 배포
- [ ] Vercel 배포

## 👨‍💻 개발자

프로젝트 문의: [작성 중]

## 📄 라이선스

[작성 중]

