-- 기존 테이블이 있다면 삭제 (개발 중에만 사용)
DROP TABLE IF EXISTS notices CASCADE;

-- notices 테이블 생성
CREATE TABLE notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_notices_is_active ON notices(is_active);
CREATE INDEX idx_notices_created_at ON notices(created_at DESC);

-- updated_at 자동 갱신 함수 생성 (이미 있다면 무시)
CREATE OR REPLACE FUNCTION update_notices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 갱신 트리거
CREATE TRIGGER trigger_update_notices_updated_at
  BEFORE UPDATE ON notices
  FOR EACH ROW
  EXECUTE FUNCTION update_notices_updated_at();

-- RLS 활성화
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 사용자가 활성 공지사항 읽기 가능
CREATE POLICY "Public read access for active notices"
  ON notices
  FOR SELECT
  USING (is_active = true);

-- RLS 정책: 서비스 역할은 모든 공지사항 관리 가능 (관리자 페이지)
CREATE POLICY "Service role full access for notices"
  ON notices
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 코멘트 추가
COMMENT ON TABLE notices IS '사용자에게 표시될 공지사항';
COMMENT ON COLUMN notices.id IS '고유 ID';
COMMENT ON COLUMN notices.title IS '공지사항 제목';
COMMENT ON COLUMN notices.content IS '공지사항 내용';
COMMENT ON COLUMN notices.is_active IS '활성 상태 (true: 메인 페이지에 표시)';
COMMENT ON COLUMN notices.created_at IS '생성 시간';
COMMENT ON COLUMN notices.updated_at IS '마지막 수정 시간';

-- 샘플 데이터 삽입 (선택사항)
INSERT INTO notices (title, content, is_active) VALUES
('🎉 영어 자료실 오픈!', '무료로 다양한 영어 학습 자료를 이용하실 수 있습니다.', true),
('📚 신규 교재 업데이트', '최신 교재가 추가되었습니다. 좌측 메뉴에서 확인해보세요!', true);

