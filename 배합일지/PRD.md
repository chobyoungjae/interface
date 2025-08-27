# BOM 기반 생산기록 시스템 PRD

## 1. 프로젝트 개요

### 1.1 목적

기존 구글 설문지 방식의 생산 데이터 수집을 자동화된 BOM(Bill of Materials) 기반 시스템으로 대체하여 생산 효율성을 향상시키고 입력 오류를 최소화합니다.

### 1.2 핵심 가치 제안

- **자동화**: 제품명 선택만으로 필요한 원재료 정보 자동 생성
- **정확성**: BOM 데이터 기반 비례 계산으로 계산 오류 방지
- **효율성**: 수동 입력 최소화로 작업 시간 단축
- **추적성**: 모든 원재료의 날짜와 로트 정보 체계적 관리

### 1.3 성공 지표

- 데이터 입력 시간 70% 단축
- 계산 오류 95% 감소
- 사용자 만족도 8/10 이상
- 시스템 가동률 99% 이상

## 2. 현재 상황 분석

### 2.1 기존 방식의 문제점

- 구글 설문지를 통한 수동 데이터 입력
- 원재료 중량 계산 오류 빈발
- 데이터 일관성 부족
- 입력 시간 과다 소요

### 2.2 데이터 환경

**BOM 스프레드시트**

- ID: `1WlabNwKwMWW-cKA_go2Q680g3S7wYDpb5iCzE_YIZdM`
- 구조: 동일 제품이 여러 행에 분산된 형태
- 그룹핑 기준: 생산품목코드(A) + 생산품목명(B) + 생산수량(E)

**저장 스프레드시트**

- ID: `1DJyHnnLDQmiZEnGXr1nIpTZ1orFhDyXUuZEe9hpKAwQ`
- 구조: 1행에 모든 데이터를 수평으로 나열

## 3. 사용자 워크플로우

### 3.1 주요 사용자

- **1차 사용자**: 생산 현장 작업자
- **2차 사용자**: 생산 관리자
- **3차 사용자**: 품질 관리 담당자

### 3.2 사용 시나리오

```
1. 작업자가 시스템에 접속
2. 제품명을 드롭다운에서 선택 (예: 310013_미스터 떡볶이소스 순한맛_분체품)
3. 생산할 중량 입력 (예: 230kg)
4. 시스템이 자동으로 원재료 목록과 계산된 중량 표시
5. 각 원재료별로 날짜와 로트 정보 입력
6. 데이터 검증 후 제출
7. 저장 스프레드시트에 1행으로 데이터 저장
```

### 3.3 인터페이스 구조

```
┌─────────────────────────────────────────┐
│ 제품명: [드롭다운: 310013_미스터떡볶이...]  │
│ 입력중량: [230] kg                        │
├─────────────────────────────────────────┤
│ 원재료 목록 (자동 생성)                   │
│ 1. 500002: 130kg  📅[2024-01-15] 📝[LOT001] │
│ 2. 500004: 60kg   📅[2024-01-15] 📝[LOT002] │
│ 3. 500007: 8kg    📅[2024-01-15] 📝[LOT003] │
│ 4. 500008: 32kg   📅[2024-01-15] 📝[LOT004] │
├─────────────────────────────────────────┤
│              [제출하기]                   │
└─────────────────────────────────────────┘
```

## 4. 기능 요구사항

### 4.1 핵심 기능

#### 4.1.1 BOM 데이터 처리 (우선순위: 높음)

**요구사항**:

- BOM 스프레드시트에서 제품별 그룹 식별
- 동일한 생산품목코드+생산품목명+생산수량 조합으로 그룹핑
- 각 그룹의 소모품목코드와 소모수량 매핑

**기술적 구현**:

```javascript
// 그룹 식별 로직 예시
const groupProducts = (bomData) => {
  const groups = {};
  bomData.forEach((row) => {
    const key = `${row.productCode}_${row.productName}_${row.baseQuantity}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push({
      materialCode: row.materialCode,
      materialQuantity: row.materialQuantity,
    });
  });
  return groups;
};
```

#### 4.1.2 비례 계산 엔진 (우선순위: 높음)

**계산 공식**:

```
계산된소모수량 = (입력중량 / 기준생산수량) × 원래소모수량
```

**예시**:

- 기준: 115kg 생산 시 500002 코드 65kg 필요
- 입력: 230kg 생산
- 계산: (230/115) × 65 = 130kg

#### 4.1.3 동적 UI 생성 (우선순위: 중간)

- 선택된 제품의 소모품목 개수에 따라 입력 필드 자동 생성
- 실시간 중량 계산 및 표시
- 반응형 레이아웃 지원

### 4.2 데이터 입력 기능

#### 4.2.1 제품 선택 (우선순위: 높음)

- 검색 가능한 드롭다운
- "생산품목코드\_생산품목명" 형태로 표시
- 자동완성 기능

#### 4.2.2 날짜 입력 (우선순위: 중간)

- 구글 설문지 스타일 캘린더 위젯
- 기본값: 당일 날짜
- 날짜 형식 검증

#### 4.2.3 로트 입력 (우선순위: 중간)

- 단답형 텍스트 입력
- 영숫자 조합 허용
- 필수 입력 검증

### 4.3 데이터 저장 기능 (우선순위: 높음)

**저장 형태**:

```
[제품코드][제품명][생산중량][소모품목1코드][소모품목1중량][날짜1][로트1][소모품목2코드][소모품목2중량][날짜2][로트2]...
```

## 5. 기술적 요구사항

### 5.1 Google Sheets API 설정

#### 5.1.1 인증 방식

**서비스 계정 방식 권장**:

1. Google Cloud Console에서 프로젝트 생성
2. Google Sheets API 활성화
3. 서비스 계정 생성 및 JSON 키 다운로드
4. 서비스 계정 이메일을 두 스프레드시트에 편집자로 공유

#### 5.1.2 권한 설정 가이드

```bash
# 1. BOM 스프레드시트 공유
# - 스프레드시트 열기
# - 우상단 "공유" 클릭
# - 서비스 계정 이메일 입력 (예: production-system@project.iam.gserviceaccount.com)
# - 권한: 편집자
# - "전송" 클릭

