import { NextRequest, NextResponse } from 'next/server';
import { BOMService } from '@/lib/bomService';
import { Product } from '@/types';

const bomService = new BOMService();

export async function POST(request: NextRequest) {
  try {
    const { productCode, productName, baseQuantity, materials, inputWeight } = await request.json();

    const errors = bomService.validateInputWeight(inputWeight);
    if (errors.length > 0) {
      return NextResponse.json(
        { errors },
        { status: 400 }
      );
    }

    const product: Product = {
      productCode,
      productName,
      baseQuantity,
      materials,
    };

    const calculatedMaterials = bomService.calculateMaterialQuantities(product, inputWeight);
    
    return NextResponse.json({
      productCode,
      productName,
      inputWeight,
      materials: calculatedMaterials,
    });
  } catch (error) {
    console.error('계산 처리 실패:', error);
    return NextResponse.json(
      { error: '계산 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}