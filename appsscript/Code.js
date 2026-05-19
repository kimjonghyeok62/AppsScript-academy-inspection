/*******************************************************
 * 2026 학원 등 지도점검 대장 자동화 v6.4.5
 *
 * ★ v6.4.5 변경사항 (v6.4.4 → v6.4.5)
 * - 그룹 배경색 통일: 같은 그룹(같은 날·같은 학원)은
 *   첫 행/반복 행 구분 없이 동일한 배경색 적용
 * - 날짜 기준 색상 교차:
 *   날짜가 같으면 같은 색, 날짜가 바뀌면 색 교차
 *   진행 중: 흰색 ↔ 연회색 교차
 *   완료:    진회색A ↔ 진회색B 교차
 * - 그룹 내 2번째 행부터 A~K열 글자색 = 배경색
 *   (같은 학원 반복 정보가 시각적으로 안 보이게)
 * - 행 높이 37px 고정 유지
 *******************************************************/

// ═══════════════════════════════════════════════════════
// 설정 (단일 진실 공급원)
// ═══════════════════════════════════════════════════════
const C_ = {
  SHEET: {
    MAIN:     '2026년도 지도점검',
    기준:     '행정처분기준',
    점검자:   '드롭다운목록',
    DV:       '__DV__',
    DV목록:   '드롭다운목록',
  },
  START_ROW: 4,
  HEADER_ROW: 3,
  TAIL_ROWS: 5,
  TZ:        'Asia/Seoul',
  TTL:       86400,

  COL: {
    연번:         1,   // A
    시작일:       2,   // B
    구분:         3,   // C
    목적:         4,   // D
    명칭:         5,   // E
    등록번호:     6,   // F
    주소:         7,   // G
    주소동:       8,   // H
    운영자:       9,   // I
    연락처:      10,   // J
    이력:        11,   // K
    미점검기간:  11,   // K (이력과 동일)
    예약일정:    12,   // L (T열에서 이동)
    지도내용:    13,   // M
    위반내용:    14,   // N
    행정처분:    15,   // O
    과태료:      16,   // P
    과태료부과일: 17,  // Q
    사전의견:    18,   // R
    처분일:      19,   // S
    비고:        20,   // T
    점검자:      21,   // U
    나이스입력:  22,   // V
    캘린더EventId: 23, // W
  },

  // FHD(1920×1080) 기준 열 너비 설정
  // A~U 합계 ≒ 1780px → 스크롤바·행번호 여백 포함 시 화면에 딱 맞음
  COL_WIDTHS: {
    1:  45,   // A 연번 (유지)
    2:  80,   // B 점검일
    3:  55,   // C 구분
    4:  80,   // D 점검목적
    5: 110,   // E 명칭   (120 → 110)
    6:  72,   // F 등록번호 (80 → 72)
    7: 160,   // G 주소
    8:  65,   // H 주소(동)
    9:  55,   // I 운영자
    10: 70,   // J 연락처
    11: 58,   // K 미점검기간 (65 → 58)
    12: 145,  // L 예약일정
    13: 120,  // M 지도내용
    14: 180,  // N 위반내용
    15: 65,   // O 행정처분
    16: 55,   // P 과태료
    17: 70,   // Q 과태료부과일
    18: 70,   // R 사전의견
    19: 70,   // S 처분일
    20: 70,   // T 비고
    21: 55,   // U 점검자
    22: 70    // V 나이스입력
  },

  DV: {
    학원명:       1,
    교습소명:     2,
    학원항목:     4,
    교습소항목:   5,
    개인과외항목: 6,
    // 점검자: 7  ← 삭제
    구분:         7,   // 기존 8 → 7
    목적:         8,   // 기존 9 → 8
  },

  LIST: {
    구분:     ['학원', '교습소', '개인과외'],
    목적:     ['국민신문고', '불법사교육', '기타민원', '특별점검', '일반점검', '교습시간점검'],
    점검목적: ['국민신문고', '불법사교육', '기타민원', '특별점검', '일반점검', '교습시간점검'],
  },

  MASTER: {
    학원: {
      SS_ID: '158ZNBb88raJ1kzBL3eFcgPZS9CGs5in0YtPtiPWfdic', GID: 1863320151, SHEET: '학원조회',
      NAME: '학원명', REGNO: '등록번호', ADDR: '학원주소', OWNER: '설립자-성명',
      PHONE: '핸드폰', REG_DATE: '등록일', REG_COL: 9,
    },
    교습소: {
      SS_ID: '158ZNBb88raJ1kzBL3eFcgPZS9CGs5in0YtPtiPWfdic', GID: 1929773080, SHEET: '교습소조회',
      NAME: '교습소명', REGNO: '신고번호', ADDR: '교습소주소', OWNER: '교습자-성명',
      PHONE: '핸드폰', REG_DATE: '신고일', REG_COL: 5,
    },
    개인과외: {
      SS_ID: '158ZNBb88raJ1kzBL3eFcgPZS9CGs5in0YtPtiPWfdic', GID: 482385921, SHEET: '개인과외조회',
      NAME: '교습자명', REGNO: '신고번호', ADDR: '교습장소', OWNER: '성명',
      PHONE: '핸드폰', REG_DATE: '신고일', REG_COL: 6,
    },
  },

  FALLBACK_SS: {
    ID: '1zSGd9TBcJRculSJzUoZ2N8bB2iENuCI0x9KBpyfXMUo',
    GID: 1946422008,
    COL_NAME: 5,
    COL_DATE: 2,
  },

  HIST: {
    SS_ID: '1xxaBOZMuLqozEm10f4lXnme_ARLfRHzGcsk5QlqoYKI',
    IDX:   '__HIST_INDEX__',
    COL:   { NAME: 4, DATE: 11, YN: 12, VIOL: 13, NOTE: 15 },
    MAX:   3,
  },

  CAL: {
    ID:         'dc5f8677cb8baf26932a5d2d62120d921f7a5d9ecd9bdfd75c0040fe37eb9e94@group.calendar.google.com',
    HEADER_ROW: 3,
    COL_DATE:   2,
    COL_TITLE:  5,
    DESC_START: 5,
    DESC_END:   13,
    EID_HEADER: '캘린더EventId',
  },

  PROP: {
    PENDING_SORT: 'PENDING_SORT',
    PREV_TYPE:    'PREV_TYPE_',
  },

  STYLE: {
    TOTAL_COLS:        23,
    BORDER_COLOR:      '#555555',
    DONE_BORDER_COLOR: '#AAAAAA',
    DIM_COLOR:         '#CCCCCC',
    NORMAL_COLOR:      '#000000',
    GROUP_REPEAT_COLS: 11,   // A~K열 (반복 행 글자 숨김 대상)
    DONE_BG:           '#DDDDDD',
    ACTIVE_BG:         '#FFFFFF',

    // ★ 날짜 기준 배경색 교차 (같은 그룹은 동일 색 적용)
    // 진행 중 그룹
    ACTIVE_A: '#F3E5F5',   // 진행 중 (단일 색상)
    ACTIVE_B: '#F3E5F5',   // 진행 중 (단일 색상)

    // 완료 그룹
    DONE_A:   '#E8EAED',   // 날짜 토글 홀수
    DONE_B:   '#DFE1E5',   // 날짜 토글 짝수
  },

  DONE_KEYWORD: '이상없음',
  DONE_NOTE:    '완료',

  HDR_NAME: {
    비고: '비고',
    EID:  '캘린더EventId',
  },
};


// ═══════════════════════════════════════════════════════
// 전역 헬퍼 함수
// ═══════════════════════════════════════════════════════

function _getColByHeader(sh, headerName, fallback) {
  try {
    const lastCol = sh.getLastColumn();
    if (lastCol < 1) return fallback;
    const headers = sh.getRange(C_.HEADER_ROW, 1, 1, lastCol).getValues()[0];
    const idx = headers.findIndex(h => String(h || '').trim() === headerName);
    return idx !== -1 ? idx + 1 : fallback;
  } catch (_) {
    return fallback;
  }
}

function _styleCols(sh) {
  const eidCol = _Cal.eidCol(sh);
  return Math.max(C_.STYLE.TOTAL_COLS, eidCol);
}

function _applyColumnLayout(sh) {
  if (!sh) return;
  try { sh.showColumns(C_.COL.구분); } catch (_) {}
  try { sh.hideColumns(23); } catch (_) {}
}

// FHD 기준 열 너비 일괄 적용
function _applyColWidths(sh) {
  const widths = C_.COL_WIDTHS;
  Object.entries(widths).forEach(([col, width]) => {
    try { sh.setColumnWidth(Number(col), width); } catch (_) {}
  });
}


// ═══════════════════════════════════════════════════════
// ★ 공개 함수 1 — SETUP
// ═══════════════════════════════════════════════════════
function SETUP() {
  const ss   = SpreadsheetApp.getActive();
  const main = _U.sh(C_.SHEET.MAIN);

  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));

  const start = C_.START_ROW;
  const last  = Math.max(main.getLastRow(), start);
  main.getRange(start, 1, last - start + 1, C_.STYLE.TOTAL_COLS).clearDataValidations();
  [C_.COL.위반내용].forEach(col =>
    _U.sanitizeTextCol(main, start, last - start + 1, col)
  );

  _DV.rebuild(ss, main);
  const lastRow = Math.max(main.getLastRow(), C_.START_ROW + 100);
  CacheService.getScriptCache().remove('VAL_VER');
  _DV.applyAll(main, C_.START_ROW, lastRow);
  _U.applyJWrap(main);

  rebuildHistoryIndex();

  ScriptApp.newTrigger('onEdit_지도점검대장').forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger('rebuildHistoryIndex').timeBased().everyDays(1).atHour(3).create();

  _Master.names('학원');
  _Master.names('교습소');

  _applyColumnLayout(main);
  applyGroupStyle();

  _U.toast('SETUP 완료! 모든 기능이 활성화되었습니다.', '✅');
}


