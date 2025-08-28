# 배합일지 (BOM 기반 생산기록 시스템)

제조 공정의 배합 및 원재료 추적을 관리하는 BOM(Bill of Materials) 기반 생산 기록 시스템입니다.

구글 설문지를 통한 수동 데이터 수집을 BOM 기반 자동 계산 시스템으로 대체하여, 제품 선택만으로 필요한 원재료 정보를 자동 생성합니다.

## 주요 기능

- **제품 선택 및 BOM 데이터 조회**: Google Sheets에서 BOM 데이터를 가져와 제품별 원재료 정보 표시
- **자동 원재료 계산**: 입력된 생산 중량에 따라 필요한 원재료 수량을 자동 계산
- **원재료 관리**: 드롭다운 선택, 시리얼 로트 및 재고 수량 입력 기능
- **생산 데이터 저장**: Google Sheets에 생산 기록을 자동 저장

## 기술 스택

- **Frontend**: Next.js 15.5.2, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Google Sheets API 연동
- **Authentication**: Google Service Account

## 설치 및 실행

1. 의존성 설치:
```bash
npm install
```

2. 환경 변수 설정 (`.env.local`):
```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
BOM_SPREADSHEET_ID=your-bom-spreadsheet-id
STORAGE_SPREADSHEET_ID=your-storage-spreadsheet-id
```

3. 개발 서버 실행:
```bash
npm run dev
```

4. 프로덕션 빌드:
```bash
npm run build
npm start
```

## 핵심 비즈니스 로직

### 원재료 계산 공식
```
계산된소모수량 = (입력중량 / 기준생산수량) × 원래소모수량
```

### 데이터 흐름
1. 사용자가 드롭다운에서 제품 선택
2. 시스템이 BOM 데이터를 가져와 원재료 그룹화
3. 사용자가 생산 중량 입력 (그램 단위)
4. 시스템이 비례적으로 원재료 수량 계산
5. 사용자가 각 원재료의 시리얼 로트와 재고 수량 입력
6. 저장 스프레드시트에 한 줄 형식으로 데이터 저장

## 프로젝트 구조

```
production-system/
├── app/
│   ├── page.tsx              # 메인 생산 데이터 입력 페이지
│   ├── api/
│   │   ├── products/         # 제품 데이터 조회 API
│   │   ├── calculate/        # 원재료 수량 계산 API
│   │   ├── materials/        # 원재료 목록 조회 API
│   │   ├── serial-lot/       # 시리얼로트 데이터 조회 API
│   │   └── save/            # 생산 데이터 저장 API
├── components/
│   ├── ProductSelector.tsx   # 제품 선택 드롭다운
│   └── MaterialCard.tsx      # 원재료 입력 카드
├── lib/
│   ├── bomService.ts         # BOM 데이터 처리 서비스
│   ├── googleSheets.ts       # Google Sheets API 서비스
│   └── mockData.ts          # 테스트용 Mock 데이터
└── types/
    └── index.ts             # TypeScript 타입 정의
```

## 도메인 특화 용어

- **배합일지**: 배합 기록 / 제조 기록부
- **생산품목**: 생산되는 최종 제품
- **소모품목**: 소비되는 원재료
- **시리얼로트**: 제품 일련번호/로트 번호
- **재고수량**: 현재 보유 중인 원재료 수량
- **소비기한**: 제품 유효기간 (기본값: 오늘 + 14개월 - 1일)

## 주요 특징

- **단위 변환**: UI는 그램(g) 표시, 내부 계산은 킬로그램(kg)
- **동적 원재료 관리**: 사용자가 원재료 추가/삭제/변경 가능
- **Fallback 시스템**: Google Sheets API 실패 시 Mock 데이터 사용
- **동적 헤더**: 저장 시트는 필요에 따라 자동으로 열 확장
