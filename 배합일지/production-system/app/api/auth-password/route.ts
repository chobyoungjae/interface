import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { createSession } from '@/lib/session';

// Rate limiting을 위한 간단한 메모리 저장소
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15분

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return ip;
}

function checkRateLimit(ip: string): { allowed: boolean; remainingTime?: number } {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);

  if (!attempt) {
    return { allowed: true };
  }

  // 잠금 시간이 지났으면 초기화
  if (now - attempt.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  // 최대 시도 횟수 초과
  if (attempt.count >= MAX_ATTEMPTS) {
    const remainingTime = Math.ceil((LOCKOUT_DURATION - (now - attempt.lastAttempt)) / 1000 / 60);
    return { allowed: false, remainingTime };
  }

  return { allowed: true };
}

function recordLoginAttempt(ip: string, success: boolean): void {
  if (success) {
    loginAttempts.delete(ip);
    return;
  }

  const now = Date.now();
  const attempt = loginAttempts.get(ip);

  if (!attempt || now - attempt.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
  } else {
    loginAttempts.set(ip, { count: attempt.count + 1, lastAttempt: now });
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);

    // Rate limit 확인
    const rateLimit = checkRateLimit(clientIp);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many attempts. Please try again in ${rateLimit.remainingTime} minutes.` },
        { status: 429 }
      );
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Please enter password.' },
        { status: 400 }
      );
    }

    const googleSheets = GoogleSheetsService.getInstance();
    const correctPassword = await googleSheets.getPasswordFromSheet();

    if (!correctPassword) {
      return NextResponse.json(
        { error: 'System configuration error. Please contact administrator.' },
        { status: 500 }
      );
    }

    // 타이밍 공격 방지를 위한 일정 시간 지연
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (password === correctPassword) {
      recordLoginAttempt(clientIp, true);
      await createSession();
      return NextResponse.json({ success: true });
    } else {
      recordLoginAttempt(clientIp, false);
      return NextResponse.json(
        { error: 'Incorrect password.' },
        { status: 401 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: 'Authentication error occurred.' },
      { status: 500 }
    );
  }
}