'use client';

import { useState, useEffect } from 'react';
import ProductSelector from '@/components/ProductSelector';
import MaterialCard from '@/components/MaterialCard';
import PasswordAuth from '@/components/PasswordAuth';
import CompanyInfoBanner from '@/components/CompanyInfoBanner';
import DateMismatchModal from '@/components/DateMismatchModal';
import { Product, Material, ProductionData } from '@/types';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [inputWeight, setInputWeight] = useState<number>(0);
  // 기본 소비기한: 오늘 + 14개월 - 1일
  const getDefaultExpiry = () => {
    const today = new Date();
    today.setMonth(today.getMonth() + 14);
    today.setDate(today.getDate() - 1);
    return today.toISOString().split('T')[0];
  };
  
  const [productExpiry, setProductExpiry] = useState<string>(getDefaultExpiry());
  const [productLot, setProductLot] = useState<string>('');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('');
  const [authors, setAuthors] = useState<string[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string>('');
  const machines = ['1호기', '2호기', '3호기', '4호기', '5호기', '6호기'];
  const [isExport, setIsExport] = useState<boolean>(false);
  const [sampleType, setSampleType] = useState<string>('');
  const sampleTypes = ['관능_SAMPLE', '업체발송용_SAMPLE'];
  const [calculatedMaterials, setCalculatedMaterials] = useState<Material[]>([]);
  const [materialInputs, setMaterialInputs] = useState<Record<string, { serialLot: string; stockQuantity: string; quantity: number }>>({});
  const [serialLotData, setSerialLotData] = useState<{code: string, serialLot: string, stockQuantity: string}[]>([]);
  const [allMaterials, setAllMaterials] = useState<{code: string, fullName: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDateMismatchModal, setShowDateMismatchModal] = useState(false);

  useEffect(() => {
    loadProducts();
    loadSerialLotData();
    loadAllMaterials();
    loadAuthors();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('제품 데이터 로딩 실패:', error);
      setErrors(['제품 데이터를 불러올 수 없습니다.']);
    }
  };

  const loadSerialLotData = async () => {
    try {
      const response = await fetch('/api/serial-lot');
      const data = await response.json();
      setSerialLotData(data);
    } catch (error) {
      console.error('시리얼로트 데이터 로딩 실패:', error);
    }
  };

  const loadAllMaterials = async () => {
    try {
      const response = await fetch('/api/materials');
      const data = await response.json();
      setAllMaterials(data);
    } catch (error) {
      console.error('원재료 목록 로딩 실패:', error);
    }
  };

  const loadAuthors = async () => {
    try {
      const response = await fetch('/api/authors');
      const data = await response.json();
      setAuthors(data);
    } catch (error) {
      console.error('작성자 목록 로딩 실패:', error);
    }
  };

  const handleProductSelect = async (product: Product) => {
    setSelectedProduct(product);
    setErrors([]);
    
    if (inputWeight > 0) {
      await calculateMaterials(product, inputWeight);
    }
  };

  const handleWeightChange = async (weight: number) => {
    setInputWeight(weight);
    setErrors([]);
    
    if (selectedProduct && weight > 0) {
      await calculateMaterials(selectedProduct, weight);
    } else {
      setCalculatedMaterials([]);
    }
  };

  const calculateMaterials = async (product: Product, weight: number) => {
    setLoading(true);
    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productCode: product.productCode,
          productName: product.productName,
          baseQuantity: product.baseQuantity,
          materials: product.materials,
          inputWeight: weight,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setCalculatedMaterials(data.materials);
        
        const initialInputs: Record<string, { serialLot: string; stockQuantity: string; quantity: number }> = {};
        data.materials.forEach((material: Material) => {
          initialInputs[material.code] = { serialLot: '', stockQuantity: '', quantity: material.quantity };
        });
        setMaterialInputs(initialInputs);
      } else {
        setErrors(data.errors || ['계산 중 오류가 발생했습니다.']);
      }
    } catch (error) {
      console.error('계산 실패:', error);
      setErrors(['계산 중 오류가 발생했습니다.']);
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialInput = (materialCode: string, field: 'serialLot' | 'stockQuantity' | 'quantity', value: string | number) => {
    setMaterialInputs(prev => ({
      ...prev,
      [materialCode]: {
        ...prev[materialCode],
        [field]: value,
      },
    }));
  };

  const handleMaterialCopy = (materialCode: string) => {
    const originalMaterial = calculatedMaterials.find(m => m.code === materialCode);
    const originalInputs = materialInputs[materialCode];
    
    if (!originalMaterial || !originalInputs) return;

    // 새로운 고유한 키 생성 (materialCode + timestamp)
    const newKey = `${materialCode}_copy_${Date.now()}`;
    
    // 복사된 원재료를 calculatedMaterials에 추가
    setCalculatedMaterials(prev => [...prev, {
      ...originalMaterial,
      code: newKey // 고유 키로 변경
    }]);

    // 복사된 입력값을 materialInputs에 추가
    setMaterialInputs(prev => ({
      ...prev,
      [newKey]: { ...originalInputs }
    }));
  };

  const handleMaterialDelete = (materialCode: string) => {
    // calculatedMaterials에서 해당 원재료 제거
    setCalculatedMaterials(prev => prev.filter(m => m.code !== materialCode));
    
    // materialInputs에서도 제거
    setMaterialInputs(prev => {
      const newInputs = { ...prev };
      delete newInputs[materialCode];
      return newInputs;
    });
  };

  const handleMaterialChange = (oldCode: string, newCode: string, newName: string) => {
    // calculatedMaterials 업데이트 - 실제 원재료 코드와 이름만 변경
    setCalculatedMaterials(prev => prev.map(material => 
      material.code === oldCode 
        ? { ...material, code: newCode, name: newName }
        : material
    ));
    
    // materialInputs 업데이트 (키 변경하고 시리얼로트 초기화)
    setMaterialInputs(prev => {
      const oldInputs = prev[oldCode];
      const newInputs = { ...prev };
      
      if (oldInputs) {
        delete newInputs[oldCode];
        // 새로운 원재료로 변경 시 시리얼로트와 재고수량 초기화
        newInputs[newCode] = {
          ...oldInputs,
          serialLot: '', // 초기화
          stockQuantity: '' // 초기화
        };
      } else {
        // 기존 입력이 없었다면 새로 생성
        newInputs[newCode] = {
          serialLot: '',
          stockQuantity: '',
          quantity: calculatedMaterials.find(m => m.code === oldCode)?.quantity || 0
        };
      }
      
      return newInputs;
    });
  };

  const isFormValid = () => {
    if (!selectedProduct || inputWeight <= 0 || calculatedMaterials.length === 0 || !selectedAuthor || !selectedMachine) return false;
    
    return calculatedMaterials.every(material => 
      materialInputs[material.code]?.serialLot && materialInputs[material.code]?.stockQuantity
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      setErrors(['모든 필드를 입력해주세요.']);
      return;
    }

    setLoading(true);
    setErrors([]);
    
    try {
      const productionData: ProductionData = {
        productCode: selectedProduct!.productCode,
        productName: selectedProduct!.productName,
        inputWeight,
        productExpiry,
        productLot,
        author: selectedAuthor,
        machine: selectedMachine,
        isExport,
        sampleType,
        materials: calculatedMaterials.map(material => ({
          code: material.code.includes('_copy_') ? material.code.split('_copy_')[0] : material.code,
          name: material.name || '',
          calculatedWeight: materialInputs[material.code]?.quantity || material.quantity,
          serialLot: materialInputs[material.code].serialLot,
          stockQuantity: materialInputs[material.code].stockQuantity,
        })),
      };

      const response = await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productionData),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage('생산 데이터가 성공적으로 저장되었습니다!');
        
        setSelectedProduct(null);
        setInputWeight(0);
        setProductExpiry(getDefaultExpiry()); // 기본 소비기한으로 리셋
        setProductLot('');
        setSelectedAuthor(''); // 작성자 리셋
        setSelectedMachine(''); // 호기 리셋
        setIsExport(false); // 수출 체크박스 리셋
        setSampleType(''); // 샘플 드롭다운 리셋
        setCalculatedMaterials([]);
        setMaterialInputs({});
        
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrors(result.errors?.map((e: {message: string}) => e.message) || ['저장 중 오류가 발생했습니다.']);
      }
    } catch (error) {
      console.error('저장 실패:', error);
      setErrors(['저장 중 오류가 발생했습니다.']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PasswordAuth>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <CompanyInfoBanner onDateMismatch={() => setShowDateMismatchModal(true)} />
        
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">BOM 기반 배합일지</h1>

        {errors.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <ul className="text-red-700 text-sm">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">{successMessage}</p>
          </div>
        )}

        {/* 첫 번째 줄: BOM 기반 배합일지, 소비기한 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div></div> {/* 빈 공간 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              소비기한
            </label>
            <input
              type="date"
              value={productExpiry}
              onChange={(e) => setProductExpiry(e.target.value)}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                productExpiry ? 'text-gray-900 font-semibold' : 'text-gray-500'
              }`}
            />
          </div>
        </div>

        {/* 두 번째 줄: 제품선택, 생산중량, 호기 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                제품 선택
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="export-checkbox"
                  checked={isExport}
                  onChange={(e) => setIsExport(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                />
                <label
                  htmlFor="export-checkbox"
                  className="text-sm font-medium text-gray-700"
                >
                  수출일 경우 체크
                </label>
              </div>
            </div>
            <ProductSelector
              products={products}
              selectedProduct={selectedProduct}
              onProductSelect={handleProductSelect}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              생산 중량 (g)
            </label>
            <input
              type="text"
              value={inputWeight ? inputWeight.toLocaleString() : ''}
              onChange={(e) => {
                const value = e.target.value.replace(/,/g, '');
                handleWeightChange(parseFloat(value) || 0);
              }}
              placeholder="중량을 입력하세요 (g)"
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 ${
                inputWeight > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'
              }`}
            />
            {selectedProduct && (
              <p className="text-xs text-gray-500 mt-1">
                기준 생산량: {(selectedProduct.baseQuantity * 1000).toLocaleString()}g
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              호기
            </label>
            <select
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${
                selectedMachine ? 'text-gray-900 font-semibold' : 'text-gray-500'
              }`}
            >
              <option value="" className="text-gray-500">호기를 선택하세요</option>
              {machines.map((machine) => (
                <option key={machine} value={machine}>
                  {machine}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 세 번째 줄: 로트, 샘플, 작성자 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제품 로트
            </label>
            <input
              type="text"
              value={productLot}
              onChange={(e) => setProductLot(e.target.value)}
              placeholder="로트 번호 입력"
              maxLength={50}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 ${
                productLot ? 'text-gray-900 font-semibold' : 'text-gray-500'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              샘플
            </label>
            <select
              value={sampleType}
              onChange={(e) => setSampleType(e.target.value)}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${
                sampleType ? 'text-gray-900 font-semibold' : 'text-gray-500'
              }`}
            >
              <option value="" className="text-gray-500">샘플을 선택하세요</option>
              {sampleTypes.map((sample) => (
                <option key={sample} value={sample}>
                  {sample}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              작성자
            </label>
            <select
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${
                selectedAuthor ? 'text-gray-900 font-semibold' : 'text-gray-500'
              }`}
            >
              <option value="" className="text-gray-500">작성자를 선택하세요</option>
              {authors.map((author) => (
                <option key={author} value={author}>
                  {author}
                </option>
              ))}
            </select>
          </div>
        </div>


        {loading && (
          <div className="text-center py-8">
            <div className="inline-flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              <span>계산 중...</span>
            </div>
          </div>
        )}

        {calculatedMaterials.length > 0 && !loading && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                원재료 목록 ({calculatedMaterials.length}개)
              </h2>
              <div className="text-lg font-bold text-blue-600">
                총 합계: {Math.round(calculatedMaterials.reduce((total, material) => 
                  total + (materialInputs[material.code]?.quantity || material.quantity), 0
                ) * 1000).toLocaleString()}g
              </div>
            </div>
            
            {/* 헤더 - 모바일/태블릿에서 숨김, 데스크톱에서만 표시 */}
            <div className="hidden lg:block p-3 font-semibold text-gray-700">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  원재료명
                </div>
                <div className="flex items-center gap-1 w-24">
                  중량(g)
                </div>
                <div className="w-40">
                  시리얼로트
                </div>
                <div className="w-32">
                  재고수량(g)
                </div>
                <div className="flex items-center gap-1">
                  복사/삭제
                </div>
              </div>
            </div>
            
            <div className="space-y-2 mb-6">
              {calculatedMaterials.map((material, index) => (
                <MaterialCard
                  key={`${material.code}_${index}`}
                  code={material.code.includes('_copy_') ? material.code.split('_copy_')[0] : material.code}
                  name={material.name || ''}
                  quantity={materialInputs[material.code]?.quantity || material.quantity}
                  serialLot={materialInputs[material.code]?.serialLot || ''}
                  stockQuantity={materialInputs[material.code]?.stockQuantity || ''}
                  onSerialLotChange={(serialLot) => handleMaterialInput(material.code, 'serialLot', serialLot)}
                  onStockQuantityChange={(stockQuantity) => handleMaterialInput(material.code, 'stockQuantity', stockQuantity)}
                  onQuantityChange={(quantity) => handleMaterialInput(material.code, 'quantity', quantity)}
                  onMaterialChange={(newCode, newName) => handleMaterialChange(material.code, newCode, newName)}
                  onCopy={() => handleMaterialCopy(material.code)}
                  onDelete={() => handleMaterialDelete(material.code)}
                  serialLotData={serialLotData}
                  allMaterials={allMaterials}
                  isCompleted={!!(materialInputs[material.code]?.serialLot && materialInputs[material.code]?.stockQuantity)}
                />
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!isFormValid() || loading}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all ${
                isFormValid() && !loading
                  ? 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? '저장 중...' : '생산 데이터 저장'}
            </button>
          </div>
        )}
      </div>
      </div>
      
      <DateMismatchModal 
        isOpen={showDateMismatchModal}
        onClose={() => setShowDateMismatchModal(false)}
      />
    </PasswordAuth>
  );
}
