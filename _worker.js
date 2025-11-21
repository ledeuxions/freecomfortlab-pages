/**
 * FreeComfortLab Cloudflare Pages + Functions Worker
 * - /api/*         : 우분투 Flask 서버로 프록시
 * - 그 외 경로     : 정적 자산(HTML/CSS/JS) ASSETS 로 전달
 */

// Flask 백엔드 서버 주소
const FLASK_BACKEND = 'http://192.168.0.12:5000';

// CORS 공통 헤더
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

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

// 메인 엔트리 포인트
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS 프리플라이트
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    // /api/* 요청은 모두 Flask 서버로 프록시
    if (url.pathname.startsWith('/api/')) {
      const backendURL = FLASK_BACKEND + url.pathname + url.search;
      return fetch(backendURL, {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
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
