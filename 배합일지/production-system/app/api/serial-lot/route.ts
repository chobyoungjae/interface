import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';

const googleSheetsService = GoogleSheetsService.getInstance();

export async function GET() {
  try {
    const serialLotData = await googleSheetsService.readSerialLotData();
    
    return NextResponse.json(serialLotData);
  } catch (error) {
    console.error('시리얼로트 데이터 로딩 실패:', error);
    return NextResponse.json(
      { error: '시리얼로트 데이터를 불러올 수 없습니다.' },
      { status: 500 }
    );
  }
}