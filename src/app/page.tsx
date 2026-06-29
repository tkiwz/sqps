'use client'

// index.html equivalent - Complete Student Grading System Frontend
// Single page with login, lecturer, and student views

import { useEffect, useRef, useCallback } from 'react'

function escapeHtml(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export default function Home() {
  // Session variables (stored in memory only, no cookies/localStorage)
  const sessionRef = useRef({ role: '', name: '', military_id: '' })

  // Show a specific screen
  const showScreen = useCallback((screen: string) => {
    const loginEl = document.getElementById('login_screen')
    const lecturerEl = document.getElementById('lecturer_screen')
    const studentEl = document.getElementById('student_screen')
    if (loginEl) loginEl.style.display = screen === 'login' ? 'block' : 'none'
    if (lecturerEl) lecturerEl.style.display = screen === 'lecturer' ? 'block' : 'none'
    if (studentEl) studentEl.style.display = screen === 'student' ? 'block' : 'none'
  }, [])

  // Numeric-only input handler
  const numericOnly = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!/^[0-9]$/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
      e.preventDefault()
    }
  }, [])

  // Numeric-only paste handler
  const numericPaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text')
    if (!/^\d*$/.test(pasted)) {
      e.preventDefault()
    }
  }, [])

  // Refs for function stability (used by delete buttons)
  const loadStudentsRef = useRef<() => Promise<void>>()
  const loadGradesStudentsRef = useRef<() => Promise<void>>()

  // Load students list into table
  const loadStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/students')
      const students = await res.json()
      const tbody = document.getElementById('students_tbody')
      if (!tbody) return
      tbody.innerHTML = ''
      students.forEach((s: { military_id: string; name: string; pin: string }) => {
        const tr = document.createElement('tr')
        tr.innerHTML =
          '<td style="border:1px solid #000;padding:6px 10px;text-align:center;">' + escapeHtml(s.military_id) + '</td>' +
          '<td style="border:1px solid #000;padding:6px 10px;text-align:center;">' + escapeHtml(s.name) + '</td>' +
          '<td style="border:1px solid #000;padding:6px 10px;text-align:center;">' + escapeHtml(s.pin) + '</td>' +
          '<td style="border:1px solid #000;padding:6px 10px;text-align:center;">' +
            '<button data-mid="' + escapeHtml(s.military_id) + '" class="delete-student-btn" ' +
            'style="background:#d00;color:#fff;border:none;padding:4px 12px;cursor:pointer;font-family:Tahoma;font-size:13px;">حذف</button>' +
          '</td>'
        tbody.appendChild(tr)
      })
      // Attach delete handlers using ref to avoid accessing before declaration
      tbody.querySelectorAll('.delete-student-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const mid = (btn as HTMLElement).dataset.mid
          if (!mid) return
          const formData = new FormData()
          formData.append('military_id', mid)
          await fetch('/api/students', { method: 'DELETE', body: formData })
          loadStudentsRef.current()
          loadGradesStudentsRef.current()
        })
      })
    } catch { /* silent */ }
  }, [])

  // Load students for grades select
  const loadGradesStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/students')
      const students = await res.json()
      const select = document.getElementById('grades_student_select') as HTMLSelectElement
      if (!select) return
      const currentVal = select.value
      select.innerHTML = '<option value="">-- اختر طالب --</option>'
      students.forEach((s: { military_id: string; name: string }) => {
        const opt = document.createElement('option')
        opt.value = s.military_id
        opt.textContent = s.name
        select.appendChild(opt)
      })
      select.value = currentVal
    } catch { /* silent */ }
  }, [])

  // Keep refs updated for delete handler access
  useEffect(() => {
    loadStudentsRef.current = loadStudents
    loadGradesStudentsRef.current = loadGradesStudents
  }, [loadStudents, loadGradesStudents])

  // Load grades into fields (lecturer view)
  const loadGradesForStudent = useCallback(async (militaryId: string) => {
    const compEl = document.getElementById('grade_computer') as HTMLInputElement
    const engEl = document.getElementById('grade_english') as HTMLInputElement
    const culEl = document.getElementById('grade_culture') as HTMLInputElement
    const islEl = document.getElementById('grade_islamic') as HTMLInputElement
    if (!militaryId) {
      if (compEl) compEl.value = ''
      if (engEl) engEl.value = ''
      if (culEl) culEl.value = ''
      if (islEl) islEl.value = ''
      return
    }
    try {
      const res = await fetch('/api/grades?military_id=' + encodeURIComponent(militaryId))
      const data = await res.json()
      if (data.success && data.grades) {
        if (compEl) compEl.value = data.grades.computer ?? ''
        if (engEl) engEl.value = data.grades.english ?? ''
        if (culEl) culEl.value = data.grades.culture ?? ''
        if (islEl) islEl.value = data.grades.islamic ?? ''
      } else {
        if (compEl) compEl.value = ''
        if (engEl) engEl.value = ''
        if (culEl) culEl.value = ''
        if (islEl) islEl.value = ''
      }
    } catch { /* silent */ }
  }, [])

  // Load grades for student view
  const loadStudentViewGrades = useCallback(async (militaryId: string) => {
    const tableEl = document.getElementById('student_grades_table')
    const noGradesEl = document.getElementById('student_no_grades')
    const compCell = document.getElementById('sgrade_computer')
    const engCell = document.getElementById('sgrade_english')
    const culCell = document.getElementById('sgrade_culture')
    const islCell = document.getElementById('sgrade_islamic')
    try {
      const res = await fetch('/api/grades?military_id=' + encodeURIComponent(militaryId))
      const data = await res.json()
      if (data.success && data.grades) {
        if (tableEl) tableEl.style.display = 'table'
        if (noGradesEl) noGradesEl.style.display = 'none'
        if (compCell) compCell.textContent = data.grades.computer ?? ''
        if (engCell) engCell.textContent = data.grades.english ?? ''
        if (culCell) culCell.textContent = data.grades.culture ?? ''
        if (islCell) islCell.textContent = data.grades.islamic ?? ''
      } else {
        if (tableEl) tableEl.style.display = 'none'
        if (noGradesEl) noGradesEl.style.display = 'block'
      }
    } catch {
      if (tableEl) tableEl.style.display = 'none'
      if (noGradesEl) noGradesEl.style.display = 'block'
    }
  }, [])

  // Login handler
  const handleLogin = useCallback(async () => {
    const mid = (document.getElementById('login_military_id') as HTMLInputElement)?.value || ''
    const pin = (document.getElementById('login_pin') as HTMLInputElement)?.value || ''
    const errorEl = document.getElementById('login_error')
    if (errorEl) errorEl.style.display = 'none'

    const formData = new FormData()
    formData.append('military_id', mid)
    formData.append('pin', pin)

    try {
      const res = await fetch('/api/login', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) {
        sessionRef.current = { role: data.role, name: data.name, military_id: data.military_id }
        if (data.role === 'lecturer') {
          const nameEl = document.getElementById('lecturer_name')
          if (nameEl) nameEl.textContent = data.name
          showScreen('lecturer')
          loadStudents()
          loadGradesStudents()
        } else {
          const nameEl = document.getElementById('student_view_name')
          if (nameEl) nameEl.textContent = data.name
          showScreen('student')
          loadStudentViewGrades(data.military_id)
        }
      } else {
        if (errorEl) {
          errorEl.textContent = data.error
          errorEl.style.display = 'block'
        }
      }
    } catch {
      if (errorEl) {
        errorEl.textContent = 'خطأ في الاتصال'
        errorEl.style.display = 'block'
      }
    }
  }, [showScreen, loadStudents, loadGradesStudents, loadStudentViewGrades])

  // Logout handler
  const handleLogout = useCallback(() => {
    sessionRef.current = { role: '', name: '', military_id: '' }
    const midEl = document.getElementById('login_military_id') as HTMLInputElement
    const pinEl = document.getElementById('login_pin') as HTMLInputElement
    if (midEl) midEl.value = ''
    if (pinEl) pinEl.value = ''
    const errorEl = document.getElementById('login_error')
    if (errorEl) errorEl.style.display = 'none'
    showScreen('login')
  }, [showScreen])

  // Add student
  const handleAddStudent = useCallback(async () => {
    const mid = (document.getElementById('add_military_id') as HTMLInputElement)?.value || ''
    const name = (document.getElementById('add_name') as HTMLInputElement)?.value || ''
    const pin = (document.getElementById('add_pin') as HTMLInputElement)?.value || ''
    const msgEl = document.getElementById('student_msg')
    if (msgEl) msgEl.style.display = 'none'

    const formData = new FormData()
    formData.append('military_id', mid)
    formData.append('name', name)
    formData.append('pin', pin)

    try {
      const res = await fetch('/api/students', { method: 'POST', body: formData })
      const data = await res.json()
      if (msgEl) {
        msgEl.style.display = 'block'
        if (data.success) {
          msgEl.style.color = 'green'
          msgEl.textContent = 'تمت الإضافة بنجاح'
          const midInp = document.getElementById('add_military_id') as HTMLInputElement
          const nameInp = document.getElementById('add_name') as HTMLInputElement
          const pinInp = document.getElementById('add_pin') as HTMLInputElement
          if (midInp) midInp.value = ''
          if (nameInp) nameInp.value = ''
          if (pinInp) pinInp.value = ''
          loadStudents()
          loadGradesStudents()
        } else {
          msgEl.style.color = 'red'
          msgEl.textContent = data.error
        }
      }
    } catch {
      if (msgEl) { msgEl.style.display = 'block'; msgEl.style.color = 'red'; msgEl.textContent = 'خطأ في الاتصال' }
    }
  }, [loadStudents, loadGradesStudents])

  // Save grades
  const handleSaveGrades = useCallback(async () => {
    const selectEl = document.getElementById('grades_student_select') as HTMLSelectElement
    const militaryId = selectEl?.value || ''
    const computer = (document.getElementById('grade_computer') as HTMLInputElement)?.value || ''
    const english = (document.getElementById('grade_english') as HTMLInputElement)?.value || ''
    const culture = (document.getElementById('grade_culture') as HTMLInputElement)?.value || ''
    const islamic = (document.getElementById('grade_islamic') as HTMLInputElement)?.value || ''
    const msgEl = document.getElementById('grades_msg')
    if (msgEl) msgEl.style.display = 'none'

    const formData = new FormData()
    formData.append('military_id', militaryId)
    formData.append('computer', computer)
    formData.append('english', english)
    formData.append('culture', culture)
    formData.append('islamic', islamic)

    try {
      const res = await fetch('/api/grades', { method: 'POST', body: formData })
      const data = await res.json()
      if (msgEl) {
        msgEl.style.display = 'block'
        if (data.success) {
          msgEl.style.color = 'green'
          msgEl.textContent = 'تم الحفظ بنجاح'
        } else {
          msgEl.style.color = 'red'
          msgEl.textContent = data.error
        }
      }
    } catch {
      if (msgEl) { msgEl.style.display = 'block'; msgEl.style.color = 'red'; msgEl.textContent = 'خطأ في الاتصال' }
    }
  }, [])

  // Tab switching
  const switchTab = useCallback((tab: string) => {
    const manageTab = document.getElementById('tab_manage')
    const gradesTab = document.getElementById('tab_grades')
    const btnManage = document.getElementById('tabbtn_manage')
    const btnGrades = document.getElementById('tabbtn_grades')
    if (tab === 'manage') {
      if (manageTab) manageTab.style.display = 'block'
      if (gradesTab) gradesTab.style.display = 'none'
      if (btnManage) { btnManage.style.background = '#333'; btnManage.style.color = '#fff' }
      if (btnGrades) { btnGrades.style.background = '#ddd'; btnGrades.style.color = '#000' }
      loadStudents()
    } else {
      if (manageTab) manageTab.style.display = 'none'
      if (gradesTab) gradesTab.style.display = 'block'
      if (btnManage) { btnManage.style.background = '#ddd'; btnManage.style.color = '#000' }
      if (btnGrades) { btnGrades.style.background = '#333'; btnGrades.style.color = '#fff' }
      loadGradesStudents()
    }
  }, [loadStudents, loadGradesStudents])

  // Grade select change
  const handleGradeSelectChange = useCallback(() => {
    const selectEl = document.getElementById('grades_student_select') as HTMLSelectElement
    loadGradesForStudent(selectEl?.value || '')
  }, [loadGradesForStudent])

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Tahoma, sans-serif', background: '#ffffff', color: '#000000', minHeight: '100vh' }}>
      {/* ===== LOGIN SCREEN ===== */}
      <div id="login_screen" style={{ maxWidth: '400px', margin: '80px auto', padding: '30px', border: '1px solid #000' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '20px' }}>تسجيل الدخول</h2>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>الرقم العسكري</label>
          <input
            id="login_military_id"
            type="text"
            maxLength={5}
            inputMode="numeric"
            onKeyDown={numericOnly}
            onPaste={numericPaste}
            style={{ width: '100%', padding: '8px', border: '1px solid #000', fontSize: '14px', fontFamily: 'Tahoma', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>الرمز</label>
          <input
            id="login_pin"
            type="password"
            maxLength={8}
            inputMode="numeric"
            onKeyDown={numericOnly}
            onPaste={numericPaste}
            style={{ width: '100%', padding: '8px', border: '1px solid #000', fontSize: '14px', fontFamily: 'Tahoma', boxSizing: 'border-box' }}
          />
        </div>
        <div id="login_error" style={{ color: 'red', fontSize: '13px', marginBottom: '8px', display: 'none' }}></div>
        <button
          onClick={handleLogin}
          style={{ width: '100%', padding: '10px', background: '#333', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '15px', fontFamily: 'Tahoma', boxSizing: 'border-box' }}
        >
          دخول
        </button>
      </div>

      {/* ===== LECTURER SCREEN ===== */}
      <div id="lecturer_screen" style={{ display: 'none' }}>
        <div style={{ background: '#333', color: '#fff', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span id="lecturer_name" style={{ fontSize: '16px' }}>مرحباً، المحاضر</span>
          <button onClick={handleLogout} style={{ background: '#d00', color: '#fff', border: 'none', padding: '6px 16px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Tahoma' }}>
            تسجيل خروج
          </button>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
          <button id="tabbtn_manage" onClick={() => switchTab('manage')} style={{ padding: '10px 24px', border: '1px solid #000', borderBottom: 'none', background: '#333', color: '#fff', cursor: 'pointer', fontSize: '14px', fontFamily: 'Tahoma' }}>
            إدارة الطلاب
          </button>
          <button id="tabbtn_grades" onClick={() => switchTab('grades')} style={{ padding: '10px 24px', border: '1px solid #000', borderBottom: 'none', background: '#ddd', color: '#000', cursor: 'pointer', fontSize: '14px', fontFamily: 'Tahoma' }}>
            إدخال الدرجات
          </button>
        </div>

        {/* Tab: Manage Students */}
        <div id="tab_manage" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          <h3 style={{ marginBottom: '15px', fontSize: '16px' }}>إضافة طالب جديد</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <input id="add_military_id" type="text" maxLength={5} inputMode="numeric" onKeyDown={numericOnly} onPaste={numericPaste} placeholder="الرقم العسكري" style={{ padding: '8px', border: '1px solid #000', fontSize: '13px', fontFamily: 'Tahoma', width: '120px', boxSizing: 'border-box' }} />
            <input id="add_name" type="text" placeholder="الاسم" style={{ padding: '8px', border: '1px solid #000', fontSize: '13px', fontFamily: 'Tahoma', width: '200px', boxSizing: 'border-box' }} />
            <input id="add_pin" type="text" maxLength={8} inputMode="numeric" onKeyDown={numericOnly} onPaste={numericPaste} placeholder="الرمز" style={{ padding: '8px', border: '1px solid #000', fontSize: '13px', fontFamily: 'Tahoma', width: '120px', boxSizing: 'border-box' }} />
            <button onClick={handleAddStudent} style={{ padding: '8px 20px', background: '#333', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontFamily: 'Tahoma' }}>
              إضافة طالب
            </button>
          </div>
          <div id="student_msg" style={{ fontSize: '13px', marginBottom: '10px', display: 'none' }}></div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #000', padding: '8px 10px', background: '#f0f0f0' }}>الرقم العسكري</th>
                <th style={{ border: '1px solid #000', padding: '8px 10px', background: '#f0f0f0' }}>الاسم</th>
                <th style={{ border: '1px solid #000', padding: '8px 10px', background: '#f0f0f0' }}>الرمز</th>
                <th style={{ border: '1px solid #000', padding: '8px 10px', background: '#f0f0f0' }}>حذف</th>
              </tr>
            </thead>
            <tbody id="students_tbody"></tbody>
          </table>
        </div>

        {/* Tab: Enter Grades */}
        <div id="tab_grades" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', display: 'none' }}>
          <h3 style={{ marginBottom: '15px', fontSize: '16px' }}>إدخال الدرجات</h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>اختر الطالب</label>
            <select id="grades_student_select" onChange={handleGradeSelectChange} style={{ width: '100%', padding: '8px', border: '1px solid #000', fontSize: '14px', fontFamily: 'Tahoma', boxSizing: 'border-box' }}>
              <option value="">-- اختر طالب --</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>الحاسوب</label>
              <input id="grade_computer" type="text" inputMode="numeric" onKeyDown={numericOnly} onPaste={numericPaste} placeholder="0 - 100" style={{ width: '100%', padding: '8px', border: '1px solid #000', fontSize: '13px', fontFamily: 'Tahoma', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>الإنجليزي</label>
              <input id="grade_english" type="text" inputMode="numeric" onKeyDown={numericOnly} onPaste={numericPaste} placeholder="0 - 100" style={{ width: '100%', padding: '8px', border: '1px solid #000', fontSize: '13px', fontFamily: 'Tahoma', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>الثقافة</label>
              <input id="grade_culture" type="text" inputMode="numeric" onKeyDown={numericOnly} onPaste={numericPaste} placeholder="0 - 100" style={{ width: '100%', padding: '8px', border: '1px solid #000', fontSize: '13px', fontFamily: 'Tahoma', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>الدراسات الشرعية</label>
              <input id="grade_islamic" type="text" inputMode="numeric" onKeyDown={numericOnly} onPaste={numericPaste} placeholder="0 - 100" style={{ width: '100%', padding: '8px', border: '1px solid #000', fontSize: '13px', fontFamily: 'Tahoma', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div id="grades_msg" style={{ fontSize: '13px', marginBottom: '10px', display: 'none' }}></div>
          <button onClick={handleSaveGrades} style={{ padding: '10px 24px', background: '#333', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '14px', fontFamily: 'Tahoma' }}>
            حفظ الدرجات
          </button>
        </div>
      </div>

      {/* ===== STUDENT SCREEN ===== */}
      <div id="student_screen" style={{ display: 'none' }}>
        <div style={{ background: '#333', color: '#fff', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '16px' }}>مرحباً، <span id="student_view_name"></span></span>
          <button onClick={handleLogout} style={{ background: '#d00', color: '#fff', border: 'none', padding: '6px 16px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Tahoma' }}>
            تسجيل خروج
          </button>
        </div>
        <div style={{ padding: '30px', maxWidth: '500px', margin: '40px auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '18px' }}>درجاتي</h2>
          <table id="student_grades_table" style={{ width: '100%', borderCollapse: 'collapse', display: 'none' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #000', padding: '8px 10px', background: '#f0f0f0' }}>المادة</th>
                <th style={{ border: '1px solid #000', padding: '8px 10px', background: '#f0f0f0' }}>الدرجة</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={{ border: '1px solid #000', padding: '8px 10px', textAlign: 'center' }}>الحاسوب</td><td id="sgrade_computer" style={{ border: '1px solid #000', padding: '8px 10px', textAlign: 'center' }}></td></tr>
              <tr><td style={{ border: '1px solid #000', padding: '8px 10px', textAlign: 'center' }}>الإنجليزي</td><td id="sgrade_english" style={{ border: '1px solid #000', padding: '8px 10px', textAlign: 'center' }}></td></tr>
              <tr><td style={{ border: '1px solid #000', padding: '8px 10px', textAlign: 'center' }}>الثقافة</td><td id="sgrade_culture" style={{ border: '1px solid #000', padding: '8px 10px', textAlign: 'center' }}></td></tr>
              <tr><td style={{ border: '1px solid #000', padding: '8px 10px', textAlign: 'center' }}>الدراسات الشرعية</td><td id="sgrade_islamic" style={{ border: '1px solid #000', padding: '8px 10px', textAlign: 'center' }}></td></tr>
            </tbody>
          </table>
          <p id="student_no_grades" style={{ textAlign: 'center', fontSize: '15px', color: '#666', display: 'none' }}>
            لم تُسجل درجاتك بعد
          </p>
        </div>
      </div>
    </div>
  )
}
