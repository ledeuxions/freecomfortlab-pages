/**
 * Cloudflare Pages _worker.js
 * - 정적 파일 서빙 (index.html, convert.html 등)
 * - /api/ping : 상태 확인
 * - /api/convert : 업로드 파일 메타데이터 분석 (파일명/용량/타입)
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname || '/';

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // API 라우트
    if (pathname.startsWith('/api/')) {
      if (pathname === '/api/ping') {
        return handlePing(request);
      }
      if (pathname === '/api/convert') {
        return handleConvert(request);
      }

      return jsonResponse(
        { error: 'Not Found', path: pathname },
        404,
      );
    }

    // 그 외는 정적 자산 (Pages 빌드 결과) 서빙
    return env.ASSETS.fetch(request, env, ctx);
  },
};

/**
 * /api/ping 헬스 체크
 */
function handlePing(request) {
  return jsonResponse({
    status: 'ok',
    message: 'pong',
    timestamp: new Date().toISOString(),
  });
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
      { error: 'file 필드가 없습니다. <input name="file">를 확인하세요.' },
      400,
    );
  }

  // Cloudflare Workers의 File 객체
  // name / type / size 를 우선 시도하고,
  // size가 없으면 arrayBuffer 길이로 계산
  let size = 0;
  let type = '';
  let name = '';

  try {
    name = file.name || 'unknown';
    type = file.type || 'application/octet-stream';

    if (typeof file.size === 'number') {
      size = file.size;
    } else {
      const buf = await file.arrayBuffer();
      size = buf.byteLength;
    }
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

/**
 * JSON 응답 헬퍼
 */
function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
    },
  });
}