// ═══════════════════════════════════════════════════════
// ★ 공개 함수 2 — rebuildHistoryIndex
// ═══════════════════════════════════════════════════════
function rebuildHistoryIndex() {
  const histSS = SpreadsheetApp.openById(C_.HIST.SS_ID);
  let idxSh    = histSS.getSheetByName(C_.HIST.IDX);
  if (!idxSh) idxSh = histSS.insertSheet(C_.HIST.IDX);

  idxSh.clear();
  idxSh.getRange(1, 1, 1, 7).setValues([
    ['normName', 'rawName', 'date', 'yn', 'viol', 'note', 'isRegDate']
  ]);

  const H   = C_.HIST.COL;
  const out = [];

  histSS.getSheets()
    .filter(s => s.getName() !== C_.HIST.IDX)
    .forEach(sh => {
      const lastRow = sh.getLastRow();
      if (lastRow < 2) return;

      const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
      let dCol = H.DATE;
      let rCol = -1;
      let nCol = H.NAME;

      headers.forEach((h, idx) => {
        const str = String(h).replace(/\s+/g, '');
        if (str.includes('점검일(보정)') || str === '점검일') {
          dCol = idx + 1;
        } else if (str.includes('등록일') || str.includes('신고일')) {
          if (rCol === -1 || str.includes('등록일(학원')) rCol = idx + 1;
        }
      });

      const allData = sh.getRange(2, 1, lastRow - 1, sh.getLastColumn()).getValues();

      for (let i = 0; i < allData.length; i++) {
        const row = allData[i];
        const raw = String(row[nCol - 1] || '').trim();
        if (!raw) continue;

        let date      = _U.toDate(row[dCol - 1]);
        let isRegDate = false;

        if (!date && rCol > 0) {
          date = _U.toDate(row[rCol - 1]);
          if (date) isRegDate = true;
        }
        if (!date) continue;

        const yn   = String(row[H.YN - 1]   || '').trim().toUpperCase();
        const viol = String(row[H.VIOL - 1] || '').trim();
        const note = String(row[H.NOTE - 1] || '').trim();

        out.push([_U.norm(raw), raw, date, yn, viol, note, isRegDate ? 'Y' : '']);
      }
    });

  try {
    const fbSS = SpreadsheetApp.openById(C_.FALLBACK_SS.ID);
    const fbSh = fbSS.getSheets().find(s => s.getSheetId() == C_.FALLBACK_SS.GID)
              || fbSS.getSheets()[0];
    if (fbSh && fbSh.getLastRow() >= 2) {
      const hdrs = fbSh.getRange(1, 1, 1, fbSh.getLastColumn()).getValues()[0]
                       .map(h => String(h || '').trim());
      const nameKeywords = ['학원(교습소)명', '명칭', '학원명', '기관명'];
      const dateKeywords = ['점검일(보정)', '점검일', '점검일자', '지도점검일'];
      const findCol = (keywords) => {
        for (const kw of keywords) {
          const i = hdrs.findIndex(h => h.replace(/\s+/g, '').includes(kw.replace(/\s+/g, '')));
          if (i !== -1) return i + 1;
        }
        return -1;
      };
      const fbNameCol = findCol(nameKeywords);
      const fbDateCol = findCol(dateKeywords);
      if (fbNameCol > 0 && fbDateCol > 0) {
        const fbData = fbSh.getRange(2, 1, fbSh.getLastRow() - 1, fbSh.getLastColumn()).getValues();
        for (const row of fbData) {
          const raw = String(row[fbNameCol - 1] || '').trim();
          if (!raw) continue;
          const date = _U.toDate(row[fbDateCol - 1]);
          if (!date) continue;
          out.push([_U.norm(raw), raw, date, '', '', '', '']);
        }
      }
    }
  } catch (e) {
    console.warn('FALLBACK_SS 인덱싱 실패:', e);
  }

  out.sort((a, b) => b[2] - a[2]);
  if (out.length) {
    idxSh.getRange(2, 1, out.length, 7).setValues(out);
    idxSh.getRange(2, 3, out.length, 1).setNumberFormat('yyyy. mm. dd');
  }
  idxSh.hideSheet();
  SpreadsheetApp.flush();
  _U.toast(`점검이력 인덱스 갱신: ${out.length}건`, '✅');
}



// ═══════════════════════════════════════════════════════
// ★ 공개 함수 — syncCalendar
// ═══════════════════════════════════════════════════════
function syncCalendar() {
  const sh    = _U.sh(C_.SHEET.MAIN);
  const C     = C_.COL;
  const start = C_.START_ROW;
  const last  = sh.getLastRow();

  const todayRaw = new Date();
  const today    = new Date(todayRaw.getFullYear(), todayRaw.getMonth(), todayRaw.getDate());
  let futureCount = 0, pastCount = 0, emptyCount = 0;

  if (last >= start) {
    const n     = last - start + 1;
    const dates = sh.getRange(start, C.시작일, n, 1).getValues().flat();
    const names = sh.getRange(start, C.명칭,   n, 1).getDisplayValues().flat();
    for (let i = 0; i < n; i++) {
      const d     = _Cal.toDay(dates[i]);
      const title = String(names[i] || '').trim();
      if (!d || !title) { emptyCount++; continue; }
      if (d < today) { pastCount++; } else { futureCount++; }
    }
  }

  const ui  = SpreadsheetApp.getUi();
  const res = ui.alert(
    '📅 캘린더 동기화 확인',
    [
      '캘린더 일정을 동기화합니다.',
      '',
      `  • 처리 대상(오늘 이후): ${futureCount}건`,
      `  • 건너뜀(과거 일정):   ${pastCount}건`,
      `  • 건너뜀(날짜·명칭 없음): ${emptyCount}건`,
      '',
      '※ 기존 일정이 있으면 삭제 후 새로 생성합니다.',
      '※ 과거 일정은 건드리지 않습니다.',
      '',
      '계속하시겠습니까?',
    ].join('\n'),
    ui.ButtonSet.YES_NO
  );
  if (res !== ui.Button.YES) {
    _U.toast('캘린더 동기화가 취소되었습니다.', '❌', 4);
    return;
  }

  _U.toast('캘린더 동기화 중...', '📅', 3);
  const r = _Cal.syncAll(sh);
  _U.toast(
    `생성 ${r.created}건 | 교체(재생성) ${r.deleted || 0}건 | 건너뜀 ${r.skipped}건`,
    '📅 캘린더 동기화 완료', 6
  );
}

// ═══════════════════════════════════════════════════════
// ★ 공개 함수 — sortAndApplyStyle (재정렬 + 스타일 통합)
// ═══════════════════════════════════════════════════════
function sortAndApplyStyle() {
  const sh    = _U.sh(C_.SHEET.MAIN);
  const start = C_.START_ROW;
  const last  = Math.max(_U.lastDataRow(sh), start);
  const n     = last - start + 1;

  const ui  = SpreadsheetApp.getUi();
  const res = ui.alert(
    '✨ 재정렬 및 스타일 통합 적용',
    [
      '데이터를 점검일 기준으로 재정렬하고 전체 스타일을 일괄 적용합니다.',
      '',
      `  • 적용 범위: ${start}행 ~ ${last}행 (${n}행)`,
      `  • 정렬 및 연번 자동 부여`,
      `  • 진행/완료 상태별 그룹 배경색 교차 적용`,
      `  • 행 높이(37px) 및 열 너비 규격 고정`,
      '',
      '계속하시겠습니까?'
    ].join('\n'),
    ui.ButtonSet.YES_NO
  );

  if (res !== ui.Button.YES) {
    _U.toast('작업이 취소되었습니다.', '❌', 4);
    return;
  }

  _U.toast('데이터 정리 및 스타일 적용 중...', '⏳', 5);

  // 1. 재정렬 수행 (내부 확인창 중복을 피하기 위해 false 전달)
  // (정렬 로직 내부에서 _Style.applyAll()이 자동으로 함께 호출됩니다)
  _Sort.sortAll(sh, false);

  // 2. 열 너비 및 행 높이 규격 강제 적용
  _applyColWidths(sh);
  sh.setRowHeights(start, n, 37);
  SpreadsheetApp.flush();
  sh.setRowHeights(start, n, 37);

  _U.toast('재정렬 및 스타일 적용이 완료되었습니다.', '✨ 완료', 4);
}

// ═══════════════════════════════════════════════════════
// 트리거 핸들러
// ═══════════════════════════════════════════════════════
function onEdit_지도점검대장(e) {
  if (!e?.range?.getSheet) return;

  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(15000)) return;

  try {
    const sh  = e.range.getSheet();
    if (sh.getName() !== C_.SHEET.MAIN) return;

    const row = e.range.getRow();
    const col = e.range.getColumn();
    if (row < C_.START_ROW) return;

    _applyColumnLayout(sh);
    sh.setRowHeight(row, 37);   // ★ 추가
    
    const isSingleCell = (e.range.getNumRows() === 1 && e.range.getNumColumns() === 1);
    if (isSingleCell) {
      _DV.guard(sh);
    }

    const C = C_.COL;
    if (!isSingleCell) return;

    switch (col) {

      case C.시작일:
        // 글자색은 사용자가 직접 지정하므로 코드에서 건드리지 않음
        break;

      case C.사전의견:
      case C.처분일:
        _Edit.showDatePicker(sh, row, col);
        break;

      case C.구분: {
        const newType  = String(e.range.getValue() || '').trim();
        const prevKey  = C_.PROP.PREV_TYPE + row;
        const props    = PropertiesService.getDocumentProperties();
        const prevType = props.getProperty(prevKey) || '';

        if (prevType && prevType !== newType) {
          const hasData = _Confirm.hasRowData(sh, row);
          if (hasData) {
            const confirmed = _Confirm.typeChange(prevType, newType, row, sh);
            if (!confirmed) {
              sh.getRange(row, C.구분).setValue(prevType);
              break;
            }
          }
        }
        props.setProperty(prevKey, newType);
        _Edit.onTypeChange(sh, row, newType);
        break;
      }

      case C.명칭:
        break;

      case C.주소:
        break;

      case C.점검자: {
        const val = String(e.range.getValue() || '').trim();
        if (!val) break;
        const dateVal = sh.getRange(row, C.시작일).getValue();
        if (!dateVal) break;
        const lastRow = Math.max(sh.getLastRow(), C_.START_ROW);
        const n       = lastRow - C_.START_ROW + 1;
        const dates   = sh.getRange(C_.START_ROW, C.시작일, n, 1).getValues();
        const dateMs  = new Date(dateVal).setHours(0, 0, 0, 0);
        dates.forEach((d, i) => {
          const r = C_.START_ROW + i;
          if (r === row) return;                              // 본인 행 제외
          if (d[0] && new Date(d[0]).setHours(0, 0, 0, 0) === dateMs) {
            const cell = sh.getRange(r, C.점검자);
            if (!String(cell.getValue() || '').trim()) cell.setValue(val);  // 빈 셀만 채움
          }
        });
        break;
      }

      case C.위반내용:
        _Edit.onViolation(sh, row, e.range.getDisplayValue().trim());
        _Style.applyAll(sh);
        break;

      case C.지도내용:
      case C.비고:
        _Style.applyAll(sh);
        break;

      default: {
        const noteCol = _getColByHeader(sh, C_.HDR_NAME.비고, C.비고);
        if (col === noteCol && noteCol !== C.비고) {
          _Style.refreshGroupBg(sh, row);
        }
        break;
      }
    }

  } catch (err) {
    console.error(err);
    _U.toast(String(err), '오류', 8);
  } finally {
    lock.releaseLock();
  }
}


// ═══════════════════════════════════════════════════════
// onOpen — 메뉴 구성 (단순화된 통합 메뉴)
// ═══════════════════════════════════════════════════════
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📋 지도점검')
    .addItem('🔍 명칭 검색 (정보 자동 채우기)', 'batchFillByName')
    .addItem('🎨 지금 바로 재정렬 및 스타일 적용', 'sortAndApplyStyle')
    .addItem('📅 캘린더 일정 반영', 'syncCalendar')
    .addItem('📊 학원,교습소,개인과외 통계 생성', 'buildCombinedStatSheet')
    .addSeparator()
    .addItem('🔄 점검이력 인덱스 갱신', 'rebuildHistoryIndex')
    .addToUi();

  try { _applyColumnLayout(_U.sh(C_.SHEET.MAIN)); } catch (_) {}
}


// ═══════════════════════════════════════════════════════
// 날짜 피커 연동
// ═══════════════════════════════════════════════════════
function setDateFromPicker(row, col, dateStr) {
  const d = new Date(dateStr);
  if (!isNaN(d.getTime()))
    _U.sh(C_.SHEET.MAIN).getRange(row, col).setValue(d).setNumberFormat('yyyy. m. d');
}

function pickMasterName_(type, row, name) {
  name = String(name || '').trim();
  if (!name) return;
  const sh = _U.sh(C_.SHEET.MAIN);
  sh.getRange(row, C_.COL.명칭).setValue(name);
  _Edit.onNameChange(sh, row, String(sh.getRange(row, C_.COL.구분).getValue() || '').trim(), name);
}

