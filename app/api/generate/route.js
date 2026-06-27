// AI 호출을 대신 처리하는 서버 함수.
// 진짜 API 키는 코드가 아니라 Vercel 환경변수(ANTHROPIC_API_KEY)에서만 읽는다.
// 따라서 GitHub에 올라가는 코드에는 키가 전혀 들어있지 않다.

export const runtime = "nodejs";
export const maxDuration = 60; // 소설처럼 긴 응답도 기다릴 수 있도록

export async function POST(req) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "서버에 ANTHROPIC_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (e) {
    return Response.json({ error: "AI 호출 실패" }, { status: 500 });
  }
}
