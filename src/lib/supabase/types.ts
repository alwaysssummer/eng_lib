// Supabase 관련 타입 정의

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      textbooks: {
        Row: {
          id: string;
          name: string;
          dropbox_path: string;
          click_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          dropbox_path: string;
          click_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          dropbox_path?: string;
          click_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      chapters: {
        Row: {
          id: string;
          textbook_id: string;
          name: string;
          dropbox_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          textbook_id: string;
          name: string;
          dropbox_path: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          textbook_id?: string;
          name?: string;
          dropbox_path?: string;
          created_at?: string;
        };
      };
      files: {
        Row: {
          id: string;
          chapter_id: string;
          name: string;
          file_type: string;
          dropbox_path: string;
          dropbox_file_id: string | null;
          dropbox_rev: string | null;
          file_size: number | null;
          last_modified: string | null;
          click_count: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          chapter_id: string;
          name: string;
          file_type?: string;
          dropbox_path: string;
          dropbox_file_id?: string | null;
          dropbox_rev?: string | null;
          file_size?: number | null;
          last_modified?: string | null;
          click_count?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          chapter_id?: string;
          name?: string;
          file_type?: string;
          dropbox_path?: string;
          dropbox_file_id?: string | null;
          dropbox_rev?: string | null;
          file_size?: number | null;
          last_modified?: string | null;
          click_count?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      textbook_requests: {
        Row: {
          id: string;
          textbook_name: string;
          request_count: number;
          user_ip: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          textbook_name: string;
          request_count?: number;
          user_ip?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          textbook_name?: string;
          request_count?: number;
          user_ip?: string | null;
          created_at?: string;
        };
      };
      notices: {
        Row: {
          id: string;
          title: string;
          content: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_analytics: {
        Row: {
          id: string;
          user_ip: string | null;
          accessed_at: string;
          page_view: string | null;
          session_duration: number | null;
        };
        Insert: {
          id?: string;
          user_ip?: string | null;
          accessed_at?: string;
          page_view?: string | null;
          session_duration?: number | null;
        };
        Update: {
          id?: string;
          user_ip?: string | null;
          accessed_at?: string;
          page_view?: string | null;
          session_duration?: number | null;
        };
      };
      file_clicks: {
        Row: {
          id: string;
          file_id: string;
          user_ip: string | null;
          clicked_at: string;
        };
        Insert: {
          id?: string;
          file_id: string;
          user_ip?: string | null;
          clicked_at?: string;
        };
        Update: {
          id?: string;
          file_id?: string;
          user_ip?: string | null;
          clicked_at?: string;
        };
      };
      dropbox_sync_log: {
        Row: {
          id: string;
          sync_type: 'add' | 'modify' | 'delete' | 'full_scan';
          dropbox_path: string;
          file_id: string | null;
          status: 'pending' | 'success' | 'failed';
          error_message: string | null;
          synced_at: string;
        };
        Insert: {
          id?: string;
          sync_type: 'add' | 'modify' | 'delete' | 'full_scan';
          dropbox_path: string;
          file_id?: string | null;
          status?: 'pending' | 'success' | 'failed';
          error_message?: string | null;
          synced_at?: string;
        };
        Update: {
          id?: string;
          sync_type?: 'add' | 'modify' | 'delete' | 'full_scan';
          dropbox_path?: string;
          file_id?: string | null;
          status?: 'pending' | 'success' | 'failed';
          error_message?: string | null;
          synced_at?: string;
        };
      };
      dropbox_cursor: {
        Row: {
          id: string;
          cursor_value: string;
          last_checked: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cursor_value: string;
          last_checked?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cursor_value?: string;
          last_checked?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      textbook_stats: {
        Row: {
          id: string;
          name: string;
          dropbox_path: string;
          textbook_click_count: number;
          chapter_count: number;
          file_count: number;
          total_file_clicks: number;
          created_at: string;
        };
      };
    };
    Functions: {
      increment_file_click_count: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
  };
}

