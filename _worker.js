/**
 * FreeComfortLab Cloudflare Pages + Functions Worker
 * - /api/ping      : 헬스 체크용 JSON 응답
 * - /api/convert   : 파일 업로드 메타데이터 확인 (향후 Flask/FFmpeg 연동 예정)
 * - 그 외 경로     : 정적 자산(HTML/CSS/JS) ASSETS 로 전달
 */

// CORS 공통 헤더
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// JSON 응답 헬퍼
function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

// OPTIONS 프리플라이트 처리
function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      'Content-Length': '0',
    },
  });
}

// /api/ping : 헬스 체크
function handlePing() {
  const body = {
    status: 'ok',
    message: 'pong',
    timestamp: new Date().toISOString(),
    version: 'v1',
  };
  return jsonResponse(body, 200);
}

/**
 * /api/convert
 * - formData에서 file 필드를 꺼내서
 *   파일 이름 / 용량 / 타입을 읽어서 반환
 * - 아직 실제 변환은 하지 않음 (다음 단계에서 Flask/FFmpeg 연결)
 */
async function handleConvert(request) {
  if (request.method !== 'POST') {
    return jsonResponse(
      { error: 'Method Not Allowed', allow: 'POST' },
      405,
    );
  }

  let formData;
  try {
    formData = await request.formData();
  } catch (e) {
    return jsonResponse(
      { error: 'Invalid form data', detail: String(e) },
      400,
    );
  }

  const file = formData.get('file');

  if (!file) {
    return jsonResponse(
      { error: 'file 필드가 없습니다. <input name="file"> 를 확인하세요.' },
      400,
    );
  }

  // 항상 arrayBuffer 로 실제 바이트 수를 계산
  let size = 0;
  let type = '';
  let name = '';

  try {
    const buf = await file.arrayBuffer();
    size = buf.byteLength; // 실제 파일 크기
    type = file.type || 'application/octet-stream';
    name = file.name || 'unknown';
  } catch (e) {
    return jsonResponse(
      {
        error: '파일 메타데이터를 읽는 중 오류',
        detail: String(e),
      },
      500,
    );
  }

  const result = {
    status: 'ok',
    received: true,
    file: {
      name,
      size,
      type,
    },
    note:
      '현재는 파일 메타데이터만 확인합니다. 다음 단계에서 Flask 서버 + FFmpeg로 실제 변환을 붙일 예정입니다.',
  };

  return jsonResponse(result, 200);
}

// 메인 엔트리 포인트
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS 프리플라이트
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    // API 라우팅
    if (path === '/api/ping') {
      return handlePing(request);
    }

    if (path === '/api/convert') {
      return handleConvert(request);
    }

    // 나머지는 Cloudflare Pages 정적 자산에게 위임
    // (index.html, convert.html 등)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    // ASSETS 없을 때 안전장치
    return new Response('ASSETS binding not found', { status: 500 });
  },
};
