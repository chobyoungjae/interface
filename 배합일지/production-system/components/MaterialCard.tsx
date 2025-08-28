'use client';

import { useState, useEffect } from 'react';

interface MaterialCardProps {
  code: string;
  name: string;
  quantity: number;
  serialLot: string;
  stockQuantity: string;
  onSerialLotChange: (serialLot: string) => void;
  onStockQuantityChange: (stockQuantity: string) => void;
  onQuantityChange: (quantity: number) => void;
  onMaterialChange: (code: string, name: string) => void;
  onCopy: () => void;
  onDelete: () => void;
  serialLotData: {code: string, serialLot: string, stockQuantity: string}[];
  allMaterials: {code: string, fullName: string}[];
  isCompleted: boolean;
}

export default function MaterialCard({
  code,
  name,
  quantity,
  serialLot,
  stockQuantity,
  onSerialLotChange,
  onStockQuantityChange,
  onQuantityChange,
  onMaterialChange,
  onCopy,
  onDelete,
  serialLotData,
  allMaterials,
  isCompleted
}: MaterialCardProps) {
  const [localSerialLot, setLocalSerialLot] = useState(serialLot || '');
  const [localStockQuantity, setLocalStockQuantity] = useState(stockQuantity || '');
  const [localQuantity, setLocalQuantity] = useState(quantity);
  const [localMaterial, setLocalMaterial] = useState(`${code}_${name}`);

  // 컴포넌트 마운트 시 기본값을 부모에게 알림
  useEffect(() => {
    if (localSerialLot && !serialLot) {
      onSerialLotChange(localSerialLot);
    }
  }, [localSerialLot, serialLot, onSerialLotChange]);

  // quantity prop이 변경될 때 로컬 상태 업데이트
  useEffect(() => {
    setLocalQuantity(quantity);
  }, [quantity]);

  // 원재료가 변경될 때 시리얼로트와 재고수량 초기화
  useEffect(() => {
    const currentMaterial = `${code}_${name}`;
    if (currentMaterial !== localMaterial) {
      setLocalMaterial(currentMaterial);
      setLocalSerialLot('');
      setLocalStockQuantity('');
      onSerialLotChange('');
      onStockQuantityChange('');
    }
  }, [code, name, localMaterial, onSerialLotChange, onStockQuantityChange]);

  const handleSerialLotChange = (newSerialLot: string) => {
    setLocalSerialLot(newSerialLot);
    onSerialLotChange(newSerialLot);
    
    // 선택된 시리얼로트에 해당하는 재고수량을 자동 선택
    const matchedItem = serialLotData.find(item => 
      item.code === code && item.serialLot === newSerialLot
    );
    if (matchedItem) {
      setLocalStockQuantity(matchedItem.stockQuantity);
      onStockQuantityChange(matchedItem.stockQuantity);
    }
  };

  // 현재 사용되지 않는 함수들 - 필요시 주석 해제
  // const handleStockQuantityChange = (newStockQuantity: string) => {
  //   setLocalStockQuantity(newStockQuantity);
  //   onStockQuantityChange(newStockQuantity);
  // };

  // const handleQuantityChange = (newQuantity: number) => {
  //   setLocalQuantity(newQuantity);
  //   onQuantityChange(newQuantity);
  // };

  return (
    <div className={`border rounded-lg p-3 transition-all ${
      isCompleted 
        ? 'border-green-300 bg-green-50' 
        : 'border-gray-300 bg-white'
    }`}>
      <div className="flex items-center gap-4">
        {/* 원재료 선택 드롭다운 */}
        <div className="flex-1 min-w-0">
          <select
            value={localMaterial}
            onChange={(e) => {
              const value = e.target.value;
              setLocalMaterial(value);
              const [newCode, ...nameParts] = value.split('_');
              const newName = nameParts.join('_');
              onMaterialChange(newCode, newName);
            }}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={localMaterial}>{localMaterial}</option>
            {allMaterials
              .filter(m => m.fullName !== localMaterial)
              .map(material => (
                <option key={material.code} value={material.fullName}>
                  {material.fullName}
                </option>
              ))}
          </select>
        </div>
        
        {/* 수량 입력 */}
        <div className="w-32 relative">
          <input
            type="text"
            value={Math.round(localQuantity * 1000).toLocaleString()}
            onChange={(e) => {
              const value = e.target.value.replace(/,/g, '');
              const numValue = parseFloat(value) || 0;
              setLocalQuantity(numValue / 1000); // g를 kg로 변환
              onQuantityChange(numValue / 1000);
            }}
            className="w-full px-2 py-1 pr-6 border border-gray-300 rounded text-sm font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
            placeholder="0"
          />
          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 pointer-events-none">g</span>
        </div>
        
        {/* 시리얼/로트No. */}
        <div className="w-40">
          <select
            value={localSerialLot}
            onChange={(e) => handleSerialLotChange(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">선택</option>
            {serialLotData.filter(item => {
              // 드롭다운에서 선택된 실제 원재료 코드로 필터링
              const actualCode = localMaterial.split('_')[0];
              return item.code === actualCode;
            }).map((item, index) => (
              <option key={index} value={item.serialLot}>{item.serialLot}</option>
            ))}
          </select>
        </div>

        {/* 재고수량 (자동 선택됨) */}
        <div className="w-32">
          <div className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-100 text-center">
            {localStockQuantity ? (parseFloat(localStockQuantity) * 1000).toLocaleString() + 'g' : '자동선택'}
          </div>
        </div>
        
        {/* 복사, 삭제 버튼 및 완료 상태 */}
        <div className="flex items-center gap-1">
          <button
            onClick={onCopy}
            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="카드 복사"
          >
            📋
          </button>
          
          <button
            onClick={onDelete}
            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="카드 삭제"
          >
            ✕
          </button>
          
          {isCompleted && (
            <div className="text-green-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}