function searchMasterNames_(type, keyword) {
  const kw = _U.norm(String(keyword || ''));
  if (!kw || kw.length < 2) return [];
  return _Master.names(type)
    .filter(n => _U.norm(n).includes(kw))
    .sort((a, b) => {
      const na = _U.norm(a), nb = _U.norm(b);
      if (na === kw && nb !== kw) return -1;
      if (nb === kw && na !== kw) return 1;
      if (na.startsWith(kw) && !nb.startsWith(kw)) return -1;
      if (nb.startsWith(kw) && !na.startsWith(kw)) return 1;
      return a.localeCompare(b, 'ko');
    })
    .slice(0, 20);
}


// ═══════════════════════════════════════════════════════
// 내부 모듈 — 삭제 확인 (_Confirm)
// ═══════════════════════════════════════════════════════
const _Confirm = {

  hasRowData(sh, row) {
    const C = C_.COL;
    const checkCols = [C.명칭, C.등록번호, C.주소동, C.운영자, C.연락처];
    return checkCols.some(c => {
      const v = String(sh.getRange(row, c).getDisplayValue() || '').trim();
      return v.length > 0;
    });
  },

  typeChange(prevType, newType, row, sh) {
    const C    = C_.COL;
    const name = String(sh.getRange(row, C.명칭).getDisplayValue() || '').trim() || '(미입력)';
    const msg  = [
      `⚠️ 구분을 변경하면 아래 데이터가 삭제됩니다.`,
      ``,
      `  대상 행: ${row}행  (${name})`,
      `  변경 내용: [${prevType}] → [${newType}]`,
      ``,
      `삭제될 데이터:`,
      `  • 명칭, 등록번호, 주소, 주소(동)`,
      `  • 운영자, 연락처, 점검이력`,
      `  • 위반내용, 행정처분, 과태료`,
      ``,
      `계속하시겠습니까?`,
    ].join('\n');

    const ui  = SpreadsheetApp.getUi();
    const res = ui.alert('⚠️ 데이터 삭제 확인', msg, ui.ButtonSet.YES_NO);
    return res === ui.Button.YES;
  },

  sortConfirm(moveInfo) {
    if (!moveInfo || moveInfo.length === 0) return true;

    const preview = moveInfo.slice(0, 8).map(m =>
      `  • ${m.name} (${m.date}) : ${m.from}행 → ${m.to}행`
    ).join('\n');
    const more = moveInfo.length > 8 ? `\n  ... 외 ${moveInfo.length - 8}건` : '';

    const ui  = SpreadsheetApp.getUi();
    const res = ui.alert(
      '📋 재정렬 확인',
      [
        `정렬 시 아래 ${moveInfo.length}개 행이 이동합니다.`,
        ``,
        preview + more,
        ``,
        `취소하면 데이터가 이동하지 않습니다.`,
        `계속하시겠습니까?`,
      ].join('\n'),
      ui.ButtonSet.YES_NO
    );
    return res === ui.Button.YES;
  },
};


// ═══════════════════════════════════════════════════════
// 내부 모듈 — 편집 핸들러 (_Edit)
// ═══════════════════════════════════════════════════════
const _Edit = {

  onTypeChange(sh, row, type) {
    const C = C_.COL;
    _U.clearCols(sh, row, [
      C.명칭, C.등록번호, C.주소, C.주소동,
      C.운영자, C.연락처, C.이력,
      C.위반내용, C.행정처분, C.과태료,
    ]);
    CacheService.getScriptCache().remove('VAL_VER');
    _DV.guard(sh);
    sh.getRange(row, C.명칭).clearDataValidations();
  },

  onNameChange(sh, row, type, name) {
    const C = C_.COL;
    if (!name) {
      _U.clearCols(sh, row, [C.등록번호, C.주소, C.주소동, C.운영자, C.연락처, C.이력]);
      return;
    }
    if (type === '개인과외') return;

    const nk = _U.norm(name);
    if (nk.length < 2) return;

    if (!type) {
      const found = ['학원', '교습소'].reduce((acc, t) => {
        if (acc) return acc;
        const exact = _Master.names(t).find(n => _U.norm(n) === nk);
        return exact ? { type: t, name: exact } : null;
      }, null);

      if (found) {
        sh.getRange(row, C.구분).setValue(found.type);
        if (found.name !== name) sh.getRange(row, C.명칭).setValue(found.name);
        _Edit._fillInfo(sh, row, found.type, found.name);
      } else {
        _U.clearCols(sh, row, [C.등록번호, C.주소, C.주소동, C.운영자, C.연락처, C.이력]);
        _Edit._toastCandidates(name);
      }
      return;
    }

    const exact = _Master.names(type).find(n => _U.norm(n) === nk);
    if (!exact) {
      _U.clearCols(sh, row, [C.등록번호, C.주소, C.주소동, C.운영자, C.연락처, C.이력]);
      _Edit._toastCandidates(name);
      return;
    }
    if (exact !== name) sh.getRange(row, C.명칭).setValue(exact);
    _Edit._fillInfo(sh, row, type, exact);
  },

  onViolation(sh, row, item) {
    const C = C_.COL;
    if (!item) {
      _U.clearCols(sh, row, [C.행정처분, C.과태료]);
      return;
    }
    if (item === C_.DONE_KEYWORD) {
      sh.getRange(row, C.행정처분).setValue('없음');
      sh.getRange(row, C.과태료).setValue('없음');
      return;
    }
    let type = String(sh.getRange(row, C.구분).getValue() || '').trim();
    if (!type) {
      for (let r = row - 1; r >= C_.START_ROW; r--) {
        const t = String(sh.getRange(r, C.구분).getValue() || '').trim();
        if (t) { type = t; break; }
      }
    }
    const m = _Edit._findSanction(type, item);
    if (m) {
      sh.getRange(row, C.행정처분).setValue(m.sanction);
      sh.getRange(row, C.과태료).setValue(m.fine);
    }
  },

  // 연번 계산 → 시트에 기록 → flush → 스타일 적용 (순서 분리)
  recalcSerial(sh) {
    const start  = C_.START_ROW;
    const last   = Math.max(_U.lastDataRow(sh), start);
    const n      = last - start + 1;
    const cols   = C_.STYLE.TOTAL_COLS;
    const vals   = sh.getRange(start, 1, n, cols).getValues();

    let serial   = 0;
    const keyMap = new Map();
    const serials = vals.map(row => {
      const dv   = row[C_.COL.시작일 - 1];
      const name = String(row[C_.COL.명칭 - 1] || '').trim();
      if (!(dv instanceof Date) || isNaN(dv.getTime())) return null;
      const dk  = `${dv.getFullYear()}-${dv.getMonth()}-${dv.getDate()}`;
      const key = name ? `${dk}|${name}` : `${dk}|__noname__${serial}`;
      if (!keyMap.has(key)) { serial++; keyMap.set(key, serial); }
      return keyMap.get(key);
    });

    sh.getRange(start, C_.COL.연번, n, 1)
      .clearContent()
      .setValues(serials.map(v => [v ?? '']));
    SpreadsheetApp.flush();

    _Style.applyAll(sh, serials, start, n);
  },

  showDatePicker(sh, row, col) {
    if (sh.getRange(row, col).getValue() instanceof Date) return;
    SpreadsheetApp.getUi().showModalDialog(
      HtmlService.createHtmlOutput(_Edit._calHtml(row, col)).setWidth(320).setHeight(300),
      '📅 날짜 선택'
    );
  },

  _findSanction(type, item) {
    const pure = item.replace(/^\d+-\d+\s*/, '');
    const vals = _U.sh(C_.SHEET.기준).getDataRange().getValues();
    for (let r = 1; r < vals.length; r++) {
      if (String(vals[r][0] || '').trim() !== type) continue;
      const name = String(vals[r][2] || '').trim();
      if (name === pure || name === item)
        return { sanction: String(vals[r][3] ?? ''), fine: String(vals[r][4] ?? '') };
    }
    return null;
  },

  _fillInfo(sh, row, type, name) {
    const C   = C_.COL;
    const DIM = C_.STYLE.DIM_COLOR;
    _U.toast('검색 중…', '조회중', 4);
    const t0   = Date.now();
    const info = _Master.info(type, name);
    if (info) {
      const dong        = _U.extractDong(info.addr);
      const trimmedAddr = _U.trimHanamAddr(info.addr);
      const dateVal     = sh.getRange(row, C.시작일).getValue();
      const isFirst     = !_U.hasSameGroupAbove(sh, row, dateVal, name);

      sh.getRange(row, C.주소).setValue(trimmedAddr);

      if (isFirst) {
        sh.getRange(row, C.등록번호).setValue(info.regno || '');
        sh.getRange(row, C.주소동).setValue(dong);
      } else {
        sh.getRange(row, C.등록번호).setValue(info.regno || '').setFontColor(DIM);
        sh.getRange(row, C.주소동).setValue(dong || '').setFontColor(DIM);
      }

      sh.getRange(row, C.운영자).setValue(info.owner);
      sh.getRange(row, C.연락처).setValue(info.phone);
    } else {
      sh.getRange(row, C.등록번호, 1, 6).clearContent();
    }

    _Gap.write(sh, row, name, type);
    _U.applyJWrap(sh);
    _U.toast(`조회 완료 (${((Date.now() - t0) / 1000).toFixed(1)}초)`, 'OK', 3);
  },

  _toastCandidates(name) {
    const k = _U.norm(name);
    if (!k || k.length < 2) return;
    const results = [];
    ['학원', '교습소'].forEach(type => {
      _Master.names(type).forEach(n => {
        const nk = _U.norm(n);
        let score = 0;
        if (nk === k)                                     score = 100;
        else if (nk.startsWith(k))                        score = 80;
        else if (nk.includes(k))                          score = 60;
        else if (k.split('').every(c => nk.includes(c))) score = 30;
        if (score > 0) results.push({ name: n, type, score });
      });
    });
    if (!results.length) {
      _U.toast(`"${name}"과 일치하는 학원/교습소가 없습니다.`, '🔍', 6);
      return;
    }
    results.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'ko'));
    if (results.length === 1) {
      _U.toast(`혹시 이 이름인가요?\n\n${results[0].name} (${results[0].type})\n\n정확한 이름을 입력하세요.`, '🔍', 30);
      return;
    }
    const preview = results.slice(0, 5).map(r => `• ${r.name} (${r.type})`).join('\n');
    const more    = results.length > 5 ? `\n  외 ${results.length - 5}건 더 있음` : '';
    _U.toast(`후보 ${results.length}건 — 정확한 이름을 입력하세요:\n\n${preview}${more}`, '🔍 검색 결과', 30);
  },

  _calHtml(row, col) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>*{box-sizing:border-box;font-family:'Noto Sans KR',sans-serif;margin:0;padding:0}
