export interface BOMRawData {
  A: string; // 생산품목코드
  B: string; // 생산품목명
  E: number; // 생산수량 (기준)
  F: string; // 소모품목코드
  G: string; // 소모품목명
  I: number; // 소모수량
}

export interface Material {
  code: string;
  name?: string;
  quantity: number;
  date?: string;
  lot?: string;
}

export interface Product {
  productCode: string;
  productName: string;
  baseQuantity: number;
  materials: Material[];
}

export interface ProductionData {
  productCode: string;
  productName: string;
  inputWeight: number;
  productExpiry: string;
  productLot: string;
  author: string;
  machine: string; // 호기 필드 추가
  isExport: boolean; // 수출 체크박스 필드
  sampleType: string; // 샘플 드롭다운 필드
  materials: Array<{
    code: string;
    name: string;
    calculatedWeight: number;
    serialLot: string;
    stockQuantity: string;
  }>;
}

export interface ValidationError {
  field: string;
  message: string;
}