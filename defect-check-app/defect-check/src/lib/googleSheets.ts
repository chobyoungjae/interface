import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { Product, PackagingItem, SerialLot } from "@/types";

export class GoogleSheetsService {
  private static instance: GoogleSheetsService;

  static getInstance(): GoogleSheetsService {
    if (!GoogleSheetsService.instance) {
      GoogleSheetsService.instance = new GoogleSheetsService();
    }
    return GoogleSheetsService.instance;
  }

  // Google Sheets 인증
  private async authenticateDoc(spreadsheetId: string): Promise<GoogleSpreadsheet> {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
      key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
    await doc.loadInfo();
    return doc;
  }

  // 작업자 목록 조회 (저장 시트 > B시트, 헤더 4행)
  async readWorkersData(): Promise<string[]> {
    try {
      const doc = await this.authenticateDoc(process.env.STORAGE_SPREADSHEET_ID!);
      const sheet = doc.sheetsByTitle["B시트"];

      if (!sheet) {
        console.warn("B시트를 찾을 수 없습니다.");
        return [];
      }

      // 헤더가 4행에 있으므로 4행을 헤더로 설정
      await sheet.loadHeaderRow(4);
      const rows = await sheet.getRows();

      // B열(이름)과 C열(부서)에서 부서가 "생산팀"인 사람들만 필터링
      const workers: string[] = [];
      rows.forEach((row) => {
        const name = row.get("이름") || "";
        const department = row.get("부서") || "";

        if (name && department === "생산팀") {
          workers.push(name);
        }
      });

      return [...new Set(workers)]; // 중복 제거
    } catch (error) {
      console.error("작업자 데이터 읽기 실패:", error);
      return [];
    }
  }

  // 생산품 목록 조회 (BOM 시트 > 시트2 + 저장 시트 > 기초코드)
  async readProductsData(): Promise<Product[]> {
    try {
      // 1. BOM 시트에서 생산품 목록 가져오기
      const bomDoc = await this.authenticateDoc(process.env.BOM_SPREADSHEET_ID!);
      const sheet = bomDoc.sheetsByTitle["시트2"];

      if (!sheet) {
        console.warn("시트2를 찾을 수 없습니다.");
        return [];
      }

      // 2. 저장 시트에서 기초코드 가져오기 (헤더 2행, A열: 품목코드, D열: 규격정보)
      const storageDoc = await this.authenticateDoc(process.env.STORAGE_SPREADSHEET_ID!);
      const categorySheet = storageDoc.sheetsByTitle["기초코드"];

      const categoryMap = new Map<string, string>();
      if (categorySheet) {
        // 헤더가 2행에 있으므로 2행을 헤더로 설정
        await categorySheet.loadHeaderRow(2);
        const categoryRows = await categorySheet.getRows();
        categoryRows.forEach((row) => {
          const code = row.get("품목코드") || "";
          const category = row.get("규격정보") || "";
          if (code && category) {
            categoryMap.set(code, category);
          }
        });
      }

      const rows = await sheet.getRows();
      const productsMap = new Map<string, Product>();

      rows.forEach((row) => {
        const productCode = row.get("생산품목코드") || "";
        const productName = row.get("생산품목명") || "";

        // 중복 제거: 코드 기준
        if (productCode && productName && !productsMap.has(productCode)) {
          // 기초코드 시트에서 카테고리 찾기
          const category = categoryMap.get(productCode) || "";

          productsMap.set(productCode, {
            productCode,
            productName,
            category,
          });
        }
      });

      return Array.from(productsMap.values());
    } catch (error) {
      console.error("생산품 데이터 읽기 실패:", error);
      return [];
    }
  }

  // 포장지/박스 조회 (BOM 시트 > 시트2, 생산품코드로 필터)
  async readPackagingData(productCode: string): Promise<{ packaging: PackagingItem | null; box: PackagingItem | null }> {
    try {
      const doc = await this.authenticateDoc(process.env.BOM_SPREADSHEET_ID!);
      const sheet = doc.sheetsByTitle["시트2"];

      if (!sheet) {
        console.warn("시트2를 찾을 수 없습니다.");
        return { packaging: null, box: null };
      }

      const rows = await sheet.getRows();
      let packaging: PackagingItem | null = null;
      let box: PackagingItem | null = null;

      rows.forEach((row) => {
        const rowProductCode = row.get("생산품목코드") || "";
        const consumableCode = row.get("소모품목코드") || "";
        const consumableName = row.get("소모품목명") || "";

        // A열(생산품목코드)이 선택된 제품과 동일한 행만 처리
        if (rowProductCode === productCode && consumableCode) {
          // 6으로 시작하는 6자리 코드 = 포장지
          if (/^6\d{5}$/.test(consumableCode) && !packaging) {
            packaging = {
              code: consumableCode,
              name: consumableName,
            };
          }
          // 7로 시작하는 6자리 코드 = 박스
          if (/^7\d{5}$/.test(consumableCode) && !box) {
            box = {
              code: consumableCode,
              name: consumableName,
            };
          }
        }
      });

      return { packaging, box };
    } catch (error) {
      console.error("포장지/박스 데이터 읽기 실패:", error);
      return { packaging: null, box: null };
    }
  }

