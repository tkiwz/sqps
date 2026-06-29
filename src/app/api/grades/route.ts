// grades.php equivalent - Grades management endpoint
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureSeedData } from '@/lib/seed'

// GET - Fetch grades for a student
export async function GET(request: NextRequest) {
  await ensureSeedData()

  const militaryId = request.nextUrl.searchParams.get('military_id') || ''

  const user = await db.user.findUnique({
    where: { militaryId },
  })

  if (!user) {
    return NextResponse.json(
      { success: true, grades: null },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    )
  }

  const grade = await db.grade.findUnique({
    where: { studentId: user.id },
  })

  if (grade) {
    return NextResponse.json(
      {
        success: true,
        grades: {
          computer: grade.computer,
          english: grade.english,
          culture: grade.culture,
          islamic: grade.islamic,
        },
      },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    )
  }

  return NextResponse.json(
    { success: true, grades: null },
    { headers: { 'Access-Control-Allow-Origin': '*' } }
  )
}

// POST - Save or update grades
export async function POST(request: NextRequest) {
  await ensureSeedData()

  try {
    const formData = await request.formData()
    const militaryId = (formData.get('military_id') as string)?.trim() || ''
    const computer = formData.get('computer') as string | null
    const english = formData.get('english') as string | null
    const culture = formData.get('culture') as string | null
    const islamic = formData.get('islamic') as string | null

    // Validate each grade: null/empty or number between 0-100
    const subjects = [
      { name: 'computer', value: computer },
      { name: 'english', value: english },
      { name: 'culture', value: culture },
      { name: 'islamic', value: islamic },
    ]

    for (const subject of subjects) {
      if (subject.value !== null && subject.value !== '') {
        const num = Number(subject.value)
        if (isNaN(num) || num < 0 || num > 100 || !Number.isInteger(num)) {
          return NextResponse.json(
            { success: false, error: 'الدرجات يجب أن تكون بين 0 و 100' },
            { headers: { 'Access-Control-Allow-Origin': '*' } }
          )
        }
      }
    }

    const user = await db.user.findUnique({
      where: { militaryId },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'الطالب غير موجود' },
        { headers: { 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const gradeData = {
      computer: computer && computer !== '' ? Number(computer) : null,
      english: english && english !== '' ? Number(english) : null,
      culture: culture && culture !== '' ? Number(culture) : null,
      islamic: islamic && islamic !== '' ? Number(islamic) : null,
    }

    // Check if grade record exists
    const existing = await db.grade.findUnique({
      where: { studentId: user.id },
    })

    if (existing) {
      // Update
      await db.grade.update({
        where: { studentId: user.id },
        data: gradeData,
      })
    } else {
      // Insert
      await db.grade.create({
        data: {
          studentId: user.id,
          ...gradeData,
        },
      })
    }

    return NextResponse.json(
      { success: true },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    )
  } catch {
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء الحفظ' },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
