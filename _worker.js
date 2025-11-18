/**
 * Cloudflare Pages 전용 Worker
 * - /api/ping : 헬스 체크
 * - /api/convert : 파일 변환 API (추후 Flask로 프록시 예정)
 * - 그 외 모든 경로 : 정적 파일(ASSETS)로 포워딩
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders,
      ...extraHeaders,
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();

    // 0) CORS 프리플라이트 처리
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // 1) 헬스 체크 API: /api/ping
    if (path === "/api/ping" && method === "GET") {
      return jsonResponse({
        status: "ok",
        message: "pong",
        timestamp: new Date().toISOString(),
      });
    }

    // 2) 파일 변환 API: /api/convert (추후 Flask 서버로 프록시 예정)
    if (path === "/api/convert" && method === "POST") {
      // TODO: 여기에서 env 내부 변수(예: env.FLASK_ENDPOINT)를 사용해
      //       로컬 또는 VPS Flask 서버로 프록시할 예정.
      // 지금은 업로드만 받고 단순 응답을 돌려준다.

      const contentType = request.headers.get("Content-Type") || "";

      // multipart/form-data, application/json 둘 다 일단 허용
      let info = {
        received: true,
        contentType,
      };

      // 필요시 간단히 body 사이즈 정도만 읽어볼 수도 있음
      // const body = await request.arrayBuffer();
      // info.size = body.byteLength;

      return jsonResponse(
        {
          status: "received",
          info,
          note: "실제 변환 로직은 Flask 서버 연결 후 동작 예정입니다.",
        },
        200,
      );
    }

    // 3) 그 외 모든 요청은 Pages 정적 파일로 넘기기
    //    => index.html, convert.html 등
    try {
      return await env.ASSETS.fetch(request);
    } catch (e) {
      // 정적 파일도 없으면 마지막으로 404 JSON
      return jsonResponse(
        {
          error: "Not found",
          path,
        },
        404,
      );
    }
  },
};
