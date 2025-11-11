'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import NoticeForm from '@/components/admin/NoticeForm';

interface Notice {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

  const loadNotices = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notices?active=false'); // 모든 공지 조회
      const data = await response.json();

      if (data.success) {
        setNotices(data.notices || []);
      }
    } catch (error) {
      console.error('공지사항 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handleCreate = () => {
    setEditingNotice(null);
    setFormOpen(true);
  };

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/notices?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await loadNotices();
      } else {
        alert(data.error || '삭제 실패');
      }
    } catch (error) {
      console.error('공지 삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleToggleActive = async (notice: Notice) => {
    try {
      const response = await fetch('/api/notices', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: notice.id,
          isActive: !notice.is_active,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await loadNotices();
      } else {
        alert(data.error || '수정 실패');
      }
    } catch (error) {
      console.error('공지 수정 실패:', error);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">공지사항 관리</h1>
          <p className="text-muted-foreground">
            사용자에게 표시될 공지사항을 관리합니다
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadNotices}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            새 공지 작성
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>공지사항 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              로딩 중...
            </div>
          ) : notices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              공지사항이 없습니다. 새 공지를 작성해보세요.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">상태</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead className="w-[180px]">작성일</TableHead>
                  <TableHead className="w-[180px]">수정일</TableHead>
                  <TableHead className="w-[150px] text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notices.map((notice) => (
                  <TableRow key={notice.id}>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(notice)}
                      >
                        <Badge variant={notice.is_active ? 'default' : 'secondary'}>
                          {notice.is_active ? '활성' : '비활성'}
                        </Badge>
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">
                      {notice.title}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(notice.created_at)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(notice.updated_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(notice)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(notice.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <NoticeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        notice={editingNotice}
        onSuccess={loadNotices}
      />
    </div>
  );
}
