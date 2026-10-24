export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  };

  // Обработка Preflight запроса браузера
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Разрешены только POST-запросы' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Извлекаем ключ (из переменных окружения Vercel или из заголовков фронтенда)
    let rawApiKey = process.env.GEMINI_API_KEY || req.headers.get('x-api-key') || '';
    const apiKey = rawApiKey.trim();

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API ключ не найден. Введите его в интерфейсе или настройте переменные окружения.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { contents } = body;

    if (!contents) {
      return new Response(JSON.stringify({ error: 'Отсутствует обязательное поле "contents".' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const model = 'gemini-3.8-flash';
    const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const finalUrl = `${baseUrl}?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(finalUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    });

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: `Ошибка Edge-сервера: ${error.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}




