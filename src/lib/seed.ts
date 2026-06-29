// seed.ts - Database initialization (equivalent to init.php)
// Creates default lecturer, test student, and test grades if not exist

import { db } from '@/lib/db'

let seeded = false

export async function ensureSeedData() {
  if (seeded) return
  seeded = true

  // Create default lecturer if not exists
  const existingLecturer = await db.user.findUnique({
    where: { militaryId: '00001' },
  })
  if (!existingLecturer) {
    await db.user.create({
      data: {
        militaryId: '00001',
        name: 'المحاضر',
        pin: '00000001',
        role: 'lecturer',
      },
    })
  }

  // Create test student if not exists
  const existingStudent = await db.user.findUnique({
    where: { militaryId: '82786' },
  })
  let studentId: number
  if (!existingStudent) {
    const student = await db.user.create({
      data: {
        militaryId: '82786',
        name: 'تركي البلوشي',
        pin: '13170649',
        role: 'student',
      },
    })
    studentId = student.id
  } else {
    studentId = existingStudent.id
  }

  // Create test grades for the student if not exists
  const existingGrade = await db.grade.findUnique({
    where: { studentId },
  })
  if (!existingGrade) {
    await db.grade.create({
      data: {
        studentId,
        computer: 85,
        english: 72,
        culture: 90,
        islamic: 88,
      },
    })
  }
}
