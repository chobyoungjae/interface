# 개발 가이드라인

## 1. Google Sheets API 연동 시 필수 주의사항

### 1.1 데이터 읽기 방법

**❌ 절대 금지**: 열 인덱스 사용
```javascript
// 이렇게 하면 빈 데이터 반환됨
row.get('A')  // ❌
row.get('B')  // ❌
```

**✅ 올바른 방법**: 실제 헤더명 사용
```javascript
// 실제 스프레드시트의 한글 헤더명 사용
row.get('생산품목코드')  // ✅
row.get('생산품목명')    // ✅
row.get('생산수량')      // ✅
row.get('소모품목코드')  // ✅
row.get('소모품목명')    // ✅
row.get('소모수량')      // ✅
```

### 1.2 개발 전 필수 확인사항

1. **스프레드시트 헤더 구조 확인**
   - 실제 Google Sheets에서 1행의 헤더명 정확히 확인
   - 한글/영문/특수문자 정확한 매칭 필요
   
2. **테스트 데이터로 먼저 검증**
   - mockData 기반으로 UI 먼저 완성
   - API 연동은 마지막 단계에서 진행

## 2. TypeScript/ESLint 오류 방지

### 2.1 개발 환경 설정

**필수**: 개발 초기부터 strict 모드 적용
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 2.2 타입 정의 가이드라인

**❌ 금지**: `any` 타입 사용
```typescript
export async function GET(): Promise<any[]>  // ❌
```

**✅ 권장**: 명시적 타입 정의
```typescript
export async function GET(): Promise<NextResponse<unknown[]>>  // ✅
```

### 2.3 일일 빌드 테스트

매일 개발 종료 전 반드시 실행:
```bash
npm run build
npm run lint
```

## 3. React 컴포넌트 개발

### 3.1 CSS 포지셔닝 주의사항

드롭다운/모달 등 절대 위치 요소 사용 시:
```tsx
// ❌ 문제 발생
<div className="w-full">  
  <div className="absolute z-10">  // 부모에 relative 없음

// ✅ 올바른 구조
<div className="relative w-full">  // relative 필수
  <div className="absolute z-10">
```

### 3.2 사용하지 않는 코드 처리

```tsx
// ❌ ESLint 오류 발생
function Component({ data, unusedProp }) {

// ✅ 주석 처리로 의도 명시
function Component({ 
  data, 
  // unusedProp, // 향후 사용 예정
}) {
```

## 4. API 오류 처리 패턴

### 4.1 폴백 시스템 필수 구현

모든 API 호출에 폴백 메커니즘 적용:
```typescript
export async function GET() {
  try {
    // 실제 API 호출
    const data = await externalAPI.getData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API 호출 실패:', error);
    // 폴백 데이터로 서비스 연속성 보장
    return NextResponse.json(mockData);
  }
}
```

### 4.2 상세한 오류 로깅

```typescript
catch (error) {
  console.error('구체적인 오류 상황:', error);
  console.log('디버깅 정보:', { 요청값, 기대결과, 실제결과 });
}
```

## 5. 개발 워크플로우

### 5.1 프로젝트 시작 시 체크리스트

- [ ] 외부 데이터 소스 구조 사전 확인
- [ ] TypeScript strict 모드 설정
- [ ] ESLint 엄격 규칙 적용
- [ ] 환경 변수 템플릿 준비
- [ ] mockData 기반 개발 환경 구축

### 5.2 개발 중 일일 체크리스트

- [ ] `npm run build` 성공 확인
- [ ] `npm run lint` 오류 해결
- [ ] 새로운 컴포넌트 독립 테스트
- [ ] Git commit 전 변경사항 검토

### 5.3 배포 전 최종 체크리스트

- [ ] 모든 TypeScript/ESLint 오류 해결
- [ ] 프로덕션 환경 전체 워크플로우 테스트
- [ ] 오류 로그 모니터링 설정 확인
- [ ] API 키 및 환경 변수 정상 작동 확인

## 6. 문제 해결 가이드

### 6.1 Google Sheets 데이터 읽기 실패

**증상**: 빈 배열 또는 undefined 반환
**해결책**: 
1. 실제 스프레드시트의 헤더명 재확인
2. `row.get()` 매개변수를 정확한 헤더명으로 수정

### 6.2 드롭다운/모달이 표시되지 않음

**증상**: 클릭해도 요소가 나타나지 않음
**해결책**: 
1. 부모 컨테이너에 `relative` 클래스 추가
2. 절대 위치 요소에 `z-index` 적절히 설정

### 6.3 빌드는 실패하지만 개발서버는 정상

**증상**: `npm run dev`는 되는데 `npm run build` 실패
**해결책**:
1. 모든 `any` 타입을 명시적 타입으로 변경
2. 사용하지 않는 변수/임포트 제거 또는 주석 처리
3. TypeScript 설정을 개발 환경에서도 엄격하게 적용

## 7. 성능 최적화 가이드

### 7.1 Google Sheets API 호출 최적화

- 불필요한 API 호출 최소화
- 캐싱 메커니즘 고려
- 대용량 데이터 처리 시 페이징 적용

### 7.2 React 컴포넌트 최적화

- `useMemo`와 `useCallback` 적절히 활용
- 불필요한 리렌더링 방지
- 컴포넌트 분리로 성능 향상

이 가이드라인을 따르면 이번에 발생했던 주요 오류들을 예방하고, 안정적인 개발 환경을 구축할 수 있습니다.