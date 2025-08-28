import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';

const googleSheetsService = GoogleSheetsService.getInstance();

export async function GET() {
  try {
    console.log('모든 원재료 목록 가져오기...');
    const doc = await googleSheetsService.authenticateDoc(process.env.BOM_SPREADSHEET_ID!);
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();
    
    // 원재료 목록 추출 (중복 제거)
    const materialsMap = new Map<string, string>();
    
    rows.forEach(row => {
      const code = row.get('소모품목코드');
      const name = row.get('소모품목명');
      
      if (code && name) {
        const key = `${code}_${name}`;
        materialsMap.set(code, key);
      }
    });
    
    // Map을 배열로 변환
    const materials = Array.from(materialsMap.entries()).map(([code, fullName]) => ({
      code,
      fullName
    }));
    
    console.log('원재료 목록 개수:', materials.length);
    
    return NextResponse.json(materials);
  } catch (error) {
    console.error('원재료 목록 조회 실패:', error);
    return NextResponse.json(
      { error: '원재료 목록을 가져올 수 없습니다.' },
      { status: 500 }
    );
  }
}