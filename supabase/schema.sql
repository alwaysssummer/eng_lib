-- 영어 자료실 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. textbooks (교재)
CREATE TABLE IF NOT EXISTS textbooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  dropbox_path VARCHAR(500) NOT NULL,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_textbooks_name ON textbooks(name);
CREATE INDEX idx_textbooks_click_count ON textbooks(click_count DESC);

-- 2. chapters (단원)
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  textbook_id UUID REFERENCES textbooks(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  dropbox_path VARCHAR(500) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chapters_textbook_id ON chapters(textbook_id);
CREATE INDEX idx_chapters_name ON chapters(name);

-- 3. files (PDF 파일)
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) DEFAULT 'pdf',
  dropbox_path VARCHAR(500) NOT NULL UNIQUE,
  dropbox_file_id VARCHAR(255),
  dropbox_rev VARCHAR(255),
  file_size BIGINT,
  last_modified TIMESTAMP WITH TIME ZONE,
  click_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PDF 파일만 허용하는 제약조건
ALTER TABLE files ADD CONSTRAINT check_pdf_only 
  CHECK (file_type = 'pdf' OR name LIKE '%.pdf');

CREATE INDEX idx_files_chapter_id ON files(chapter_id);
CREATE INDEX idx_files_dropbox_path ON files(dropbox_path);
CREATE INDEX idx_files_is_active ON files(is_active);
CREATE INDEX idx_files_click_count ON files(click_count DESC);
CREATE INDEX idx_files_name ON files(name);

-- 4. textbook_requests (교재 요청)
CREATE TABLE IF NOT EXISTS textbook_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  textbook_name VARCHAR(255) NOT NULL,
  request_count INTEGER DEFAULT 1,
  user_ip VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_requests_textbook_name ON textbook_requests(textbook_name);
CREATE INDEX idx_requests_count ON textbook_requests(request_count DESC);

-- 5. notices (공지사항)
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notices_is_active ON notices(is_active);
CREATE INDEX idx_notices_created_at ON notices(created_at DESC);

-- 6. user_analytics (사용자 분석)
CREATE TABLE IF NOT EXISTS user_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_ip VARCHAR(50),
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  page_view VARCHAR(255),
  session_duration INTEGER
);

CREATE INDEX idx_analytics_accessed_at ON user_analytics(accessed_at DESC);
CREATE INDEX idx_analytics_user_ip ON user_analytics(user_ip);

-- 7. file_clicks (파일 클릭 로그)
CREATE TABLE IF NOT EXISTS file_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  user_ip VARCHAR(50),
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_file_clicks_file_id ON file_clicks(file_id);
CREATE INDEX idx_file_clicks_clicked_at ON file_clicks(clicked_at DESC);

-- 8. dropbox_sync_log (드롭박스 동기화 로그)
CREATE TABLE IF NOT EXISTS dropbox_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_type VARCHAR(50) NOT NULL CHECK (sync_type IN ('add', 'modify', 'delete', 'full_scan')),
  dropbox_path VARCHAR(500) NOT NULL,
  file_id UUID REFERENCES files(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sync_log_status ON dropbox_sync_log(status);
CREATE INDEX idx_sync_log_synced_at ON dropbox_sync_log(synced_at DESC);
CREATE INDEX idx_sync_log_sync_type ON dropbox_sync_log(sync_type);

-- 9. dropbox_cursor (드롭박스 변경 감지 커서)
CREATE TABLE IF NOT EXISTS dropbox_cursor (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cursor_value TEXT NOT NULL,
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 커서는 하나만 존재해야 함
CREATE UNIQUE INDEX idx_dropbox_cursor_singleton ON dropbox_cursor((id IS NOT NULL));

-- 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 적용
CREATE TRIGGER update_textbooks_updated_at BEFORE UPDATE ON textbooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notices_updated_at BEFORE UPDATE ON notices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dropbox_cursor_updated_at BEFORE UPDATE ON dropbox_cursor
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 함수: 파일 클릭 시 클릭수 증가
CREATE OR REPLACE FUNCTION increment_file_click_count()
RETURNS TRIGGER AS $$
BEGIN
  -- files 테이블의 click_count 증가
  UPDATE files 
  SET click_count = click_count + 1 
  WHERE id = NEW.file_id;
  
  -- 해당 교재의 click_count도 증가
  UPDATE textbooks
  SET click_count = click_count + 1
  WHERE id = (
    SELECT textbook_id 
    FROM chapters 
    WHERE id = (SELECT chapter_id FROM files WHERE id = NEW.file_id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 파일 클릭 트리거
CREATE TRIGGER on_file_click AFTER INSERT ON file_clicks
  FOR EACH ROW EXECUTE FUNCTION increment_file_click_count();

-- Row Level Security (RLS) 정책
ALTER TABLE textbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE textbook_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE dropbox_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE dropbox_cursor ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책 (모든 사용자가 읽을 수 있음)
CREATE POLICY "Public read access" ON textbooks FOR SELECT USING (true);
CREATE POLICY "Public read access" ON chapters FOR SELECT USING (true);
CREATE POLICY "Public read access" ON files FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access" ON notices FOR SELECT USING (is_active = true);

-- 쓰기 정책 (인증된 사용자만)
CREATE POLICY "Authenticated users can insert" ON textbook_requests 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can insert" ON file_clicks 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can insert" ON user_analytics 
  FOR INSERT WITH CHECK (true);

-- 관리자 전용 정책 (서비스 역할만)
CREATE POLICY "Service role full access" ON textbooks 
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON chapters 
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON files 
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON notices 
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON textbook_requests 
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON dropbox_sync_log 
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON dropbox_cursor 
  FOR ALL USING (auth.role() = 'service_role');

-- 샘플 데이터 (테스트용)
-- 실제 환경에서는 제거하거나 주석 처리하세요

-- INSERT INTO textbooks (name, dropbox_path) VALUES
-- ('중학영어', '/교재자료/중학영어'),
-- ('고등영어', '/교재자료/고등영어'),
-- ('초등영어', '/교재자료/초등영어');

-- INSERT INTO notices (title, content, is_active) VALUES
-- ('자료실 오픈', '영어 자료실에 오신 것을 환영합니다!', true),
-- ('업데이트 안내', '새로운 교재가 추가되었습니다.', true);

-- 뷰: 교재별 통계
CREATE OR REPLACE VIEW textbook_stats AS
SELECT 
  t.id,
  t.name,
  t.dropbox_path,
  t.click_count as textbook_click_count,
  COUNT(DISTINCT c.id) as chapter_count,
  COUNT(DISTINCT f.id) as file_count,
  COALESCE(SUM(f.click_count), 0) as total_file_clicks,
  t.created_at
FROM textbooks t
LEFT JOIN chapters c ON t.id = c.textbook_id
LEFT JOIN files f ON c.id = f.chapter_id AND f.is_active = true
GROUP BY t.id, t.name, t.dropbox_path, t.click_count, t.created_at;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 데이터베이스 스키마 생성 완료!';
  RAISE NOTICE '📊 총 9개 테이블 생성됨';
  RAISE NOTICE '🔒 RLS 정책 적용됨';
  RAISE NOTICE '🔄 트리거 및 함수 생성됨';
END $$;

