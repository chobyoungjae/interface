"use client";

import { useState, useMemo } from "react";
import { Product } from "@/types";

interface ProductSelectorProps {
  products: Product[];
  selectedProduct: Product | null;
  onProductSelect: (product: Product) => void;
}

export default function ProductSelector({
  products,
  selectedProduct,
  onProductSelect,
}: ProductSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;

    return products.filter(
      (product) =>
        product.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const handleProductSelect = (product: Product) => {
    onProductSelect(product);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        제품 선택
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {selectedProduct ? (
          <span className="block truncate pr-8">
            {selectedProduct.productCode}_{selectedProduct.productName}
          </span>
        ) : (
          <span className="text-gray-500">제품을 선택하세요</span>
        )}

        <span className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <svg
            className={`w-4 h-4 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="p-3 border-b">
            <input
              type="text"
              placeholder="제품 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredProducts.length > 0 ? (
              filteredProducts.slice(0, 10).map((product, index) => (
                <button
                  key={`${product.productCode}-${index}`}
                  onClick={() => handleProductSelect(product)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 border-b last:border-b-0"
                >
                  <div className="font-medium text-gray-900">
                    {product.productCode}
                  </div>
                  <div className="text-sm text-gray-600">
                    {product.productName}
                  </div>
                  <div className="text-xs text-gray-500">
                    기준: {product.baseQuantity}kg
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-gray-500 text-center">
                검색 결과가 없습니다
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
