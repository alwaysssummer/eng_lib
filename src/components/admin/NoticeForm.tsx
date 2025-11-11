'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
}

interface NoticeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notice?: Notice | null;
  onSuccess?: () => void;
}

export default function NoticeForm({
  open,
  onOpenChange,
  notice,
  onSuccess,
}: NoticeFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 수정 모드일 때 데이터 로드
  useEffect(() => {
    if (notice) {
      setTitle(notice.title);
      setContent(notice.content);
      setIsActive(notice.is_active);
    } else {
      setTitle('');
      setContent('');
      setIsActive(true);
    }
    setError('');
  }, [notice, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (title.trim().length < 2) {
      setError('제목은 최소 2자 이상 입력해주세요.');
      return;
    }

    if (content.trim().length < 5) {
      setError('내용은 최소 5자 이상 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = '/api/notices';
      const method = notice ? 'PUT' : 'POST';
      const body: any = {
        title: title.trim(),
        content: content.trim(),
        isActive,
      };

      if (notice) {
        body.id = notice.id;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '처리 중 오류가 발생했습니다.');
        return;
      }

      // 성공
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      console.error('공지사항 처리 실패:', err);
      setError('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {notice ? '공지사항 수정' : '새 공지사항 작성'}
          </DialogTitle>
          <DialogDescription>
            사용자에게 표시될 공지사항을 {notice ? '수정' : '작성'}합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                placeholder="공지사항 제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="content">내용</Label>
              <Textarea
                id="content"
                placeholder="공지사항 내용을 입력하세요"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={loading}
                rows={6}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked as boolean)}
                disabled={loading}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                활성화 (메인 페이지에 즉시 표시)
              </Label>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  처리 중...
                </>
              ) : (
                notice ? '수정' : '작성'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

