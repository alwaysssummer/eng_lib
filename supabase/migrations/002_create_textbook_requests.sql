-- 기존 테이블이 있다면 삭제 (개발 중에만 사용)
DROP TABLE IF EXISTS textbook_requests CASCADE;

-- textbook_requests 테이블 생성
CREATE TABLE textbook_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  textbook_name VARCHAR(255) NOT NULL,
  request_count INTEGER DEFAULT 1,
  user_ip VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_textbook_requests_name ON textbook_requests(textbook_name);
CREATE INDEX idx_textbook_requests_count ON textbook_requests(request_count DESC);
CREATE INDEX idx_textbook_requests_created_at ON textbook_requests(created_at DESC);

-- updated_at 자동 갱신 함수 생성
CREATE OR REPLACE FUNCTION update_textbook_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 갱신 트리거
CREATE TRIGGER trigger_update_textbook_requests_updated_at
  BEFORE UPDATE ON textbook_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_textbook_requests_updated_at();

-- RLS 활성화
ALTER TABLE textbook_requests ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 사용자가 읽기 가능
CREATE POLICY "Public read access for textbook requests"
  ON textbook_requests
  FOR SELECT
  USING (true);

-- RLS 정책: 모든 사용자가 요청 생성 가능
CREATE POLICY "Public insert access for textbook requests"
  ON textbook_requests
  FOR INSERT
  WITH CHECK (true);

-- RLS 정책: 서비스 역할만 업데이트 가능
CREATE POLICY "Service role update access for textbook requests"
  ON textbook_requests
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 코멘트 추가
COMMENT ON TABLE textbook_requests IS '사용자가 요청한 교재 목록';
COMMENT ON COLUMN textbook_requests.id IS '고유 ID';
COMMENT ON COLUMN textbook_requests.textbook_name IS '요청한 교재명';
COMMENT ON COLUMN textbook_requests.request_count IS '요청 횟수 (중복 요청 시 증가)';
COMMENT ON COLUMN textbook_requests.user_ip IS '요청자 IP (익명화)';
COMMENT ON COLUMN textbook_requests.created_at IS '최초 요청 시간';
COMMENT ON COLUMN textbook_requests.updated_at IS '마지막 업데이트 시간';

