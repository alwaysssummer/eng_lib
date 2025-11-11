'use client';

import { useState } from 'react';
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
import { BookPlus, Loader2 } from 'lucide-react';

interface RequestTextbookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTextbookName?: string;
  onSuccess?: () => void;
}

export default function RequestTextbookDialog({
  open,
  onOpenChange,
  initialTextbookName = '',
  onSuccess,
}: RequestTextbookDialogProps) {
  const [textbookName, setTextbookName] = useState(initialTextbookName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // 다이얼로그 열릴 때마다 초기화
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setTextbookName(initialTextbookName);
      setError('');
      setSuccess(false);
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (textbookName.trim().length < 2) {
      setError('교재명은 최소 2자 이상 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          textbookName: textbookName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError(data.error || '이미 요청하신 교재입니다.');
        } else {
          setError(data.error || '요청 처리 중 오류가 발생했습니다.');
        }
        return;
      }

      // 성공
      setSuccess(true);
      setTextbookName('');
      
      // 1초 후 다이얼로그 닫기
      setTimeout(() => {
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);

    } catch (err) {
      console.error('교재 요청 실패:', err);
      setError('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookPlus className="w-5 h-5" />
            교재 요청하기
          </DialogTitle>
          <DialogDescription>
            원하시는 교재가 없으신가요? 교재명을 입력하시면 검토 후 추가해드립니다.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="mb-4 text-4xl">✅</div>
            <p className="text-lg font-medium mb-2">요청이 접수되었습니다!</p>
            <p className="text-sm text-muted-foreground">
              검토 후 빠른 시일 내에 추가하겠습니다.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="textbook-name">교재명</Label>
                <Input
                  id="textbook-name"
                  placeholder="예: 능률 영어 1-1"
                  value={textbookName}
                  onChange={(e) => setTextbookName(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• 교재명을 정확히 입력해주세요.</p>
                <p>• 동일한 교재는 24시간에 1회만 요청 가능합니다.</p>
                <p>• 요청이 많은 교재 순으로 우선 제작됩니다.</p>
              </div>
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
                    요청 중...
                  </>
                ) : (
                  '요청하기'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

