import { BOMRawData, Product, Material } from '@/types';
import { GoogleSheetsService } from './googleSheets';

export class BOMService {
  private googleSheetsService = GoogleSheetsService.getInstance();

  async getProducts(): Promise<Product[]> {
    const bomData = await this.googleSheetsService.readBOMData();
    return this.groupBOMData(bomData as BOMRawData[]);
  }

  private groupBOMData(bomData: BOMRawData[]): Product[] {
    const groups = new Map<string, Product>();
    
    bomData.forEach((row) => {
      if (!row.A || !row.B || !row.E || !row.F || !row.G || !row.I) {
        return;
      }

      // A열(생산품목코드) + B열(생산품목명) 조합으로 그룹핑 (중복 제거)
      const key = `${row.A}_${row.B}`;
      
      if (!groups.has(key)) {
        groups.set(key, {
          productCode: row.A,
          productName: row.B,
          baseQuantity: row.E, // 첫 번째 발견된 기준 수량 사용
          materials: [],
        });
      }

      const product = groups.get(key)!;
      
      // 동일한 소모품목코드가 이미 있는지 확인
      const existingMaterial = product.materials.find(m => m.code === row.F);
      if (!existingMaterial) {
        product.materials.push({
          code: row.F || '',
          name: row.G || '',
          quantity: row.I || 0,
        });
      }
    });


    return Array.from(groups.values());
  }

  calculateMaterialQuantities(product: Product, inputWeight: number): Material[] {
    // inputWeight는 그램 단위로 입력됨
    // BOM의 baseQuantity와 materials.quantity는 모두 kg 단위
    
    // 비율 계산: 입력그램 / 기준수량그램
    // BOM 기준수량이 kg 단위이므로 1000을 곱해서 g로 변환
    const baseQuantityInGrams = product.baseQuantity * 1000;
    const ratio = inputWeight / baseQuantityInGrams;
    
    // 각 원재료 계산 (결과는 kg 단위로 반환)
    const result = product.materials.map((material) => {
      // material.quantity는 kg 단위
      const calculatedQuantityInKg = material.quantity * ratio;
      
      return {
        code: material.code,
        name: material.name,
        quantity: calculatedQuantityInKg, // kg 단위로 저장
      };
    });
    
    return result;
  }

  validateInputWeight(weight: number): string[] {
    const errors: string[] = [];
    
    if (!weight || weight <= 0) {
      errors.push('중량은 0보다 큰 값이어야 합니다.');
    }
    
    // weight는 그램 단위이므로 10,000,000g (10톤) 제한
    if (weight > 10000000) {
      errors.push('중량은 10,000,000g (10톤)을 초과할 수 없습니다.');
    }

    return errors;
  }
}