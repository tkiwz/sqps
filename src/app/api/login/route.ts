// login.php equivalent - Authentication endpoint
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureSeedData } from '@/lib/seed'

export async function POST(request: NextRequest) {
  await ensureSeedData()

  try {
    const formData = await request.formData()
    const militaryId = (formData.get('military_id') as string)?.trim() || ''
    const pin = (formData.get('pin') as string)?.trim() || ''

    // Validate: military_id exactly 5 digits, pin exactly 8 digits
    if (!/^\d{5}$/.test(militaryId) || !/^\d{8}$/.test(pin)) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة' },
        { headers: { 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Query user (Prisma uses prepared statements by default)
    const user = await db.user.findUnique({
      where: { militaryId },
    })

    if (user && user.pin === pin) {
      return NextResponse.json(
        {
          success: true,
          role: user.role,
          name: user.name,
          military_id: user.militaryId,
        },
        { headers: { 'Access-Control-Allow-Origin': '*' } }
      )
    }

    return NextResponse.json(
      { success: false, error: 'بيانات غير صحيحة' },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    )
  } catch {
    return NextResponse.json(
      { success: false, error: 'بيانات غير صحيحة' },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
