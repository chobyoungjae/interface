"use client";

import { useEffect } from "react";

interface DateMismatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DateMismatchModal({ isOpen, onClose }: DateMismatchModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">시리얼로트 업데이트 필요</h3>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              시리얼로트 시트의 날짜가 오늘 날짜와 다릅니다.
            </p>
            <p className="text-sm text-gray-500">
              정확한 데이터 사용을 위해 시리얼로트 정보를 업데이트해주세요.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                window.open('https://docs.google.com/spreadsheets/d/1DJyHnnLDQmiZEnGXr1nIpTZ1orFhDyXUuZEe9hpKAwQ/edit?gid=0#gid=0', '_blank');
              }}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
            >
              시트 열기
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
            >
              나중에
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}