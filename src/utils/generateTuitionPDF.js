function getSignLabel(academy) {
  const cat = academy.category || ''
  const name = academy.name || ''
  if (cat.includes('교습소')) return `${name} 교습자`
  if (cat.includes('학원')) return `${name} 설립운영자`
  return '개인과외교습자'
}

function feeCell(val) {
  return val ? `${val}원` : '-'
}

function calcTotal(course) {
  const nums = [
    course.mockExamFee,
    course.materialFee,
    course.clothingFee,
    course.mealFee,
    course.dormitoryFee,
    course.vehicleFee,
  ]
    .map((v) => {
      if (!v) return 0
      return parseInt(v.replace(/[^\d]/g, ''), 10) || 0
    })
    .reduce((a, b) => a + b, 0)

  if (!nums && !course.tuitionFee) return '-'

  const tuition = parseInt((course.tuitionFee || '').replace(/[^\d]/g, ''), 10) || 0
  const total = tuition + nums
  return total ? total.toLocaleString('ko-KR') + '원' : '-'
}

function openPrintWindow(html) {
  const win = window.open('', '_blank')
  if (!win) {
    alert('팝업 차단이 활성화되어 있습니다. 팝업을 허용하고 다시 시도해주세요.')
    return
  }
  win.document.write(html)
  win.document.close()
}

// ────────────────────────────────────────────────────────────
// 내부용: 별지 제4호서식
// ────────────────────────────────────────────────────────────
export function printTuitionForm(academy) {
  const today = new Date()
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`
  const signLabel = getSignLabel(academy)

  const courseRows = (academy.courses || [])
    .map(
      (c) => `
    <tr>
      <td>${c.process || '-'}</td>
      <td>${c.subject || '-'}</td>
      <td>${c.totalTime || '-'}</td>
      <td>${c.tuitionFee ? c.tuitionFee + '원' : '-'}</td>
      <td>${c.period || '-'}</td>
      <td>${feeCell(c.mockExamFee)}</td>
      <td>${feeCell(c.materialFee)}</td>
      <td>${feeCell(c.clothingFee)}</td>
      <td>${feeCell(c.mealFee)}</td>
      <td>${feeCell(c.dormitoryFee)}</td>
      <td>${feeCell(c.vehicleFee)}</td>
      <td>${calcTotal(c)}</td>
    </tr>`,
    )
    .join('')

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>교습비등 게시표 (내부용)</title>
<style>
  @page { size: A4 portrait; margin: 12mm 10mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: '맑은 고딕', 'Malgun Gothic', sans-serif; font-size: 9pt; color: #000; }
  .page { width: 100%; }
  .form-title { text-align: center; font-size: 14pt; font-weight: bold; margin-bottom: 3px; }
  .form-subtitle { text-align: center; font-size: 9pt; font-weight: bold; margin-bottom: 10px; }
  .info-row { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-bottom: 6px; font-size: 8.5pt; }
  .info-item { display: flex; gap: 4px; }
  .info-label { font-weight: bold; white-space: nowrap; }
  table { width: 100%; border-collapse: collapse; font-size: 7pt; }
  th, td { border: 1px solid #000; padding: 3px 2px; text-align: center; vertical-align: middle; word-break: keep-all; }
  th { background: #f0f0f0; font-weight: bold; font-size: 7pt; }
  th.section { background: #d8d8d8; }
  .sign-row { margin-top: 14px; text-align: right; font-size: 9pt; }
  .notice { margin-top: 8px; font-size: 7pt; color: #333; }
  .notice p { margin-bottom: 2px; }
</style>
</head>
<body>
<div class="page">
  <div class="form-title">교습비등 게시표</div>
  <div class="form-subtitle">[별지 제4호서식]&nbsp;&nbsp;(내부 게시용)</div>
  <div class="info-row">
    <div class="info-item"><span class="info-label">학원(교습소)명:</span><span>${academy.name || ''}</span></div>
    <div class="info-item"><span class="info-label">등록(신고)번호:</span><span>${academy.regNo || ''}</span></div>
    <div class="info-item"><span class="info-label">주소:</span><span>${academy.address || ''}</span></div>
  </div>
  <table>
    <thead>
      <tr>
        <th rowspan="2">교습계열</th>
        <th rowspan="2">교습과정</th>
        <th rowspan="2">총교습시간<br>(분/월)</th>
        <th rowspan="2">교습비</th>
        <th rowspan="2">징수단위</th>
        <th colspan="6" class="section">기타경비</th>
        <th rowspan="2">합계</th>
      </tr>
      <tr>
        <th>모의고사비</th>
        <th>재료비</th>
        <th>피복비</th>
        <th>급식비</th>
        <th>기숙사비</th>
        <th>차량비</th>
      </tr>
    </thead>
    <tbody>
      ${courseRows}
    </tbody>
  </table>
  <div class="notice">
    <p>※ 교습비는 교습시간(분)을 기준으로 산정하며, 1개월의 교습시간은 실제 교습한 시간을 기준으로 합니다.</p>
    <p>※ 기타경비는 교습비와 별도로 징수할 수 있으며, 영수증을 발급하여야 합니다.</p>
  </div>
  <div class="sign-row">
    ${dateStr}&nbsp;&nbsp;&nbsp;${signLabel}&nbsp;&nbsp;&nbsp;<span style="display:inline-block;width:80px;border-bottom:1px solid #000;">&nbsp;</span>&nbsp;(인)
  </div>
</div>
<script>window.onload=()=>window.print()</script>
</body>
</html>`

  openPrintWindow(html)
}

