import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

// 시리얼로트 시트 디버깅용 API
export async function GET() {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
      key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const doc = new GoogleSpreadsheet(process.env.STORAGE_SPREADSHEET_ID!, serviceAccountAuth);
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle["시리얼로트"];

    if (!sheet) {
      return NextResponse.json({ error: "시리얼로트 시트 없음", sheets: Object.keys(doc.sheetsByTitle) });
    }

    await sheet.loadHeaderRow(2);
    const rows = await sheet.getRows();

    // 처음 3행 데이터 샘플
    const sampleRows = rows.slice(0, 3).map((row, i) => ({
      index: i,
      raw: row.toObject(),
      품목코드: row.get("품목코드"),
      품목명: row.get("품목명"),
      시리얼로트No: row.get("시리얼/로트No."),
      재고수량: row.get("재고수량"),
    }));

    return NextResponse.json({
      sheetTitle: sheet.title,
      headerValues: sheet.headerValues,
      rowCount: rows.length,
      sampleRows,
    });
  } catch (error) {
    console.error('디버그 실패:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
