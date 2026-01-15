# 불량체크일지 프로젝트

## 프로젝트 개요
제조 공정의 불량 체크를 관리하는 웹 입력 시스템입니다.
BOM 데이터를 참조하여 제품 정보를 가져오고, 불량 데이터를 Google Sheets에 저장합니다.

---

## 용어 정리 및 시트 구조

### 1. 데이터 저장 시트
- **스프레드시트 URL**: https://docs.google.com/spreadsheets/d/10zoJnnRuQQDh_VYR5QdVPjjH_Wg4VEcr9t_E-ytp0iQ/edit?usp=sharing
- **스프레드시트 ID**: `10zoJnnRuQQDh_VYR5QdVPjjH_Wg4VEcr9t_E-ytp0iQ`

#### 하위 시트 구조
| 시트명 | 용도 | 설명 |
|--------|------|------|
| 시트1 | **데이터 저장** | 웹에서 입력한 불량 데이터가 저장되는 곳 |
| B시트 | **참고 데이터** | 고정값, 드롭다운 옵션 등 참고용 데이터 |

### 2. BOM 데이터
- **위치**: 환경변수(.env)에 BOM_SPREADSHEET_ID로 설정
- **스프레드시트 ID**: `1WlabNwKwMWW-cKA_go2Q680g3S7wYDpb5iCzE_YIZdM`
- **용도**: 제품 정보 조회 (생산품목코드, 생산품목명 등)

---

## 환경 변수 설정

```env
# BOM 데이터 시트 (제품 정보 조회용)
BOM_SPREADSHEET_ID="1WlabNwKwMWW-cKA_go2Q680g3S7wYDpb5iCzE_YIZdM"

# 불량체크일지 저장 시트
STORAGE_SPREADSHEET_ID="10zoJnnRuQQDh_VYR5QdVPjjH_Wg4VEcr9t_E-ytp0iQ"

# Google 서비스 계정 인증
GOOGLE_SERVICE_ACCOUNT_EMAIL="서비스계정이메일"
GOOGLE_PRIVATE_KEY="서비스계정키"
```

---

## 입력 필드 및 저장 구조

(추가 예정 - 사용자가 알려줄 내용)

---

## 참고 프로젝트
- `배합일지/production-system/`: 참고용 (수정 금지)
- 유사한 구조로 Next.js + TypeScript + Tailwind CSS 사용
