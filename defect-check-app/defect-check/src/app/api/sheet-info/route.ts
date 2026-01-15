import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';

const sheetsService = GoogleSheetsService.getInstance();

// 포장지 시트 A1 정보 조회
export async function GET() {
  try {
    const info = await sheetsService.readPackagingSheetInfo();
    return NextResponse.json({ info });
  } catch (error) {
    console.error('포장지 시트 정보 조회 실패:', error);
    return NextResponse.json(
      { error: '시트 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
