import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { DefectCheckData } from '@/types';

const sheetsService = GoogleSheetsService.getInstance();

// 불량 데이터 저장
export async function POST(request: Request) {
  try {
    const body: DefectCheckData = await request.json();

    // 타임스탬프 생성
    const now = new Date();
    const timestamp = now.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // 저장할 데이터 배열 생성 (A~U열 순서)
    const rowData = [
      timestamp,                              // A: 타임스탬프
      body.worker,                            // B: 작업자
      body.line,                              // C: 라인
      body.productCode,                       // D: 생산품코드
      body.productName,                       // E: 생산품명
      body.packagingCode,                     // F: 포장지코드
      body.packagingName,                     // G: 포장지명
      body.packagingLot,                      // H: 포장지로트
      body.packagingDefect.sealingDefect,     // I: 실링불량
      body.packagingDefect.weightDefect,      // J: 중량불량
      body.packagingDefect.printDefect,       // K: 날인불량(포장지)
      body.packagingDefect.selfDefect,        // L: 자체불량
      body.boxCode,                           // M: 박스코드
      body.boxName,                           // N: 박스명
      body.boxDefect.contamination,           // O: 박스오염
      body.boxDefect.damage,                  // P: 파손
      body.boxDefect.printDefect,             // Q: 날인불량(박스)
      body.boxDefect.other,                   // R: 기타
      body.specialNote.content,               // S: 내용
      body.specialNote.improvement,           // T: 개선조치사항
      body.specialNote.completionStatus,      // U: 완료여부
    ];

    await sheetsService.saveDefectData(rowData);

    return NextResponse.json({ success: true, message: '저장되었습니다.' });
  } catch (error) {
    console.error('불량 데이터 저장 실패:', error);
    return NextResponse.json(
      { error: '데이터 저장에 실패했습니다.' },
      { status: 500 }
    );
  }
}
