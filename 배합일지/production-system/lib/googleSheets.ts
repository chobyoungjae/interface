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
      
      return rows.map(row => ({
        A: row.get('A') || '', // 생산품목코드
        B: row.get('B') || '', // 생산품목명
        E: parseFloat(row.get('E') || '0') || 0, // 생산수량
        F: row.get('F') || '', // 소모품목코드
        G: row.get('G') || '', // 소모품목명
        I: parseFloat(row.get('I') || '0') || 0, // 소모수량
      }));
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
      
      const rows = await sheet.getRows();
      
      return rows.map(row => ({
        code: row.get('A') || '',        // A열: 원재료 코드
        serialLot: row.get('D') || '',   // D열: 시리얼/로트No.
        stockQuantity: row.get('F') || '' // F열: 재고수량
      })).filter(item => item.code && item.serialLot && item.stockQuantity);
    } catch (error) {
      console.error('시리얼로트 데이터 읽기 실패:', error);
      return [];
    }
  }

  async saveProductionData(data: unknown[]): Promise<void> {
    try {
      console.log('저장할 데이터:', data);
      const doc = await this.authenticateDoc(process.env.STORAGE_SPREADSHEET_ID!);
      console.log('문서 로드 성공, 시트 목록:', Object.keys(doc.sheetsByTitle));
      
      const sheet = doc.sheetsByTitle['시트1'] || doc.sheetsByIndex[0];
      console.log('선택된 시트:', sheet.title);
      
      // 헤더 로드 및 확장
      await sheet.loadHeaderRow();
      
      // 현재 헤더 길이 확인 후 필요시 확장
      const currentHeaders = sheet.headerValues;
      const requiredColumns = 5 + (data.length - 5); // 기본 5개 + 원재료 데이터
      
      if (currentHeaders.length < requiredColumns) {
        console.log(`헤더 확장 필요: 현재 ${currentHeaders.length}개, 필요 ${requiredColumns}개`);
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
        console.log('헤더 확장 완료:', newHeaders.slice(currentHeaders.length));
      }
      
      await sheet.addRow(data as unknown as Record<string, string | number>);
      console.log('데이터 저장 성공!');
    } catch (error) {
      console.error('생산 데이터 저장 실패:', error);
      throw new Error('생산 데이터를 저장하는 중 오류가 발생했습니다.');
    }
  }
}