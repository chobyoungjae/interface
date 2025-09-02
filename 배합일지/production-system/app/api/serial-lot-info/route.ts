import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';

const googleSheetsService = GoogleSheetsService.getInstance();

export async function GET() {
  try {
    const sheetInfo = await googleSheetsService.readSerialLotSheetInfo();
    
    if (!sheetInfo) {
      return NextResponse.json(
        { error: '시리얼로트 시트 정보를 불러올 수 없습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(sheetInfo);
  } catch (error) {
    console.error('시리얼로트 시트 정보 로딩 실패:', error);
    return NextResponse.json(
      { error: '시리얼로트 시트 정보를 불러올 수 없습니다.' },
      { status: 500 }
    );
  }
}