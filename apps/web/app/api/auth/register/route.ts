import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const apiBaseUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:3001';

    const res = await fetch(`${apiBaseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || 'Registration failed. Please check your details and try again.' },
        { status: res.status },
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Unable to connect to government identity registration service.' },
      { status: 500 },
    );
  }
}
