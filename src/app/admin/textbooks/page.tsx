'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  BookOpen, 
  Search, 
  ArrowUpDown, 
  Eye,
  RefreshCw 
} from 'lucide-react';
import Link from 'next/link';

interface Textbook {
  id: string;
  name: string;
  dropbox_path: string;
  created_at: string;
  totalClicks: number;
  fileCount: number;
  chapterCount: number;
}

type SortField = 'name' | 'clicks' | 'files' | 'created_at';
type SortOrder = 'asc' | 'desc';

export default function AdminTextbooksPage() {
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const loadTextbooks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sort: sortField,
        order: sortOrder,
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/textbooks?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '교재 목록 조회 실패');
      }

      if (data.success && data.textbooks) {
        setTextbooks(data.textbooks);
      }
    } catch (error) {
      console.error('교재 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTextbooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // 같은 필드 클릭 시 order 토글
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // 다른 필드 클릭 시 해당 필드로 변경하고 asc
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadTextbooks();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-muted-foreground" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUpDown className="h-4 w-4 ml-1 text-primary" />
      : <ArrowUpDown className="h-4 w-4 ml-1 text-primary rotate-180" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">교재 관리</h1>
          <p className="text-muted-foreground">
            교재별 통계 및 상세 정보를 확인하세요
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadTextbooks}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="교재명 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading}>
              검색
            </Button>
            {search && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setTimeout(loadTextbooks, 0);
                }}
              >
                초기화
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Textbooks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            교재 목록 ({textbooks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : textbooks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {search ? '검색 결과가 없습니다.' : '등록된 교재가 없습니다.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      교재명
                      {getSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-center"
                    onClick={() => handleSort('clicks')}
                  >
                    <div className="flex items-center justify-center">
                      총 클릭수
                      {getSortIcon('clicks')}
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    챕터/파일
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-center"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center justify-center">
                      등록일
                      {getSortIcon('created_at')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {textbooks.map((textbook) => (
                  <TableRow key={textbook.id}>
                    <TableCell className="font-medium">
                      {textbook.name}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={textbook.totalClicks > 0 ? 'default' : 'secondary'}>
                        {textbook.totalClicks.toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {textbook.chapterCount}개 / {textbook.fileCount}개
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {formatDate(textbook.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/textbooks/${textbook.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          상세보기
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
