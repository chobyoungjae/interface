# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 필요한 가이드를 제공합니다.

## 프로젝트 개요

**BOM 기반 생산기록 시스템** - 제조 공정의 배합 및 원재료 추적을 관리하는 BOM(Bill of Materials) 기반 생산 기록 시스템입니다.

구글 설문지를 통한 수동 데이터 수집을 BOM 기반 자동 계산 시스템으로 대체하여, 제품 선택만으로 필요한 원재료 정보를 자동 생성합니다.

## 프로젝트 구조

메인 애플리케이션은 `배합일지/production-system/` 디렉토리에 위치하며, Next.js 15.5.2, TypeScript, Tailwind CSS로 구축되었습니다.

## 개발 명령어

먼저 `배합일지/production-system/` 디렉토리로 이동:

```bash
# Turbopack으로 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm start

# 린터 실행
npm run lint
```

## 아키텍처 개요

### 프론트엔드 (React/Next.js)
- **메인 페이지** (`app/page.tsx`): 제품 선택, 중량 계산, 원재료 관리가 포함된 생산 데이터 입력 인터페이스
- **컴포넌트**:
  - `ProductSelector`: 검색 가능한 제품 선택 드롭다운
  - `MaterialCard`: 시리얼 로트와 재고 수량 입력이 포함된 개별 원재료 입력 카드

### 백엔드 (API 라우트)
- `/api/products`: 구글 시트에서 그룹화된 BOM 데이터 조회
- `/api/calculate`: 입력 중량에 따른 원재료 수량 계산
- `/api/save`: 저장 스프레드시트에 생산 데이터 저장
- `/api/serial-lot`: 시리얼 로트 참조 데이터 조회

### 데이터 서비스
- **GoogleSheetsService** (`lib/googleSheets.ts`): 구글 시트 API 작업을 위한 싱글톤 서비스
- **BOMService** (`lib/bomService.ts`): BOM 데이터 처리 및 그룹화 로직
- **MockData** (`lib/mockData.ts`): 테스트용 대체 데이터

### 타입 정의
- `types/index.ts`: BOMRawData, Material, Product, ProductionData를 위한 TypeScript 인터페이스

## 구글 시트 연동

### 필수 환경 변수 (.env.local)
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
BOM_SPREADSHEET_ID=1WlabNwKwMWW-cKA_go2Q680g3S7wYDpb5iCzE_YIZdM
STORAGE_SPREADSHEET_ID=1DJyHnnLDQmiZEnGXr1nIpTZ1orFhDyXUuZEe9hpKAwQ
```

### 스프레드시트 구조
- **BOM 시트**: 생산품목코드(A) + 생산품목명(B) + 생산수량(E)으로 그룹화된 제품
- **저장 시트**: 동적 헤더 확장이 가능한 가로 데이터 저장
- **시리얼로트 시트**: 시리얼 로트와 재고 수량 참조 데이터

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

## 도메인 특화 용어

- **배합일지**: 배합 기록 / 제조 기록부
- **생산품목**: 생산되는 최종 제품
- **소모품목**: 소비되는 원재료
- **시리얼로트**: 제품 일련번호/로트 번호
- **재고수량**: 현재 보유 중인 원재료 수량
- **소비기한**: 제품 유효기간 (기본값: 오늘 + 14개월 - 1일)

## 주요 구현 세부사항

- 중량 단위: UI는 그램(g)으로 표시, 내부적으로는 킬로그램(kg)으로 저장
- 원재료 복제: 사용자는 여러 로트 처리를 위해 원재료 항목을 복사/삭제 가능
- 동적 헤더: 저장 시트는 필요에 따라 자동으로 열 확장
- 에러 처리: 필수 필드와 API 실패에 대한 포괄적인 검증
- Mock 데이터 대체: 구글 시트를 사용할 수 없을 때 mockData.ts 사용