# 2. 저장 스프레드시트도 동일하게 설정
```

### 5.2 환경 변수 설정

#### 5.2.1 .env 파일 구성

```bash
# Google Sheets API
GOOGLE_SERVICE_ACCOUNT_EMAIL=production-system@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_ID=123456789
GOOGLE_CLIENT_EMAIL=production-system@project.iam.gserviceaccount.com

# 스프레드시트 ID
BOM_SPREADSHEET_ID=1WlabNwKwMWW-cKA_go2Q680g3S7wYDpb5iCzE_YIZdM
STORAGE_SPREADSHEET_ID=1DJyHnnLDQmiZEnGXr1nIpTZ1orFhDyXUuZEe9hpKAwQ

# 애플리케이션 설정
PORT=3000
NODE_ENV=production
```

### 5.3 데이터 처리 로직

#### 5.3.1 BOM 데이터 읽기

```javascript
const { GoogleSpreadsheet } = require("google-spreadsheet");

class BOMService {
  async loadBOMData() {
    const doc = new GoogleSpreadsheet(process.env.BOM_SPREADSHEET_ID);
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY,
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    return this.groupBOMData(rows);
  }

  groupBOMData(rows) {
    const groups = new Map();
    rows.forEach((row) => {
      const key = `${row.A}_${row.B}_${row.E}`;
      if (!groups.has(key)) {
        groups.set(key, {
          productCode: row.A,
          productName: row.B,
          baseQuantity: parseFloat(row.E),
          materials: [],
        });
      }
      groups.get(key).materials.push({
        code: row.F,
        quantity: parseFloat(row.I),
      });
    });
    return Array.from(groups.values());
  }
}
```

#### 5.3.2 데이터 저장 로직

```javascript
class StorageService {
  async saveProductionData(productionData) {
    const doc = new GoogleSpreadsheet(process.env.STORAGE_SPREADSHEET_ID);
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY,
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    const rowData = this.flattenProductionData(productionData);
    await sheet.addRow(rowData);
  }

