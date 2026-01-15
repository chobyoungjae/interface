import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';

const sheetsService = GoogleSheetsService.getInstance();

// 시리얼로트 조회 (포장지코드로 필터)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const packagingCode = searchParams.get('packagingCode');

    if (!packagingCode) {
      return NextResponse.json(
        { error: '포장지코드가 필요합니다.' },
        { status: 400 }
      );
    }

    const lots = await sheetsService.readSerialLotData(packagingCode);
    return NextResponse.json(lots);
  } catch (error) {
    console.error('시리얼로트 데이터 조회 실패:', error);
    return NextResponse.json(
      { error: '시리얼로트 데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
