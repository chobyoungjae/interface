import { NextRequest, NextResponse } from "next/server";
import { GoogleSheetsService } from "@/lib/googleSheets";

const sheetsService = GoogleSheetsService.getInstance();

// 옵션 목록 조회 (맛 + 키워드 한 번에)
export async function GET() {
  try {
    const options = await sheetsService.readAllOptions();
    return NextResponse.json(options);
  } catch (error) {
    console.error("옵션 조회 실패:", error);
    return NextResponse.json(
      { error: "옵션 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// 옵션 추가
export async function POST(request: NextRequest) {
  try {
    const { type, value } = await request.json();

    if (!type || !value?.trim()) {
      return NextResponse.json(
        { error: "타입과 값이 필요합니다." },
        { status: 400 }
      );
    }

    if (!["flavor", "keyword", "worker", "line"].includes(type)) {
      return NextResponse.json(
        { error: "유효하지 않은 타입입니다." },
        { status: 400 }
      );
    }

    const success = await sheetsService.addOption(type, value.trim());

    if (success) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "이미 존재하거나 추가에 실패했습니다." },
      { status: 400 }
    );
  } catch (error) {
    console.error("옵션 추가 실패:", error);
    return NextResponse.json(
      { error: "옵션 추가 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 옵션 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { type, value } = await request.json();

    if (!type || !value?.trim()) {
      return NextResponse.json(
        { error: "타입과 값이 필요합니다." },
        { status: 400 }
      );
    }

    if (!["flavor", "keyword", "worker", "line"].includes(type)) {
      return NextResponse.json(
        { error: "유효하지 않은 타입입니다." },
        { status: 400 }
      );
    }

    const success = await sheetsService.deleteOption(type, value.trim());

    if (success) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "삭제에 실패했습니다." },
      { status: 500 }
    );
  } catch (error) {
    console.error("옵션 삭제 실패:", error);
    return NextResponse.json(
      { error: "옵션 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
