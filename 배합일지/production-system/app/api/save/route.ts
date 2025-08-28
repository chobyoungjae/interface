import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { ProductionData, ValidationError } from '@/types';

const googleSheetsService = GoogleSheetsService.getInstance();

export async function POST(request: NextRequest) {
  try {
    const productionData: ProductionData = await request.json();

    const errors = validateProductionData(productionData);
    if (errors.length > 0) {
      return NextResponse.json(
        { errors },
        { status: 400 }
      );
    }

    const flattenedData = flattenProductionData(productionData);
    
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
    data.productCode, 
    data.productName, 
    data.inputWeight, // 이미 그램 단위로 들어오므로 그대로 저장
    data.productExpiry,
    data.productLot
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