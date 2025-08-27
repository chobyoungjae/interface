import { Product } from '@/types';

export const mockProducts: Product[] = [
  {
    productCode: '310013',
    productName: '미스터 떡볶이소스 순한맛_분체품',
    baseQuantity: 115,
    materials: [
      { code: '500002', name: '정백당', quantity: 65 },
      { code: '500004', name: '쇠고기다시다', quantity: 30 },
      { code: '500007', name: '조미고추맛분말5.0', quantity: 4 },
      { code: '500008', name: 'L-글루탐산나트륨', quantity: 16 },
    ]
  },
  {
    productCode: '310014',
    productName: '미스터 떡볶이소스 매운맛_분체품',
    baseQuantity: 100,
    materials: [
      { code: '500002', name: '정백당', quantity: 50 },
      { code: '500004', name: '쇠고기다시다', quantity: 25 },
      { code: '500007', name: '조미고추맛분말5.0', quantity: 5 },
      { code: '500008', name: 'L-글루탐산나트륨', quantity: 15 },
      { code: '500009', name: '기타원료', quantity: 5 },
    ]
  },
  {
    productCode: '310015',
    productName: '치킨소스 오리지널_액상품',
    baseQuantity: 200,
    materials: [
      { code: '500010', name: '치킨베이스', quantity: 120 },
      { code: '500011', name: '식용유', quantity: 40 },
      { code: '500012', name: '향신료', quantity: 30 },
      { code: '500013', name: '보존료', quantity: 10 },
    ]
  }
];