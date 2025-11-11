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
  ArrowLeft, 
  BookOpen, 
  FileText, 
  TrendingUp,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface TextbookDetail {
  textbook: {
    id: string;
    name: string;
    dropbox_path: string;
    created_at: string;
  };
  stats: {
    totalClicks: number;
    fileCount: number;
    chapterCount: number;
  };
  chapters: Array<{
    id: string;
    name: string;
    order_index: number;
    fileCount: number;
    totalClicks: number;
  }>;
  topFiles: Array<{
    id: string;
    name: string;
    chapterName: string;
    clickCount: number;
    createdAt: string;
  }>;
  dailyClicks: Array<{
    date: string;
    count: number;
  }>;
}

export default function TextbookDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [data, setData] = useState<TextbookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTextbookDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/textbooks/${id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '교재 상세 조회 실패');
      }

      if (result.success) {
        setData(result);
      }
    } catch (err) {
      console.error('교재 상세 로딩 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadTextbookDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <Link href="/admin/textbooks">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로가기
          </Button>
        </Link>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-destructive">
              {error || '교재를 찾을 수 없습니다.'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/textbooks">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              뒤로가기
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{data.textbook.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              등록일: {formatDate(data.textbook.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              총 클릭수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.stats.totalClicks.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              챕터 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.stats.chapterCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              파일 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.stats.fileCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 챕터별 통계 */}
      <Card>
        <CardHeader>
          <CardTitle>챕터별 통계</CardTitle>
        </CardHeader>
        <CardContent>
          {data.chapters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              챕터가 없습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>순서</TableHead>
                  <TableHead>챕터명</TableHead>
                  <TableHead className="text-center">파일 수</TableHead>
                  <TableHead className="text-center">클릭수</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.chapters.map((chapter) => (
                  <TableRow key={chapter.id}>
                    <TableCell className="font-mono text-sm">
                      {chapter.order_index}
                    </TableCell>
                    <TableCell className="font-medium">
                      {chapter.name}
                    </TableCell>
                    <TableCell className="text-center">
                      {chapter.fileCount}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={chapter.totalClicks > 0 ? 'default' : 'secondary'}>
                        {chapter.totalClicks}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 인기 파일 TOP 10 */}
      <Card>
        <CardHeader>
          <CardTitle>인기 파일 TOP 10</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              클릭된 파일이 없습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">순위</TableHead>
                  <TableHead>파일명</TableHead>
                  <TableHead>챕터</TableHead>
                  <TableHead className="text-right">클릭수</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topFiles.map((file, index) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-bold">
                      <div className={`
                        flex items-center justify-center w-8 h-8 rounded-full text-sm
                        ${index === 0 ? 'bg-yellow-500 text-white' : ''}
                        ${index === 1 ? 'bg-gray-400 text-white' : ''}
                        ${index === 2 ? 'bg-orange-600 text-white' : ''}
                        ${index > 2 ? 'bg-muted text-muted-foreground' : ''}
                      `}>
                        {index + 1}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {file.name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {file.chapterName}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="default">
                        {file.clickCount.toLocaleString()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 최근 30일 클릭 추이 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            최근 30일 클릭 추이
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.dailyClicks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              최근 30일 클릭 데이터가 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                총 {data.dailyClicks.reduce((sum, d) => sum + d.count, 0).toLocaleString()}회 클릭
              </p>
              <div className="text-xs text-muted-foreground">
                {data.dailyClicks.slice(0, 10).map((day) => (
                  <div key={day.date} className="flex justify-between py-1 border-b">
                    <span>{day.date}</span>
                    <span className="font-semibold">{day.count}회</span>
                  </div>
                ))}
              </div>
              {data.dailyClicks.length > 10 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  ... 외 {data.dailyClicks.length - 10}일
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

