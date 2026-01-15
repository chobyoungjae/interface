// 생산품 정보 (BOM 시트2에서 가져옴)
export interface Product {
  productCode: string;    // A열: 생산품목코드
  productName: string;    // B열: 생산품목명
  category: string;       // 기초코드 시트 D열: 규격정보
}

// 포장지/박스 정보 (BOM 시트2에서 가져옴)
export interface PackagingItem {
  code: string;           // F열: 소모품목코드 (6자리)
  name: string;           // G열: 소모품목명
}

// 시리얼 로트 정보 (BOM 시리얼로트 시트에서 가져옴)
export interface SerialLot {
  code: string;           // A열: 품목코드
  productName: string;    // B열: 제품명
  lotNumber: string;      // D열: 시리얼/로트No.
  stockQuantity: string;  // F열: 재고수량
}

// 포장지 불량 데이터
export interface PackagingDefect {
  sealingDefect: number;     // 실링불량
  weightDefect: number;      // 중량불량
  printDefect: number;       // 날인불량
  selfDefect: number;        // 자체불량
}

// 박스 불량 데이터
export interface BoxDefect {
  contamination: number;     // 박스오염
  damage: number;            // 파손
  printDefect: number;       // 날인불량
  other: number;             // 기타
}

// 특이사항
export interface SpecialNote {
  content: string;           // 내용
  improvement: string;       // 개선조치사항
  completionStatus: string;  // 완료여부
}

// 전체 불량체크 데이터 (제출용)
export interface DefectCheckData {
  worker: string;            // 작업자
  line: string;              // 라인
  productCode: string;       // 생산품코드
  productName: string;       // 생산품명
  packagingCode: string;     // 포장지코드
  packagingName: string;     // 포장지명
  packagingLot: string;      // 포장지로트
  packagingDefect: PackagingDefect;
  boxCode: string;           // 박스코드
  boxName: string;           // 박스명
  boxDefect: BoxDefect;
  specialNote: SpecialNote;
}

// 라인 옵션 (고정값)
export const LINE_OPTIONS = [
  '1라인',
  '2라인',
  '3라인',
  '4라인',
  '수작업',
  '배합실'
] as const;

export type LineOption = typeof LINE_OPTIONS[number];
