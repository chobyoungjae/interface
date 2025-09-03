import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

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
      key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
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

      return rows.map((row) => {
        // 숫자 변환 함수 - 콤마 제거하고 숫자로 변환
        const toNumber = (value: any): number => {
          if (!value) return 0;
          // 숫자면 그대로 반환
          if (typeof value === "number") return value;
          // 문자열이면 콤마 제거 후 변환
          const str = String(value).replace(/,/g, "");
          return parseFloat(str) || 0;
        };

        return {
          A: row.get("생산품목코드") || "", // 생산품목코드
          B: row.get("생산품목명") || "", // 생산품목명
          E: toNumber(row.get("생산수량")), // 생산수량 - 숫자 변환
          F: row.get("소모품목코드") || "", // 소모품목코드
          G: row.get("소모품목명") || "", // 소모품목명
          I: toNumber(row.get("소모수량")), // 소모수량 - 숫자 변환
        };
      });
    } catch (error) {
      console.error("BOM 데이터 읽기 실패:", error);
      throw new Error("BOM 데이터를 읽는 중 오류가 발생했습니다.");
    }
  }

  async readSerialLotData(): Promise<
    { code: string; serialLot: string; stockQuantity: string }[]
  > {
    try {
      const doc = await this.authenticateDoc(
        process.env.STORAGE_SPREADSHEET_ID!
      );
      const sheet = doc.sheetsByTitle["시리얼로트"];
      if (!sheet) {
        console.warn("시리얼로트 시트를 찾을 수 없습니다.");
        return [];
      }

      // 헤더가 2행에 있으므로 먼저 헤더 행을 수동으로 설정
      await sheet.loadHeaderRow(2); // 2행을 헤더로 설정 (1부터 시작)
      const rows = await sheet.getRows();

      return rows
        .map((row) => {
          return {
            code: row.get("품목코드") || "", // A열: 품목코드
            serialLot: row.get("시리얼/로트No.") || "", // D열: 시리얼/로트No.
            stockQuantity: row.get("재고수량") || "", // F열: 재고수량
          };
        })
        .filter((item) => item.code && item.serialLot && item.stockQuantity);
    } catch (error) {
      console.error("시리얼로트 데이터 읽기 실패:", error);
      return [];
    }
  }

  async readAuthorsData(): Promise<string[]> {
    try {
      const doc = await this.authenticateDoc(
        process.env.STORAGE_SPREADSHEET_ID!
      );
      const sheet = doc.sheetsByTitle["B시트"]; // B시트 선택
      if (!sheet) {
        console.warn("B시트를 찾을 수 없습니다.");
        return [];
      }

      // 헤더가 4행에 있으므로 4행을 헤더로 설정
      await sheet.loadHeaderRow(4); // 4행을 헤더로 설정 (1부터 시작)
      const rows = await sheet.getRows();

      // B열(이름)과 C열(부서)에서 부서가 "생산팀"인 사람들만 필터링
      const authors: string[] = [];
      rows.forEach((row) => {
        const name = row.get("이름") || ""; // B열: 이름
        const department = row.get("부서") || ""; // C열: 부서

        if (name && department === "생산팀") {
          authors.push(name);
        }
      });

      return [...new Set(authors)]; // 중복 제거
    } catch (error) {
      console.error("작성자 데이터 읽기 실패:", error);
      return [];
    }
  }

  async saveProductionData(data: unknown[]): Promise<void> {
    try {
      console.log('저장할 데이터:', data);
      console.log('스프레드시트 ID:', process.env.STORAGE_SPREADSHEET_ID);
      
      const doc = await this.authenticateDoc(
        process.env.STORAGE_SPREADSHEET_ID!
      );
      console.log('인증 성공, 스프레드시트 제목:', doc.title);

      const sheet = doc.sheetsByTitle["시트1"] || doc.sheetsByIndex[0];
      console.log('사용할 시트:', sheet.title);

      // 필요한 열 수 계산
      const requiredColumns = data.length;
      console.log('필요한 열 수:', requiredColumns);

      // 기본 헤더 정의 (A~K)
      const baseHeaders = [
        '타임스탬프',      // A열
        '작성자',         // B열
        '호기',          // C열
        '제품코드',       // D열
        '제품명',        // E열
        '생산중량',      // F열
        '원재료합계',     // G열
        '소비기한',      // H열
        '제품로트',      // I열
        '시리얼로트',     // J열
        '샘플'           // K열
      ];

      // 새 헤더 배열 생성
      const newHeaders = [...baseHeaders];

      // 원재료 헤더를 동적으로 추가 (L열부터)
      let materialCount = 1;
      while (newHeaders.length < requiredColumns) {
        newHeaders.push(`코드${materialCount}`);
        newHeaders.push(`원재료명${materialCount}`);
        newHeaders.push(`중량${materialCount}`);
        newHeaders.push(`시리얼로트${materialCount}`);
        materialCount++;
      }

      console.log('설정할 헤더:', newHeaders);
      
      try {
        // 헤더를 강제로 설정 (기존 헤더 무시)
        await sheet.setHeaderRow(newHeaders);
        console.log('헤더 설정 완료');
      } catch (headerError) {
        console.error('헤더 설정 실패:', headerError);
        // 헤더 설정에 실패하면 첫 번째 행을 직접 업데이트
        await sheet.loadCells(`A1:${String.fromCharCode(65 + newHeaders.length - 1)}1`);
        for (let i = 0; i < newHeaders.length; i++) {
          const cell = sheet.getCell(0, i);
          cell.value = newHeaders[i];
        }
        await sheet.saveUpdatedCells();
        console.log('헤더 직접 설정 완료');
      }

      console.log('행 추가 시작');
      await sheet.addRow(data as unknown as Record<string, string | number>);
      console.log('행 추가 완료');
    } catch (error) {
      console.error("생산 데이터 저장 실패:", error);
      throw new Error("생산 데이터를 저장하는 중 오류가 발생했습니다.");
    }
  }

  async getPasswordFromSheet(): Promise<string> {
    try {
      const doc = await this.authenticateDoc(process.env.BOM_SPREADSHEET_ID!);
      const sheet = doc.sheetsByTitle["비밀번호"];
      if (!sheet) {
        console.warn("비밀번호 시트를 찾을 수 없습니다.");
        return 'bom2024!'; // 기본값
      }

      await sheet.loadCells();
      const a1Cell = sheet.getCell(0, 0); // A1 (0-based index)
      const password = String(a1Cell.value || 'bom2024!');
      
      return password;
    } catch (error) {
      console.error("비밀번호 읽기 실패:", error);
      return 'bom2024!'; // 기본값
    }
  }

  async readSerialLotSheetInfo(): Promise<{
    companyInfo: string;
    lastUpdateDate: string;
  } | null> {
    try {
      const doc = await this.authenticateDoc(
        process.env.STORAGE_SPREADSHEET_ID!
      );
      const sheet = doc.sheetsByTitle["시리얼로트"];
      if (!sheet) {
        console.warn("시리얼로트 시트를 찾을 수 없습니다.");
        return null;
      }

      await sheet.loadCells();
      
      // A1 셀 정보 읽기
      const a1Cell = sheet.getCell(0, 0); // A1 (0-based index)
      const companyInfo = String(a1Cell.value || "");

      // 날짜 추출 (YYYY/MM/DD 형식)
      const dateMatch = companyInfo.match(/(\d{4}\/\d{2}\/\d{2})/);
      const lastUpdateDate = dateMatch ? dateMatch[1] : "";

      return {
        companyInfo,
        lastUpdateDate
      };
    } catch (error) {
      console.error("시리얼로트 시트 정보 읽기 실패:", error);
      return null;
    }
  }
}
