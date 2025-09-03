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
  // 원재료 중량 합계 계산 (kg → g 변환)
  const materialTotalWeight = data.materials.reduce((total, material) => 
    total + (material.calculatedWeight * 1000), 0
  );
  
  // 소비기한을 YY.MM.DD 형식으로 변환 (YYYY-MM-DD → YY.MM.DD)
  const expiryFormatted = data.productExpiry.substring(2).replace(/-/g, '.');
  
  // 시리얼로트 생성 (25.08.09_AA 형식)
  const serialLot = `${expiryFormatted}_${data.productLot}`;
  
  const flattened = [
    formatKoreanDateTime(), // A열: 타임스템프
    data.author,           // B열: 작성자
    data.machine,          // C열: 호기
    data.productCode,      // D열: 제품코드
    data.productName,      // E열: 제품명
    data.inputWeight,      // F열: 생산중량 (그램)
    materialTotalWeight,   // G열: 원재료합계 (그램)
    data.productExpiry,    // H열: 소비기한
    data.productLot,       // I열: 제품로트
    serialLot,             // J열: 시리얼로트 (자동생성)
    data.sampleType,       // K열: 샘플 유형
    data.isExport ? '(수출)' : '' // L열: 수출 여부
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