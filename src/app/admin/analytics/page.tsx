'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Calendar,
  RefreshCw,
  BarChart3,
  Clock
} from 'lucide-react';

interface AnalyticsData {
  period: string;
  stats: {
    totalClicks: number;
    avgDailyClicks: number;
    daysTracked: number;
  };
  hourlyStats: Array<{ hour: string; count: number }>;
  dailyStats: Array<{ date: string; count: number }>;
  weekdayStats: Array<{ day: string; count: number }>;
  topFiles: Array<{
    id: string;
    name: string;
    clickCount: number;
    chapterName: string;
    textbookName: string;
  }>;
}

type Period = 'today' | 'week' | 'month';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('month');

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?period=${period}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '분석 데이터 조회 실패');
      }

      if (result.success) {
        setData(result);
      }
    } catch (error) {
      console.error('분석 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const getPeriodLabel = (p: Period) => {
    switch (p) {
      case 'today': return '오늘';
      case 'week': return '최근 7일';
      case 'month': return '최근 30일';
      default: return p;
    }
  };

  // 요일별 차트 색상
  const WEEKDAY_COLORS = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">상세 분석</h1>
          <p className="text-muted-foreground">
            사용자 행동 분석 및 통계
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">오늘</SelectItem>
              <SelectItem value="week">최근 7일</SelectItem>
              <SelectItem value="month">최근 30일</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAnalytics}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <>
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
                <p className="text-xs text-muted-foreground mt-1">
                  {getPeriodLabel(period)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  일평균 클릭수
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.stats.avgDailyClicks.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.stats.daysTracked}일 추적
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  활성 교재
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.topFiles.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  클릭된 파일 수
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 시간대별 클릭 추이 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                시간대별 클릭 추이 (0~23시)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.hourlyStats.every(h => h.count === 0) ? (
                <div className="text-center py-12 text-muted-foreground">
                  해당 기간에 클릭 데이터가 없습니다.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.hourlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="클릭수"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* 요일별 통계 */}
          <Card>
            <CardHeader>
              <CardTitle>요일별 클릭 통계</CardTitle>
            </CardHeader>
            <CardContent>
              {data.weekdayStats.every(d => d.count === 0) ? (
                <div className="text-center py-12 text-muted-foreground">
                  해당 기간에 클릭 데이터가 없습니다.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.weekdayStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="클릭수">
                      {data.weekdayStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={WEEKDAY_COLORS[index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* 일별 클릭 추이 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                일별 클릭 추이
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.dailyStats.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  해당 기간에 클릭 데이터가 없습니다.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('ko-KR');
                      }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#22c55e" name="클릭수" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* 인기 파일 TOP 20 */}
          <Card>
            <CardHeader>
              <CardTitle>인기 파일 TOP 20</CardTitle>
            </CardHeader>
            <CardContent>
              {data.topFiles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  클릭된 파일이 없습니다.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">순위</TableHead>
                      <TableHead>파일명</TableHead>
                      <TableHead>챕터</TableHead>
                      <TableHead>교재</TableHead>
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
                        <TableCell className="text-sm text-muted-foreground">
                          {file.textbookName}
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
        </>
      )}
    </div>
  );
}
