"use client";

import { useState, useEffect } from "react";

interface CompanyInfoBannerProps {
  onDateMismatch: () => void;
}

export default function CompanyInfoBanner({ onDateMismatch }: CompanyInfoBannerProps) {
  const [companyInfo, setCompanyInfo] = useState<string>("");
  const [lastUpdateDate, setLastUpdateDate] = useState<string>("");

  useEffect(() => {
    loadCompanyInfo();
  }, []);

  const loadCompanyInfo = async () => {
    try {
      const response = await fetch('/api/serial-lot-info');
      const data = await response.json();
      
      if (data.companyInfo && data.lastUpdateDate) {
        setCompanyInfo(data.companyInfo);
        setLastUpdateDate(data.lastUpdateDate);
        
        // 날짜 비교
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const formattedToday = today.replace(/-/g, '/'); // YYYY/MM/DD
        
        if (data.lastUpdateDate !== formattedToday) {
          onDateMismatch();
        }
      }
    } catch (error) {
      console.error('회사 정보 로딩 실패:', error);
    }
  };

  if (!companyInfo) return null;

  return (
    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm">
        <div className="text-blue-800 font-medium mb-1 sm:mb-0">
          시리얼로트: {companyInfo}
        </div>
        {lastUpdateDate && (
          <div className="text-blue-600 text-xs sm:text-sm">
            업데이트: {lastUpdateDate}
          </div>
        )}
      </div>
    </div>
  );
}