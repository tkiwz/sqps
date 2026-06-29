// students.php equivalent - Student management endpoint
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureSeedData } from '@/lib/seed'

// GET - Fetch all students
export async function GET() {
  await ensureSeedData()

  const students = await db.user.findMany({
    where: { role: 'student' },
    orderBy: { id: 'asc' },
    select: {
      militaryId: true,
      name: true,
      pin: true,
    },
  })

  const result = students.map((s) => ({
    military_id: s.militaryId,
    name: s.name,
    pin: s.pin,
  }))

  return NextResponse.json(result, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  })
}

// POST - Add new student
export async function POST(request: NextRequest) {
  await ensureSeedData()

  try {
    const formData = await request.formData()
    const militaryId = (formData.get('military_id') as string)?.trim() || ''
    const name = (formData.get('name') as string)?.trim() || ''
    const pin = (formData.get('pin') as string)?.trim() || ''

    // Validate military_id: exactly 5 digits only
    if (!/^\d{5}$/.test(militaryId)) {
      return NextResponse.json(
        { success: false, error: 'الرقم العسكري يجب أن يكون 5 أرقام بالضبط' },
        { headers: { 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Validate name: not empty
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'الاسم مطلوب' },
        { headers: { 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Validate pin: exactly 8 digits only
    if (!/^\d{8}$/.test(pin)) {
      return NextResponse.json(
        { success: false, error: 'الرمز يجب أن يكون 8 أرقام بالضبط' },
        { headers: { 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Check duplicate military_id
    const existing = await db.user.findUnique({
      where: { militaryId },
    })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'الرقم العسكري مكرر' },
        { headers: { 'Access-Control-Allow-Origin': '*' } }
      )
    }

    await db.user.create({
      data: {
        militaryId,
        name,
        pin,
        role: 'student',
      },
    })

    return NextResponse.json(
      { success: true },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    )
  } catch {
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء الإضافة' },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    )
  }
}

// DELETE - Remove student
export async function DELETE(request: NextRequest) {
  await ensureSeedData()

  try {
    const formData = await request.formData()
    const militaryId = (formData.get('military_id') as string)?.trim() || ''

    await db.user.delete({
      where: { militaryId },
    })

    return NextResponse.json(
      { success: true },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    )
  } catch {
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء الحذف' },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