body{padding:12px;background:#fff}
.hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.hd button{background:none;border:1px solid #ddd;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:14px}
.ml{font-size:16px;font-weight:700;color:#333}
.gr{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}
.dn{text-align:center;font-size:11px;color:#888;padding:4px 0;font-weight:600}
.dn:first-child{color:#e53935}.dn:last-child{color:#1565c0}
.c{text-align:center;padding:6px 2px;border-radius:4px;cursor:pointer;font-size:13px;color:#333}
.c:hover{background:#e3f2fd}.c.today{background:#fff9c4;font-weight:700}
.c.sel{background:#1976d2;color:#fff;font-weight:700;border-radius:50%}
.c.om{color:#ccc}.c.su{color:#e53935}.c.sa{color:#1565c0}
.c.sel.su,.c.sel.sa{color:#fff}
.bw{margin-top:12px;text-align:center}
.bc{background:#1976d2;color:#fff;border:none;padding:7px 28px;border-radius:5px;cursor:pointer;font-size:14px}
.bc:hover{background:#1565c0}
.bx{background:#eee;color:#555;border:none;padding:7px 18px;border-radius:5px;cursor:pointer;font-size:14px;margin-left:8px}
</style></head><body>
<div class="hd"><button onclick="mv(-1)">&#8249;</button><span class="ml" id="lb"></span><button onclick="mv(1)">&#8250;</button></div>
<div class="gr" id="g"></div>
<div class="bw"><button class="bc" onclick="ok()">선택</button><button class="bx" onclick="google.script.host.close()">취소</button></div>
<script>const R=${row},C=${col};
let td=new Date(),sel=null,cur=new Date(td.getFullYear(),td.getMonth(),1);
const render=()=>{
  document.getElementById('lb').textContent=cur.getFullYear()+'년 '+(cur.getMonth()+1)+'월';
  const g=document.getElementById('g');g.innerHTML='';
  ['일','월','화','수','목','금','토'].forEach(d=>{const e=document.createElement('div');e.className='dn';e.textContent=d;g.appendChild(e);});
  const fd=new Date(cur.getFullYear(),cur.getMonth(),1).getDay();
  const ld=new Date(cur.getFullYear(),cur.getMonth()+1,0).getDate();
  const pl=new Date(cur.getFullYear(),cur.getMonth(),0).getDate();
  for(let i=0;i<fd;i++){const e=document.createElement('div');e.className='c om';e.textContent=pl-fd+1+i;g.appendChild(e);}
  for(let d=1;d<=ld;d++){
    const e=document.createElement('div');
    const dw=new Date(cur.getFullYear(),cur.getMonth(),d).getDay();
    let cl='c';if(dw===0)cl+=' su';if(dw===6)cl+=' sa';
    if(d===td.getDate()&&cur.getMonth()===td.getMonth()&&cur.getFullYear()===td.getFullYear())cl+=' today';
    if(sel&&d===sel.getDate()&&cur.getMonth()===sel.getMonth()&&cur.getFullYear()===sel.getFullYear())cl+=' sel';
    e.className=cl;e.textContent=d;e.onclick=()=>{sel=new Date(cur.getFullYear(),cur.getMonth(),d);render();};
    g.appendChild(e);}};
const mv=d=>{cur=new Date(cur.getFullYear(),cur.getMonth()+d,1);render();};
const ok=()=>{
  if(!sel){alert('날짜를 선택하세요.');return;}
  const s=sel.getFullYear()+'-'+String(sel.getMonth()+1).padStart(2,'0')+'-'+String(sel.getDate()).padStart(2,'0');
  google.script.run.withSuccessHandler(()=>google.script.host.close()).withFailureHandler(e=>alert(e.message)).setDateFromPicker(R,C,s);};
render();</script></body></html>`;
  },
};


// ═══════════════════════════════════════════════════════
// 내부 모듈 — 그룹 스타일 (_Style)
// 글자색 변경 없음, 배경색·테두리만 처리
// ═══════════════════════════════════════════════════════
const _Style = {

  refreshGroupBg(sh, row) {
    const C     = C_.COL;
    const ST    = C_.STYLE;
    const start = C_.START_ROW;
    const last  = Math.max(_U.lastDataRow(sh), start);
    const n     = last - start + 1;

    const dateVal = sh.getRange(row, C.시작일).getValue();
    const name    = String(sh.getRange(row, C.명칭).getDisplayValue() || '').trim();
    if (!(dateVal instanceof Date) || !name) return;

    const dk       = `${dateVal.getFullYear()}-${dateVal.getMonth()}-${dateVal.getDate()}`;
    const groupKey = `${dk}|${name}`;

    const dates  = sh.getRange(start, C.시작일,   n, 1).getValues().flat();
    const names  = sh.getRange(start, C.명칭,     n, 1).getDisplayValues().flat();
    const viols  = sh.getRange(start, C.위반내용, n, 1).getDisplayValues().flat();
    const guides = sh.getRange(start, C.지도내용, n, 1).getDisplayValues().flat();

    const noteCol = _getColByHeader(sh, C_.HDR_NAME.비고, C.비고);
    const notes   = sh.getRange(start, noteCol, n, 1).getDisplayValues().flat();

    let gStart = -1, gEnd = -1;
    for (let i = 0; i < n; i++) {
      const d = dates[i];
      if (!(d instanceof Date)) continue;
      const kd = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const nm = String(names[i] || '').trim();
      if (`${kd}|${nm}` !== groupKey) continue;
      if (gStart === -1) gStart = i;
      gEnd = i;
    }
    if (gStart === -1) return;

    let isDone = true;
    for (let k = gStart; k <= gEnd; k++) {
      const viol  = String(viols[k]  || '').trim();
      const guide = String(guides[k] || '').trim();
      const note  = String(notes[k]  || '').trim();
      if (viol === C_.DONE_KEYWORD) continue;
      if (viol  && note === C_.DONE_NOTE) continue;
      
      // 👇 M열(guide)에 '적정' 또는 '이상없음'이 포함된 경우도 완료 조건으로 추가했습니다.
      if (guide && (note === C_.DONE_NOTE || guide.includes('적정') || guide.includes('이상없음'))) continue;
      
      isDone = false; break;
    }

    const totalCols   = _styleCols(sh);
    const groupSize   = gEnd - gStart + 1;
    const MEDIUM      = SpreadsheetApp.BorderStyle.SOLID;
    const borderColor = isDone ? ST.DONE_BORDER_COLOR : ST.BORDER_COLOR;

    // ★ 그룹 전체 배경색 통일 (refreshGroupBg는 날짜 토글 없으므로 A 고정)
    const bgColor = isDone ? ST.DONE_A : ST.ACTIVE_A;
    sh.getRange(start + gStart, 1, groupSize, totalCols).setBackground(bgColor);

    // ★ 2번째 행부터 A~K열 글자색 = 배경색 (안 보이게)
    if (groupSize > 1) {
      const hideCols = C_.STYLE.GROUP_REPEAT_COLS;
      sh.getRange(start + gStart + 1, 1, groupSize - 1, hideCols)
        .setFontColor(bgColor);
    }

    sh.getRange(start + gStart, 1, 1, totalCols)
      .setBorder(true, null, groupSize === 1 ? true : null, null, null, null, borderColor, MEDIUM);
    if (groupSize > 1) {
      sh.getRange(start + gEnd, 1, 1, totalCols)
        .setBorder(null, null, true, null, null, null, borderColor, MEDIUM);
    }

    SpreadsheetApp.flush();
  },

  applyAll(sh, serials = null, start = null, n = null) {
    const ST = C_.STYLE;
    if (start === null) start = C_.START_ROW;
    if (n === null) {
      const last = Math.max(_U.lastDataRow(sh), start);
      n = last - start + 1;
    }
    if (n <= 0) return;

    const noteCol   = _getColByHeader(sh, C_.HDR_NAME.비고, C_.COL.비고);
    const totalCols = _styleCols(sh);

    if (!serials) {
      const vals = sh.getRange(start, 1, n, 5).getValues();
      let serial  = 0;
      const keyMap = new Map();
      serials = vals.map(row => {
        const dv   = row[C_.COL.시작일 - 1];
        const name = String(row[C_.COL.명칭 - 1] || '').trim();
        if (!(dv instanceof Date) || isNaN(dv.getTime())) return null;
        const dk  = `${dv.getFullYear()}-${dv.getMonth()}-${dv.getDate()}`;
        const key = name ? `${dk}|${name}` : `${dk}|__noname__${serial}`;
        if (!keyMap.has(key)) { serial++; keyMap.set(key, serial); }
        return keyMap.get(key);
      });
    }

    const MEDIUM = SpreadsheetApp.BorderStyle.SOLID;
    sh.getRange(start, 1, n, totalCols).setBorder(null, null, null, null, false, false);

    const violVals  = sh.getRange(start, C_.COL.위반내용, n, 1).getDisplayValues().flat();
    const guideVals = sh.getRange(start, C_.COL.지도내용, n, 1).getDisplayValues().flat();
    const noteVals  = sh.getRange(start, noteCol,          n, 1).getDisplayValues().flat();
    const dateVals  = sh.getRange(start, C_.COL.시작일,   n, 1).getValues().flat();

    let dateToggle  = false;
    let lastDateStr = '';

    let i = 0;
    while (i < n) {
      const s = serials[i];

      if (s === null) {
        sh.getRange(start + i, 1, 1, totalCols)
          .setBackground('#FFFFFF')
          .setFontColor(ST.NORMAL_COLOR);
        i++;
        continue;
      }

      let j = i + 1;
      while (j < n && serials[j] === s) j++;
      const groupSize = j - i;
      const firstRow  = start + i;
      const lastRow   = start + j - 1;

      // 날짜 토글 (같은 날짜끼리 배경색 교차)
      const groupDateVal   = dateVals[i];
      const currentDateStr = (groupDateVal instanceof Date && !isNaN(groupDateVal.getTime()))
        ? `${groupDateVal.getFullYear()}-${groupDateVal.getMonth()}-${groupDateVal.getDate()}`
        : 'no_date';
      if (currentDateStr !== lastDateStr) {
        dateToggle  = !dateToggle;
        lastDateStr = currentDateStr;
      }

      // 완료 여부 판단
      let isDone = true;
      for (let k = i; k < j; k++) {
        const viol     = String(violVals[k]  || '').trim();
        const guide    = String(guideVals[k] || '').trim();
        const note     = String(noteVals[k]  || '').trim();
        const noteDone = note.includes(C_.DONE_NOTE);
        
        // 👇 M열(guide)에 '적정' 또는 '이상없음'이 포함되어 있으면 통과되도록 로직을 보완했습니다.
        if (guide) { if (!noteDone && !guide.includes('적정') && !guide.includes('이상없음')) { isDone = false; break; } }
        else if (viol === C_.DONE_KEYWORD) { /* 완료 */ }
        else if (viol && noteDone) { /* 완료 */ }
        else { isDone = false; break; }
      }

      // ★ 같은 그룹은 배경색 통일 (날짜 기준 교차)
      const bgColor = isDone
        ? (dateToggle ? ST.DONE_A : ST.DONE_B)
        : (dateToggle ? ST.ACTIVE_A : ST.ACTIVE_B);

      // 그룹 전체 배경색 한 번에 적용
      sh.getRange(firstRow, 1, groupSize, totalCols).setBackground(bgColor);

      // 첫 번째 행은 글자색 검정으로 명시 복원
      sh.getRange(firstRow, 1, 1, totalCols).setFontColor(ST.NORMAL_COLOR);

      // ★ 2번째 행부터 A~K열(연번~미점검기간) 글자색 = 배경색 (내용 안 보이게)
      if (groupSize > 1) {
        const hideCols = C_.STYLE.GROUP_REPEAT_COLS; // 11 = A~K
        sh.getRange(firstRow + 1, 1, groupSize - 1, hideCols)
          .setFontColor(bgColor);
      }

      const borderColor = isDone ? ST.DONE_BORDER_COLOR : ST.BORDER_COLOR;

      sh.getRange(firstRow, 1, 1, totalCols)
        .setBorder(true, null, null, null, null, null, borderColor, MEDIUM);
      if (groupSize > 1) {
        sh.getRange(lastRow, 1, 1, totalCols)
          .setBorder(null, null, true, null, null, null, borderColor, MEDIUM);
      } else {
        sh.getRange(firstRow, 1, 1, totalCols)
          .setBorder(true, null, true, null, null, null, borderColor, MEDIUM);
      }

      i = j;
    }

    _U.applyJWrap(sh);
    SpreadsheetApp.flush();
  },
};


// ═══════════════════════════════════════════════════════
// 내부 모듈 — 유효성(DV) 관리
// ═══════════════════════════════════════════════════════
const _DV = {

  guard(sh) {
    const last  = Math.max(_U.lastDataRow(sh), C_.START_ROW);
    const end   = Math.max(last + C_.TAIL_ROWS, C_.START_ROW + 200);
    const n     = end - C_.START_ROW + 1;
    const types = sh.getRange(C_.START_ROW, C_.COL.구분, n, 1).getValues().flat().join('|');
    const ver   = `${end}:${types}`;
    const cache = CacheService.getScriptCache();
    if (cache.get('VAL_VER') === ver) return;
    _DV.applyAll(sh, C_.START_ROW, end);
    cache.put('VAL_VER', ver, C_.TTL);
  },

  applyAll(sh, start, end) {
    const C  = C_.COL;
    const DV = C_.DV;
    const dv = SpreadsheetApp.getActive().getSheetByName(C_.SHEET.DV);
    if (!dv) return;
    const n = end - start + 1;

    const dateRule = SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(true).build();
    [C.시작일, C.과태료부과일, C.사전의견, C.처분일].forEach(c =>
      sh.getRange(start, c, n, 1).setDataValidation(dateRule).setNumberFormat('yyyy. m. d')
    );

    const rng = (col, strict) => SpreadsheetApp.newDataValidation()
      .requireValueInRange(_DV.dvRng(dv, col), true).setAllowInvalid(!strict).build();

    const dvList    = SpreadsheetApp.getActive().getSheetByName(C_.SHEET.DV목록);
    const rngDirect = (shRef, a1) => SpreadsheetApp.newDataValidation()
      .requireValueInRange(shRef.getRange(a1), true).setAllowInvalid(true).build();

    sh.getRange(start, C.구분, n, 1).setDataValidation(rng(DV.구분, true));
    if (dvList) {
      sh.getRange(start, C.목적, n, 1).setDataValidation(rngDirect(dvList, 'C2:C7'));
    } else {
      sh.getRange(start, C.목적, n, 1).setDataValidation(rng(DV.목적));
    }

    sh.getRange(start, C.비고, n, 1).clearDataValidations();

    // ★ 점검자 드롭다운 적용 블록 전체 삭제

    const eff = _DV.effTypes(sh, start, n);
    _DV.bySegment(sh, start, eff, [C.위반내용], {
      학원:     _DV.dvRng(dv, DV.학원항목),
      교습소:   _DV.dvRng(dv, DV.교습소항목),
      개인과외: _DV.dvRng(dv, DV.개인과외항목),
    });
  },

  bySegment(sh, startRow, effTypes, cols, rngMap) {
    const rules = {};
    for (const [k, r] of Object.entries(rngMap))
      rules[k] = SpreadsheetApp.newDataValidation().requireValueInRange(r, true).setAllowInvalid(true).build();
    let i = 0;
    while (i < effTypes.length) {
      const t = effTypes[i]; let j = i;
      while (j < effTypes.length && effTypes[j] === t) j++;
      const rule = rules[t];
      cols.forEach(col => {
        const r = sh.getRange(startRow + i, col, j - i, 1);
        rule ? r.setDataValidation(rule) : r.clearDataValidations();
      });
      i = j;
    }
  },

  effTypes(sh, startRow, n) {
    const vals = sh.getRange(startRow, C_.COL.구분, n, 1).getValues();
    let last = '';
    return vals.map(([v]) => {
      const t = String(v || '').trim();
      if (t) last = t;
      return last;
    });
  },

  dvRng(dv, col) {
    const vals = dv.getRange(1, col, dv.getMaxRows(), 1).getValues().flat();
    let last = 1;
    for (let r = vals.length; r >= 1; r--) {
      if (String(vals[r - 1] || '').trim()) { last = r; break; }
    }
    return dv.getRange(2, col, Math.max(last - 1, 1), 1);
  },

  rebuild(ss, main) {
    let dv = ss.getSheetByName(C_.SHEET.DV);
    if (!dv) dv = ss.insertSheet(C_.SHEET.DV);
    dv.clear();
    dv.getRange(1, 1, 1, 9).setValues([[
      '학원명(A)', '교습소명(B)', '',
      '위반항목-학원(D)', '위반항목-교습소(E)', '위반항목-개인과외(F)',
      '점검자(G)', '구분(H)', '점검목적(I)',
    ]]);

    const CHUNK = 500;
    const w = (col, list) => {
      if (!list?.length) return;
      for (let offset = 0; offset < list.length; offset += CHUNK) {
        const chunk = list.slice(offset, offset + CHUNK);
        const r = dv.getRange(2 + offset, col, chunk.length, 1);
        r.setNumberFormat('@');
        r.setValues(chunk.map(v => [String(v)]));
      }
    };

    const DV = C_.DV;
    w(DV.학원명,       _Master.names('학원'));
    w(DV.교습소명,     _Master.names('교습소'));
    w(DV.학원항목,     _DV.sanctionItems('학원'));
    w(DV.교습소항목,   _DV.sanctionItems('교습소'));
    w(DV.개인과외항목, _DV.sanctionItems('개인과외'));
    w(DV.구분,         C_.LIST.구분);
    w(DV.목적,         C_.LIST.점검목적);
    CacheService.getScriptCache().remove('VAL_VER');
    _DV.guard(main);
    dv.hideSheet();
    SpreadsheetApp.flush();
  },

  sanctionItems(type) {
    const vals = _U.sh(C_.SHEET.기준).getDataRange().getValues();
    const out  = [];
    const seen = new Set();
    for (let r = 1; r < vals.length; r++) {
      if (String(vals[r][0] || '').trim() !== type) continue;
      const code = String(vals[r][1] || '').trim();
      const name = String(vals[r][2] || '').trim();
      if (!name) continue;
      const d = code ? `${code} ${name}` : name;
      if (!seen.has(d)) { seen.add(d); out.push(d); }
    }
    return [C_.DONE_KEYWORD, ...out];
  },

  inspectors() {
    return _U.sh(C_.SHEET.점검자).getRange('A2:A9').getValues().flat()
      .map(v => String(v || '').trim()).filter(Boolean);
  },
};


// ═══════════════════════════════════════════════════════
// 내부 모듈 — 미점검기간 산정 (_Gap)
// ═══════════════════════════════════════════════════════
const _Gap = {

  latestDate(name, type, baseDate) {
    const raw  = String(name || '').trim();
    if (!raw) return null;
    const norm = _U.norm(raw);

    const refDateRaw = (baseDate instanceof Date && !isNaN(baseDate.getTime())) ? baseDate : new Date();
    const refTime    = new Date(refDateRaw.getFullYear(), refDateRaw.getMonth(), refDateRaw.getDate()).getTime();

    const histSS = SpreadsheetApp.openById(C_.HIST.SS_ID);
    const idxSh  = histSS.getSheetByName(C_.HIST.IDX);
    if (idxSh) {
      const lastRow = idxSh.getLastRow();
      if (lastRow >= 2) {
        const vals = idxSh.getRange(2, 1, lastRow - 1, 3).getValues();
        for (let i = 0; i < vals.length; i++) {
          if (String(vals[i][0] || '').trim() === norm) {
            const dt = vals[i][2];
            if (dt instanceof Date && !isNaN(dt.getTime())) {
              const dtTime = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
              if (dtTime < refTime) return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
            }
          }
        }
      }
    }

    const fbDate = _Gap._fetchFrom2nd(raw);
    if (fbDate) {
      const fbTime = new Date(fbDate.getFullYear(), fbDate.getMonth(), fbDate.getDate()).getTime();
      if (fbTime < refTime) return fbDate;
    }

    if (type && C_.MASTER[type]) {
      const info = _Master.info(type, raw);
      if (info && info.regDateStr) {
        const d = _U.toDate(info.regDateStr);
        if (d) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
      }
    }

    return null;
  },

  _fetchFrom2nd(name) {
    const norm  = _U.norm(name);
    if (!norm) return null;
    const cache = CacheService.getScriptCache();
    const key   = `FB2_${norm}`;
    const hit   = cache.get(key);
    if (hit) return hit === 'NULL' ? null : new Date(hit);

    try {
      const conf    = C_.FALLBACK_SS;
      const ss      = SpreadsheetApp.openById(conf.ID);
      const sh      = ss.getSheets().find(s => s.getSheetId() == conf.GID) || ss.getSheets()[0];
      const nameRng = sh.getRange(1, conf.COL_NAME, sh.getLastRow(), 1);
      let found     = nameRng.createTextFinder(name).matchEntireCell(true).findNext();

      if (!found) {
        const list = nameRng.getDisplayValues().flat();
        for (let i = 0; i < list.length; i++) {
          if (_U.norm(list[i]) === norm) {
            const dateVal = sh.getRange(i + 1, conf.COL_DATE).getValue();
            const dt      = _U.toDate(dateVal);
            if (dt) { cache.put(key, dt.toISOString(), C_.TTL); return dt; }
            break;
          }
        }
      } else {
        const dateVal = sh.getRange(found.getRow(), conf.COL_DATE).getValue();
        const dt      = _U.toDate(dateVal);
        if (dt) { cache.put(key, dt.toISOString(), C_.TTL); return dt; }
      }
    } catch (e) {
      console.warn('2순위 시트 에러:', e);
    }

    cache.put(key, 'NULL', C_.TTL);
    return null;
  },

  text(lastDate, baseDate) {
    if (!(lastDate instanceof Date) || isNaN(lastDate.getTime())) return '';

    const refDateRaw = (baseDate instanceof Date && !isNaN(baseDate.getTime())) ? baseDate : new Date();
    const refDate    = new Date(refDateRaw.getFullYear(), refDateRaw.getMonth(), refDateRaw.getDate());

    let years  = refDate.getFullYear() - lastDate.getFullYear();
    let months = refDate.getMonth()    - lastDate.getMonth();

    if (refDate.getDate() < lastDate.getDate()) months -= 1;
    if (months < 0) { years -= 1; months += 12; }
    if (years < 0) return '';

    if (years === 0 && months === 0) return '0개월';
    if (years === 0) return `${months}개월`;
    if (months === 0) return `${years}년`;
    return `${years}년 ${months}개월`;
  },

  write(sh, row, name, type) {
    const col  = C_.COL.미점검기간 ?? C_.COL.이력;
    const cell = sh.getRange(row, col);

    if (!type) type = String(sh.getRange(row, C_.COL.구분).getValue() || '').trim();

    const baseDate = sh.getRange(row, C_.COL.시작일).getValue();
    const lastDate = _Gap.latestDate(name, type, baseDate);
    const txt      = _Gap.text(lastDate, baseDate);

    cell.clearContent();
    if (!txt) return;
    cell.setValue(txt).setFontWeight('bold');
  },
};


// ═══════════════════════════════════════════════════════
// 내부 모듈 — 마스터 조회 (_Master)
// ═══════════════════════════════════════════════════════
const _Master = {

  _getSheet(ss, conf) {
    if (conf.GID) {
      const target = ss.getSheets().find(s => s.getSheetId() == conf.GID);
      if (target) return target;
    }
    if (conf.SHEET) {
      const target = ss.getSheetByName(conf.SHEET);
      if (target) return target;
    }
    return ss.getSheets()[0];
  },

  names(type) {
    const cache   = CacheService.getScriptCache();
    const baseKey = `MN_v2_${type}`;
    const metaHit = cache.get(baseKey);
    if (metaHit) {
      const meta = JSON.parse(metaHit);
      const all  = [];
      for (let c = 0; c < meta.chunks; c++) {
        const part = cache.get(`${baseKey}_${c}`);
        if (part) all.push(...JSON.parse(part));
      }
      if (all.length) return all;
    }

    const conf = C_.MASTER[type];
    if (!conf) return [];

    const ss  = SpreadsheetApp.openById(conf.SS_ID);
    const sh  = _Master._getSheet(ss, conf);
    if (!sh) throw new Error(`마스터 시트 없음 (${type})`);

    const hdr = sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0]
                  .map(x => String(x || '').trim());

    let nameI = hdr.indexOf(conf.NAME);
    if (nameI === -1) {
      if (type === '개인과외') nameI = 2;
      else throw new Error(`"${conf.NAME}" 헤더 없음 (${type})`);
    }

    const vals  = sh.getRange(2, nameI + 1, sh.getLastRow() - 1, 1).getDisplayValues().flat();
    const names = [...new Set(vals.map(v => String(v || '').trim()).filter(Boolean))];

    const CHUNK = 500;
    let chunks  = 0;
    for (let i = 0; i < names.length; i += CHUNK) {
      cache.put(`${baseKey}_${chunks}`, JSON.stringify(names.slice(i, i + CHUNK)), C_.TTL);
      chunks++;
    }
    cache.put(baseKey, JSON.stringify({ chunks }), C_.TTL);
    return names;
  },

  info(type, name) {
    const cache = CacheService.getScriptCache();
    const key   = `MI_v2_${type}_${_U.norm(name)}`;
    const hit   = cache.get(key);
    if (hit) return JSON.parse(hit);

    const conf = C_.MASTER[type];
    if (!conf) return null;

    const ss  = SpreadsheetApp.openById(conf.SS_ID);
    const sh  = _Master._getSheet(ss, conf);
    if (!sh) throw new Error(`마스터 시트 없음 (${type})`);

    const lastRow = sh.getLastRow();
    if (lastRow < 2) return null;

    const hdr    = sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0]
                     .map(x => String(x || '').trim());
    const getIdx = (n) => { const i = hdr.indexOf(n); return i !== -1 ? i + 1 : -1; };
    const idx    = {
      name:  getIdx(conf.NAME),
      regno: getIdx(conf.REGNO),
      addr:  getIdx(conf.ADDR),
      owner: getIdx(conf.OWNER),
      phone: getIdx(conf.PHONE),
    };

    let regIdx = getIdx(conf.REG_DATE);
    if (regIdx === -1) regIdx = conf.REG_COL;

    if (idx.name === -1) {
      if (type === '개인과외') idx.name = 3;
      else return null;
    }

    const target  = String(name || '').trim();
    const nameRng = sh.getRange(2, idx.name, lastRow - 1, 1);
    let found     = nameRng.createTextFinder(target).matchEntireCell(true).findNext();
    if (!found) {
      const tNorm = _U.norm(target);
      const list  = nameRng.getDisplayValues().flat();
      for (let i = 0; i < list.length; i++) {
        if (_U.norm(list[i]) === tNorm) { found = sh.getRange(2 + i, idx.name); break; }
      }
    }
    if (!found) return null;

    const vals = sh.getRange(found.getRow(), 1, 1, sh.getLastColumn()).getDisplayValues()[0];
    const info = {
      regno:      idx.regno !== -1 ? String(vals[idx.regno - 1] ?? '') : '',
      addr:       idx.addr  !== -1 ? String(vals[idx.addr  - 1] ?? '') : '',
      owner:      idx.owner !== -1 ? String(vals[idx.owner - 1] ?? '') : '',
      phone:      idx.phone !== -1 ? String(vals[idx.phone - 1] ?? '') : '',
      regDateStr: String(vals[regIdx - 1] ?? ''),
    };
    cache.put(key, JSON.stringify(info), C_.TTL);
    return info;
  },
};


// ═══════════════════════════════════════════════════════
// 내부 모듈 — 점검이력 (_Hist)
// ═══════════════════════════════════════════════════════
const _Hist = {

  _fetch(name) {
    const norm   = _U.norm(name);
    if (!norm) return [];
    const histSS = SpreadsheetApp.openById(C_.HIST.SS_ID);
    const idxSh  = histSS.getSheetByName(C_.HIST.IDX);
    if (!idxSh || idxSh.getLastRow() < 2) {
      _U.toast('점검이력 인덱스 없음 — SETUP() 실행 필요', '⚠️', 8);
      return [];
    }
    const last = idxSh.getLastRow();
    const all  = idxSh.getRange(2, 1, last - 1, 7).getValues();
    const rows = [];
    for (const rec of all) {
      const nm = String(rec[0] || '').trim();
      if (!nm || (nm !== norm && !nm.includes(norm) && !norm.includes(nm))) continue;
      const date = rec[2];
      if (!(date instanceof Date) || isNaN(date.getTime())) continue;

      rows.push({
        date,
        yn:        String(rec[3] || '').trim().toUpperCase(),
        viol:      String(rec[4] || '').trim(),
        note:      String(rec[5] || '').trim(),
        isRegDate: String(rec[6] || '') === 'Y',
      });
      if (rows.length >= 200) break;
    }
    return rows;
  },

  rich(name) {
    if (!name) return null;
    const cache = CacheService.getScriptCache();
    const key   = `HR_${_U.norm(name)}`;
    const hit   = cache.get(key);
    if (hit) {
      try { const l = JSON.parse(hit); if (Array.isArray(l)) return _Hist._build(l); } catch (_) {}
    }
    const rows = _Hist._fetch(name);
    if (!rows.length) return null;
    rows.sort((a, b) => b.date - a.date);
    const lines = rows.slice(0, C_.HIST.MAX).map(x => {
      const dt = "'" + Utilities.formatDate(x.date, C_.TZ, 'yy.MM.dd');
      let text  = '';
      let isViol = false;
      if (x.isRegDate) {
        text = `• ${dt} [설립/등록]`;
      } else if (x.yn === 'Y') {
        text   = `• ${dt} [위반] ${x.viol}`;
        isViol = true;
      } else {
        text = `• ${dt} [점검] ${x.note}`;
      }
      return { text, isViol };
    });
    cache.put(key, JSON.stringify(lines), C_.TTL);
    return _Hist._build(lines);
  },

  _build(lines) {
    const RED   = SpreadsheetApp.newTextStyle().setForegroundColor('#d93025').build();
    const BLACK = SpreadsheetApp.newTextStyle().setForegroundColor('#000000').build();
    const text  = lines.map(l => l.text).join('\n');
    const b     = SpreadsheetApp.newRichTextValue().setText(text);
    let idx = 0;
    for (const l of lines) {
      b.setTextStyle(idx, idx + l.text.length, l.isViol ? RED : BLACK);
      idx += l.text.length + 1;
    }
    return b.build();
  },
};


// ═══════════════════════════════════════════════════════
// 내부 모듈 — 행 정렬 (_Sort)
// ═══════════════════════════════════════════════════════
const _Sort = {

  sortAll(sh, showConfirm = false) {
    const C     = C_.COL;
    const start = C_.START_ROW;
    const last  = Math.max(_U.lastDataRow(sh), start);
    if (last < start) return;

    const n    = last - start + 1;
    const cols = C_.STYLE.TOTAL_COLS;

    const values = sh.getRange(start, 1, n, cols).getValues();

    const richCols = [C.명칭, C.이력];
    const richData = {};
    richCols.forEach(c => {
      richData[c] = sh.getRange(start, c, n, 1).getRichTextValues();
    });

    const eidCol = _Cal.eidCol(sh);
    let eidVals;
    try {
      eidVals = sh.getRange(start, eidCol, n, 1).getValues();
    } catch (_) {
      eidVals = Array.from({ length: n }, () => ['']);
    }

    const indices = Array.from({ length: n }, (_, i) => i);

    const parseTime = (s) => {
      const m = String(s || '').match(/(\d{1,2}):(\d{2})/);
      return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : Infinity;
    };

    const getGroup = (i) => {
      const guide = String(values[i][C.지도내용 - 1] || '').trim();
      if (guide.includes('교습시간 점검') || guide.includes('교습시간점검')) return 0;
      const sc = String(values[i][C.예약일정 - 1] || '').trim();
      if (sc.includes('자율점검대상')) return 1;
      if (parseTime(sc) !== Infinity) return 2;
      return 3;
    };

    const parseAddr = (addr) => {
      const s     = String(addr || '').trim();
      const clean = s.replace(/[（(][^）)]*[）)]/g, '').trim();
      let road = '', rest = clean;

      const patterns = [
        /^(.*?\d+번안길)/,
        /^(.*?\d+번길)/,
        /^(.*?대로)/,
        /^(.*?[^번]로)/,
        /^(.*?[^번]길)/,
      ];

      for (const pat of patterns) {
        const m = clean.match(pat);
        if (m) { road = m[1].trim(); rest = clean.slice(m[1].length).trim(); break; }
      }

      const bldgM    = rest.match(/^[\s,]*(\d+)/);
      const bldg     = bldgM ? parseInt(bldgM[1], 10) : 0;
      const afterBldg = bldgM ? rest.slice(bldgM[0].length) : rest;

      const floorM = afterBldg.match(/(\d+)\s*층\s*(\d+)/);
      if (floorM) {
        return { road, bldg, unit: parseInt(floorM[1], 10) * 100 + parseInt(floorM[2], 10) };
      }

      const unitM = afterBldg.match(/(\d+)\s*호/);
      return { road, bldg, unit: unitM ? parseInt(unitM[1], 10) : 0 };
    };

    indices.sort((a, b) => {
      const da   = values[a][C.시작일 - 1];
      const db   = values[b][C.시작일 - 1];
      const hasA = da instanceof Date && !isNaN(da.getTime());
      const hasB = db instanceof Date && !isNaN(db.getTime());
      if (!hasA && !hasB) return a - b;
      if (!hasA) return 1;
      if (!hasB) return -1;
      if (da.getTime() !== db.getTime()) return da.getTime() - db.getTime();

      // 같은 날짜 내 우선순위: 교습시간점검(0) → 자율점검대상(1) → 예약시간순(2) → 주소순(3)
      const ga = getGroup(a), gb = getGroup(b);
      if (ga !== gb) return ga - gb;
      if (ga === 2) {
        const ta = parseTime(values[a][C.예약일정 - 1]);
        const tb = parseTime(values[b][C.예약일정 - 1]);
        if (ta !== tb) return ta - tb;
      }

      const addrA = String(values[a][C.주소 - 1] || '').trim();
      const addrB = String(values[b][C.주소 - 1] || '').trim();
      if (addrA || addrB) {
        const pA     = parseAddr(addrA);
        const pB     = parseAddr(addrB);
        const roadCmp = pA.road.localeCompare(pB.road, 'ko');
        if (roadCmp !== 0) return roadCmp;
        if (pA.bldg !== pB.bldg) return pA.bldg - pB.bldg;
        if (pA.unit !== pB.unit) return pA.unit - pB.unit;
      }
      return String(values[a][C.명칭 - 1] || '').trim()
              .localeCompare(String(values[b][C.명칭 - 1] || '').trim(), 'ko');
    });

    const alreadySorted = indices.every((v, i) => v === i);
    if (alreadySorted) {
      _Edit.recalcSerial(sh);
      return;
    }

    if (showConfirm) {
      const moveInfo = [];
      indices.forEach((origIdx, newIdx) => {
        if (origIdx !== newIdx) {
          const dv      = values[origIdx][C.시작일 - 1];
          const name    = String(values[origIdx][C.명칭 - 1] || '').trim() || '(미입력)';
          const dateStr = (dv instanceof Date && !isNaN(dv.getTime()))
            ? Utilities.formatDate(dv, C_.TZ, 'yyyy.MM.dd')
            : '날짜없음';
          moveInfo.push({ from: start + origIdx, to: start + newIdx, name, date: dateStr });
        }
      });

      if (moveInfo.length > 0) {
        const confirmed = _Confirm.sortConfirm(moveInfo);
        if (!confirmed) {
          _U.toast('재정렬이 취소되었습니다. 데이터가 이동하지 않습니다.', '❌', 4);
          return;
        }
      }
    }

    sh.getRange(start, 1, n, cols).setValues(indices.map(i => values[i]));
    richCols.forEach(c => {
      sh.getRange(start, c, n, 1).setRichTextValues(indices.map(i => richData[c][i]));
    });
    try {
      sh.getRange(start, eidCol, n, 1).setValues(indices.map(i => eidVals[i]));
    } catch (_) {}

    SpreadsheetApp.flush();
    _Edit.recalcSerial(sh);
  },
};


// ═══════════════════════════════════════════════════════
// 내부 모듈 — 캘린더 연동 (_Cal)
// ═══════════════════════════════════════════════════════
const _Cal = {

  eidCol(sh) {
    const cfg      = C_.CAL;
    const lastCol  = sh.getLastColumn();
    const headers  = sh.getRange(cfg.HEADER_ROW, 1, 1, lastCol).getValues()[0];
    const foundIdx = headers.findIndex(h => String(h || '').trim() === cfg.EID_HEADER);
    if (foundIdx !== -1) return foundIdx + 1;
    const newCol = lastCol + 1;
    sh.getRange(cfg.HEADER_ROW, newCol).setValue(cfg.EID_HEADER);
    return newCol;
  },

  cal() {
    const c = CalendarApp.getCalendarById(C_.CAL.ID);
    if (!c) throw new Error('캘린더를 찾을 수 없습니다. ID·권한 확인 필요.');
    return c;
  },

  toDay(v) {
    if (v instanceof Date && !isNaN(v.getTime()))
      return new Date(v.getFullYear(), v.getMonth(), v.getDate());
    const d = new Date(v);
    return !isNaN(d.getTime()) ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null;
  },

  ds(d) {
    return Utilities.formatDate(d, SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'yyyy-MM-dd');
  },

  syncAll(sh) {
    const C      = C_.COL;
    const eidCol = _Cal.eidCol(sh);
    const start  = C_.START_ROW;
    const last   = sh.getLastRow();
    if (last < start) return { created: 0, updated: 0, skipped: 0, deleted: 0 };

    const n   = last - start + 1;
    const cal = _Cal.cal();

    const todayRaw = new Date();
    const today    = new Date(todayRaw.getFullYear(), todayRaw.getMonth(), todayRaw.getDate());

    const dates = sh.getRange(start, C.시작일, n, 1).getValues().flat();
    const names = sh.getRange(start, C.명칭,   n, 1).getDisplayValues().flat();
    const eids  = sh.getRange(start, eidCol,   n, 1).getValues().flat();

    let created = 0, updated = 0, skipped = 0, deleted = 0;
    const eidWrites = [];
    const groupSeen = new Map();

    for (let i = 0; i < n; i++) {
      const row   = start + i;
      const d     = _Cal.toDay(dates[i]);
      const title = String(names[i] || '').trim();
      let eid     = String(eids[i] || '').trim();

      if (!d || !title) {
        if (eid) {
          try { const ev = cal.getEventById(eid); if (ev) { ev.deleteEvent(); deleted++; } } catch (_) {}
        }
        eidWrites.push({ row, eid: '' });
        skipped++;
        continue;
      }

      if (d < today) { skipped++; continue; }

      const groupKey = `${_Cal.ds(d)}|${title}`;
      const desc     = _Cal._desc(sh, row);

      if (groupSeen.has(groupKey)) {
        const sharedEid = groupSeen.get(groupKey);
        if (eid !== sharedEid) {
          if (eid && eid !== sharedEid) {
            try { const ev = cal.getEventById(eid); if (ev) { ev.deleteEvent(); deleted++; } } catch (_) {}
          }
          eidWrites.push({ row, eid: sharedEid });
        }
        skipped++;
        continue;
      }

      if (eid) {
        try { const ev = cal.getEventById(eid); if (ev) { ev.deleteEvent(); deleted++; } } catch (_) {}
        eid = '';
      }

      try {
        const newEv = cal.createAllDayEvent(title, d, { description: desc });
        eid = newEv.getId();
        eidWrites.push({ row, eid });
        groupSeen.set(groupKey, eid);
        created++;
        updated++;
      } catch (_) {
        skipped++;
        eidWrites.push({ row, eid: '' });
      }
    }

    for (const w of eidWrites) sh.getRange(w.row, eidCol).setValue(w.eid);

    SpreadsheetApp.flush();
    return { created, updated, skipped, deleted };
  },

  _desc(sh, row) {
    const C   = C_.COL;
    const val = (col) => String(sh.getRange(row, col).getDisplayValue() || '').trim();

    return [
      '【시트 연동 정보】', '',
      '■ 기본정보',
      `- 구분: ${val(C.구분) || '-'}`,
      `- 점검목적: ${val(C.목적) || '-'}`,
      `- 명칭: ${val(C.명칭) || '-'}`,
      `- 등록/신고번호: ${val(C.등록번호) || '-'}`,
      '',
      '■ 위치/운영자',
      `- 주소: ${val(C.주소) || '-'}`,
      `- 주소(동): ${val(C.주소동) || '-'}`,
      `- 운영자: ${val(C.운영자) || '-'}`,
      `- 연락처: ${val(C.연락처) || '-'}`,
      '',
      '■ 점검내용',
      `- 점검이력: ${val(C.이력) || '-'}`,
      `- 지도내용: ${val(C.지도내용) || '-'}`,
      `- 위반내용: ${val(C.위반내용) || '-'}`,
      `- 행정처분: ${val(C.행정처분) || '-'}`,
      `- 과태료: ${val(C.과태료) || '-'}`,
      `- 과태료부과일: ${val(C.과태료부과일) || '-'}`,
      `- 사전의견: ${val(C.사전의견) || '-'}`,
      `- 처분일: ${val(C.처분일) || '-'}`,
      '',
      '■ 추가 메모',
      `- 비고: ${val(C.비고) || '-'}`,
      //  `- 점검자: ${val(C.점검자) || '-'}`,
      `- 예약일정: ${val(C.예약일정) || '-'}`,
      `- 나이스입력: ${val(C.나이스입력) || '-'}`,
      '',
      '■ 위치 링크',
      `- 네이버플레이스: ${val(C.명칭) ? 'https://map.naver.com/p/search/' + encodeURIComponent(val(C.명칭) + ' 경기도 하남시') : '-'}`,
      `- 네이버지도: ${val(C.주소) ? 'https://map.naver.com/v5/search/' + encodeURIComponent(val(C.주소)) : '-'}`,
    ].join('\n').trim();
  },
};


// ═══════════════════════════════════════════════════════
// 내부 모듈 — 공통 유틸리티 (_U)
// ═══════════════════════════════════════════════════════
const _U = {

  sh(name) {
    const s = SpreadsheetApp.getActive().getSheetByName(name);
    if (!s) throw new Error(`시트 없음: "${name}"`);
    return s;
  },

  norm(v) {
    return String(v || '').replace(/[^a-zA-Z0-9가-힣]/g, '').toLowerCase();
  },

  toDate(v) {
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    if (typeof v === 'number') v = String(v);
    let s = String(v || '').trim().replace(/[\u00A0\s]/g, '').replace(/[./]/g, '-');
    if (/^\d{8}$/.test(s)) {
      s = `${s.substring(0, 4)}-${s.substring(4, 6)}-${s.substring(6, 8)}`;
    }
    if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  },

  hasSameGroupAbove(sh, row, dateVal, name) {
    if (!(dateVal instanceof Date) || isNaN(dateVal.getTime()) || !name) return false;
    const dk    = `${dateVal.getFullYear()}-${dateVal.getMonth()}-${dateVal.getDate()}`;
    const start = C_.START_ROW;
    if (row <= start) return false;
    const n     = row - start;
    const dates = sh.getRange(start, C_.COL.시작일, n, 1).getValues().flat();
    const names = sh.getRange(start, C_.COL.명칭,   n, 1).getDisplayValues().flat();
    for (let i = 0; i < n; i++) {
      const d = dates[i];
      if (!(d instanceof Date) || isNaN(d.getTime())) continue;
      if (`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === dk &&
          String(names[i] || '').trim() === name) return true;
    }
    return false;
  },

  extractDong(addr) {
    if (!addr) return '';
    const s  = String(addr);
    const pm = s.match(/[（(]([가-힣]+(?:동|읍|면))[）)]/);
    if (pm) return pm[1];
    const dm = s.match(/([가-힣]+(?:동|읍|면))(?=\s|[0-9,\-(]|$)/);
    if (dm) return dm[1];
    const rm = s.match(/([가-힣]+(?:로|길))(?=\s|[0-9,\-(]|$)/);
    if (rm) return rm[1];
    return '';
  },

  clearCols(sh, row, cols) {
    cols.forEach(c => sh.getRange(row, c).clearContent());
  },

  hdrIdx(hdr, name, type) {
    const i = hdr.indexOf(name);
    if (i === -1) throw new Error(`"${name}" 헤더 없음 (${type})`);
    return i;
  },

  // ★ applyJWrap — v6.4.9
  // 나머지 전체: 10pt + 줄바꿈 ON + 상단정렬
  // 위반내용(M열): 9pt + 줄바꿈 ON + 상단정렬 (콤팩트하게 2줄 표시)
  // 행 높이 40px 강제 고정

  applyJWrap(sh) {
    const start   = C_.START_ROW;
    const last    = Math.max(sh.getLastRow(), start);
    const n       = last - start + 1;
    const lastCol = sh.getLastColumn();
    const violCol  = C_.COL.위반내용;  // N열 = 14
    const addrCol  = C_.COL.주소;      // G열 = 7
    const inspCol  = C_.COL.점검자;    // U열 = 21

    if (n <= 0 || lastCol < 1) return;

    // 1) 헤더(3행): 11pt + 줄바꿈
    sh.getRange(C_.HEADER_ROW, 1, 1, lastCol)
      .setFontSize(11)
      .setWrap(true);

    // 2) 데이터 전체: 11pt + 줄바꿈 + 세로 가운데 정렬
    sh.getRange(start, 1, n, lastCol)
      .setFontSize(11)
      .setWrap(true)
      .setVerticalAlignment('middle');

    // 3) 주소(G열)만 9pt
    if (addrCol <= lastCol) {
      sh.getRange(start, addrCol, n, 1)
        .setFontSize(9);
    }

    // 4) 위반내용(M열)만 9pt
    if (violCol <= lastCol) {
      sh.getRange(start, violCol, n, 1)
        .setFontSize(9);
    }

    // 5) 점검자(U열)만 9pt
    if (inspCol <= lastCol) {
      sh.getRange(start, inspCol, n, 1)
        .setFontSize(9);
    }

    // 5-1) Q~S열(과태료부과일·사전의견·처분일) 9pt
    const qCol = C_.COL.과태료부과일;
    if (qCol <= lastCol) {
      sh.getRange(start, qCol, n, 3)
        .setFontSize(9);
    }

    // 6) 가운데 정렬 열 일괄 적용
    // A~D (연번·점검일·구분·목적)
    sh.getRange(start, C_.COL.연번, n, 4).setHorizontalAlignment('center');
    // F (등록번호)
    sh.getRange(start, C_.COL.등록번호, n, 1).setHorizontalAlignment('center');
    // H~K (주소동·운영자·연락처·미점검기간)
    sh.getRange(start, C_.COL.주소동, n, 4).setHorizontalAlignment('center');
    // O~S (행정처분·과태료·과태료부과일·사전의견·처분일)
    sh.getRange(start, C_.COL.행정처분, n, 5).setHorizontalAlignment('center');
    // U~V (점검자·나이스입력)
    sh.getRange(start, C_.COL.점검자, n, 2).setHorizontalAlignment('center');

    // 7) 행 높이 37px 고정 (flush 후 재설정으로 자동 확장 억제)
    sh.setRowHeights(start, n, 37);
    SpreadsheetApp.flush();
    sh.setRowHeights(start, n, 37);
  },

  // 명칭·등록번호·주소·운영자 기준으로 마지막 실데이터 행 탐색
  lastDataRow(sh) {
    const start     = C_.START_ROW;
    const last      = Math.max(sh.getLastRow(), start);
    const checkCols = [C_.COL.명칭, C_.COL.등록번호, C_.COL.주소, C_.COL.운영자];
    let r = start;
    for (const col of checkCols) {
      const vals = sh.getRange(start, col, last - start + 1, 1).getDisplayValues().flat();
      for (let i = vals.length - 1; i >= 0; i--) {
        if (String(vals[i] || '').trim()) {
          const candidate = start + i;
          if (candidate > r) r = candidate;
          break;
        }
      }
    }
    return r;
  },

  sanitizeTextCol(sh, startRow, n, col) {
    const rng  = sh.getRange(startRow, col, n, 1);
    const vals = rng.getValues();
    const disp = rng.getDisplayValues();
    rng.setNumberFormat('@');
    rng.setValues(vals.map((row, i) => {
      const v = row[0];
      if (v instanceof Date && !isNaN(v.getTime()))
        return [String(disp[i][0] || '').trim() || Utilities.formatDate(v, C_.TZ, 'yyyy.MM.dd')];
      if (typeof v === 'number')
        return [String(disp[i][0] || '').trim() || String(v)];
      return [v];
    }));
  },

  col2L(col) {
    let s = '';
    while (col > 0) {
      const m = (col - 1) % 26;
      s   = String.fromCharCode(65 + m) + s;
      col = Math.floor((col - 1) / 26);
    }
    return s;
  },

  trimHanamAddr(addr) {
    return String(addr || '').replace(/경기도\s*하남시\s*/g, '').trim();
  },

  toast(msg, title, sec) {
    SpreadsheetApp.getActive().toast(msg, title || 'OK', sec || 5);
  },
};


// ═══════════════════════════════════════════════════════
// ★ 공개 함수 — batchFillByName
// ═══════════════════════════════════════════════════════
function batchFillByName() {
  const sh    = _U.sh(C_.SHEET.MAIN);
  const start = C_.START_ROW;
  const last  = sh.getLastRow();
  if (last < start) {
    _U.toast('처리할 데이터가 없습니다.', '⚠️', 4);
    return;
  }

  const C = C_.COL;
  const n = last - start + 1;

  const nameVals  = sh.getRange(start, C.명칭,     n, 1).getDisplayValues().flat();
  const typeVals  = sh.getRange(start, C.구분,     n, 1).getDisplayValues().flat();
  const dateVals  = sh.getRange(start, C.시작일,   n, 1).getValues().flat();
  const regnoVals = sh.getRange(start, C.등록번호, n, 1).getDisplayValues().flat();
  const addrVals  = sh.getRange(start, C.주소,     n, 1).getDisplayValues().flat();
  const dongVals  = sh.getRange(start, C.주소동,   n, 1).getDisplayValues().flat();
  const ownerVals = sh.getRange(start, C.운영자,   n, 1).getDisplayValues().flat();
  const phoneVals = sh.getRange(start, C.연락처,   n, 1).getDisplayValues().flat();

  const targets = [];
  let lastType  = '';
  for (let i = 0; i < n; i++) {
    const name = String(nameVals[i] || '').trim();
    const tipo = String(typeVals[i] || '').trim() || lastType;
    if (tipo) lastType = tipo;
    if (!name || tipo === '개인과외') continue;

    const isMissing = !regnoVals[i].trim()
                   || !addrVals[i].trim()
                   || !dongVals[i].trim()
                   || !ownerVals[i].trim()
                   || !phoneVals[i].trim();
    if (!isMissing) continue;

    targets.push({ rowIdx: i, row: start + i, name, type: tipo });
  }

  const ui  = SpreadsheetApp.getUi();
  const res = ui.alert(
    '🔍 명칭 검색 확인',
    [
      `명칭을 기준으로 정보를 자동으로 채웁니다. (초고속 모드)`,
      ``,
      `  • 처리 대상: ${targets.length}행`,
      `계속하시겠습니까?`,
    ].join('\n'),
    ui.ButtonSet.YES_NO
  );
  if (res !== ui.Button.YES) {
    _U.toast('취소되었습니다.', '❌', 3);
    return;
  }

  _U.toast(`조회 중... 외부 시트 데이터를 한 번에 불러옵니다. (${targets.length}건)`, '🚀 초고속 검색', 10);

  const masterCache = _batchLoadMaster();
  const histMap     = _batchLoadAllHistory();
  const fbMap       = _batchLoadAllFallback();

  const DIM         = C_.STYLE.DIM_COLOR;
  let successCount  = 0;
  let failCount     = 0;
  const failNames   = [];

  for (const t of targets) {
    const norm = _U.norm(t.name);
    const map  = masterCache[t.type];
    const info = map ? (map.get(norm) || null) : null;

    if (!info) {
      failCount++;
      failNames.push(`${t.name}(${t.type})`);
      continue;
    }

    const dateVal     = dateVals[t.rowIdx];
    const isFirst     = !_U.hasSameGroupAbove(sh, t.row, dateVal, t.name);
    const dong        = _U.extractDong(info.addr);
    const trimmedAddr = _U.trimHanamAddr(info.addr);

    sh.getRange(t.row, C.주소).setValue(trimmedAddr);

    if (isFirst) {
      sh.getRange(t.row, C.등록번호).setValue(info.regno || '');
      sh.getRange(t.row, C.주소동).setValue(dong);
    } else {
      sh.getRange(t.row, C.등록번호).setValue(info.regno || '').setFontColor(DIM);
      sh.getRange(t.row, C.주소동).setValue(dong || '').setFontColor(DIM);
    }

    sh.getRange(t.row, C.운영자).setValue(info.owner);
    sh.getRange(t.row, C.연락처).setValue(info.phone);

    const refDateRaw = (dateVal instanceof Date && !isNaN(dateVal.getTime())) ? dateVal : new Date();
    const refTime    = new Date(refDateRaw.getFullYear(), refDateRaw.getMonth(), refDateRaw.getDate()).getTime();
    let bestDate     = null;

    const hDates = histMap.get(norm);
    if (hDates) {
      for (const d of hDates) {
        if (d.getTime() < refTime) { bestDate = d; break; }
      }
    }
    if (!bestDate) {
      const fbD = fbMap.get(norm);
      if (fbD && fbD.getTime() < refTime) bestDate = fbD;
    }
    if (!bestDate && info.regDateStr) {
      const regD = _U.toDate(info.regDateStr);
      if (regD) bestDate = new Date(regD.getFullYear(), regD.getMonth(), regD.getDate());
    }

    const gapTxt  = _Gap.text(bestDate, refDateRaw);
    const gapCell = sh.getRange(t.row, C.이력);
    gapCell.clearContent();
    if (gapTxt) gapCell.setValue(gapTxt).setFontWeight('bold');

    successCount++;
  }

  SpreadsheetApp.flush();
  _U.applyJWrap(sh);

  let msg = `완료: ${successCount}건 채움`;
  if (failCount > 0) {
    const preview = failNames.slice(0, 5).join(', ');
    const more    = failNames.length > 5 ? ` 외 ${failNames.length - 5}건` : '';
    msg += `\n미발견: ${failCount}건 (${preview}${more})`;
  }
  _U.toast(msg, '🚀 검색 완료', 8);
}


// ═══════════════════════════════════════════════════════
// 내부 헬퍼 — 마스터 시트 일괄 로드
// ═══════════════════════════════════════════════════════
function _batchLoadMaster() {
  const result = {};
  ['학원', '교습소'].forEach(type => {
    const conf = C_.MASTER[type];
    if (!conf) return;

    const ss = SpreadsheetApp.openById(conf.SS_ID);
    const sh = ss.getSheets().find(s => s.getSheetId() == conf.GID)
            || ss.getSheetByName(conf.SHEET)
            || ss.getSheets()[0];
    if (!sh) return;

    const lastRow = sh.getLastRow();
    if (lastRow < 2) return;

    const hdr    = sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0]
                     .map(x => String(x || '').trim());
    const getIdx = name => { const i = hdr.indexOf(name); return i !== -1 ? i : -1; };
    const idx    = {
      name:  getIdx(conf.NAME),
      regno: getIdx(conf.REGNO),
      addr:  getIdx(conf.ADDR),
      owner: getIdx(conf.OWNER),
      phone: getIdx(conf.PHONE),
      reg:   getIdx(conf.REG_DATE) !== -1 ? getIdx(conf.REG_DATE) : conf.REG_COL - 1,
    };
    if (idx.name === -1) return;

    const allData = sh.getRange(2, 1, lastRow - 1, sh.getLastColumn()).getDisplayValues();
    const map     = new Map();
    for (const row of allData) {
      const rawName = String(row[idx.name] || '').trim();
      if (!rawName) continue;
      const norm = _U.norm(rawName);
      if (map.has(norm)) continue;
      map.set(norm, {
        regno:      idx.regno !== -1 ? String(row[idx.regno] || '') : '',
        addr:       idx.addr  !== -1 ? String(row[idx.addr]  || '') : '',
        owner:      idx.owner !== -1 ? String(row[idx.owner] || '') : '',
        phone:      idx.phone !== -1 ? String(row[idx.phone] || '') : '',
        regDateStr: String(row[idx.reg] || ''),
      });
    }
    result[type] = map;
  });
  return result;
}


// ═══════════════════════════════════════════════════════
// 내부 헬퍼 — 이력 인덱스 일괄 로드
// ═══════════════════════════════════════════════════════
function _batchLoadAllHistory() {
  const map = new Map();
  try {
    const histSS = SpreadsheetApp.openById(C_.HIST.SS_ID);
    const idxSh  = histSS.getSheetByName(C_.HIST.IDX);
    if (!idxSh || idxSh.getLastRow() < 2) return map;

    const vals = idxSh.getRange(2, 1, idxSh.getLastRow() - 1, 3).getValues();
    for (const row of vals) {
      const norm = String(row[0] || '').trim();
      if (!norm) continue;
      const dt = row[2];
      if (dt instanceof Date && !isNaN(dt.getTime())) {
        if (!map.has(norm)) map.set(norm, []);
        map.get(norm).push(new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()));
      }
    }
  } catch (e) {
    console.warn('이력 로드 실패:', e);
  }
  return map;
}


// ═══════════════════════════════════════════════════════
// 내부 헬퍼 — FALLBACK 시트 일괄 로드
// ═══════════════════════════════════════════════════════
function _batchLoadAllFallback() {
  const map = new Map();
  try {
    const conf    = C_.FALLBACK_SS;
    const ss      = SpreadsheetApp.openById(conf.ID);
    const sh      = ss.getSheets().find(s => s.getSheetId() == conf.GID) || ss.getSheets()[0];
    const lastRow = sh.getLastRow();
    if (lastRow < 2) return map;

    const maxCol = Math.max(conf.COL_NAME, conf.COL_DATE);
    const vals   = sh.getRange(2, 1, lastRow - 1, maxCol).getValues();

    for (const row of vals) {
      const rawName = String(row[conf.COL_NAME - 1] || '').trim();
      if (!rawName) continue;
      const norm = _U.norm(rawName);
      const dt   = _U.toDate(row[conf.COL_DATE - 1]);
      if (dt && !map.has(norm)) {
        map.set(norm, new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()));
      }
    }
  } catch (e) {
    console.warn('폴백 시트 로드 실패:', e);
  }
  return map;
}