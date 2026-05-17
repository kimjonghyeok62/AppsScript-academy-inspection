// 시도교육청 코드 목록 (경기도 = J10)
export const GYEONGGI_CODE = 'J10'

/**
 * PSNBY_THCC_CNTNT 필드 파싱
 * 예: "1개월 100,000원" → { fee: '100,000', period: '1개월' }
 */
function parseFeeContent(content) {
  if (!content) return { fee: '', period: '' }
  const str = content.trim()

  const feeMatch = str.match(/([\d,]+)\s*원/)
  const fee = feeMatch ? feeMatch[1] : ''

  const periodPatterns = [
    /(\d+개월)/,
    /(분기)/,
    /(반기)/,
    /(연간)/,
    /(1년)/,
    /(주간)/,
    /(주)/,
    /(월)/,
    /(일)/,
  ]
  let period = ''
  for (const pat of periodPatterns) {
    const m = str.match(pat)
    if (m) { period = m[1]; break }
  }

  return { fee, period }
}

function rowToAcademy(row) {
  const { fee, period } = parseFeeContent(row.PSNBY_THCC_CNTNT)

  return {
    name: row.ACA_NM || '',
    address: (row.FA_RDNMA || row.FA_RDNDA || '').trim(),
    regNo: '',
    category: row.ACA_KND_SC_NM || '',
    eduType: row.REALM_SC_NM || '',
    regDate: row.REG_YMD || '',
    changeDate: row.TOFOR_SMTOT || '',
    founder: { name: '' },
    courses: [
      {
        process: row.REALM_SC_NM || '',
        subject: row.LE_ORD_NM || '',
        tuitionFee: fee,
        period: period,
        totalTime: '',
        mockExamFee: '',
        materialFee: '',
        clothingFee: '',
        mealFee: '',
        dormitoryFee: '',
        vehicleFee: '',
        note: '',
      },
    ],
    rawRows: [],
  }
}

function mergeRows(rows) {
  if (!rows.length) return null
  const base = rowToAcademy(rows[0])
  base.rawRows = rows

  if (rows.length > 1) {
    base.courses = rows.map((row) => {
      const { fee, period } = parseFeeContent(row.PSNBY_THCC_CNTNT)
      return {
        process: row.REALM_SC_NM || '',
        subject: row.LE_ORD_NM || '',
        tuitionFee: fee,
        period: period,
        totalTime: '',
        mockExamFee: '',
        materialFee: '',
        clothingFee: '',
        mealFee: '',
        dormitoryFee: '',
        vehicleFee: '',
        note: '',
      }
    })
  }

  return base
}

export async function fetchAcademyFromNeis({ name, apiKey }) {
  const params = new URLSearchParams()
  params.set('Type', 'json')
  params.set('pIndex', '1')
  params.set('pSize', '100')
  params.set('ATPT_OFCDC_SC_CODE', GYEONGGI_CODE)

  if (apiKey) params.set('KEY', apiKey)
  if (name) params.set('ACA_NM', name)

  const url = `/api/neis?${params.toString()}`
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`서버 오류: ${res.status}`)
  }

  const data = await res.json()

  if (data?.RESULT) {
    const { CODE, MESSAGE } = data.RESULT
    if (CODE === 'INFO-300') {
      throw new Error('API 키가 유효하지 않거나 없습니다. open.neis.go.kr에서 키를 발급 후 입력해주세요.')
    }
    throw new Error(MESSAGE || '데이터 조회 실패')
  }

  const errorInfo = data?.acaInsTiInfo?.[0]?.head?.[1]?.RESULT
  if (errorInfo) {
    const code = errorInfo.CODE
    if (code !== 'INFO-000') {
      if (code === 'INFO-200') throw new Error('해당 조건으로 검색된 데이터가 없습니다. 학원명을 다시 확인해주세요.')
      throw new Error(errorInfo.MESSAGE || '데이터 조회 실패')
    }
  }

  const rows = data?.acaInsTiInfo?.[1]?.row
  if (!rows || !rows.length) {
    throw new Error('검색 결과가 없습니다.')
  }

  return mergeRows(rows)
}
