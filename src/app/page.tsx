'use client'

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

function getGradeClass(grade: string | number | null | undefined): string {
  if (grade === null || grade === undefined || grade === '') return ''
  const num = Number(grade)
  if (isNaN(num)) return ''
  if (num >= 80) return 'grade-high'
  if (num >= 60) return 'grade-mid'
  return 'grade-low'
}

export default function Home() {
  const sessionRef = useRef({ role: '', name: '', military_id: '' })

  const showScreen = useCallback((screen: string) => {
    const loginEl = document.getElementById('login_screen')
    const lecturerEl = document.getElementById('lecturer_screen')
    const studentEl = document.getElementById('student_screen')
    if (loginEl) loginEl.style.display = screen === 'login' ? 'flex' : 'none'
    if (lecturerEl) lecturerEl.style.display = screen === 'lecturer' ? 'block' : 'none'
    if (studentEl) studentEl.style.display = screen === 'student' ? 'block' : 'none'
  }, [])

  const numericOnly = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!/^[0-9]$/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
      e.preventDefault()
    }
  }, [])

  const numericPaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text')
    if (!/^\d*$/.test(pasted)) {
      e.preventDefault()
    }
  }, [])

  const loadStudentsRef = useRef<() => Promise<void>>()
  const loadGradesStudentsRef = useRef<() => Promise<void>>()

  const loadStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/students')
      const students = await res.json()
      const tbody = document.getElementById('students_tbody')
      if (!tbody) return
      tbody.innerHTML = ''
      if (students.length === 0) {
        const tr = document.createElement('tr')
        tr.innerHTML = '<td colspan="4" style="padding:20px;color:var(--text-muted);text-align:center;font-size:14px;">لا يوجد طلاب مسجلين</td>'
        tbody.appendChild(tr)
        return
      }
      students.forEach((s: { military_id: string; name: string; pin: string }) => {
        const tr = document.createElement('tr')
        tr.innerHTML =
          '<td>' + escapeHtml(s.military_id) + '</td>' +
          '<td>' + escapeHtml(s.name) + '</td>' +
          '<td>' + escapeHtml(s.pin) + '</td>' +
          '<td><button data-mid="' + escapeHtml(s.military_id) + '" class="delete-student-btn btn-danger">حذف</button></td>'
        tbody.appendChild(tr)
      })
      tbody.querySelectorAll('.delete-student-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const mid = (btn as HTMLElement).dataset.mid
          if (!mid) return
          if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return
          const formData = new FormData()
          formData.append('military_id', mid)
          await fetch('/api/students', { method: 'DELETE', body: formData })
          loadStudentsRef.current()
          loadGradesStudentsRef.current()
        })
      })
    } catch { /* silent */ }
  }, [])

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
        opt.textContent = s.name + ' (' + s.military_id + ')'
        select.appendChild(opt)
      })
      select.value = currentVal
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    loadStudentsRef.current = loadStudents
    loadGradesStudentsRef.current = loadGradesStudents
  }, [loadStudents, loadGradesStudents])

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
        if (compCell) { compCell.textContent = data.grades.computer ?? ''; compCell.className = getGradeClass(data.grades.computer) }
        if (engCell) { engCell.textContent = data.grades.english ?? ''; engCell.className = getGradeClass(data.grades.english) }
        if (culCell) { culCell.textContent = data.grades.culture ?? ''; culCell.className = getGradeClass(data.grades.culture) }
        if (islCell) { islCell.textContent = data.grades.islamic ?? ''; islCell.className = getGradeClass(data.grades.islamic) }
      } else {
        if (tableEl) tableEl.style.display = 'none'
        if (noGradesEl) noGradesEl.style.display = 'block'
      }
    } catch {
      if (tableEl) tableEl.style.display = 'none'
      if (noGradesEl) noGradesEl.style.display = 'block'
    }
  }, [])

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
          switchTab('manage')
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
        errorEl.textContent = 'خطأ في الاتصال بالخادم'
        errorEl.style.display = 'block'
      }
    }
  }, [showScreen, loadStudents, loadGradesStudents, loadStudentViewGrades])

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
          msgEl.className = 'msg msg-success'
          msgEl.textContent = 'تمت إضافة الطالب بنجاح'
          const midInp = document.getElementById('add_military_id') as HTMLInputElement
          const nameInp = document.getElementById('add_name') as HTMLInputElement
          const pinInp = document.getElementById('add_pin') as HTMLInputElement
          if (midInp) midInp.value = ''
          if (nameInp) nameInp.value = ''
          if (pinInp) pinInp.value = ''
          loadStudents()
          loadGradesStudents()
        } else {
          msgEl.className = 'msg msg-error'
          msgEl.textContent = data.error
        }
      }
    } catch {
      if (msgEl) { msgEl.style.display = 'block'; msgEl.className = 'msg msg-error'; msgEl.textContent = 'خطأ في الاتصال بالخادم' }
    }
  }, [loadStudents, loadGradesStudents])

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
          msgEl.className = 'msg msg-success'
          msgEl.textContent = 'تم حفظ الدرجات بنجاح'
        } else {
          msgEl.className = 'msg msg-error'
          msgEl.textContent = data.error
        }
      }
    } catch {
      if (msgEl) { msgEl.style.display = 'block'; msgEl.className = 'msg msg-error'; msgEl.textContent = 'خطأ في الاتصال بالخادم' }
    }
  }, [])

  const switchTab = useCallback((tab: string) => {
    const manageTab = document.getElementById('tab_manage')
    const gradesTab = document.getElementById('tab_grades')
    const btnManage = document.getElementById('tabbtn_manage')
    const btnGrades = document.getElementById('tabbtn_grades')
    if (tab === 'manage') {
      if (manageTab) manageTab.style.display = 'block'
      if (gradesTab) gradesTab.style.display = 'none'
      if (btnManage) btnManage.className = 'tab-btn active'
      if (btnGrades) btnGrades.className = 'tab-btn'
      loadStudents()
    } else {
      if (manageTab) manageTab.style.display = 'none'
      if (gradesTab) gradesTab.style.display = 'block'
      if (btnManage) btnManage.className = 'tab-btn'
      if (btnGrades) btnGrades.className = 'tab-btn active'
      loadGradesStudents()
    }
  }, [loadStudents, loadGradesStudents])

  const handleGradeSelectChange = useCallback(() => {
    const selectEl = document.getElementById('grades_student_select') as HTMLSelectElement
    loadGradesForStudent(selectEl?.value || '')
  }, [loadGradesForStudent])

  // Handle Enter key on login
  const handleLoginKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin()
  }, [handleLogin])

  return (
    <div>
      {/* ===== LOGIN SCREEN ===== */}
      <div id="login_screen" className="login-wrapper">
        <div className="login-card">
          <div className="login-header">
            <h2> نظام درجات الطلاب</h2>
            <p>سجّل دخولك باستخدام الرقم العسكري والرمز</p>
          </div>
          <div className="login-body">
            <div className="form-group">
              <label>الرقم العسكري</label>
              <input
                id="login_military_id"
                type="text"
                maxLength={5}
                inputMode="numeric"
                onKeyDown={(e) => { numericOnly(e); handleLoginKeyDown(e) }}
                onPaste={numericPaste}
                className="form-input"
                placeholder="أدخل 5 أرقام"
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <label>الرمز</label>
              <input
                id="login_pin"
                type="password"
                maxLength={8}
                inputMode="numeric"
                onKeyDown={(e) => { numericOnly(e); handleLoginKeyDown(e) }}
                onPaste={numericPaste}
                className="form-input"
                placeholder="أدخل 8 أرقام"
                autoComplete="off"
              />
            </div>
            <div id="login_error" className="login-error"></div>
            <button onClick={handleLogin} className="btn-primary">
              تسجيل الدخول
            </button>
          </div>
        </div>
      </div>

      {/* ===== LECTURER SCREEN ===== */}
      <div id="lecturer_screen" style={{ display: 'none', minHeight: '100vh', background: 'var(--bg)' }}>
        {/* Header */}
        <div className="header-bar">
          <div className="header-title">
            <div className="icon-shield"></div>
            <span>مرحباً، <span id="lecturer_name">المحاضر</span></span>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            &#x2190; تسجيل خروج
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs-bar">
          <button id="tabbtn_manage" onClick={() => switchTab('manage')} className="tab-btn active">
            &#x1F4CB; إدارة الطلاب
          </button>
          <button id="tabbtn_grades" onClick={() => switchTab('grades')} className="tab-btn">
            &#x270D; إدخال الدرجات
          </button>
        </div>

        {/* Tab: Manage Students */}
        <div className="main-content">
          <div id="tab_manage">
            {/* Add Student Card */}
            <div className="card">
              <div className="card-header">
                <div className="card-header-icon">+</div>
                <h3>إضافة طالب جديد</h3>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>الرقم العسكري</label>
                  <input id="add_military_id" type="text" maxLength={5} inputMode="numeric" onKeyDown={numericOnly} onPaste={numericPaste} className="form-input" placeholder="5 أرقام" style={{ width: '130px' }} />
                </div>
                <div className="form-group">
                  <label>اسم الطالب</label>
                  <input id="add_name" type="text" className="form-input" placeholder="الاسم الثلاثي" style={{ width: '220px' }} />
                </div>
                <div className="form-group">
                  <label>الرمز</label>
                  <input id="add_pin" type="text" maxLength={8} inputMode="numeric" onKeyDown={numericOnly} onPaste={numericPaste} className="form-input" placeholder="8 أرقام" style={{ width: '130px' }} />
                </div>
                <button onClick={handleAddStudent} className="btn-primary" style={{ height: '42px' }}>
                  إضافة طالب
                </button>
              </div>
              <div id="student_msg" className="msg"></div>
            </div>

            {/* Students Table Card */}
            <div className="card">
              <div className="card-header">
                <div className="card-header-icon">&#x1F465;</div>
                <h3>قائمة الطلاب</h3>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>الرقم العسكري</th>
                    <th>الاسم</th>
                    <th>الرمز</th>
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody id="students_tbody"></tbody>
              </table>
            </div>
          </div>

          {/* Tab: Enter Grades */}
          <div id="tab_grades" style={{ display: 'none' }}>
            <div className="card">
              <div className="card-header">
                <div className="card-header-icon">&#x1F4CA;</div>
                <h3>إدخال الدرجات</h3>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-light)', fontWeight: 'bold' }}>اختر الطالب</label>
                <select id="grades_student_select" onChange={handleGradeSelectChange} className="form-select">
                  <option value="">-- اختر طالب --</option>
                </select>
              </div>

              <div className="grades-grid">
                <div className="grade-field">
                  <label>الحاسوب</label>
                  <input id="grade_computer" type="text" inputMode="numeric" onKeyDown={numericOnly} onPaste={numericPaste} className="form-input" placeholder="0 - 100" />
                </div>
                <div className="grade-field">
                  <label>اللغة الإنجليزية</label>
                  <input id="grade_english" type="text" inputMode="numeric" onKeyDown={numericOnly} onPaste={numericPaste} className="form-input" placeholder="0 - 100" />
                </div>
                <div className="grade-field">
                  <label>الثقافة العسكرية</label>
                  <input id="grade_culture" type="text" inputMode="numeric" onKeyDown={numericOnly} onPaste={numericPaste} className="form-input" placeholder="0 - 100" />
                </div>
                <div className="grade-field">
                  <label>الدراسات الشرعية</label>
                  <input id="grade_islamic" type="text" inputMode="numeric" onKeyDown={numericOnly} onPaste={numericPaste} className="form-input" placeholder="0 - 100" />
                </div>
              </div>

              <div id="grades_msg" className="msg"></div>

              <button onClick={handleSaveGrades} className="btn-primary">
                حفظ الدرجات
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== STUDENT SCREEN ===== */}
      <div id="student_screen" style={{ display: 'none', minHeight: '100vh', background: 'var(--bg)' }}>
        {/* Header */}
        <div className="header-bar">
          <div className="header-title">
            <div className="icon-shield"></div>
            <span>مرحباً، <span id="student_view_name"></span></span>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            &#x2190; تسجيل خروج
          </button>
        </div>

        <div className="student-content">
          <div className="card">
            <div className="student-welcome">
              <h2>&#x1F4DA; درجاتي</h2>
              <p>عرض الدرجات المسجلة في جميع المواد</p>
            </div>

            <table id="student_grades_table" className="data-table" style={{ display: 'none' }}>
              <thead>
                <tr>
                  <th>المادة</th>
                  <th>الدرجة</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>الحاسوب</td>
                  <td id="sgrade_computer"></td>
                </tr>
                <tr>
                  <td>اللغة الإنجليزية</td>
                  <td id="sgrade_english"></td>
                </tr>
                <tr>
                  <td>الثقافة العسكرية</td>
                  <td id="sgrade_culture"></td>
                </tr>
                <tr>
                  <td>الدراسات الشرعية</td>
                  <td id="sgrade_islamic"></td>
                </tr>
              </tbody>
            </table>
            <div id="student_no_grades" className="grade-display">
              لم تُسجل درجاتك بعد
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}