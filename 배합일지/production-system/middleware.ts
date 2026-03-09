import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateSessionFromRequest } from '@/lib/session';

// 인증이 필요한 API 경로
const PROTECTED_API_ROUTES = [
  '/api/products',
  '/api/calculate',
  '/api/save',
  '/api/materials',
  '/api/serial-lot',
  '/api/serial-lot-info',
  '/api/authors',
];

// 인증 없이 접근 가능한 경로
const PUBLIC_ROUTES = ['/api/auth-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 공개 경로는 통과
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 보호된 API 경로 확인
  const isProtectedApi = PROTECTED_API_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedApi) {
    const isValidSession = validateSessionFromRequest(request);

    if (!isValidSession) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
  }

  // 보안 헤더 추가
  const response = NextResponse.next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
