import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';

const googleSheetsService = GoogleSheetsService.getInstance();

export async function GET() {
  try {
    const authors = await googleSheetsService.readAuthorsData();
    return NextResponse.json(authors);
  } catch (error) {
    console.error('작성자 목록 조회 실패:', error);
    return NextResponse.json(
      { error: '작성자 목록을 가져올 수 없습니다.' },
      { status: 500 }
    );
  }
}