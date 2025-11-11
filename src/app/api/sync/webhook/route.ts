import { NextResponse } from 'next/server';
import { incrementalSync } from '@/lib/dropbox/sync';
import crypto from 'crypto';

/**
 * Dropbox Webhook 검증 (GET)
 * Dropbox가 웹훅 설정 시 호출하는 엔드포인트
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');

  if (!challenge) {
    return NextResponse.json(
      { error: 'Missing challenge parameter' },
      { status: 400 }
    );
  }

  console.log('[Webhook] Challenge 응답:', challenge);
  
  // Dropbox가 요구하는 대로 challenge를 그대로 반환
  return new NextResponse(challenge, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

/**
 * Dropbox Webhook 수신 (POST)
 * Dropbox에서 변경사항 발생 시 호출됨
 */
export async function POST(request: Request) {
  try {
    // 1. 서명 검증
    const signature = request.headers.get('X-Dropbox-Signature');
    const body = await request.text();

    if (!verifySignature(body, signature)) {
      console.error('[Webhook] 서명 검증 실패');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    // 2. Webhook 페이로드 파싱
    const payload = JSON.parse(body);
    console.log('[Webhook] 변경 알림 수신:', payload);

    // 3. 비동기로 증분 동기화 실행
    // (Dropbox는 빠른 응답을 요구하므로 백그라운드에서 실행)
    incrementalSync().catch((error) => {
      console.error('[Webhook] 증분 동기화 실패:', error);
    });

    // 4. 즉시 200 응답
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Webhook] 처리 오류:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Dropbox 웹훅 서명 검증
 * HMAC-SHA256 사용
 */
function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false;

  const appSecret = process.env.DROPBOX_APP_SECRET;
  if (!appSecret) {
    console.error('[Webhook] DROPBOX_APP_SECRET 환경 변수 없음');
    return false;
  }

  const hmac = crypto.createHmac('sha256', appSecret);
  hmac.update(body);
  const expectedSignature = hmac.digest('hex');

  return signature === expectedSignature;
}

