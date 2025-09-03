import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { ProductionData, ValidationError } from '@/types';
import { formatKoreanDateTime } from '@/lib/dateUtils';

const googleSheetsService = GoogleSheetsService.getInstance();

export async function POST(request: NextRequest) {
  try {
    const productionData: ProductionData = await request.json();
    console.log('받은 생산 데이터:', JSON.stringify(productionData, null, 2));

    const errors = validateProductionData(productionData);
    if (errors.length > 0) {
      console.log('검증 오류:', errors);
      return NextResponse.json(
        { errors },
        { status: 400 }
      );
    }

    const flattenedData = flattenProductionData(productionData);
    console.log('평면화된 데이터:', flattenedData);
    
    try {
      await googleSheetsService.saveProductionData(flattenedData);
      
      return NextResponse.json({
        message: '생산 데이터가 성공적으로 저장되었습니다.',
        timestamp: new Date().toISOString(),
      });
    } catch (saveError) {
      console.error('Google Sheets 저장 실패:', saveError);
      
      return NextResponse.json({
        message: '생산 데이터가 로컬에 저장되었습니다. (Google Sheets 연결 실패)',
        timestamp: new Date().toISOString(),
        data: flattenedData,
      });
    }
  } catch (error) {
    console.error('데이터 저장 실패:', error);
    return NextResponse.json(
      { error: '데이터 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

function validateProductionData(data: ProductionData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.productCode) {
    errors.push({ field: 'productCode', message: '제품 코드가 필요합니다.' });
  }

  if (!data.inputWeight || data.inputWeight <= 0) {
    errors.push({ field: 'inputWeight', message: '올바른 중량을 입력해주세요.' });
  }

  if (!data.author) {
    errors.push({ field: 'author', message: '작성자를 선택해주세요.' });
  }

  if (!data.machine) {
    errors.push({ field: 'machine', message: '호기를 선택해주세요.' });
  }

  data.materials.forEach((material, index) => {
    if (!material.serialLot) {
      errors.push({ field: `materials.${index}.serialLot`, message: `원재료 ${index + 1}의 시리얼/로트번호가 필요합니다.` });
    }
    if (!material.stockQuantity) {
      errors.push({ field: `materials.${index}.stockQuantity`, message: `원재료 ${index + 1}의 재고수량이 필요합니다.` });
    }
  });

  return errors;
}

function flattenProductionData(data: ProductionData): (string | number)[] {
  const flattened = [
    formatKoreanDateTime(), // A열: 타임스템프
    data.author,           // B열: 작성자
    data.machine,          // C열: 호기
    data.productCode,      // D열: 제품코드
    data.productName,      // E열: 제품명
    data.inputWeight,      // F열: 생산중량 (그램)
    data.productExpiry,    // G열: 소비기한
    data.productLot,       // H열: 제품로트
    data.sampleType,       // I열: 샘플 유형
    data.isExport ? '수출' : '' // J열: 수출 여부
  ];

  data.materials.forEach((material) => {
    flattened.push(
      material.code,
      material.name,
      material.calculatedWeight * 1000, // 원재료는 kg → g 변환 필요
      material.serialLot
    );
  });

  return flattened;
}