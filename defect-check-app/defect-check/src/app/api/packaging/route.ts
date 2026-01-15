import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';

const sheetsService = GoogleSheetsService.getInstance();

// 포장지/박스 조회 (생산품코드로 필터)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productCode = searchParams.get('productCode');

    if (!productCode) {
      return NextResponse.json(
        { error: '생산품코드가 필요합니다.' },
        { status: 400 }
      );
    }

    const { packaging, box } = await sheetsService.readPackagingData(productCode);
    return NextResponse.json({ packaging, box });
  } catch (error) {
    console.error('포장지/박스 데이터 조회 실패:', error);
    return NextResponse.json(
      { error: '포장지/박스 데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
