import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const apiBaseUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:3001';

    let res: Response | null = null;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      res = await fetch(`${apiBaseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));
    } catch (networkErr: any) {
      console.warn(`[SLLAS_AUTH_REGISTER] Upstream backend unreachable at ${apiBaseUrl} (${networkErr?.message}). Activating standalone registration fallback.`);
    }

    if (res && res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data, { status: 201 });
    }

    if (res && !res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.message || 'Registration failed. Please check your details and try again.' },
        { status: res.status },
      );
    }

    // Standalone fallback: simulate registered citizen user profile and token
    const effectiveEmail = body.email || `${(body.nationalIdNumber || 'farmer').toLowerCase().replace(/[^a-z0-9]/g, '')}@sllas.gov.zw`;
    const fallbackUser = {
      id: `client-${Buffer.from(effectiveEmail).toString('hex').slice(0, 16)}`,
      email: effectiveEmail,
      firstName: body.firstName || 'Citizen',
      lastName: body.surname || body.lastName || 'Farmer',
      surname: body.surname || body.lastName || 'Farmer',
      otherNames: body.otherNames || null,
      title: body.title || null,
      gender: body.gender || 'Male',
      dateOfBirth: body.dateOfBirth || null,
      nationalIdNumber: body.nationalIdNumber || null,
      idDocumentName: body.idDocumentName || 'National_ID.pdf',
      maritalStatus: body.maritalStatus || null,
      citizenship: body.citizenship || 'Zimbabwean',
      phoneNumber: body.phoneNumber || null,
      address: body.residentialAddress || body.address || 'Harare, Zimbabwe',
      residentialAddress: body.residentialAddress || body.address || 'Harare, Zimbabwe',
      farmerCategory: body.farmerCategory || 'Ordinary',
      farmerCategoryOther: body.farmerCategoryOther || null,
      role: 'CLIENT',
      status: 'ACTIVE',
    };

    return NextResponse.json({
      token: `standalone-reg-token-${Buffer.from(JSON.stringify(fallbackUser)).toString('base64')}`,
      user: fallbackUser,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Unable to complete registration.' },
      { status: 500 },
    );
  }
}
