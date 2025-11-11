// 데이터베이스 타입 정의

export interface Textbook {
  id: string;
  name: string;
  dropbox_path: string;
  click_count: number;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  textbook_id: string;
  name: string;
  dropbox_path: string;
  created_at: string;
}

export interface File {
  id: string;
  chapter_id: string;
  name: string;
  file_type: string;
  dropbox_path: string;
  dropbox_file_id?: string;
  dropbox_rev?: string;
  file_size?: number;
  last_modified?: string;
  click_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TextbookRequest {
  id: string;
  textbook_name: string;
  request_count: number;
  user_ip?: string;
  created_at: string;
}

export interface Notice {
  id: string;
  title: string;
  content?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAnalytics {
  id: string;
  user_ip?: string;
  accessed_at: string;
  page_view?: string;
  session_duration?: number;
}

export interface FileClick {
  id: string;
  file_id: string;
  user_ip?: string;
  clicked_at: string;
}

export interface DropboxSyncLog {
  id: string;
  sync_type: 'add' | 'modify' | 'delete' | 'full_scan';
  dropbox_path: string;
  file_id?: string;
  status: 'pending' | 'success' | 'failed';
  error_message?: string;
  synced_at: string;
}

export interface DropboxCursor {
  id: string;
  cursor_value: string;
  last_checked: string;
  updated_at: string;
}

// 확장된 타입 (조인 포함)
export interface TextbookWithStats extends Textbook {
  totalClicks: number;
  chapters: ChapterWithFiles[];
}

export interface ChapterWithFiles extends Chapter {
  files: File[];
}

export interface FileTreeNode {
  id: string;
  name: string;
  type: 'textbook' | 'chapter' | 'file';
  path: string;
  clickCount?: number;
  children?: FileTreeNode[];
  isExpanded?: boolean;
}

// API 응답 타입
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// 정렬 옵션
export type SortMode = 'name' | 'clicks';

// Dropbox 관련 타입
export interface DropboxFileMetadata {
  '.tag': 'file' | 'folder' | 'deleted';
  id: string;
  name: string;
  path_lower: string;
  path_display: string;
  rev?: string;
  size?: number;
  server_modified?: string;
  client_modified?: string;
}

