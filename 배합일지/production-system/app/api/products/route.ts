import { NextResponse } from 'next/server';
import { BOMService } from '@/lib/bomService';
import { mockProducts } from '@/lib/mockData';

const bomService = new BOMService();

export async function GET() {
  try {
    const products = await bomService.getProducts();
    return NextResponse.json(products);
  } catch (error) {
    console.error('제품 데이터 조회 실패:', error);
    
    // Google Sheets API 실패 시 mock 데이터 fallback
    console.log('Fallback으로 Mock 데이터 사용...');
    return NextResponse.json(mockProducts);
  }
}