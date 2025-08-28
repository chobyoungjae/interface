import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export class GoogleSheetsService {
  private static instance: GoogleSheetsService;

  static getInstance(): GoogleSheetsService {
    if (!GoogleSheetsService.instance) {
      GoogleSheetsService.instance = new GoogleSheetsService();
    }
    return GoogleSheetsService.instance;
  }

  async authenticateDoc(spreadsheetId: string): Promise<GoogleSpreadsheet> {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
      key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });

    const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
    await doc.loadInfo();
    return doc;
  }

  async readBOMData(): Promise<unknown[]> {
    try {
      const doc = await this.authenticateDoc(process.env.BOM_SPREADSHEET_ID!);
      const sheet = doc.sheetsByIndex[0];
      const rows = await sheet.getRows();
      
      return rows.map(row => {
        // 숫자 변환 함수 - 콤마 제거하고 숫자로 변환
        const toNumber = (value: any): number => {
          if (!value) return 0;
          // 숫자면 그대로 반환
          if (typeof value === 'number') return value;
          // 문자열이면 콤마 제거 후 변환
          const str = String(value).replace(/,/g, '');
          return parseFloat(str) || 0;
        };
        
        return {
          A: row.get('생산품목코드') || '', // 생산품목코드
          B: row.get('생산품목명') || '', // 생산품목명
          E: toNumber(row.get('생산수량')), // 생산수량 - 숫자 변환
          F: row.get('소모품목코드') || '', // 소모품목코드
          G: row.get('소모품목명') || '', // 소모품목명
          I: toNumber(row.get('소모수량')), // 소모수량 - 숫자 변환
        };
      });
    } catch (error) {
      console.error('BOM 데이터 읽기 실패:', error);
      throw new Error('BOM 데이터를 읽는 중 오류가 발생했습니다.');
    }
  }

  async readSerialLotData(): Promise<{code: string, serialLot: string, stockQuantity: string}[]> {
    try {
      const doc = await this.authenticateDoc(process.env.STORAGE_SPREADSHEET_ID!);
      const sheet = doc.sheetsByTitle['시리얼로트'];
      if (!sheet) {
        console.warn('시리얼로트 시트를 찾을 수 없습니다.');
        return [];
      }
      
      // 헤더가 2행에 있으므로 먼저 헤더 행을 수동으로 설정
      await sheet.loadHeaderRow(2); // 2행을 헤더로 설정 (1부터 시작)
      const rows = await sheet.getRows();
      
      return rows.map((row) => {
        return {
          code: row.get('품목코드') || '',        // A열: 품목코드
          serialLot: row.get('시리얼/로트No.') || '',   // D열: 시리얼/로트No.
          stockQuantity: row.get('재고수량') || '' // F열: 재고수량
        };
      }).filter(item => item.code && item.serialLot && item.stockQuantity);
    } catch (error) {
      console.error('시리얼로트 데이터 읽기 실패:', error);
      return [];
    }
  }

  async saveProductionData(data: unknown[]): Promise<void> {
    try {
      const doc = await this.authenticateDoc(process.env.STORAGE_SPREADSHEET_ID!);
      
      const sheet = doc.sheetsByTitle['시트1'] || doc.sheetsByIndex[0];
      
      // 헤더 로드 및 확장
      await sheet.loadHeaderRow();
      
      // 현재 헤더 길이 확인 후 필요시 확장
      const currentHeaders = sheet.headerValues;
      const requiredColumns = 5 + (data.length - 5); // 기본 5개 + 원재료 데이터
      
      if (currentHeaders.length < requiredColumns) {
        const newHeaders = [...currentHeaders];
        
        // 원재료 헤더를 동적으로 추가
        let materialCount = Math.floor((currentHeaders.length - 5) / 4) + 1;
        while (newHeaders.length < requiredColumns) {
          newHeaders.push(`코드${materialCount}`);
          newHeaders.push(`원재료명${materialCount}`);
          newHeaders.push(`중량${materialCount}`);
          newHeaders.push(`시리얼로트${materialCount}`);
          materialCount++;
        }
        
        await sheet.setHeaderRow(newHeaders);
      }
      
      await sheet.addRow(data as unknown as Record<string, string | number>);
    } catch (error) {
      console.error('생산 데이터 저장 실패:', error);
      throw new Error('생산 데이터를 저장하는 중 오류가 발생했습니다.');
    }
  }
}