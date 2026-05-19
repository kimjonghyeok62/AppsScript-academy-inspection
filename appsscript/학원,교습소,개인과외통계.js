/*******************************************************
 * (공문)학원,교습소통계 시트 생성 모듈 v2.0
 * — 헤더 구조를 공문 원본과 동일하게 구현
 *
 * ★ 헤더 구조 (이미지 기준)
 * 1행: 제목
 * 2행: 대분류 (교육지원청명 | 월 | 지도점검인원 | 점검수 | 적발수 | [적발건수: 시설/교습비등/강사등/운영] | [행정처분현황] | 과태료금액)
 * 3행: 중분류 (시설 / 교습비등 / 강사등 / 운영 / 행정처분세부)
 * 4행: 세부항목 설명 (긴 텍스트)
 * 5행: 공문상 코드 (1-1, 2-1, 2-2 ...)
 * 6행~: 데이터
 *
 * ★ 추가 구조 (이 모듈에서 확장)
 * 월 열 오른쪽에: 주차 | 날짜범위
 * 맨 끝열: 학원명(참고)
 *******************************************************/


// ═══════════════════════════════════════════════════════
// ★ 공개 함수 — buildCombinedStatSheet
// ═══════════════════════════════════════════════════════
function buildCombinedStatSheet() {
  const ui  = SpreadsheetApp.getUi();
  const res = ui.alert(
    '📊 통합통계 시트 생성',
    [
      '"(공문)학원,교습소통계" 및 "(공문)개인과외통계" 시트를 새로 만듭니다.',
      '',
      '  • 기존 시트가 있으면 삭제 후 재생성',
      '  • 각각 별도의 시트로 나뉘어 데이터가 집계됩니다.',
      '',
      '계속하시겠습니까?'
    ].join('\n'),
    ui.ButtonSet.YES_NO
  );
  if (res !== ui.Button.YES) {
    _U.toast('취소되었습니다.', '❌', 3);
    return;
  }

  _U.toast('데이터 수집 및 시트 생성 중...', '⏳', 8);

  const ss   = SpreadsheetApp.getActive();
  const main = _U.sh(C_.SHEET.MAIN);
  const weeks = _CombStat2.buildWeeks();

  // 1. 학원, 교습소 통계 시트 생성
  _CombStat2.generateSheet(ss, main, weeks, '(공문)학원,교습소통계', ['학원', '교습소'], _CombStat2.VIOL_ITEMS);

  // 2. 개인과외 통계 시트 생성 (항목 배열은 별도 정의된 VIOL_ITEMS_과외 사용)
  _CombStat2.generateSheet(ss, main, weeks, '(공문)개인과외통계', ['개인과외'], _CombStat2.VIOL_ITEMS_과외);

  SpreadsheetApp.flush();
  _U.toast('통계 시트 2종 생성 완료!', '✅', 5);
}


