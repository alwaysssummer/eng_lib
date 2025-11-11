-- textbook_requests 테이블에 status 컬럼 추가

-- 1. status ENUM 타입 생성 (이미 있으면 무시)
DO $$ BEGIN
  CREATE TYPE request_status AS ENUM ('pending', 'in_progress', 'completed', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. status 컬럼 추가 (이미 있으면 무시)
DO $$ BEGIN
  ALTER TABLE textbook_requests 
  ADD COLUMN status request_status DEFAULT 'pending';
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- 3. admin_memo 컬럼 추가 (선택사항)
DO $$ BEGIN
  ALTER TABLE textbook_requests 
  ADD COLUMN admin_memo TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- 4. status 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_textbook_requests_status 
ON textbook_requests(status);

-- 5. 기존 데이터 업데이트 (모두 pending으로)
UPDATE textbook_requests 
SET status = 'pending' 
WHERE status IS NULL;

-- 코멘트 추가
COMMENT ON COLUMN textbook_requests.status IS '요청 상태: pending(대기), in_progress(처리중), completed(완료), rejected(거절)';
COMMENT ON COLUMN textbook_requests.admin_memo IS '관리자 메모';

