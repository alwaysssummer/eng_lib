'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BookOpen, 
  RefreshCw,
  Filter,
  Users
} from 'lucide-react';
import { RequestStatus } from '@/app/api/admin/requests/route';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface TextbookRequest {
  id: string;
  textbook_name: string;
  request_count: number;
  status: RequestStatus;
  admin_memo: string | null;
  created_at: string;
  updated_at: string;
}

type FilterStatus = 'all' | RequestStatus;

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<TextbookRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  
  // 메모 다이얼로그
  const [memoDialogOpen, setMemoDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TextbookRequest | null>(null);
  const [memo, setMemo] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: filterStatus,
        sort: 'request_count',
        order: 'desc',
      });

      const response = await fetch(`/api/admin/requests?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '요청 목록 조회 실패');
      }

      if (data.success && data.requests) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('요청 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const handleStatusChange = async (requestId: string, newStatus: RequestStatus) => {
    try {
      const response = await fetch(`/api/admin/requests`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId, status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '상태 변경 실패');
      }

      // 성공 시 목록 새로고침
      loadRequests();
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  const handleMemoSave = async () => {
    if (!selectedRequest) return;

    try {
      const response = await fetch(`/api/admin/requests`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: selectedRequest.id, 
          adminMemo: memo 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '메모 저장 실패');
      }

      // 성공 시 다이얼로그 닫기 및 목록 새로고침
      setMemoDialogOpen(false);
      setSelectedRequest(null);
      setMemo('');
      loadRequests();
    } catch (error) {
      console.error('메모 저장 실패:', error);
      alert('메모 저장 중 오류가 발생했습니다.');
    }
  };

  const openMemoDialog = (request: TextbookRequest) => {
    setSelectedRequest(request);
    setMemo(request.admin_memo || '');
    setMemoDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeVariant = (status: RequestStatus) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'in_progress': return 'default';
      case 'completed': return 'outline';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: RequestStatus) => {
    switch (status) {
      case 'pending': return '대기';
      case 'in_progress': return '처리중';
      case 'completed': return '완료';
      case 'rejected': return '거절';
      default: return status;
    }
  };

  const statusCounts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">요청 교재 관리</h1>
          <p className="text-muted-foreground">
            사용자 요청 교재를 확인하고 상태를 관리하세요
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadRequests}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* Status Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className={filterStatus === 'all' ? 'border-primary' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              전체
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.all}</div>
          </CardContent>
        </Card>

        <Card className={filterStatus === 'pending' ? 'border-primary' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              대기
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
          </CardContent>
        </Card>

        <Card className={filterStatus === 'in_progress' ? 'border-primary' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              처리중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statusCounts.in_progress}</div>
          </CardContent>
        </Card>

        <Card className={filterStatus === 'completed' ? 'border-primary' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              완료
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.completed}</div>
          </CardContent>
        </Card>

        <Card className={filterStatus === 'rejected' ? 'border-primary' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              거절
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 ({statusCounts.all})</SelectItem>
                <SelectItem value="pending">대기 ({statusCounts.pending})</SelectItem>
                <SelectItem value="in_progress">처리중 ({statusCounts.in_progress})</SelectItem>
                <SelectItem value="completed">완료 ({statusCounts.completed})</SelectItem>
                <SelectItem value="rejected">거절 ({statusCounts.rejected})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            요청 목록 ({requests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              요청이 없습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>교재명</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4" />
                      요청수
                    </div>
                  </TableHead>
                  <TableHead className="text-center">상태</TableHead>
                  <TableHead className="text-center">요청일</TableHead>
                  <TableHead className="text-center">최종 업데이트</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.textbook_name}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {request.request_count}명
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Select
                        value={request.status}
                        onValueChange={(value) => handleStatusChange(request.id, value as RequestStatus)}
                      >
                        <SelectTrigger className="w-[110px] mx-auto">
                          <SelectValue>
                            <Badge variant={getStatusBadgeVariant(request.status)}>
                              {getStatusLabel(request.status)}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">대기</SelectItem>
                          <SelectItem value="in_progress">처리중</SelectItem>
                          <SelectItem value="completed">완료</SelectItem>
                          <SelectItem value="rejected">거절</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {formatDate(request.created_at)}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {formatDate(request.updated_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openMemoDialog(request)}
                      >
                        메모
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Memo Dialog */}
      <Dialog open={memoDialogOpen} onOpenChange={setMemoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>관리자 메모</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRequest && (
              <div className="text-sm">
                <strong>교재:</strong> {selectedRequest.textbook_name}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="memo">메모</Label>
              <Textarea
                id="memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="관리자 메모를 입력하세요..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemoDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleMemoSave}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