// ────────────────────────────────────────────────────────────
// 외부용: 옥외 가격표시제
// ────────────────────────────────────────────────────────────
export function printTuitionFormExternal(academy) {
  const today = new Date()
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`

  const courseRows = (academy.courses || [])
    .map(
      (c, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${c.process || '-'}</td>
      <td>${c.subject || '-'}</td>
      <td style="font-weight:bold;">${c.tuitionFee ? c.tuitionFee + '원' : '-'}</td>
      <td>${c.period || '-'}</td>
      <td>${c.totalTime || '-'}</td>
      <td>${c.note || '-'}</td>
    </tr>`,
    )
    .join('')

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>교습비등 게시표 (외부용)</title>
<style>
  @page { size: A4 portrait; margin: 20mm 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: '맑은 고딕', 'Malgun Gothic', sans-serif; font-size: 10pt; color: #000; }
  .page { width: 100%; }
  .outer-border { border: 3px solid #000; padding: 16px 20px; }
  .form-title { text-align: center; font-size: 18pt; font-weight: bold; margin-bottom: 4px; letter-spacing: 2px; }
  .form-badge { text-align: center; font-size: 9pt; color: #555; margin-bottom: 14px; }
  .info-box { border: 1px solid #000; padding: 8px 12px; margin-bottom: 14px; }
  .info-row { display: flex; gap: 24px; flex-wrap: wrap; }
  .info-item { display: flex; gap: 8px; font-size: 10pt; }
  .info-label { font-weight: bold; white-space: nowrap; }
  table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-bottom: 12px; }
  th, td { border: 1px solid #000; padding: 5px 6px; text-align: center; vertical-align: middle; }
  th { background: #e8e8e8; font-weight: bold; font-size: 9pt; }
  .highlight { background: #fff8dc; }
  .footer-row { display: flex; justify-content: space-between; font-size: 9pt; margin-top: 6px; }
  .notice { font-size: 8pt; color: #444; margin-top: 10px; }
  .notice p { margin-bottom: 2px; }
</style>
</head>
<body>
<div class="page">
  <div class="outer-border">
    <div class="form-title">교습비등 게시표</div>
    <div class="form-badge">(교육부 학원비 옥외가격표시제 — 외부 게시용)</div>
    <div class="info-box">
      <div class="info-row">
        <div class="info-item"><span class="info-label">학원(교습소)명</span><span>${academy.name || ''}</span></div>
        <div class="info-item"><span class="info-label">등록(신고)번호</span><span>${academy.regNo || ''}</span></div>
      </div>
      <div class="info-row" style="margin-top:5px;">
        <div class="info-item"><span class="info-label">소재지</span><span>${academy.address || ''}</span></div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>번호</th>
          <th>교습계열</th>
          <th>교습과정</th>
          <th class="highlight">교습비</th>
          <th>징수단위</th>
          <th>총교습시간<br>(분/월)</th>
          <th>비고</th>
        </tr>
      </thead>
      <tbody>
        ${courseRows}
      </tbody>
    </table>
    <div class="notice">
      <p>※ 위 교습비는 학원법 제18조에 따라 신고된 금액입니다.</p>
      <p>※ 교습비 외 기타경비(재료비·모의고사비 등)는 별도 고지서를 통해 안내드립니다.</p>
      <p>※ 부당하게 초과 징수된 경우 관할 교육지원청에 신고하실 수 있습니다.</p>
    </div>
    <div class="footer-row">
      <span>${dateStr}</span>
      <span style="font-weight:bold;">${academy.name || ''}&nbsp;&nbsp;&nbsp;<span style="display:inline-block;width:80px;border-bottom:1px solid #000;">&nbsp;</span>&nbsp;(인)</span>
    </div>
  </div>
</div>
<script>window.onload=()=>window.print()</script>
</body>
</html>`

  openPrintWindow(html)
}
