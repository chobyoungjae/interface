/**
 * 불량체크일지 시트1 → ERP_excel 변환 스크립트
 *
 * 기능: 날짜 범위를 선택하여 시트1 데이터를 ERP_excel 형식으로 변환
 */

// ============================================
// 메뉴 생성
// ============================================

/**
 * 스프레드시트 열릴 때 커스텀 메뉴 추가
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🔧 불량 데이터 변환')
    .addItem('📅 날짜 선택하여 변환', 'showDatePickerDialog')
    .addSeparator()
    .addItem('🗑️ ERP_excel 데이터 초기화', 'clearERPExcel')
    .addToUi();
}

/**
 * 날짜 선택 다이얼로그 표시
 */
function showDatePickerDialog() {
  const html = HtmlService.createHtmlOutputFromFile('DatePickerDialog')
    .setWidth(400)
    .setHeight(300)
    .setTitle('날짜 범위 선택');
  SpreadsheetApp.getUi().showModalDialog(html, '📅 변환할 날짜 범위 선택');
}

// ============================================
// 데이터 변환 로직
// ============================================

/**
 * 시트1 데이터를 ERP_excel 형식으로 변환
 * @param {string} startDate - 시작 날짜 (yyyy-MM-dd)
 * @param {string} endDate - 종료 날짜 (yyyy-MM-dd)
 * @returns {Object} 결과 메시지
 */
function convertToERP(startDate, endDate) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sourceSheet = ss.getSheetByName('시트1');
    const targetSheet = ss.getSheetByName('ERP_excel');

    if (!sourceSheet || !targetSheet) {
      return { success: false, message: '시트1 또는 ERP_excel 시트를 찾을 수 없습니다.' };
    }

    const sourceData = sourceSheet.getDataRange().getValues();
    const dataRows = sourceData.slice(1);

    const start = parseDate(startDate);
    const end = parseDate(endDate);
    end.setHours(23, 59, 59, 999);

    const packagingDefectTypes = [
      { colIndex: 8, name: '포장지_실링불량' },
      { colIndex: 9, name: '포장지_중량불량' },
      { colIndex: 10, name: '포장지_날인불량' },
      { colIndex: 11, name: '자체불량' }
    ];

    const boxDefectTypes = [
      { colIndex: 14, name: '박스오염' },
      { colIndex: 15, name: '박스파손' },
      { colIndex: 16, name: '박스_날인불량' },
      { colIndex: 17, name: '기타' }
    ];

    const convertedRows = [];
    let processedCount = 0;
    let packagingDefectCount = 0;
    let boxDefectCount = 0;

    dataRows.forEach(row => {
      const timestamp = row[0];
      if (!timestamp) return;

      const rowDate = parseTimestamp(timestamp);
      if (!rowDate) return;

      if (rowDate < start || rowDate > end) return;

      const dateStr = formatDateToYYYYMMDD(rowDate);
      const worker = row[1];

      const packagingData = {
        code: row[5],
        name: row[6],
        lot: row[7]
      };

      const boxData = {
        code: row[12],
        name: row[13]
      };

      // 포장지 불량 처리
      packagingDefectTypes.forEach(defect => {
        const quantity = Number(row[defect.colIndex]) || 0;

        if (quantity > 0) {
          const erpRow = [
            dateStr,
            '',
            worker,
            '불출창고',
            1, // 🔥 처리방법을 숫자 1로 변경
            packagingData.code,
            packagingData.name,
            '',
            quantity,
            '',
            defect.name,
            '',
            packagingData.lot
          ];
          convertedRows.push(erpRow);
          packagingDefectCount++;
        }
      });

      // 박스 불량 처리
      boxDefectTypes.forEach(defect => {
        const quantity = Number(row[defect.colIndex]) || 0;

        if (quantity > 0) {
          const erpRow = [
            dateStr,
            '',
            worker,
            '불출창고',
            1, // 🔥 처리방법을 숫자 1로 변경
            boxData.code,
            boxData.name,
            '',
            quantity,
            '',
            defect.name,
            '',
            ''
          ];
          convertedRows.push(erpRow);
          boxDefectCount++;
        }
      });

      processedCount++;
    });

    if (convertedRows.length === 0) {
      return {
        success: true,
        message: `선택한 날짜 범위(${startDate} ~ ${endDate})에 변환할 데이터가 없습니다.`
      };
    }

    const lastRow = targetSheet.getLastRow();
    const startRow = lastRow + 1;

    targetSheet.getRange(startRow, 1, convertedRows.length, 13)
      .setValues(convertedRows);

    return {
      success: true,
      message:
        `✅ 변환 완료!\n\n` +
        `📅 기간: ${startDate} ~ ${endDate}\n` +
        `📊 처리된 원본 행: ${processedCount}건\n` +
        `📦 포장지 불량: ${packagingDefectCount}건\n` +
        `📦 박스 불량: ${boxDefectCount}건\n` +
        `📝 총 생성된 ERP 행: ${convertedRows.length}건`
    };

  } catch (error) {
    return { success: false, message: `오류 발생: ${error.message}` };
  }
}

// ============================================
// 유틸리티 함수
// ============================================

function parseTimestamp(timestamp) {
  if (timestamp instanceof Date) {
    return timestamp;
  }

  if (typeof timestamp === 'string') {
    const match = timestamp.match(/(\d{4})\.\s*(\d{2})\.\s*(\d{2})\.\s*(\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      return new Date(
        parseInt(match[1]),
        parseInt(match[2]) - 1,
        parseInt(match[3]),
        parseInt(match[4]),
        parseInt(match[5]),
        parseInt(match[6])
      );
    }
  }

  return null;
}

function parseDate(dateString) {
  const parts = dateString.split('-');
  return new Date(
    parseInt(parts[0]),
    parseInt(parts[1]) - 1,
    parseInt(parts[2])
  );
}

function formatDateToYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function clearERPExcel() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '⚠️ 확인',
    'ERP_excel 시트의 데이터를 모두 삭제하시겠습니까?\n(헤더는 유지됩니다)',
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.YES) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('ERP_excel');

    if (sheet) {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
        ui.alert('✅ 완료', 'ERP_excel 데이터가 초기화되었습니다.', ui.ButtonSet.OK);
      } else {
        ui.alert('ℹ️ 알림', '삭제할 데이터가 없습니다.', ui.ButtonSet.OK);
      }
    }
  }
}