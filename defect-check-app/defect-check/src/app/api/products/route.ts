import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';

const sheetsService = GoogleSheetsService.getInstance();

// 생산품 목록 조회 (BOM 시트2에서)
export async function GET() {
  try {
    const products = await sheetsService.readProductsData();
    return NextResponse.json(products);
  } catch (error) {
    console.error('생산품 데이터 조회 실패:', error);
    return NextResponse.json(
      { error: '생산품 데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
