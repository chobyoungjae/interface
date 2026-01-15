"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Product,
  PackagingItem,
  SerialLot,
  DefectCheckData,
  LINE_OPTIONS,
} from "@/types";

// 맛 옵션 (제품명에서 추출) - "맛" 글자 제외
const FLAVOR_OPTIONS = [
  "전체",
  "오리지널",
  "순한",
  "단짠",
  "보통",
  "매콤한",
  "매운",
  "불",
  "카레",
  "짜장",
  "로제",
  "마라",
  "궁중",
] as const;

// 키워드 옵션 (브랜드/제품 특성)
const KEYWORD_OPTIONS = [
  "전체",
  "떡군이",
  "불스",
  "엄청난",
  "홈즈",
  "와플칸",
  "순수",
  "오부장",
  "원달러",
  "시장",
  "한둘",
  "마법",
  "김치",
  "닭",
  "짬뽕",
  "미쓰리",
] as const;

export default function Home() {
  // 드롭다운 데이터
  const [workers, setWorkers] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [serialLots, setSerialLots] = useState<SerialLot[]>([]);

  // 선택된 값들
  const [selectedWorker, setSelectedWorker] = useState("");
  const [selectedLine, setSelectedLine] = useState("");
  const [selectedFlavor, setSelectedFlavor] = useState("전체");
  const [selectedKeyword, setSelectedKeyword] = useState("전체");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedLot, setSelectedLot] = useState("");

  // 자동 선택된 포장지/박스
  const [packaging, setPackaging] = useState<PackagingItem | null>(null);
  const [box, setBox] = useState<PackagingItem | null>(null);

  // 불량 수량 입력
  const [packagingDefect, setPackagingDefect] = useState({
    sealingDefect: 0,
    weightDefect: 0,
    printDefect: 0,
    selfDefect: 0,
  });
  const [boxDefect, setBoxDefect] = useState({
    contamination: 0,
    damage: 0,
    printDefect: 0,
    other: 0,
  });

  // 특이사항
  const [specialNote, setSpecialNote] = useState({
    content: "",
    improvement: "",
    completionStatus: "",
  });

  // 불량 등록 (로스)
  const [lossData, setLossData] = useState({
    productionLoss: "",  // 생산시_가공로스 (kg)
    mixingLoss: "",      // 배합_청소로스 (kg)
  });

  // 로딩/에러 상태
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 맛으로만 필터링된 제품 (키워드 옵션 카운트용)
  const flavorFilteredProducts = useMemo(() => {
    if (selectedFlavor === "전체") return products;
    return products.filter((p) => p.productName.includes(selectedFlavor));
  }, [products, selectedFlavor]);

  // 키워드로만 필터링된 제품 (맛 옵션 카운트용)
  const keywordFilteredProducts = useMemo(() => {
    if (selectedKeyword === "전체") return products;
    return products.filter((p) => p.productName.includes(selectedKeyword));
  }, [products, selectedKeyword]);

  // 맛 + 키워드로 필터링된 제품 목록 (최종 결과)
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // 맛 필터
    if (selectedFlavor !== "전체") {
      filtered = filtered.filter((p) => p.productName.includes(selectedFlavor));
    }

    // 키워드 필터
    if (selectedKeyword !== "전체") {
      filtered = filtered.filter((p) => p.productName.includes(selectedKeyword));
    }

    return filtered;
  }, [products, selectedFlavor, selectedKeyword]);

  // 현재 필터 기준으로 유효한 맛 옵션들 (키워드 기준 필터링)
  const availableFlavors = useMemo(() => {
    return FLAVOR_OPTIONS.filter((flavor) => {
      if (flavor === "전체") return true;
      return keywordFilteredProducts.some((p) => p.productName.includes(flavor));
    });
  }, [keywordFilteredProducts]);

  // 현재 필터 기준으로 유효한 키워드 옵션들 (맛 기준 필터링)
  const availableKeywords = useMemo(() => {
    return KEYWORD_OPTIONS.filter((keyword) => {
      if (keyword === "전체") return true;
      return flavorFilteredProducts.some((p) => p.productName.includes(keyword));
    });
  }, [flavorFilteredProducts]);

  // 초기 데이터 로드
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [workersRes, productsRes] = await Promise.all([
          fetch("/api/workers"),
          fetch("/api/products"),
        ]);

        if (workersRes.ok) {
          const workersData = await workersRes.json();
          setWorkers(workersData);
        }

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData);
        }
      } catch (err) {
        console.error("초기 데이터 로드 실패:", err);
        setError("데이터를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // 맛/키워드 변경 시 선택된 제품 초기화
  useEffect(() => {
    setSelectedProduct(null);
    setPackaging(null);
    setBox(null);
    setSerialLots([]);
    setSelectedLot("");
  }, [selectedFlavor, selectedKeyword]);

  // 선택한 맛이 더 이상 유효하지 않으면 전체로 리셋
  useEffect(() => {
    if (selectedFlavor !== "전체" && !availableFlavors.includes(selectedFlavor as typeof FLAVOR_OPTIONS[number])) {
      setSelectedFlavor("전체");
    }
  }, [availableFlavors, selectedFlavor]);

  // 선택한 키워드가 더 이상 유효하지 않으면 전체로 리셋
  useEffect(() => {
    if (selectedKeyword !== "전체" && !availableKeywords.includes(selectedKeyword as typeof KEYWORD_OPTIONS[number])) {
      setSelectedKeyword("전체");
    }
  }, [availableKeywords, selectedKeyword]);

  // 생산품 선택 시 포장지/박스 자동 조회
  useEffect(() => {
    if (!selectedProduct) {
      setPackaging(null);
      setBox(null);
      setSerialLots([]);
      setSelectedLot("");
      return;
    }

    const fetchPackaging = async () => {
      try {
        const res = await fetch(
          `/api/packaging?productCode=${selectedProduct.productCode}`
        );
        if (res.ok) {
          const data = await res.json();
          setPackaging(data.packaging);
          setBox(data.box);

          // 포장지가 있으면 시리얼로트 조회
          if (data.packaging) {
            const lotRes = await fetch(
              `/api/serial-lot?packagingCode=${data.packaging.code}`
            );
            if (lotRes.ok) {
              const lotData = await lotRes.json();
              setSerialLots(lotData);
            }
          }
        }
      } catch (err) {
        console.error("포장지/박스 데이터 로드 실패:", err);
      }
    };

    fetchPackaging();
  }, [selectedProduct]);

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 불량 등록(로스)에 값이 있는지 확인
    const hasLossData = lossData.productionLoss !== "" || lossData.mixingLoss !== "";

    // 필수 필드 검증
    // 로스 데이터가 있으면 작업자만 필수, 없으면 작업자+라인+생산품 필수
    if (!selectedWorker) {
      setError("작업자를 선택해주세요.");
      return;
    }

    if (!hasLossData && (!selectedLine || !selectedProduct)) {
      setError("라인, 생산품을 선택하거나, 불량 등록(로스)을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    const data: DefectCheckData = {
      worker: selectedWorker,
      line: selectedLine || "",
      productCode: selectedProduct?.productCode || "",
      productName: selectedProduct?.productName || "",
      packagingCode: packaging?.code || "",
      packagingName: packaging?.name || "",
      packagingLot: selectedLot,
      packagingDefect,
      boxCode: box?.code || "",
      boxName: box?.name || "",
      boxDefect,
      lossData,
      specialNote,
    };

    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        // 성공 모달 표시
        setShowSuccessModal(true);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "저장에 실패했습니다.");
      }
    } catch (err) {
      console.error("저장 실패:", err);
      setError("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 성공 모달 확인 클릭 시 페이지 새로고침
  const handleSuccessConfirm = () => {
    setShowSuccessModal(false);
    window.location.reload();
  };

  // 수량 포맷팅 (천 단위 콤마)
  const formatQuantity = (qty: string) => {
    const num = parseFloat(qty);
    if (isNaN(num)) return qty;
    return num.toLocaleString("ko-KR");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">데이터 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-8">
          불량체크일지
        </h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* 성공 모달 */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 mx-4 max-w-sm w-full shadow-2xl transform animate-bounce-once">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">저장 완료!</h2>
                <p className="text-gray-600 mb-6">불량체크 데이터가 저장되었습니다.</p>
                <button
                  onClick={handleSuccessConfirm}
                  className="w-full py-4 bg-green-500 text-white font-bold text-lg rounded-xl hover:bg-green-600 transition-colors"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. 작업자 */}
          <div className="bg-white p-4 rounded-lg shadow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              1. 작업자
            </label>
            <select
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">선택하세요</option>
              {workers.map((worker) => (
                <option key={worker} value={worker}>
                  {worker}
                </option>
              ))}
            </select>
          </div>

          {/* 2. 라인 */}
          <div className="bg-white p-4 rounded-lg shadow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              2. 라인
            </label>
            <select
              value={selectedLine}
              onChange={(e) => setSelectedLine(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">선택하세요</option>
              {LINE_OPTIONS.map((line) => (
                <option key={line} value={line}>
                  {line}
                </option>
              ))}
            </select>
          </div>

          {/* 3. 맛 선택 + 키워드 */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-2 gap-4">
              {/* 맛 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  3. 맛 선택
                </label>
                <select
                  value={selectedFlavor}
                  onChange={(e) => setSelectedFlavor(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {availableFlavors.map((flavor) => {
                    // 키워드 필터 기준으로 카운트
                    const count = keywordFilteredProducts.filter(p => p.productName.includes(flavor)).length;
                    return (
                      <option key={flavor} value={flavor}>
                        {flavor} {flavor !== "전체" && `(${count})`}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* 키워드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  키워드
                </label>
                <select
                  value={selectedKeyword}
                  onChange={(e) => setSelectedKeyword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {availableKeywords.map((keyword) => {
                    // 맛 필터 기준으로 카운트
                    const count = flavorFilteredProducts.filter(p => p.productName.includes(keyword)).length;
                    return (
                      <option key={keyword} value={keyword}>
                        {keyword} {keyword !== "전체" && `(${count})`}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* 4. 생산품 선택 */}
          <div className="bg-white p-4 rounded-lg shadow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              4. 생산품 선택 ({filteredProducts.length}개)
            </label>
            <select
              value={selectedProduct?.productCode || ""}
              onChange={(e) => {
                const product = products.find(
                  (p) => p.productCode === e.target.value
                );
                setSelectedProduct(product || null);
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">선택하세요</option>
              {filteredProducts.map((product) => (
                <option key={product.productCode} value={product.productCode}>
                  {product.productCode} / {product.productName}{product.category ? ` [${product.category}]` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* 포장지 섹션 */}
          {selectedProduct && (
            <div className="bg-blue-50 p-4 rounded-lg shadow space-y-4">
              <h2 className="text-lg font-semibold text-blue-800">포장지</h2>

              {/* 5. 포장지 자동선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  5. 포장지 (자동)
                </label>
                <div className="p-3 bg-gray-100 rounded-lg text-gray-700">
                  {packaging
                    ? `${packaging.code} / ${packaging.name}`
                    : "포장지 정보 없음"}
                </div>
              </div>

              {/* 6. 포장지 로트 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  6. 포장지 로트
                </label>
                <select
                  value={selectedLot}
                  onChange={(e) => setSelectedLot(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  disabled={serialLots.length === 0}
                >
                  <option value="">선택하세요</option>
                  {serialLots.map((lot, index) => (
                    <option
                      key={index}
                      value={lot.lotNumber}
                      className={index % 2 === 0 ? "bg-blue-50" : "bg-white"}
                    >
                      로트: {lot.lotNumber}  |  수량: {formatQuantity(lot.stockQuantity)} ea
                    </option>
                  ))}
                </select>
                {/* 선택된 로트 정보 표시 */}
                {selectedLot && (
                  <div className="mt-2 p-3 bg-blue-100 rounded-lg border-l-4 border-blue-500">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-800 font-medium">
                        로트: <span className="text-blue-900 font-bold">{selectedLot}</span>
                      </span>
                      <span className="text-green-700 font-medium">
                        수량: <span className="text-green-800 font-bold">
                          {formatQuantity(serialLots.find(l => l.lotNumber === selectedLot)?.stockQuantity || "0")} ea
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 7. 포장지 불량 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  7. 포장지 불량
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">실링불량</label>
                    <input
                      type="number"
                      min="0"
                      value={packagingDefect.sealingDefect || ""}
                      onChange={(e) =>
                        setPackagingDefect({
                          ...packagingDefect,
                          sealingDefect: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">중량불량</label>
                    <input
                      type="number"
                      min="0"
                      value={packagingDefect.weightDefect || ""}
                      onChange={(e) =>
                        setPackagingDefect({
                          ...packagingDefect,
                          weightDefect: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">날인불량</label>
                    <input
                      type="number"
                      min="0"
                      value={packagingDefect.printDefect || ""}
                      onChange={(e) =>
                        setPackagingDefect({
                          ...packagingDefect,
                          printDefect: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">자체불량</label>
                    <input
                      type="number"
                      min="0"
                      value={packagingDefect.selfDefect || ""}
                      onChange={(e) =>
                        setPackagingDefect({
                          ...packagingDefect,
                          selfDefect: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 박스 섹션 */}
          {selectedProduct && (
            <div className="bg-amber-50 p-4 rounded-lg shadow space-y-4">
              <h2 className="text-lg font-semibold text-amber-800">박스</h2>

              {/* 8. 박스 자동선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  8. 박스 (자동)
                </label>
                <div className="p-3 bg-gray-100 rounded-lg text-gray-700">
                  {box ? `${box.code} / ${box.name}` : "박스 정보 없음"}
                </div>
              </div>

              {/* 9. 박스 불량 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  9. 박스 불량
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">박스오염</label>
                    <input
                      type="number"
                      min="0"
                      value={boxDefect.contamination || ""}
                      onChange={(e) =>
                        setBoxDefect({
                          ...boxDefect,
                          contamination: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">파손</label>
                    <input
                      type="number"
                      min="0"
                      value={boxDefect.damage || ""}
                      onChange={(e) =>
                        setBoxDefect({
                          ...boxDefect,
                          damage: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">날인불량</label>
                    <input
                      type="number"
                      min="0"
                      value={boxDefect.printDefect || ""}
                      onChange={(e) =>
                        setBoxDefect({
                          ...boxDefect,
                          printDefect: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">기타</label>
                    <input
                      type="number"
                      min="0"
                      value={boxDefect.other || ""}
                      onChange={(e) =>
                        setBoxDefect({
                          ...boxDefect,
                          other: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 10. 불량 등록 (로스) */}
          <div className="bg-rose-50 p-4 rounded-lg shadow space-y-4">
            <h2 className="text-lg font-semibold text-rose-800">10. 불량 등록</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  생산시_가공로스
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={lossData.productionLoss}
                    onChange={(e) =>
                      setLossData({ ...lossData, productionLoss: e.target.value })
                    }
                    className="w-full p-3 pr-12 border border-gray-300 rounded-lg"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    kg
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  배합_청소로스
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={lossData.mixingLoss}
                    onChange={(e) =>
                      setLossData({ ...lossData, mixingLoss: e.target.value })
                    }
                    className="w-full p-3 pr-12 border border-gray-300 rounded-lg"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    kg
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 11. 특이사항 */}
          <div className="bg-white p-4 rounded-lg shadow space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">11. 특이사항</h2>
            <div>
              <label className="block text-sm text-gray-600 mb-1">내용</label>
              <input
                type="text"
                value={specialNote.content}
                onChange={(e) =>
                  setSpecialNote({ ...specialNote, content: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg"
                placeholder="내용을 입력하세요"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                개선조치사항
              </label>
              <input
                type="text"
                value={specialNote.improvement}
                onChange={(e) =>
                  setSpecialNote({ ...specialNote, improvement: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg"
                placeholder="개선조치사항을 입력하세요"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                완료여부
              </label>
              <input
                type="text"
                value={specialNote.completionStatus}
                onChange={(e) =>
                  setSpecialNote({
                    ...specialNote,
                    completionStatus: e.target.value,
                  })
                }
                className="w-full p-3 border border-gray-300 rounded-lg"
                placeholder="완료여부를 입력하세요"
              />
            </div>
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "저장 중..." : "제출"}
          </button>
        </form>
      </div>
    </div>
  );
}