  // 시리얼로트 조회 (저장 시트 > 시리얼로트, 헤더 2행)
  async readSerialLotData(packagingCode: string): Promise<SerialLot[]> {
    try {
      const doc = await this.authenticateDoc(process.env.STORAGE_SPREADSHEET_ID!);
      const sheet = doc.sheetsByTitle["시리얼로트"];

      if (!sheet) {
        console.warn("시리얼로트 시트를 찾을 수 없습니다.");
        return [];
      }

      // 헤더가 2행에 있으므로 2행을 헤더로 설정
      await sheet.loadHeaderRow(2);
      const rows = await sheet.getRows();

      // 디버깅: 헤더 목록 출력
      console.log("시리얼로트 시트 헤더:", sheet.headerValues);
      console.log("검색 포장지코드:", packagingCode);
      console.log("총 행 수:", rows.length);

      const lots: SerialLot[] = [];
      rows.forEach((row, index) => {
        const code = String(row.get("품목코드") || "").trim();
        const productName = row.get("품목명") || "";
        const lotNumber = row.get("시리얼/로트No.") || "";
        const stockQuantity = row.get("재고수량") || "";

        // 디버깅: 처음 5행 출력
        if (index < 5) {
          console.log(`행 ${index}: 품목코드=${code}, 로트=${lotNumber}`);
        }

        // 포장지 코드와 매칭되는 모든 로트 반환 (숫자/문자열 모두 매칭)
        if (code === packagingCode.trim() && lotNumber) {
          lots.push({
            code,
            productName,
            lotNumber,
            stockQuantity,
          });
        }
      });

      console.log("매칭된 로트 수:", lots.length);

      return lots;
    } catch (error) {
      console.error("시리얼로트 데이터 읽기 실패:", error);
      return [];
    }
  }

  // 포장지 시트 A1 정보 조회 (저장 시트 > 포장지)
  async readPackagingSheetInfo(): Promise<string> {
    try {
      const doc = await this.authenticateDoc(process.env.STORAGE_SPREADSHEET_ID!);
      const sheet = doc.sheetsByTitle["포장지"];

      if (!sheet) {
        console.warn("포장지 시트를 찾을 수 없습니다.");
        return "";
      }

      await sheet.loadCells("A1");
      const a1Cell = sheet.getCell(0, 0);
      return String(a1Cell.value || "");
    } catch (error) {
      console.error("포장지 시트 정보 읽기 실패:", error);
      return "";
    }
  }

  // 불량 데이터 저장 (저장 시트 > 시트1)
  async saveDefectData(data: (string | number)[]): Promise<void> {
    try {
      const doc = await this.authenticateDoc(process.env.STORAGE_SPREADSHEET_ID!);
      const sheet = doc.sheetsByTitle["시트1"] || doc.sheetsByIndex[0];

      // 헤더 정의
      const headers = [
        '타임스탬프',
        '작업자',
        '라인',
        '생산품코드',
        '생산품명',
        '포장지코드',
        '포장지명',
        '포장지로트',
        '실링불량',
        '중량불량',
        '날인불량(포장지)',
        '자체불량',
        '박스코드',
        '박스명',
        '박스오염',
        '파손',
        '날인불량(박스)',
        '기타',
        '생산시_가공로스',
        '배합_청소로스',
        '내용',
        '개선조치사항',
        '완료여부'
      ];

      // 헤더 설정
      try {
        await sheet.setHeaderRow(headers);
      } catch {
        // 헤더가 이미 있으면 무시
        console.log('헤더가 이미 설정되어 있습니다.');
      }

      // 데이터 추가
      await sheet.addRow(data as unknown as Record<string, string | number>);
      console.log('불량 데이터 저장 완료');
    } catch (error) {
      console.error("불량 데이터 저장 실패:", error);
      throw new Error("불량 데이터를 저장하는 중 오류가 발생했습니다.");
    }
  }
}
