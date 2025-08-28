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
    console.log('BOM 데이터 총 행 수:', bomData.length);
    
    bomData.forEach((row, index) => {
      if (!row.A || !row.B || !row.E || !row.F || !row.G || !row.I) {
        return;
      }

      // 310021 제품의 경우 상세 로그
      if (row.A === '310021') {
        console.log(`[310021 BOM 데이터] 행 ${index}:`, {
          생산품목코드: row.A,
          생산품목명: row.B,
          기준수량_E열: row.E,
          소모품목코드_F열: row.F,
          소모품목명_G열: row.G,
          소모수량_I열: row.I
        });
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

    // 310021 제품 최종 데이터 확인
    const product310021 = Array.from(groups.values()).find(p => p.productCode === '310021');
    if (product310021) {
      console.log('===== 310021 최종 그룹화된 데이터 =====');
      console.log('제품코드:', product310021.productCode);
      console.log('제품명:', product310021.productName);
      console.log('기준수량:', product310021.baseQuantity);
      console.log('원재료 개수:', product310021.materials.length);
      console.log('원재료 총합:', product310021.materials.reduce((sum, m) => sum + m.quantity, 0));
      console.log('=====================================');
    }

    return Array.from(groups.values());
  }

  calculateMaterialQuantities(product: Product, inputWeight: number): Material[] {
    // inputWeight는 그램 단위로 입력됨
    // BOM의 baseQuantity와 materials.quantity는 모두 kg 단위
    
    console.log(`===== ${product.productCode} 계산 디버깅 =====`);
    console.log('제품코드:', product.productCode);
    console.log('제품명:', product.productName);
    console.log('BOM 기준수량 (kg):', product.baseQuantity);
    console.log('입력중량 (g):', inputWeight);
    
    // 원재료 총합 확인
    const bomTotal = product.materials.reduce((sum, m) => sum + m.quantity, 0);
    console.log('BOM 원재료 총합 (kg):', bomTotal);
    
    // 비율 계산: 입력그램 / 기준수량그램
    // BOM 기준수량이 kg 단위이므로 1000을 곱해서 g로 변환
    const baseQuantityInGrams = product.baseQuantity * 1000;
    const ratio = inputWeight / baseQuantityInGrams;
    
    console.log('기준수량 (g):', baseQuantityInGrams);
    console.log('계산 비율:', ratio);
    console.log('예상 원재료 총합 (g):', bomTotal * ratio * 1000);
    
    // 각 원재료 계산 (결과는 kg 단위로 반환)
    const result = product.materials.map((material) => {
      // material.quantity는 kg 단위
      const calculatedQuantityInKg = material.quantity * ratio;
      
      console.log(`  - ${material.code}: ${material.quantity}kg × ${ratio} = ${calculatedQuantityInKg}kg (${calculatedQuantityInKg * 1000}g)`);
      
      return {
        code: material.code,
        name: material.name,
        quantity: calculatedQuantityInKg, // kg 단위로 저장
      };
    });
    
    const totalCalculatedKg = result.reduce((sum, m) => sum + m.quantity, 0);
    console.log('계산된 원재료 총합 (kg):', totalCalculatedKg);
    console.log('계산된 원재료 총합 (g):', totalCalculatedKg * 1000);
    console.log('입력 중량 (g):', inputWeight);
    console.log('=====================================');
    
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