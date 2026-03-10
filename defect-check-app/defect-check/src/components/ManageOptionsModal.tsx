"use client";

import { useState, useMemo } from "react";

interface ManageOptionsModalProps {
  title: string;
  options: string[];
  isOpen: boolean;
  onClose: () => void;
  onAdd: (value: string) => Promise<void>;
  onDelete: (value: string) => Promise<void>;
}

export default function ManageOptionsModal({
  title,
  options,
  isOpen,
  onClose,
  onAdd,
  onDelete,
}: ManageOptionsModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [newValue, setNewValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    return options.filter((opt) =>
      opt.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  if (!isOpen) return null;

  const handleAdd = async () => {
    const trimmed = newValue.trim();
    if (!trimmed) return;
    if (options.includes(trimmed)) {
      alert("이미 존재하는 옵션입니다.");
      return;
    }
    setIsAdding(true);
    try {
      await onAdd(trimmed);
      setNewValue("");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) {
      alert("삭제할 항목을 선택해주세요.");
      return;
    }
    if (!confirm(`"${selectedItem}" 을(를) 삭제하시겠습니까?`)) return;
    setIsDeleting(true);
    try {
      await onDelete(selectedItem);
      setSelectedItem(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm overflow-hidden">
        {/* 타이틀바 */}
        <div className="bg-blue-600 px-4 py-3 rounded-t-2xl flex items-center justify-between">
          <span className="text-white font-semibold">{title}</span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            &times;
          </button>
        </div>

        {/* 검색 */}
        <div className="p-3 flex gap-2 border-b border-gray-200">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="입력 후 [Enter]"
            className="flex-1 p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={() => setSearchTerm("")}
            className="px-4 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600"
          >
            검색
          </button>
        </div>

        {/* 테이블 헤더 */}
        <div className="flex bg-gray-100 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
          <div className="w-14 text-center py-2 border-r border-gray-200">No.</div>
          <div className="flex-1 py-2 px-4">옵션명</div>
        </div>

        {/* 목록 */}
        <div className="overflow-y-auto max-h-[45vh]">
          {filteredOptions.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              {searchTerm ? "검색 결과가 없습니다." : "등록된 항목이 없습니다."}
            </div>
          ) : (
            filteredOptions.map((option, index) => (
              <div
                key={option}
                onClick={() => setSelectedItem(option)}
                className={`flex items-center border-b border-gray-100 text-sm cursor-pointer transition-colors ${
                  selectedItem === option
                    ? "bg-blue-100"
                    : index % 2 === 0
                    ? "bg-white hover:bg-gray-50"
                    : "bg-gray-50/50 hover:bg-gray-100"
                }`}
              >
                <div className="w-14 text-center py-2.5 text-gray-400 border-r border-gray-100 text-xs">
                  {index + 1}
                </div>
                <div className="flex-1 py-2.5 px-4 text-blue-700 font-medium">
                  {option}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 신규 추가 */}
        <div className="p-3 border-t border-gray-200 flex gap-2">
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="새 항목 입력"
            className="flex-1 p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 하단 버튼 - 스크린샷과 유사 */}
        <div className="px-3 pb-3 flex gap-2">
          <button
            onClick={handleAdd}
            disabled={isAdding || !newValue.trim()}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isAdding ? "추가중..." : "신규"}
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting || !selectedItem}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isDeleting ? "삭제중..." : "삭제"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-300"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
