import { env } from '@/env';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_BASE_URL = env.NEXT_PUBLIC_DB_CHAT_API;

if (!BACKEND_API_BASE_URL) {
  console.error('Environment variable NEXT_PUBLIC_DB_CHAT_API is not set!');
}

export async function POST(request: NextRequest) {
  if (!BACKEND_API_BASE_URL) {
     return new NextResponse('Backend API URL is not configured.', { status: 500 });
  }

  // Lấy phần path còn lại sau '/api/adk'
  // request.nextUrl.pathname sẽ là '/api/adk/apps/...'
  // Chúng ta cần loại bỏ '/api/adk' để có '/apps/...'
  const pathSegments = request.nextUrl.pathname.split('/api/adk');
  const backendPath = pathSegments[1];

  const targetUrl = `${BACKEND_API_BASE_URL}${backendPath}`;

  try {
    const body = await request.text();
    const headers = new Headers(request.headers);

    headers.delete('host');
     // Xóa header 'Origin' để backend không bị ảnh hưởng bởi CORS policy từ frontend
     headers.delete('origin');


    const backendResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: headers,
      body: body,
    });

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: backendResponse.headers,
    });

  } catch (error) {
    console.error('Error proxying request to backend:', error);
    return new NextResponse('Error proxying request.', { status: 500 });
  }
} 