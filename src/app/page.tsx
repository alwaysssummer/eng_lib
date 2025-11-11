import { FileProvider } from '@/contexts/FileContext';
import LeftSidebar from '@/components/LeftSidebar';
import PDFViewer from '@/components/PDFViewer';
import RightSidebar from '@/components/RightSidebar';

export default function Home() {
  return (
    <FileProvider>
      <div className="flex h-screen overflow-hidden">
        {/* 좌측 패널: 최소 240px, 최대 20% */}
        <aside className="min-w-[240px] w-[20%] max-w-[320px] flex-shrink-0 border-r border-border bg-background">
          <LeftSidebar />
        </aside>

        {/* 중앙 패널: 최소 600px, flex-1로 가변, 최대 60% */}
        <main className="flex-1 min-w-[600px] w-[60%] overflow-auto">
          <PDFViewer />
        </main>

        {/* 우측 패널: 최소 240px, 최대 20% */}
        <aside className="min-w-[240px] w-[20%] max-w-[320px] flex-shrink-0 border-l border-border bg-background">
          <RightSidebar />
        </aside>
      </div>
    </FileProvider>
  );
}
