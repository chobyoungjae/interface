/**
 * Google Sheets 수식 인젝션 방지를 위한 문자열 sanitization
 * 셀에 저장되는 값이 수식으로 해석되지 않도록 처리
 */
export function sanitizeForSheets(value: string | number): string | number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value !== 'string') {
    return String(value);
  }

  // 빈 문자열은 그대로 반환
  if (!value.trim()) {
    return value;
  }

  // 수식으로 해석될 수 있는 문자로 시작하면 앞에 작은따옴표 추가
  const dangerousChars = ['=', '+', '-', '@', '\t', '\r', '\n'];
  if (dangerousChars.some((char) => value.startsWith(char))) {
    return `'${value}`;
  }

  return value;
}

/**
 * 배열의 모든 값을 sanitize
 */
export function sanitizeArrayForSheets(
  data: (string | number)[]
): (string | number)[] {
  return data.map((item) => sanitizeForSheets(item));
}

/**
 * HTML 특수문자 이스케이프 (XSS 방지)
 */
export function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}

/**
 * 입력 문자열 길이 제한
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength);
}

/**
 * 숫자 범위 검증
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number
): boolean {
  return !isNaN(value) && isFinite(value) && value >= min && value <= max;
}