  flattenProductionData(data) {
    const flattened = [data.productCode, data.productName, data.inputWeight];

    data.materials.forEach((material) => {
      flattened.push(
        material.code,
        material.calculatedWeight,
        material.date,
        material.lot
      );
    });

    return flattened;
  }
}
```

### 5.4 Claude Code 구현 방향

#### 5.4.1 프로젝트 구조

```
production-system/
├── .env
├── package.json
├── src/
│   ├── app.js
│   ├── services/
│   │   ├── bomService.js
│   │   └── storageService.js
│   ├── routes/
│   │   └── production.js
│   └── public/
│       ├── index.html
│       ├── style.css
│       └── script.js
└── README.md
```

#### 5.4.2 기술 스택

- **백엔드**: Node.js + Express
- **프론트엔드**: Vanilla JavaScript + HTML5 + CSS3
- **API**: Google Sheets API v4
- **인증**: Google Service Account
- **배포**: Claude Code 환경

## 6. UI/UX 요구사항

### 6.1 디자인 원칙

- **단순성**: 생산 현장에서 빠르게 사용 가능
- **명확성**: 모든 정보가 한눈에 파악 가능
- **일관성**: 기존 작업 패턴과의 호환성
- **접근성**: 터치 친화적 인터페이스

### 6.2 구체적 요구사항

#### 6.2.1 제품 선택 (우선순위: 높음)

- 드롭다운 메뉴 + 검색 기능
- 최대 10개 항목까지 표시
- 타이핑 시 실시간 필터링
- 키보드 네비게이션 지원

#### 6.2.2 중량 입력 (우선순위: 높음)

- 숫자만 입력 가능
- 소수점 2자리까지 허용
- 단위(kg) 자동 표시
- 범위 검증 (1-10000kg)

#### 6.2.3 원재료 표시 (우선순위: 중간)

- 카드 형태의 레이아웃
- 원재료코드와 계산된 중량 강조 표시
- 색상 코딩으로 입력 상태 구분
- 입력 완료 시 체크마크 표시

#### 6.2.4 반응형 디자인 (우선순위: 낮음)

- 모바일: 세로 스크롤 레이아웃
- 태블릿: 2열 그리드 레이아웃
- 데스크톱: 3열 그리드 레이아웃

### 6.3 사용성 테스트 계획

1. **A/B 테스트**: 드롭다운 vs 검색창
2. **사용자 인터뷰**: 현장 작업자 5명
3. **태스크 완료 시간 측정**: 기존 대비 개선도
4. **오류율 분석**: 입력 실수 빈도

## 7. 데이터 구조 및 검증

### 7.1 입력 데이터 검증

#### 7.1.1 필수 필드 검증

```javascript
const validateProductionData = (data) => {
  const errors = [];

  if (!data.productCode) errors.push("제품 선택 필수");
  if (!data.inputWeight || data.inputWeight <= 0) errors.push("중량 입력 필수");

  data.materials.forEach((material, index) => {
    if (!material.date) errors.push(`원재료 ${index + 1} 날짜 필수`);
    if (!material.lot) errors.push(`원재료 ${index + 1} 로트 필수`);
  });

  return errors;
};
```

#### 7.1.2 데이터 타입 검증

- 중량: 숫자형, 양수
- 날짜: YYYY-MM-DD 형식
- 로트: 문자열, 50자 이내

### 7.2 오류 처리 시나리오

#### 7.2.1 BOM 데이터 오류 (우선순위: 높음)

- **상황**: BOM 스프레드시트에서 제품 정보를 찾을 수 없음
- **처리**: 오류 메시지 표시 + 관리자 알림
- **복구**: 수동 입력 모드 제공

#### 7.2.2 API 연결 실패 (우선순위: 높음)

- **상황**: Google Sheets API 호출 실패
- **처리**: 재시도 로직 (최대 3회)
- **복구**: 로컬 저장 후 나중에 동기화

#### 7.2.3 계산 오류 (우선순위: 중간)

- **상황**: 비례 계산 결과가 비정상적
- **처리**: 경고 메시지 + 수동 확인 요청
- **복구**: 기본값 제공 + 수정 가능

## 8. 보안 및 접근 권한

### 8.1 인증 및 권한 (향후 개발)

- **현재**: 개방형 접근 (사내 네트워크 내)
- **추후**: 사용자 인증 시스템 도입 예정

### 8.2 데이터 보안

- 환경 변수를 통한 민감 정보 관리
- HTTPS 통신 (배포 시)
- API 키 순환 정책

## 9. 성능 요구사항

### 9.1 응답 시간

- **제품 목록 로딩**: 2초 이내
- **원재료 계산**: 1초 이내
- **데이터 저장**: 3초 이내

### 9.2 동시 사용자

- **현재**: 최대 5명 동시 접속
- **확장성**: 수평 스케일링 고려

## 10. 테스트 전략

### 10.1 단위 테스트

- BOM 데이터 그룹핑 로직
- 비례 계산 알고리즘
- 데이터 검증 함수

### 10.2 통합 테스트

- Google Sheets API 연동
- 전체 워크플로우 테스트
- 오류 시나리오 테스트

### 10.3 사용자 승인 테스트

- 실제 생산 환경에서의 파일럿 테스트
- 현장 작업자 피드백 수집
- 성능 및 정확성 검증

## 11. 배포 및 운영

### 11.1 배포 계획

1. **개발 환경**: Claude Code로 로컬 개발
2. **테스트 환경**: 사내 서버에 배포
3. **운영 환경**: 클라우드 서비스 배포

### 11.2 모니터링

- API 호출 로그
- 오류 발생 추적
- 사용자 활동 분석

## 12. 일정 및 마일스톤

### 12.1 개발 일정 (총 4주)

**Week 1: 기반 구축**

- Google Sheets API 연동
- BOM 데이터 읽기 기능
- 기본 UI 구조

**Week 2: 핵심 기능**

- 제품 선택 드롭다운
- 비례 계산 엔진
- 동적 UI 생성

**Week 3: 데이터 처리**

- 입력 검증 로직
- 데이터 저장 기능
- 오류 처리

**Week 4: 테스트 및 배포**

- 통합 테스트
- 사용자 테스트
- 배포 준비

### 12.2 성공 기준

- 모든 핵심 기능 정상 작동
- 계산 정확도 99.9% 이상
- 사용자 만족도 8/10 이상
- 시스템 안정성 99% 이상

---

이 PRD는 BOM 기반 생산기록 시스템의 완전한 개발 가이드라인을 제공합니다. Claude Code 환경에서 단계별로 구현하여 생산 현장의 효율성을 크게 향상시킬 수 있을 것입니다.