// ═══════════════════════════════════════════════════════
// 내부 모듈 — _CombStat2
// ═══════════════════════════════════════════════════════
const _CombStat2 = {
  // ★ 동적 처리를 위한 내부 변수 추가
  _currentTargets: [],   
  _currentViolItems: [], 
  _currentCols: {}, // ★ 새로 추가: 현재 시트에 맞는 동적 열 정보 저장소

  // ── 1. 시트 생성기 함수 (유지) ──
  generateSheet(ss, main, weeks, sheetName, targetTypes, violItemsDef) {
    const existing = ss.getSheetByName(sheetName);
    if (existing) ss.deleteSheet(existing);
    
    const statSh = ss.insertSheet(sheetName);

    this._currentTargets = targetTypes;
    this._currentViolItems = violItemsDef;
    
    // ★ 시트를 만들 때마다 열 위치를 새롭게 계산
    this._currentCols = this.buildCols(); 

    const rawData = this.collectData(main);
    this.writeSheet(statSh, rawData, weeks);
  },

  // ── 2. ★ 기존 COLS를 삭제하고 대체한 동적 열 계산 함수 ★ ──
  buildCols() {
    // 실제 위반 항목(계 제외)의 개수를 셉니다. (학원=21개, 과외=14개)
    const itemsCount = this._currentViolItems.filter(v => !v.is계).length;
    const VIOL_START = 9; // I열 고정
    const AFTER_VIOL = VIOL_START + itemsCount; // 위반 항목이 끝난 바로 다음 열

    return {
      기관명:    1,  월:        2,  주차:      3,  날짜범위:  4,
      인원:      5,  점검수:    6,  적발수:    7,  적발계:    8,
      VIOL_START: 9,
      처분계:     AFTER_VIOL,
      말소:       AFTER_VIOL + 1,
      정지:       AFTER_VIOL + 2,
      벌점:       AFTER_VIOL + 3,
      지도:       AFTER_VIOL + 4,
      과태료처분: AFTER_VIOL + 5,
      고발:       AFTER_VIOL + 6,
      과태료금액: AFTER_VIOL + 7,
      학원명:     AFTER_VIOL + 8,
    };
  },

  // ── 3. 위반항목 배열들 (유지) ──
  // 1-1은 "계" 열
  VIOL_ITEMS: [
    {
      code: '1-1',
      대분류: '시설',  // 실제로는 표 전체의 "계"에 해당
      설명: '계',
      is계: true,
    },
    // ── 시설 ──
    {
      code: '2-1',
      대분류: '시설',
      중분류: '시설',
      설명: '시설·설비 변경 미등록, 위치 무단 변경, 무등록·기준미달 숙박시설 운영',
    },
    // ── 교습비 등 ──
    {
      code: '2-2',
      대분류: '교습비 등',
      중분류: '교습비 등',
      설명: '교습비등 초과징수',
    },
    {
      code: '2-3',
      대분류: '교습비 등',
      중분류: '교습비 등',
      설명: '교습비등과 반환에 관한 사항 게시, 표시, 고지 위반(미게시, 미표시, 거짓게시, 부분게시 등)',
    },
    // ── 강사 등 ──
    {
      code: '3-1',
      대분류: '강사 등',
      중분류: '강사 등',
      설명: '강사 채용·해임 미통보, 무자격 강사 채용',
    },
    {
      code: '3-2',
      대분류: '강사 등',
      중분류: '강사 등',
      설명: '성범죄 범죄전력 미조회',
    },
    {
      code: '3-3',
      대분류: '강사 등',
      중분류: '강사 등',
      설명: '아동학대 범죄전력 미조회',
    },
    {
      code: '3-4',
      대분류: '강사 등',
      중분류: '강사 등',
      설명: '강사 인적사항 미게시',
    },
    {
      code: '3-5',
      대분류: '강사 등',
      중분류: '강사 등',
      설명: '교습소 강사(임시교습자) 또는 보조요원 관련 위반',
    },
    // ── 운영 ──
    {
      code: '4-1',
      대분류: '운영',
      중분류: '운영',
      설명: '미등록(신고) 학원(교습소)/거짓이나 부정한 방법으로 등록(신고)',
    },
    {
      code: '4-2',
      대분류: '운영',
      중분류: '운영',
      설명: '등록(신고) 외 교습과정 운영',
    },
    {
      code: '4-3',
      대분류: '운영',
      중분류: '운영',
      설명: '광고시 교습비등, 등록(신고)증명서 내용(번호, 명칭, 교습과목 등) 표시 위반(미표시, 거짓표시 등)',
    },
    {
      code: '4-4',
      대분류: '운영',
      중분류: '운영',
      설명: '제장부 (서류) 미비치, 부실기재',
    },
    {
      code: '4-5',
      대분류: '운영',
      중분류: '운영',
      설명: '등록(신고)증명서 미게시',
    },
    {
      code: '4-6',
      대분류: '운영',
      중분류: '운영',
      설명: '명칭사용위반',
    },
    {
      code: '4-7',
      대분류: '운영',
      중분류: '운영',
      설명: '선행학습 유발 광고 및 선전',
    },
    {
      code: '4-8',
      대분류: '운영',
      중분류: '운영',
      설명: '교습 시간위반',
    },
    {
      code: '4-9',
      대분류: '운영',
      중분류: '운영',
      설명: '거짓, 과대광고',
    },
    {
      code: '4-10',
      대분류: '운영',
      중분류: '운영',
      설명: '정기 연수 불참',
    },
    {
      code: '4-11',
      대분류: '운영',
      중분류: '운영',
      설명: '학원 휴원, 폐원 미신고/교습소 휴소, 폐소 미신고',
    },
    {
      code: '4-12',
      대분류: '운영',
      중분류: '운영',
      설명: '안전보험 미가입/기준미달',
    },
    {
      code: '5-1',
      대분류: '운영',
      중분류: '운영',
      설명: '기타',
    },
  ],

  // ★ 개인과외 전용 위반항목 정의 (실제 공문 기준에 맞게 내용을 수정해 주세요)
  VIOL_ITEMS_과외: [
    { code: '0-0', 대분류: '계', 설명: '계', is계: true }, // F열 계를 위한 더미 데이터
    // ── 교습비 등 ──
    { code: '1-1', 대분류: '교습비 등', 설명: '교습비등 초과징수' },
    { code: '1-2', 대분류: '교습비 등', 설명: '교습비등 변경 미신고, 교습비등 미반환, 영수증 미교부, 조정명령 미이행' },
    { code: '1-3', 대분류: '교습비 등', 설명: '교습비등과 반환에 관한 사항 게시, 표시, 고지 위반(미게시, 미표시, 거짓게시, 부분게시 등)' },
    // ── 강사 ──
    { code: '2-1', 대분류: '강사', 설명: '강사 채용' },
    // ── 운영 ──
    { code: '3-1', 대분류: '운영', 설명: '미신고 개인과외, 거짓이나 부정한 방법으로 신고' },
    { code: '3-2', 대분류: '운영', 설명: '위치 무단 변경' },
    { code: '3-3', 대분류: '운영', 설명: '신고외 교습과목 운영' },
    { code: '3-4', 대분류: '운영', 설명: '선행학습 유발광고,선전' },
    { code: '3-5', 대분류: '운영', 설명: '교습시간 위반' },
    { code: '3-6', 대분류: '운영', 설명: '신고증명서 미게시(제시불응)' },
    { code: '3-7', 대분류: '운영', 설명: '신고증명서 내용(번호, 교습과목 등) 미표시, 거짓표시' },
    { code: '3-8', 대분류: '운영', 설명: '개인과외교습 장소표지 미부착' },
    { code: '3-9', 대분류: '운영', 설명: '제장부(서류) 미비치, 부실기재' },
    { code: '4-1', 대분류: '운영', 설명: '기타' },
  ],


  // 위반항목 중 "계" 제외한 실제 항목들
  getItemCodes() {
    return this._currentViolItems.filter(v => !v.is계).map(v => v.code);
  },

  // ─── 공문상 코드 → 위반내용 텍스트 매핑 ─────────────────
  buildCodeToItemMap() {
    const vals = _U.sh(C_.SHEET.기준).getDataRange().getValues();
    const map  = new Map(); // 위반내용텍스트 → 공문상코드
    for (let r = 1; r < vals.length; r++) {
      const type = String(vals[r][0] || '').trim();
      if (!this._currentTargets.includes(type)) continue;
      const code = String(vals[r][1] || '').trim();
      const name = String(vals[r][2] || '').trim();
      if (!code || !name) continue;
      const fullItem = `${code} ${name}`;
      if (!map.has(fullItem)) map.set(fullItem, code);
      if (!map.has(name))     map.set(name, code);
    }
    return map;
  },

  // ─── 메인 시트 데이터 수집 ───────────────────────────────
  collectData(sh) {
    const C     = C_.COL;
    const start = C_.START_ROW;
    const last  = sh.getLastRow();
    if (last < start) return [];

    const n = last - start + 1;

    const dateVals  = sh.getRange(start, C.시작일,   n, 1).getValues().flat();
    const typeVals  = sh.getRange(start, C.구분,     n, 1).getDisplayValues().flat();
    const nameVals  = sh.getRange(start, C.명칭,     n, 1).getDisplayValues().flat();
    const violVals  = sh.getRange(start, C.위반내용, n, 1).getDisplayValues().flat();
    const guideVals = sh.getRange(start, C.지도내용, n, 1).getDisplayValues().flat();
    const sanctVals = sh.getRange(start, C.행정처분, n, 1).getDisplayValues().flat();
    const noteVals  = sh.getRange(start, C.비고,     n, 1).getDisplayValues().flat();
    const fineVals  = sh.getRange(start, C.과태료,   n, 1).getDisplayValues().flat();

    const codeMap       = _CombStat2.buildCodeToItemMap();
    const rows          = [];
    let   lastType      = '';
    const visitedGroup  = new Set();

    for (let i = 0; i < n; i++) {
      const type = String(typeVals[i] || '').trim() || lastType;
      if (type) lastType = type;
      if (!this._currentTargets.includes(type)) continue;

      const date = _U.toDate(dateVals[i]);
      if (!date) continue;

      const name  = String(nameVals[i]  || '').trim();
      const viol  = String(violVals[i]  || '').trim();
      const guide = String(guideVals[i] || '').trim();
      const sanct = String(sanctVals[i] || '').trim();
      const note  = String(noteVals[i]  || '').trim();
      const fine  = String(fineVals[i]  || '').trim();

      // 공문상 위반 코드 추출
      let violCode = '';
      if (viol && viol !== C_.DONE_KEYWORD) {
        violCode = codeMap.get(viol) || '';
        if (!violCode) {
          const m = viol.match(/^(\d+-\d+)\s/);
          if (m) violCode = m[1];
        }
      }

      // 과태료 금액 파싱 (천원 단위로 저장)
      let fineAmt = 0;
      if (fine) {
        const cleaned = fine.replace(/[^0-9.]/g, '');
        const num     = parseFloat(cleaned);
        if (!isNaN(num) && num > 0) {
          // 이미 천원 단위인지 확인 (값이 크면 원 단위로 간주)
          fineAmt = num >= 10000 ? Math.round(num / 1000) : num;
        }
      }

      // 같은 날+같은 학원 = 같은 점검 그룹
      const dk       = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const groupKey = `${dk}|${name}`;
      const isFirst  = !visitedGroup.has(groupKey);
      if (isFirst) visitedGroup.add(groupKey);

      rows.push({ date, type, name, viol, violCode, guide, sanct, note, fineAmt, isFirst });
    }
    return rows;
  },

  // ─── 주차 목록 생성 (금~목 기준) ─────────────────────────
  buildWeeks() {
    const today    = new Date();
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
    const year     = 2026;
    const jan1     = new Date(year, 0, 1);

    // 2026-01-01이 속한 주의 금요일(직전 금요일 or 당일) 구하기
    const dow       = jan1.getDay(); // 0=일,1=월,...,5=금,6=토
    // 금요일(5)까지의 offset: 금=0, 목=-1기준으로 직전 금요일
    // dow=5(금)→0, dow=6(토)→-1, dow=0(일)→-2, dow=1(월)→-3, dow=2(화)→-4, dow=3(수)→-5, dow=4(목)→-6
    const offsetToFri = (dow <= 5) ? (dow - 5) : (dow - 12); // dow=6→-6? 아님
    // 정확히: 직전 금요일 = date - ((date.getDay() - 5 + 7) % 7)
    const toFri = (d) => {
      const day = d.getDay();
      const diff = (day - 5 + 7) % 7;
      const fri = new Date(d);
      fri.setDate(d.getDate() - diff);
      return fri;
    };

    let weekStart = toFri(jan1);
    const weeks   = [];
    const monthWeekCount = {};
    let   safety  = 0;

    while (safety++ < 70) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // 목요일

      // 이 주차가 2026년과 겹치는지 확인
      const endYear = weekEnd.getFullYear();
      const startYear = weekStart.getFullYear();
      if (endYear < year && startYear < year) {
        weekStart.setDate(weekStart.getDate() + 7);
        continue;
      }
      if (startYear > year) break;

      // 대표 월: 목요일(weekEnd) 기준
      const repMonth = weekEnd.getFullYear() === year
        ? weekEnd.getMonth() + 1
        : weekStart.getMonth() + 1;

      // 월별 주차 번호
      if (!monthWeekCount[repMonth]) monthWeekCount[repMonth] = 0;
      monthWeekCount[repMonth]++;
      const weekNum = monthWeekCount[repMonth];

      const isThisWeek = (todayMid >= weekStart && todayMid <= weekEnd);

      weeks.push({
        weekStart:  new Date(weekStart),
        weekEnd:    new Date(weekEnd),
        month:      repMonth,
        weekNum,
        isThisWeek,
        label: _CombStat2.weekLabel(weekStart, weekEnd),
      });

      if (isThisWeek) break; // 오늘 포함 주차에서 중단

      weekStart.setDate(weekStart.getDate() + 7);
    }
    return weeks;
  },

  weekLabel(s, e) {
    const f = d => `${d.getMonth() + 1}.${d.getDate()}.`;
    return `${f(s)} ~ ${f(e)}`;
  },

  // ─── 시트 작성 ───────────────────────────────────────────
  writeSheet(sh, rawData, weeks) {
    const C2 = this._currentCols; // ★ 고정된 값 대신 알아서 맞춰진 동적 열 정보 사용
    const ITEM_CODES = this.getItemCodes(); 
    const TOTAL_COL  = C2.학원명;

    // ★ 병합 전에 먼저 freeze 설정 — 반드시 병합보다 앞에 와야 함
    // 열 고정(setFrozenColumns)은 병합된 셀이 경계를 걸칠 경우 무조건 오류 발생
    // → 이 시트는 가로가 넓으므로 행 고정(5행)만 사용, 열 고정은 하지 않음
    sh.setFrozenRows(5);
    SpreadsheetApp.flush();

    // ═══════════════════════════════════════════════════
    // ① 헤더 작성 (5행) — freeze 확정 후 병합 시작
    // ═══════════════════════════════════════════════════
    _CombStat2.writeHeaders(sh, C2, ITEM_CODES, TOTAL_COL);

    // ═══════════════════════════════════════════════════
    // ② 데이터 행 작성
    // ═══════════════════════════════════════════════════
    const monthGroups = _CombStat2.groupByMonth(weeks);
    let   dataRow     = 6; // 6행부터 데이터

    // 총계 누적
    const grandTotal = _CombStat2.emptyAgg(ITEM_CODES);

    for (const [month, monthWeeks] of monthGroups) {
      const monthAgg = _CombStat2.emptyAgg(ITEM_CODES);

      for (const week of monthWeeks) {
        const weekRows = rawData.filter(r =>
          r.date >= week.weekStart && r.date <= week.weekEnd
        );
        const stat = _CombStat2.aggregate(weekRows, ITEM_CODES);

        // 데이터 행 값 배열
        const row = _CombStat2.buildRowValues(
          '하남', `${month}`, `${week.weekNum}주차`, week.label,
          stat, C2, ITEM_CODES, TOTAL_COL
        );
        sh.getRange(dataRow, 1, 1, TOTAL_COL).setValues([row]);

        // 오늘 주차 강조
        if (week.isThisWeek) {
          sh.getRange(dataRow, 1, 1, TOTAL_COL).setBackground('#FFFDE7');
        }

        // 메모 추가
        _CombStat2.addMemos(sh, dataRow, stat, ITEM_CODES, C2);

        // 월별 누적
        _CombStat2.addAgg(monthAgg, stat, ITEM_CODES);
        // 총계 누적
        _CombStat2.addAgg(grandTotal, stat, ITEM_CODES);

        dataRow++;
      }

      // 월별 소계 행
      const mRow = _CombStat2.buildRowValues(
        '하남', `${month}`, '계', '',
        monthAgg, C2, ITEM_CODES, TOTAL_COL
      );
      sh.getRange(dataRow, 1, 1, TOTAL_COL).setValues([mRow]);
      sh.getRange(dataRow, 1, 1, TOTAL_COL)
        .setBackground('#E3F2FD')
        .setFontWeight('bold');
      dataRow++;
    }

    // 총계 행 (학원명 생략 — 너무 길어지므로)
    const totRow = _CombStat2.buildRowValues(
      '계', '', '', '',
      grandTotal, C2, ITEM_CODES, TOTAL_COL
    );
    totRow[C2.학원명 - 1] = '';  // ★ 총계 행 학원명 비움
    sh.getRange(dataRow, 1, 1, TOTAL_COL).setValues([totRow]);
    sh.getRange(dataRow, 1, 1, TOTAL_COL)
      .setBackground('#BBDEFB')
      .setFontWeight('bold');

    // ═══════════════════════════════════════════════════
    // ③ 서식 적용
    // ═══════════════════════════════════════════════════
    _CombStat2.applyStyle(sh, dataRow, TOTAL_COL, C2, ITEM_CODES.length);
  },

  // ─── 헤더 5행 작성 (동적 병합 적용) ─────────────────────────
  writeHeaders(sh, C2, ITEM_CODES, TOTAL_COL) {
    const ITEMS = this._currentViolItems;
    const is과외 = this._currentTargets.includes('개인과외');

    // ── 1행: 제목 ──
    const title = is과외 ? '개인과외교습자 행정처분 및 적발 현황(2026년 1월~12월)' : '학원(교습소) 행정처분 및 적발 현황(2026년 1월~12월)';
    sh.getRange(1, 1).setValue(title);
    sh.getRange(1, 1, 1, TOTAL_COL)
      .setBackground('#FFFFFF').setFontColor('#000000')
      .setFontSize(13) // ★ 폰트 크기 13으로 수정
      .setFontWeight('bold').setHorizontalAlignment('left'); // ★ 왼쪽 정렬

    // ── 2행: 최상위 구조 (고정) ──
    sh.getRange(2, C2.기관명,  4, 1).merge().setValue('교육지원청명');
    sh.getRange(2, C2.월,      4, 1).merge().setValue('월');
    sh.getRange(2, C2.주차,    4, 1).merge().setValue('주차');
    sh.getRange(2, C2.날짜범위,4, 1).merge().setValue('날짜 범위');
    sh.getRange(2, C2.인원,    4, 1).merge().setValue('지도점검\n인원(명)');
    sh.getRange(2, C2.점검수,  4, 1).merge().setValue('점검\n학원(교습소) 수');
    sh.getRange(2, C2.적발수,  4, 1).merge().setValue('적발학원\n(교습소) 수');

    const violBlockLen = 1 + ITEM_CODES.length;
    sh.getRange(2, C2.적발계, 1, violBlockLen).merge().setValue('적발건수');
    sh.getRange(2, C2.처분계, 1, 7).merge().setValue('행정처분 현황(건수)');
    sh.getRange(2, C2.과태료금액, 4, 1).merge().setValue('과태료\n금액(천원)');
    sh.getRange(2, C2.학원명,     4, 1).merge().setValue('학원명(참고)');

    // ── 3행: 적발건수 대분류 (★동적 병합 핵심 로직★) ──
    sh.getRange(3, C2.적발계, 2, 1).merge().setValue('계');

    const actualItems = ITEMS.filter(v => !v.is계);
    let currentGroup = '';
    let groupStartCol = C2.VIOL_START;
    let count = 0;

    actualItems.forEach((item, idx) => {
      const col = C2.VIOL_START + idx;
      if (item.대분류 !== currentGroup) {
        if (count > 0) sh.getRange(3, groupStartCol, 1, count).merge().setValue(currentGroup);
        currentGroup = item.대분류;
        groupStartCol = col;
        count = 1;
      } else {
        count++;
      }
    });
    if (count > 0) sh.getRange(3, groupStartCol, 1, count).merge().setValue(currentGroup);

    // ── 3~4행: 행정처분 세부 병합 ──
    const sanctHeaders = ['계', '등록말소/폐지', '교습정지', '벌점부과/시정명령/경고', '행정지도', '과태료', '고발(수사의뢰)'];
    sanctHeaders.forEach((text, idx) => {
      sh.getRange(3, C2.처분계 + idx, 2, 1).merge().setValue(text);
    });

    // ── 4행: 세부항목 설명 ──
    ITEM_CODES.forEach((code, idx) => {
      const item = ITEMS.find(v => v.code === code);
      if (item) sh.getRange(4, C2.VIOL_START + idx, 1, 1).setValue(item.설명);
    });

    // ── 5행: 공문상 코드 ──
    sh.getRange(5, C2.적발계, 1, 1).setValue('공문상');
    ITEM_CODES.forEach((code, idx) => {
      sh.getRange(5, C2.VIOL_START + idx, 1, 1).setValue(code);
    });
  },

  // ─── 행 데이터 배열 생성 ─────────────────────────────────
  buildRowValues(기관명, 월, 주차, 날짜범위, stat, C2, ITEM_CODES, TOTAL_COL) {
    const row = Array(TOTAL_COL).fill(0);

    row[C2.기관명   - 1] = 기관명;
    row[C2.월       - 1] = 월;
    row[C2.주차     - 1] = 주차;
    row[C2.날짜범위 - 1] = 날짜범위;
    row[C2.인원     - 1] = stat.inspectors;
    row[C2.점검수   - 1] = stat.checked;
    row[C2.적발수   - 1] = stat.caught;
    row[C2.적발계   - 1] = stat.violTotal;

    ITEM_CODES.forEach((code, idx) => {
      row[C2.VIOL_START + idx - 1] = stat.violByCode[code] || 0;
    });

    row[C2.처분계     - 1] = stat.sanctTotal;
    row[C2.말소       - 1] = stat.sanct.말소;
    row[C2.정지       - 1] = stat.sanct.정지;
    row[C2.벌점       - 1] = stat.sanct.벌점;
    row[C2.지도       - 1] = stat.sanct.지도;
    row[C2.과태료처분 - 1] = stat.sanct.과태료처분;
    row[C2.고발       - 1] = stat.sanct.고발;
    row[C2.과태료금액 - 1] = stat.fine;
    row[C2.학원명     - 1] = [...stat.names].join(', ');

    return row;
  },

  // ─── 집계 ───────────────────────────────────────────────
  emptyAgg(ITEM_CODES) {
    const violByCode  = {};
    const namesByCode = {};
    ITEM_CODES.forEach(c => { 
      violByCode[c] = 0; 
      namesByCode[c] = []; // 위반항목 메모도 상세 내역을 위해 Array로 변경
    });
    
    return {
      inspectors: 0, checked: 0, caught: 0, violTotal: 0,
      violByCode, namesByCode,
      sanctTotal: 0,
      sanct: { 말소: 0, 정지: 0, 벌점: 0, 지도: 0, 과태료처분: 0, 고발: 0 },
      // ★ 행정처분 메모 저장소를 Array[]로 변경하여 중복 내역(동일금액 과태료 등) 보존
      namesBySanct: { 
        말소: [], 정지: [], 벌점: [], 
        지도: [], 과태료처분: [], 고발: [] 
      },
      fine: 0,
      names: new Set(), // 점검 학원 명단은 유니크해야 하므로 Set 유지
    };
  },

  addAgg(dest, src, ITEM_CODES) {
    dest.inspectors += src.inspectors;
    dest.checked    += src.checked;
    dest.caught     += src.caught;
    dest.violTotal  += src.violTotal;
    dest.sanctTotal += src.sanctTotal;
    dest.fine       += src.fine;
    src.names.forEach(n => dest.names.add(n));
    
    ITEM_CODES.forEach(c => {
      dest.violByCode[c] = (dest.violByCode[c] || 0) + (src.violByCode[c] || 0);
      dest.namesByCode[c] = dest.namesByCode[c].concat(src.namesByCode[c]);
    });
    
    Object.keys(dest.sanct).forEach(k => {
      dest.sanct[k] += src.sanct[k];
      // 기존 배열에 새로운 배열 합치기
      dest.namesBySanct[k] = dest.namesBySanct[k].concat(src.namesBySanct[k]);
    });
  },

  aggregate(weekRows, ITEM_CODES) {
    const agg = this.emptyAgg(ITEM_CODES);
    const checkedGK = new Set();
    const caughtGK  = new Set();

    for (const r of weekRows) {
      const dk = `${r.date.getFullYear()}-${r.date.getMonth()}-${r.date.getDate()}`;
      const gk = `${dk}|${r.name}`;

      if (r.isFirst && !checkedGK.has(gk)) {
        checkedGK.add(gk);
        agg.inspectors += 2;
        agg.names.add(r.name);
      }

      if (r.violCode || r.fineAmt > 0) {
        caughtGK.add(gk);

        if (ITEM_CODES.includes(r.violCode)) {
          agg.violByCode[r.violCode]++;
          agg.namesByCode[r.violCode].push(r.name); // .add -> .push
          agg.violTotal++;
        }

        const s = r.sanct;
        let isSanctAction = false;

        const checkSanct = (key, regex) => {
          if (regex.test(s)) {
            agg.sanct[key]++;
            agg.namesBySanct[key].push(r.name); // .add -> .push
            isSanctAction = true;
          }
        };

        checkSanct('말소', /말소|폐지/);
        checkSanct('정지', /정지/);
        checkSanct('벌점', /벌점|시정|경고/);
        checkSanct('지도', /지도/);
        checkSanct('고발', /고발|수사/);

        // ★ 과태료: 금액 발생 시 내역 무조건 추가
        if (r.fineAmt > 0 || /과태료/.test(s)) {
          agg.sanct.과태료처분++;
          const fineInfo = r.fineAmt > 0 ? `${r.name}(${r.fineAmt.toLocaleString()}천원)` : r.name;
          agg.namesBySanct.과태료처분.push(fineInfo); // 중복되어도 모두 저장
          isSanctAction = true;
          agg.fine += r.fineAmt;
        }

        if (isSanctAction) agg.sanctTotal++;
      }
    }
    agg.checked = checkedGK.size;
    agg.caught = caughtGK.size;
    return agg;
  },

  // ─── 메모 추가 ───────────────────────────────────────────
  addMemos(sh, rowIdx, stat, ITEM_CODES, C2) {
    ITEM_CODES.forEach((code, idx) => {
      const names = stat.namesByCode[code];
      if (names && names.length > 0) {
        sh.getRange(rowIdx, C2.VIOL_START + idx).setNote(`[${code} 위반]\n${names.join('\n')}`);
      }
    });

    const sanctKeys = [
      { key: '말소', col: C2.말소 }, { key: '정지', col: C2.정지 },
      { key: '벌점', col: C2.벌점 }, { key: '지도', col: C2.지도 },
      { key: '과태료처분', col: C2.과태료처분 }, { key: '고발', col: C2.고발 },
    ];

    sanctKeys.forEach(item => {
      const names = stat.namesBySanct[item.key];
      if (names && names.length > 0) {
        sh.getRange(rowIdx, item.col).setNote(`[${item.key} 대상]\n${names.join('\n')}`);
      }
    });
    
    if (stat.fine > 0) {
      const fineNames = stat.namesBySanct['과태료처분'];
      sh.getRange(rowIdx, C2.과태료금액).setNote(`[과태료 상세]\n${fineNames.join('\n')}`);
    }
  },

  groupByMonth(weeks) {
    const map = new Map();
    for (const w of weeks) {
      if (!map.has(w.month)) map.set(w.month, []);
      map.get(w.month).push(w);
    }
    return map;
  },

  // ─── 서식 적용 (0값 투명 처리 및 동적 색상 최적화) ─────────────────
  applyStyle(sh, lastRow, TOTAL_COL, C2, itemCount) {
    sh.getRange(1, 1, lastRow, TOTAL_COL)
      .setFontSize(9).setVerticalAlignment('middle').setHorizontalAlignment('center');

    const headerRange = sh.getRange(2, 1, 4, TOTAL_COL);
    headerRange.setFontWeight('bold').setWrap(true);

    // 섹션별 2행 배경색 지정
    sh.getRange(2, C2.기관명, 4, C2.날짜범위).setBackground('#1565C0').setFontColor('#FFFFFF'); 
    sh.getRange(2, C2.인원,   4, 3).setBackground('#1565C0').setFontColor('#FFFFFF'); 
    
    const violBlockLen = 1 + itemCount; 
    sh.getRange(2, C2.적발계, 1, violBlockLen).setBackground('#1976D2').setFontColor('#FFFFFF'); 
    sh.getRange(2, C2.처분계, 1, 7).setBackground('#388E3C').setFontColor('#FFFFFF'); 
    sh.getRange(2, C2.과태료금액, 4, 1).setBackground('#6A1B9A').setFontColor('#FFFFFF');
    sh.getRange(2, C2.학원명,     4, 1).setBackground('#37474F').setFontColor('#FFFFFF');

    // ── 3행 대분류별 동적 색상 적용 (★에러 해결의 핵심★) ──
    const actualItems = this._currentViolItems.filter(v => !v.is계);
    let currentGroup = '';
    let groupStartCol = C2.VIOL_START;
    let count = 0;

    const colorMap = {
      '시설': { bg: '#B3E5FC', font: '#01579B' },
      '교습비 등': { bg: '#C8E6C9', font: '#1B5E20' },
      '강사 등': { bg: '#FFF9C4', font: '#F57F17' },
      '강사': { bg: '#FFF9C4', font: '#F57F17' }, // 개인과외용 강사 색상 추가
      '운영': { bg: '#FCE4EC', font: '#880E4F' }
    };

    actualItems.forEach((item, idx) => {
      const col = C2.VIOL_START + idx;
      if (item.대분류 !== currentGroup) {
        if (count > 0) {
          const colors = colorMap[currentGroup] || { bg: '#E0E0E0', font: '#000000' };
          sh.getRange(3, groupStartCol, 1, count).setBackground(colors.bg).setFontColor(colors.font);
        }
        currentGroup = item.대분류;
        groupStartCol = col;
        count = 1;
      } else {
        count++;
      }
    });
    if (count > 0) {
      const colors = colorMap[currentGroup] || { bg: '#E0E0E0', font: '#000000' };
      sh.getRange(3, groupStartCol, 1, count).setBackground(colors.bg).setFontColor(colors.font);
    }

    sh.getRange(3, C2.처분계, 1, 7).setBackground('#A5D6A7').setFontColor('#1B5E20'); // 행정처분
    sh.getRange(4, C2.VIOL_START, 1, itemCount).setBackground('#F5F5F5').setFontColor('#424242'); // 세부설명
    sh.getRange(4, C2.처분계, 1, 7).setBackground('#E8F5E9').setFontColor('#2E7D32'); // 행정처분 설명
    sh.getRange(5, C2.적발계, 1, violBlockLen).setBackground('#ECEFF1').setFontColor('#546E7A'); // 코드

    // 숫자 데이터 서식 및 테두리 (6행 이상 데이터가 있을 경우)
    if (lastRow >= 6) {
      const numRange = sh.getRange(6, C2.인원, lastRow - 5, C2.과태료금액 - C2.인원 + 1);
      numRange.setNumberFormat('#,##0;-#,##0;;@');
      
      sh.getRange(6, 1, lastRow - 5, TOTAL_COL)
        .setBorder(true, true, true, true, true, true, '#BBBBBB', SpreadsheetApp.BorderStyle.SOLID);
        
      sh.getRange(6, C2.날짜범위, lastRow - 5, 1).setHorizontalAlignment('left');
      sh.getRange(6, C2.학원명,   lastRow - 5, 1).setHorizontalAlignment('left');
    }

    sh.getRange(2, 1, 4, TOTAL_COL)
      .setBorder(true, true, true, true, true, true, '#888888', SpreadsheetApp.BorderStyle.SOLID);

    // 열 너비 기본 설정
    sh.setColumnWidth(C2.기관명, 60); sh.setColumnWidth(C2.월, 35);
    sh.setColumnWidth(C2.주차, 45);   sh.setColumnWidth(C2.날짜범위, 105);
    sh.setColumnWidth(C2.인원, 50);   sh.setColumnWidth(C2.점검수, 50);
    sh.setColumnWidth(C2.적발수, 50); sh.setColumnWidth(C2.적발계, 40);
    
    // 항목 개수만큼 유연하게 열 너비 설정
    for (let i = 0; i < itemCount; i++) {
      sh.setColumnWidth(C2.VIOL_START + i, 42);
    }
    
    const sanctCols = [C2.처분계, C2.말소, C2.정지, C2.벌점, C2.지도, C2.과태료처분, C2.고발];
    const sanctWidths = [42, 55, 55, 80, 55, 50, 70];
    sanctCols.forEach((col, idx) => sh.setColumnWidth(col, sanctWidths[idx]));
    
    sh.setColumnWidth(C2.과태료금액, 75);
    sh.setColumnWidth(C2.학원명, 300);

    sh.setRowHeights(1, 3, 28);
    sh.setRowHeight(4, 90); 
    sh.setRowHeight(5, 28);
    if (lastRow >= 6) sh.setRowHeights(6, lastRow - 5, 30);

    SpreadsheetApp.flush();
  }
};


// ═══════════════════════════════════════════════════════
// ★ onOpen 추가 안내
// 기존 onOpen() 내부 메뉴 체인에 아래 두 줄을 추가하세요:
//
//   .addSeparator()
//   .addItem('📊 학원,교습소,개인과외 통계 생성', 'buildCombinedStatSheet')
//
// (addToUi() 바로 직전)
// ═══════════════════════════════════════════════════════