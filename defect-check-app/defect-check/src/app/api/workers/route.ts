import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';

const sheetsService = GoogleSheetsService.getInstance();

// 작업자 목록 조회 (B시트에서 생산팀만)
export async function GET() {
  try {
    const workers = await sheetsService.readWorkersData();
    return NextResponse.json(workers);
  } catch (error) {
    console.error('작업자 데이터 조회 실패:', error);
    return NextResponse.json(
      { error: '작업자 데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
