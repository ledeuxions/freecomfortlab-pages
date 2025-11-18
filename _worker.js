/**
 * Cloudflare Worker
 * /api/ping - 헬스 체크 엔드포인트
 * /api/convert - 파일 변환 엔드포인트
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS 헤더 설정
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // OPTIONS 요청 처리 (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    try {
      // /api/ping 라우터
      if (path === '/api/ping') {
        return handlePing(corsHeaders);
      }

      // /api/convert 라우터
      if (path === '/api/convert') {
        if (request.method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            {
              status: 405,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        return await handleConvert(request, corsHeaders);
      }

      // 404 처리
      return new Response(
        JSON.stringify({ error: 'Not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Internal server error', message: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  },
};

/**
 * /api/ping 핸들러
 * 헬스 체크용 엔드포인트
 */
function handlePing(corsHeaders) {
  return new Response(
    JSON.stringify({
      status: 'ok',
      message: 'pong',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * /api/convert 핸들러
 * 파일 변환 처리
 */
async function handleConvert(request, corsHeaders) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // multipart/form-data 처리
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      const format = formData.get('format') || 'jpg';

      if (!file) {
        return new Response(
          JSON.stringify({ error: 'No file provided' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // 파일 정보 추출
      const fileName = file.name;
      const fileSize = file.size;
      const fileType = file.type;

      // 실제 변환 로직은 여기에 구현
      // 현재는 파일 정보만 반환
      return new Response(
        JSON.stringify({
          success: true,
          message: 'File conversion requested',
          file: {
            name: fileName,
            size: fileSize,
            type: fileType,
            targetFormat: format,
          },
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // JSON 처리
    if (contentType.includes('application/json')) {
      const body = await request.json();

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Conversion request received',
          data: body,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 지원하지 않는 Content-Type
    return new Response(
      JSON.stringify({ error: 'Unsupported content type' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to process request', message: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
