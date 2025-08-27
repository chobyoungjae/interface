import { BOMRawData, Product, Material } from '@/types';
import { GoogleSheetsService } from './googleSheets';

export class BOMService {
  private googleSheetsService = GoogleSheetsService.getInstance();

  async getProducts(): Promise<Product[]> {
    const bomData = await this.googleSheetsService.readBOMData();
    return this.groupBOMData(bomData);
  }

  private groupBOMData(bomData: BOMRawData[]): Product[] {
    const groups = new Map<string, Product>();

    bomData.forEach((row) => {
      if (!row.A || !row.B || !row.E || !row.F || !row.G || !row.I) return;

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
          code: row.F,
          name: row.G,
          quantity: row.I,
        });
      }
    });

    return Array.from(groups.values());
  }

  calculateMaterialQuantities(product: Product, inputWeight: number): Material[] {
    const ratio = inputWeight / product.baseQuantity;
    
    return product.materials.map((material) => ({
      code: material.code,
      name: material.name,
      quantity: Math.round(material.quantity * ratio * 1000) / 1000, // kg 단위로 계산 (내부적으로는 여전히 kg)
    }));
  }

  validateInputWeight(weight: number): string[] {
    const errors: string[] = [];
    
    if (!weight || weight <= 0) {
      errors.push('중량은 0보다 큰 값이어야 합니다.');
    }
    
    if (weight > 10000) {
      errors.push('중량은 10,000kg를 초과할 수 없습니다.');
    }

    return errors;
  }
}