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