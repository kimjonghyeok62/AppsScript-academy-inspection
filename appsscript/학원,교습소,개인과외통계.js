/*******************************************************
 * (공문) 지도점검 실적 시트 생성 모듈 v3.0
 * — 도교육청 「학원등 지도ㆍ점검 실적」 엑셀 서식과 같은 모양으로 만든다
 *
 * ★ 만드는 시트
 *   (공문)학원,교습소통계        ← 1-1 시트 (대장: 2026 지도점검(학원,교습소))
 *   (공문)개인과외통계           ← 1-2 시트 (대장: 2026 지도점검(개인과외))
 *   (공문)행정처분·과태료현황    ← 2   시트 (두 대장 모두)
 *   (공문)무등록·미신고적발현황  ← 3   시트 (두 대장 모두)
 *
 * ★ 1-1, 1-2 는 행·열 위치가 공문 서식과 같다
 *   6~17행 = 1~12월, 18행 = 계, C열부터 숫자
 *   → 6~17행을 복사해 공문 엑셀의 같은 칸에 붙여넣으면 된다
 *   (노란 칸 = 공문 서식에서 수식이 든 칸)
 *
 * ★ 월은 점검일의 달력 월로 나눈다 (공문 작성기간 기준)
 *   3.30~31 점검 → 3월, 4.1~3 점검 → 4월
 *******************************************************/


// ═══════════════════════════════════════════════════════
// ★ 공개 함수 — buildCombinedStatSheet
// ═══════════════════════════════════════════════════════
function buildCombinedStatSheet() {
  const ui  = SpreadsheetApp.getUi();
  const S   = _CombStat2.SHEETS;
  const res = ui.alert(
    '📊 공문 통계 시트 생성',
    [
      '도교육청 제출 서식과 같은 모양으로 아래 시트를 만듭니다.',
      '',
      `  • ${S.학원}   (1-1)`,
      `  • ${S.과외}   (1-2)`,
      `  • ${S.처분}   (2)`,
      `  • ${S.무등록}   (3)`,
      '',
      '  • 시트가 이미 있으면 내용을 지우고 다시 씁니다.',
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

  const ss = SpreadsheetApp.getActive();

  // ★ 대장은 시트를 지우거나 만들기 전에 먼저 읽는다.
  //   시트를 지우고 만든 직후 대장을 읽으면 '스프레드시트 서비스 타임아웃'으로
  //   멈추고, 통계 시트만 빈 채로 남았다.
  const mainRows  = _CombStat2.collectMain(_CombStat2.readMain(_U.sh(C_.SHEET.MAIN)));
  const tutorRows = _CombStat2.collectTutor(_U.sh(C_.SHEET.과외));
  const allRows   = mainRows.concat(tutorRows);

  _CombStat2.writeMonthly(ss, S.학원, _CombStat2.form('학원'), mainRows);
  _CombStat2.writeMonthly(ss, S.과외, _CombStat2.form('과외'), tutorRows);
  _CombStat2.writeSanctionList(ss, S.처분, allRows);
  _CombStat2.writeUnregistered(ss, S.무등록, allRows);

  SpreadsheetApp.flush();
  _U.toast('공문 통계 시트 4종 생성 완료!', '✅', 5);
}


// ═══════════════════════════════════════════════════════
// 내부 모듈 — _CombStat2
// ═══════════════════════════════════════════════════════
const _CombStat2 = {
  YEAR: 2026,
  SIDO: '경기',
  ORG:  '하남',
  INSPECTORS_PER_VISIT: 2,   // 한 번 점검에 나가는 인원 (지도점검 인원 = 점검 수 × 2)

  SHEETS: {
    학원:   '(공문)학원,교습소통계',
    과외:   '(공문)개인과외통계',
    처분:   '(공문)행정처분·과태료현황',
    무등록: '(공문)무등록·미신고적발현황',
  },

  COLOR: {
    HEAD:   '#E4DFEC',   // 머리글 (공문 서식의 연보라)
    YELLOW: '#FFF2CC',   // 공문 서식에서 수식이 든 칸 (붙여넣기 금지 칸)
    TOTAL:  '#D9D9D9',   // 계 행
    REF:    '#F3F3F3',   // 참고 열
  },

  // ── 위반항목 — code 는 '행정처분기준' 시트의 공문상 번호, 순서는 공문 서식의 열 순서 ──
  // 대분류가 하나뿐이고 설명도 같은 항목(기타)은 공문처럼 4~5행을 합쳐 쓴다
  VIOL_ITEMS: [
    { code: '1-1',  대분류: '시설',      설명: '시설·설비 변경 미등록, 위치 무단 변경, 무등록·기준미달 숙박시설 운영' },
    { code: '2-1',  대분류: '교습비 등', 설명: '교습비등 초과징수' },
    { code: '2-2',  대분류: '교습비 등', 설명: '교습비등 변경 미등록, 교습비등 미반환, 조정명령 미이행, 영수증 미교부' },
    { code: '2-3',  대분류: '교습비 등', 설명: '교습비등과 반환에 관한 사항 게시, 표시, 고지 위반(미게시, 미표시, 거짓게시, 부분게시 등)' },
    { code: '3-1',  대분류: '강사 등',   설명: '강사 채용·해임 미통보, 무자격 강사 채용' },
    { code: '3-2',  대분류: '강사 등',   설명: '성범죄 범죄전력 미조회' },
    { code: '3-3',  대분류: '강사 등',   설명: '아동학대 범죄전력 미조회' },
    { code: '3-4',  대분류: '강사 등',   설명: '강사 인적사항 미게시' },
    { code: '3-5',  대분류: '강사 등',   설명: '교습소 강사(임시교습자) 또는 보조요원 관련 위반' },
    { code: '4-1',  대분류: '운영',      설명: '미등록(신고) 학원(교습소)/ 거짓이나 부정한 방법으로 등록(신고)' },
    { code: '4-2',  대분류: '운영',      설명: '등록(신고) 외 교습과정 운영' },
    { code: '4-3',  대분류: '운영',      설명: '광고시 교습비등, 등록(신고)증명서 내용(번호, 명칭, 교습과목 등) 표시 위반(미표시, 거짓표시 등)' },
    { code: '4-4',  대분류: '운영',      설명: '제장부(서류) 미비치, 부실기재' },
    { code: '4-5',  대분류: '운영',      설명: '등록(신고)증명서 미게시' },
    { code: '4-6',  대분류: '운영',      설명: '명칭사용위반' },
    { code: '4-7',  대분류: '운영',      설명: '선행학습 유발 광고 및 선전' },
    { code: '4-8',  대분류: '운영',      설명: '교습시간위반' },
    { code: '4-9',  대분류: '운영',      설명: '거짓, 과대광고' },
    { code: '4-10', 대분류: '운영',      설명: '정기 연수 불참' },
    { code: '4-11', 대분류: '운영',      설명: '학원 휴원, 폐원 미신고/교습소 휴소, 폐소 미신고' },
    { code: '4-12', 대분류: '운영',      설명: '안전보험 미가입/기준미달' },
    { code: '5-1',  대분류: '기타',      설명: '기타' },
  ],

  VIOL_ITEMS_과외: [
    { code: '1-1', 대분류: '교습비 등', 설명: '교습비등 초과 징수' },
    { code: '1-2', 대분류: '교습비 등', 설명: '교습비등 변경 미신고, 교습비등 미반환, 영수증 미교부, 조정명령 미이행' },
    { code: '1-3', 대분류: '교습비 등', 설명: '교습비등과 반환에 관한 사항 게시, 표시, 고지 위반(미게시, 거짓게시, 미표시, 거짓표시 등)' },
    { code: '2-1', 대분류: '강사',      설명: '강사 채용' },
    { code: '3-1', 대분류: '운영',      설명: '미신고 개인과외, 거짓이나 부정한 방법으로 신고' },
    { code: '3-2', 대분류: '운영',      설명: '위치 무단 변경' },
    { code: '3-3', 대분류: '운영',      설명: '신고외 교습과목 운영' },
    { code: '3-4', 대분류: '운영',      설명: '선행학습유발광고,선전' },
    { code: '3-5', 대분류: '운영',      설명: '교습시간 위반' },
    { code: '3-6', 대분류: '운영',      설명: '신고증명서 미게시(제시 불응)' },
    { code: '3-7', 대분류: '운영',      설명: '광고시 교습비등, 신고증명서 내용(번호, 교습과목 등) 미표시, 거짓표시' },
    { code: '3-8', 대분류: '운영',      설명: '개인과외교습 장소표지 미부착' },
    { code: '3-9', 대분류: '운영',      설명: '제장부(서류) 미비치, 부실기재' },
    { code: '4-1', 대분류: '기타',      설명: '기타' },
  ],

  // 개인과외 대장은 '처분 세부 내용'이 글로만 적혀 있어 낱말로 항목을 고른다
  // (공백을 지운 글에 차례로 맞춰 보고, 처음 맞는 항목으로 센다 — 어느 것도 안 맞으면 기타)
  TUTOR_RULES: [
    ['3-4', /선행학습/],
    ['3-7', /광고/],
    ['1-1', /초과/],
    ['1-2', /교습비.*변경|미반환|영수증|조정명령/],
    ['3-2', /교습장소|위치/],
    ['3-3', /교습과목/],
    ['1-3', /교습비|반환기준/],
    ['2-1', /강사/],
    ['3-5', /교습시간/],
    ['3-6', /증명서/],
    ['3-8', /표지/],
    ['3-9', /장부|서류/],
    ['3-1', /미신고|거짓|부정/],
  ],

  // 행정처분 현황 열 (계 다음 6칸)
  SANCT_KEYS: ['말소', '정지', '벌점', '지도', '과태료처분', '고발'],
  SANCT_RULES: {
    말소: /말소|폐지/,
    정지: /(^|[^행])정지|중지/,   // 행정지도의 '정지'는 빼고
    벌점: /벌점|시정|경고/,
    지도: /지도/,
    고발: /고발|수사/,
  },

  // ── 1-1 / 1-2 서식 정의 ──
  form(kind) {
    const common = [
      '- 작성기간:  매주(월~금) 업데이트 하여 월단위로 작성( 주 중에 월이 바뀌는 경우에는 월 단위로 구분하여 작성 )',
      '  ※ 예시: 3.30~31에 실시한 점검 실적은 3월 실적란에 작성, 4.1.~3에 실시한 점검 실적은 4월 실적란에 작성',
      '- 지도검검 인원: 학원 등에 대한 월별  지도점검 누적 투입 인원(ex. 1월 7일 점검 인원 10명, 2개 학원 점검, 1월 28일 점검 인원이 6명, 1개 학원 점검일 경우 1월 지도점검 누적 인원은 26명(=10*2+6)',
    ];
    const sanctNote = [
      '  * 행정지도: 「행정절차법」제2조3호 정의에 따른 조치 건(지도점검표 행정지도 기록 등 증빙 가능한 건에 한함)(ex. 선행학습 유발 광고 또는 선전 행위 금지)',
      '  * 행정처분 중복 산정 가능(동종 적발건: 벌점부과 1건, 과태료 1건)',
    ];
    const tail = [
      '- 셀 병합 금지',
      '- 노란셀 작성 금지(흰색 칸만 작성)',
      '',
      '※ (이 시트) 6~17행 C열부터 복사해 공문 엑셀의 같은 칸에 붙여넣으면 됩니다. 노란 칸은 공문 서식에서 수식이 든 칸입니다.',
      '※ (이 시트) 숫자 칸의 메모에 해당 학원·교습자 이름이 있습니다. 맨 오른쪽 참고 열은 공문 서식에 없는 열입니다.',
    ];
    if (kind === '과외') {
      return {
        items: this.VIOL_ITEMS_과외,
        title: `1-2. 개인과외교습자 행정처분 및 적발 현황(${this.YEAR}년)`,
        heads: {
          인원: '지도점검 \n인원(명)', 점검: '점검 개인과외교습자 수', 적발: '적발된 개인과외교습자 수',
          적발건수: '적발 건수', 처분: '행정처분 현황(건수)', 금액: '과태료 부과 금액(천원)',
          참고: '적발 교습자(참고)',
        },
        sanctHeads: ['계', '등록말소/폐지', '교습정지', '벌점부과/시정명령/ 경고', '행정지도', '과태료', '고발(수사의뢰)'],
        notes: [
          '- 작성대상: 개인과외교습자 만 해당',
          ...common,
          '- 적발된 개인과외교습자 수: 1건 이상 학원법령 위반 등으로 적발된 개인과외교습자수',
          '- 적발 건수 중  기타: 아동학대 행위, 운영과 관련된 부조리(시험지 유출, 안전사고, 풍기 문란 등), 자료 거짓제출, 중지명령 미이행 등',
          '- 행정처분 현황: 해당 월 지도점검에 대한 행정처분(예정)건수 작성(ex. 1월 7일 지도점검에 대한 행정처분 또는 행정처분예정 건수를 1월 1차 현황에 작성. 처분결과가 처분예정결과와 다를 경우 다음 현황 제출 시 건수 수정, 빨간색 표시)',
          ...sanctNote,
          '- 고발건수: 시트 3. 적발 현황: 미신고 개인과외교습자 고발(수사의뢰) 건수 현황조사 통계와 일치',
          ...tail,
        ],
      };
    }
    return {
      items: this.VIOL_ITEMS,
      title: `1-1. 학원 및 교습소 행정처분 및 적발 현황(${this.YEAR}년)`,
      heads: {
        인원: '지도점검 \n인원(명)', 점검: '점검 학원(교습소) 수', 적발: '적발학원\n(교습소) 수',
        적발건수: '적발건수', 처분: '행정처분 현황(건수)', 금액: '과태료 금액(천원)',
        참고: '적발 학원(참고)',
      },
      sanctHeads: ['계', '등록말소/폐지', '교습정지', '벌점부과/시정명령/경고', '행정지도', '과태료', '고발(수사의뢰)'],
      notes: [
        '- 작성대상: 학원 및 교습소 (개인과외교습자는 1-2 시트에 작성)',
        ...common,
        '- 적발학원(교습소) 수: 1건 이상 학원법령 위반 등으로 적발된 학원 및 교습소 수',
        "- 적발건수 중 '기타': 교육환경 및 위생시설 미달, 어린이통학버스 운행  중 사고, 아동학대 행위, 학원운영과 관련된 부조리(시험지 유출, 안전사고, 풍기문란 등), 설립운영자 변경 미등록, 일시교습인원 초과, 환경불량, 지도감독 거부, 자료 미보고 등",
        '- 행정처분 현황: 해당 월 지도점검에 대한 행정처분 건수 작성(ex. 1월 7일 지도점검에 대한 행정처분 또는 행정처분예정 건수를 1월 1차현황에 작성. 처분결과가 처분예정결과와 다를 경우 다음 현황 제출 시 건수 수정, 빨간색 표시)',
        ...sanctNote,
        '- 고발(수사의뢰) 건수: 시트 3. 적발 현황:  무등록 학원 및 교습소  고발(수사의뢰) 건 수 현황조사  통계와  일치',
        ...tail,
      ],
    };
  },

  // ── 1-1 / 1-2 열 위치 (A 교육지원청 · B 월 · C 인원 · D 점검 · E 적발 · F 계 · G~ 위반항목) ──
  layout(itemCount) {
    const VIOL = 7;
    const 처분계 = VIOL + itemCount;
    return { VIOL, 처분계, 금액: 처분계 + 7, 참고: 처분계 + 8, LAST: 처분계 + 8 };
  },

  // ═══════════════════════════════════════════════════
  // 자료 읽기
  // ═══════════════════════════════════════════════════

  // ─── 학원·교습소 대장 한 번에 읽기 ───
  readMain(sh) {
    const C     = C_.COL;
    const start = C_.START_ROW;
    const last  = sh.getLastRow();
    if (last < start) return null;

    const n    = last - start + 1;
    const vals = sh.getRange(start, 1, n, C.비고).getValues();
    const disp = sh.getRange(start, 1, n, C.비고).getDisplayValues();
    const col  = (rows, c) => rows.map(r => r[c - 1]);
    return {
      n,
      dateVals:     col(vals, C.시작일),
      typeVals:     col(disp, C.구분),
      purpVals:     col(disp, C.목적),
      nameVals:     col(disp, C.명칭),
      addrVals:     col(disp, C.주소),
      ownerVals:    col(disp, C.운영자),
      violVals:     col(disp, C.위반내용),
      guideVals:    col(disp, C.지도내용),
      sanctVals:    col(disp, C.행정처분),
      noteVals:     col(disp, C.비고),
      fineVals:     col(disp, C.과태료),
      fineDateVals: col(disp, C.과태료부과일),
      sanctDateVals: col(disp, C.처분일),
    };
  },

  // ─── 학원·교습소 대장 → 행 목록 ───
  collectMain(raw) {
    if (!raw) return [];
    const codeMap = this.buildCodeToItemMap(['학원', '교습소']);
    const rows    = [];
    let   lastType = '';

    for (let i = 0; i < raw.n; i++) {
      const type = String(raw.typeVals[i] || '').trim() || lastType;
      if (type) lastType = type;
      if (type !== '학원' && type !== '교습소') continue;

      const date = _U.toDate(raw.dateVals[i]);
      if (!date) continue;

      const viol = String(raw.violVals[i] || '').trim();
      let violCode = '';
      if (viol && viol !== C_.DONE_KEYWORD) {
        const m = viol.match(/^(\d+-\d+)\s/);
        violCode = m ? m[1] : (codeMap.get(viol) || '');
      }

      const str = arr => String(arr[i] || '').trim();
      rows.push({
        date, type,
        name:      str(raw.nameVals),
        purpose:   str(raw.purpVals),
        addr:      str(raw.addrVals),
        owner:     str(raw.ownerVals),
        viol, violCode,
        violLabel: viol.replace(/^\d+-\d+\s*/, '').replace(/^\([^)]*\)\s*/, ''),
        guide:     str(raw.guideVals),
        sanct:     str(raw.sanctVals),
        note:      str(raw.noteVals),
        fineAmt:   this.parseFine(raw.fineVals[i]),
        paidWon:   this.parsePaid(raw.noteVals[i]),
        fineDate:  this.fmtDate(raw.fineDateVals[i]),
        sanctDate: this.fmtDate(raw.sanctDateVals[i]),
      });
    }
    return rows;
  },

  // ─── 개인과외 대장 → 행 목록 ───
  collectTutor(sh) {
    const T    = C_.TUTOR;
    const C    = T.COL;
    const last = sh.getLastRow();
    if (last <= T.HEADER_ROW) return [];

    const n    = last - T.HEADER_ROW;
    const vals = sh.getRange(T.HEADER_ROW + 1, 1, n, C.납부).getValues();
    const disp = sh.getRange(T.HEADER_ROW + 1, 1, n, C.납부).getDisplayValues();
    const codeMap = this.buildCodeToItemMap(['개인과외']);
    const rows = [];
    let   lastName = '';

    for (let i = 0; i < n; i++) {
      const v = vals[i], d = disp[i];
      const date = this.tutorDate(v[C.점검일 - 1], d[C.점검일 - 1]);
      if (!date) continue;

      // 이어지는 위반 행은 이름이 비어 있다 → 윗행 이름
      let name = String(d[C.성명 - 1] || '').trim();
      if (name) lastName = name; else name = lastName;

      const sanct  = String(d[C.처분 - 1] || '').trim();
      const detail = String(d[C.세부 - 1] || '').trim();
      const fineAmt = this.parseFine(d[C.과태료 - 1]);
      const isViol  = !!detail || fineAmt > 0 || (!!sanct && !/정상|이상없음|^없음$/.test(sanct));

      rows.push({
        date, type: '개인과외', name,
        purpose:   String(d[C.목적 - 1] || '').trim(),
        addr: '', owner: name,
        viol: detail,
        violCode:  isViol ? this.tutorCode(detail, codeMap) : '',
        violLabel: detail,
        guide: '', sanct, note: String(d[C.납부 - 1] || '').trim(),
        fineAmt,
        paidWon:   this.parsePaid(d[C.납부 - 1]),
        fineDate:  fineAmt > 0 ? this.fmtDate(d[C.의견알림 - 1]) : '',
        sanctDate: this.fmtDate(d[C.처분일 - 1]),
      });
    }
    return rows;
  },

  // ─── 행정처분기준 시트: 위반내용 글 → 공문상 번호 ───
  buildCodeToItemMap(types) {
    const vals = _U.sh(C_.SHEET.기준).getDataRange().getValues();
    const map  = new Map();
    for (let r = 1; r < vals.length; r++) {
      const type = String(vals[r][0] || '').trim();
      if (!types.includes(type)) continue;
      const code = String(vals[r][1] || '').trim();
      const name = String(vals[r][2] || '').trim();
      if (!code || !name) continue;
      if (!map.has(`${code} ${name}`)) map.set(`${code} ${name}`, code);
      if (!map.has(name))              map.set(name, code);
    }
    return map;
  },

  tutorCode(text, codeMap) {
    const m = text.match(/^(\d+-\d+)\s/);
    if (m) return m[1];
    if (codeMap.has(text)) return codeMap.get(text);
    const t = text.replace(/\s/g, '');
    const hit = this.TUTOR_RULES.find(([, re]) => re.test(t));
    return hit ? hit[0] : '4-1';
  },

  // 개인과외 점검일은 '4.16' · '5.19.' · '06-22' 처럼 연도 없이 적혀 있다
  tutorDate(v, disp) {
    if (v instanceof Date && !isNaN(v.getTime())) return v;
    const s = String(disp || v || '').trim();
    let m = s.match(/^(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = s.match(/^(\d{1,2})\D+(\d{1,2})/);
    if (m) return new Date(this.YEAR, +m[1] - 1, +m[2]);
    return null;
  },

  // 과태료 → 천원
  // 학원 대장 과태료 열은 만원 단위(50 = 50만원) → ×10
  // 값이 크면 원 단위로 적힌 것으로 보고 ÷1000 (개인과외 대장 '1,000,000')
  parseFine(v) {
    const num = parseFloat(String(v || '').replace(/[^0-9.]/g, ''));
    if (isNaN(num) || num <= 0) return 0;
    return num >= 10000 ? Math.round(num / 1000) : Math.round(num * 10);
  },

  // 비고의 '과태료 납부 완료 (40만원)' 처럼 금액이 적힌 경우만 실 납부금액(원)으로 쓴다
  parsePaid(v) {
    const s = String(v || '');
    const man = s.match(/(\d[\d,]*)\s*만\s*원/);
    if (man) return Number(man[1].replace(/,/g, '')) * 10000;
    const won = s.match(/(\d{1,3}(?:,\d{3})+|\d{5,})\s*원?/);
    return won ? Number(won[1].replace(/,/g, '')) : 0;
  },

  fmtDate(v) {
    const d = v instanceof Date ? v : _U.toDate(String(v || '').replace(/\.$/, ''));
    if (!d) return '';
    const p = x => String(x).padStart(2, '0');
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}.`;
  },

  // ═══════════════════════════════════════════════════
  // 집계
  // ═══════════════════════════════════════════════════
  emptyAgg(codes) {
    const violByCode = {}, namesByCode = {};
    codes.forEach(c => { violByCode[c] = 0; namesByCode[c] = []; });
    const sanct = {}, namesBySanct = {};
    this.SANCT_KEYS.forEach(k => { sanct[k] = 0; namesBySanct[k] = []; });
    return {
      inspectors: 0, checked: 0, caught: 0, violTotal: 0,
      violByCode, namesByCode,
      sanctTotal: 0, sanct, namesBySanct,
      fine: 0,
      caughtNames: new Set(),
    };
  },

  addAgg(dest, src, codes) {
    ['inspectors', 'checked', 'caught', 'violTotal', 'sanctTotal', 'fine']
      .forEach(k => { dest[k] += src[k]; });
    src.caughtNames.forEach(n => dest.caughtNames.add(n));
    codes.forEach(c => {
      dest.violByCode[c] += src.violByCode[c];
      dest.namesByCode[c] = dest.namesByCode[c].concat(src.namesByCode[c]);
    });
    this.SANCT_KEYS.forEach(k => {
      dest.sanct[k] += src.sanct[k];
      dest.namesBySanct[k] = dest.namesBySanct[k].concat(src.namesBySanct[k]);
    });
  },

  // 한 달치 행 → 집계
  // 같은 날 + 같은 기관 + 같은 점검목적 = 한 번의 점검 (대장 연번과 같은 기준)
  aggregate(rows, codes) {
    const agg     = this.emptyAgg(codes);
    const checked = new Set();
    const caught  = new Set();

    for (const r of rows) {
      const gk = _U.visitKey(r.date, r.name, r.purpose);
      checked.add(gk);
      if (!r.violCode && !(r.fineAmt > 0)) continue;

      caught.add(gk);
      agg.caughtNames.add(r.name);

      if (codes.includes(r.violCode)) {
        agg.violByCode[r.violCode]++;
        agg.namesByCode[r.violCode].push(r.name);
        agg.violTotal++;
      }

      Object.keys(this.SANCT_RULES).forEach(k => {
        if (!this.SANCT_RULES[k].test(r.sanct)) return;
        agg.sanct[k]++;
        agg.namesBySanct[k].push(r.name);
      });
      // 과태료: 금액이 있으면 처분이 시정명령이어도 함께 센다 (중복 산정)
      if (r.fineAmt > 0 || /과태료/.test(r.sanct)) {
        agg.sanct.과태료처분++;
        agg.namesBySanct.과태료처분.push(r.fineAmt > 0 ? `${r.name}(${r.fineAmt.toLocaleString()}천원)` : r.name);
        agg.fine += r.fineAmt;
      }
    }
    agg.checked    = checked.size;
    agg.caught     = caught.size;
    agg.inspectors = checked.size * this.INSPECTORS_PER_VISIT;
    // 공문 서식의 계 = 6칸의 합 (=SUM)
    agg.sanctTotal = this.SANCT_KEYS.reduce((s, k) => s + agg.sanct[k], 0);
    return agg;
  },

  // ═══════════════════════════════════════════════════
  // 시트 공통
  // ═══════════════════════════════════════════════════

  // ★ 있던 시트는 지우지 않고 비워서 다시 쓴다 (시트 삭제·생성이 타임아웃을 부른다)
  prepSheet(ss, name, nCols) {
    const sh = ss.getSheetByName(name) || ss.insertSheet(name);
    sh.setFrozenRows(0);
    sh.setFrozenColumns(0);
    const all = sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns());
    all.breakApart();
    all.clearNote();
    sh.clear();
    if (sh.getMaxColumns() < nCols) sh.insertColumnsAfter(sh.getMaxColumns(), nCols - sh.getMaxColumns());
    SpreadsheetApp.flush();
    return sh;
  },

  // 2차원 머리글 배열에 값을 넣고 병합할 범위를 모은다
  headWriter(rows, cols) {
    const grid   = Array.from({ length: rows }, () => Array(cols).fill(''));
    const merges = [];
    return {
      grid, merges,
      put(r, c, text, nr = 1, nc = 1) {
        grid[r][c - 1] = text;
        if (nr > 1 || nc > 1) merges.push([r, c, nr, nc]);
      },
    };
  },

  applyHead(sh, top, hw) {
    const cols = hw.grid[0].length;
    sh.getRange(top, 1, hw.grid.length, cols).setValues(hw.grid);
    hw.merges.forEach(([r, c, nr, nc]) => sh.getRange(top + r, c, nr, nc).merge());
    sh.getRange(top, 1, hw.grid.length, cols)
      .setBackground(this.COLOR.HEAD).setFontWeight('bold').setWrap(true)
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
  },

  writeFootNotes(sh, row, lines) {
    if (!lines.length) return;
    sh.getRange(row, 1, lines.length, 1).setValues(lines.map(t => [t]))
      .setWrap(false).setFontSize(10).setHorizontalAlignment('left');
  },

  thinBorder(range) {
    range.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
  },

  // ═══════════════════════════════════════════════════
  // 1-1 / 1-2 — 월별 행정처분 및 적발 현황
  // ═══════════════════════════════════════════════════
  writeMonthly(ss, sheetName, form, rows) {
    const codes = form.items.map(v => v.code);
    const L     = this.layout(codes.length);
    const sh    = this.prepSheet(ss, sheetName, L.LAST);

    // ── 1행 제목, 3~5행 머리글 ──
    sh.getRange(1, 1).setValue(form.title).setFontSize(14).setFontWeight('bold');
    this.writeMonthlyHead(sh, form, L);

    // ── 6~17행 = 1~12월, 18행 = 계 ──
    const FIRST  = 6;
    const today  = new Date();
    const lastMo = today.getFullYear() > this.YEAR ? 12
                 : today.getFullYear() < this.YEAR ? 0 : today.getMonth() + 1;
    const total  = this.emptyAgg(codes);
    const values = [], notes = [];

    for (let m = 1; m <= 12; m++) {
      const mRows = rows.filter(r => r.date.getFullYear() === this.YEAR && r.date.getMonth() + 1 === m);
      const a = this.aggregate(mRows, codes);
      this.addAgg(total, a, codes);
      values.push(this.monthlyRow(this.ORG, m, a, codes, L, m <= lastMo, false));
      notes.push(this.memoRow(a, codes, L));
    }
    values.push(this.monthlyRow(' 계', '', total, codes, L, true, true));
    notes.push(Array(L.LAST).fill(''));

    const TOTAL_ROW = FIRST + 12;
    sh.getRange(FIRST, 1, values.length, L.LAST).setValues(values).setNotes(notes);

    // ── 서식 ──
    sh.getRange(1, 1, TOTAL_ROW, L.LAST).setFontFamily('맑은 고딕');
    sh.getRange(3, 1, 3, L.LAST).setFontSize(9);
    sh.getRange(FIRST, 1, values.length, L.LAST)
      .setFontSize(10).setVerticalAlignment('middle').setHorizontalAlignment('center');
    sh.getRange(FIRST, 3, values.length, L.금액 - 2).setNumberFormat('#,##0;-#,##0;"-"').setHorizontalAlignment('right');
    // 공문 서식에서 수식이 든 칸 (적발건수 계 · 행정처분 계)
    sh.getRange(FIRST, 6, 12, 1).setBackground(this.COLOR.YELLOW);
    sh.getRange(FIRST, L.처분계, 12, 1).setBackground(this.COLOR.YELLOW);
    sh.getRange(TOTAL_ROW, 1, 1, L.금액).setBackground(this.COLOR.TOTAL).setFontWeight('bold');
    this.thinBorder(sh.getRange(3, 1, TOTAL_ROW - 2, L.금액));

    // 참고 열 (공문 서식에 없는 열)
    sh.getRange(3, L.참고, TOTAL_ROW - 2, 1)
      .setBackground(this.COLOR.REF).setFontSize(9).setHorizontalAlignment('left')
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
    sh.getRange(3, L.참고).setHorizontalAlignment('center').setFontWeight('bold');

    this.writeFootNotes(sh, TOTAL_ROW + 2, form.notes);

    // ── 크기 ──
    sh.setColumnWidth(1, 70);  sh.setColumnWidth(2, 35);
    sh.setColumnWidth(3, 60);  sh.setColumnWidth(4, 75);  sh.setColumnWidth(5, 75);
    sh.setColumnWidth(6, 40);
    sh.setColumnWidths(L.VIOL, codes.length, 58);
    sh.setColumnWidths(L.처분계, 7, 52);
    sh.setColumnWidth(L.처분계 + 3, 70);   // 벌점부과/시정명령/경고
    sh.setColumnWidth(L.금액, 70);
    sh.setColumnWidth(L.참고, 300);
    sh.setRowHeight(1, 30);
    sh.setRowHeights(3, 2, 30);
    sh.setRowHeight(5, 150);
    sh.setRowHeights(FIRST, values.length, 24);

    sh.setFrozenRows(5);
    sh.setFrozenColumns(2);
    SpreadsheetApp.flush();
  },

  writeMonthlyHead(sh, form, L) {
    const H  = form.heads;
    const hw = this.headWriter(3, L.LAST);   // 0=3행, 1=4행, 2=5행
    hw.put(0, 1, '교육지원청명', 3);
    hw.put(0, 2, '월', 3);
    hw.put(0, 3, H.인원, 3);
    hw.put(0, 4, H.점검, 3);
    hw.put(0, 5, H.적발, 3);
    hw.put(0, 6, H.적발건수, 1, 1 + form.items.length);
    hw.put(1, 6, '계', 2);

    // 대분류 묶음 — 이어지는 같은 대분류끼리 4행을 합친다
    let i = 0;
    while (i < form.items.length) {
      const g = form.items[i].대분류;
      let len = 1;
      while (i + len < form.items.length && form.items[i + len].대분류 === g) len++;
      const col = L.VIOL + i;
      if (len === 1 && form.items[i].설명 === g) {
        hw.put(1, col, g, 2);                       // 기타: 4~5행 합침
      } else {
        hw.put(1, col, g, 1, len);
        for (let k = 0; k < len; k++) hw.put(2, col + k, form.items[i + k].설명);
      }
      i += len;
    }

    hw.put(0, L.처분계, H.처분, 1, 7);
    form.sanctHeads.forEach((t, k) => hw.put(1, L.처분계 + k, t, 2));
    hw.put(0, L.금액, H.금액, 3);
    hw.put(0, L.참고, H.참고, 3);
    this.applyHead(sh, 3, hw);
  },

  // 0 은 빈칸으로 쓴다 (공문 서식처럼 흰 칸은 비워 둔다) — 계 행과 수식 칸은 0 그대로
  monthlyRow(org, month, a, codes, L, past, isTotal) {
    const row = Array(L.LAST).fill('');
    const z   = v => (isTotal ? v : (v || ''));
    row[0] = org;
    row[1] = month;
    if (past) {
      row[2] = a.inspectors;
      row[3] = a.checked;
      row[4] = a.caught;
    }
    row[5] = a.violTotal;
    codes.forEach((c, k) => { row[L.VIOL - 1 + k] = z(a.violByCode[c]); });
    row[L.처분계 - 1] = a.sanctTotal;
    this.SANCT_KEYS.forEach((k, j) => { row[L.처분계 + j] = z(a.sanct[k]); });
    row[L.금액 - 1] = z(a.fine);
    row[L.참고 - 1] = isTotal ? '' : [...a.caughtNames].join(', ');
    return row;
  },

  // 한 행의 메모 (칸마다 문자열, 없으면 '')
  memoRow(a, codes, L) {
    const row = Array(L.LAST).fill('');
    codes.forEach((code, k) => {
      const names = a.namesByCode[code];
      if (names.length) row[L.VIOL - 1 + k] = `[${code} 위반]\n${names.join('\n')}`;
    });
    const label = { 말소: '말소·폐지', 정지: '교습정지', 벌점: '벌점·시정명령·경고', 지도: '행정지도', 과태료처분: '과태료', 고발: '고발' };
    this.SANCT_KEYS.forEach((k, j) => {
      const names = a.namesBySanct[k];
      if (names.length) row[L.처분계 + j] = `[${label[k]}]\n${names.join('\n')}`;
    });
    if (a.fine > 0) row[L.금액 - 1] = `[과태료 상세]\n${a.namesBySanct.과태료처분.join('\n')}`;
    return row;
  },

  // ═══════════════════════════════════════════════════
  // 2 — 행정처분(정지, 말소 등), 과태료 부과 현황
  // 정지·말소·폐지·중지 처분이거나 과태료가 있는 위반 건, 지도점검일 순
  // ═══════════════════════════════════════════════════
  writeSanctionList(ss, sheetName, rows) {
    const NC   = 13;
    const sh   = this.prepSheet(ss, sheetName, NC);
    const list = rows
      .filter(r => (r.violCode || r.fineAmt > 0) && (r.fineAmt > 0 || /(^|[^행])정지|중지|말소|폐지/.test(r.sanct)))
      .sort((a, b) => a.date - b.date);   // 같은 날은 대장 순서 그대로

    sh.getRange(1, 1).setValue(`2. 행정처분(정지, 말소 등), 과태료 부과 현황(${this.YEAR}년)`)
      .setFontSize(14).setFontWeight('bold');

    const hw = this.headWriter(1, NC);
    ['시도\n교육청', '교육지원청', '대상', '학원 등, 개인과외교습자 이름', '위반사항', '지도점검일',
     '행정처분(예정)', '행정처분일', '과태료 부과일', '과태료 부과금액(원)', '과태료 실 납부금액(원)',
     '과태료 감경사유', '비고'].forEach((t, k) => hw.put(0, k + 1, t));
    this.applyHead(sh, 3, hw);

    const FIRST  = 4;
    const values = list.map(r => [
      this.SIDO, this.ORG,
      r.type === '개인과외' ? '개인과외교습자' : r.type,
      r.name,
      r.violLabel || '기타',
      this.fmtDate(r.date),
      r.sanct,
      r.sanctDate || '처분예정',
      r.fineAmt > 0 ? (r.fineDate || '부과예정') : '-',
      r.fineAmt > 0 ? r.fineAmt * 1000 : '-',
      r.paidWon || '',
      '',
      r.guide,
    ]);
    const fineSum = list.reduce((s, r) => s + r.fineAmt * 1000, 0);
    const paidSum = list.reduce((s, r) => s + r.paidWon, 0);
    values.push(['계', '', '', '', list.length, '', '', '', '', fineSum, paidSum, '', '']);

    const TOTAL_ROW = FIRST + values.length - 1;
    sh.getRange(FIRST, 1, values.length, NC).setValues(values)
      .setFontSize(10).setVerticalAlignment('middle').setHorizontalAlignment('center');
    sh.getRange(FIRST, 10, values.length, 2).setNumberFormat('#,##0').setHorizontalAlignment('right');
    sh.getRange(FIRST, 4, values.length, 2).setHorizontalAlignment('left');
    sh.getRange(FIRST, 13, values.length, 1).setHorizontalAlignment('left');
    sh.getRange(TOTAL_ROW, 1, 1, NC).setBackground(this.COLOR.TOTAL).setFontWeight('bold');
    this.thinBorder(sh.getRange(3, 1, TOTAL_ROW - 2, NC));

    this.writeFootNotes(sh, TOTAL_ROW + 2, [
      `○ 작성기간: ${this.YEAR}. 1. 1.~12. 31.`,
      `○ 작성대상: ${this.YEAR}. 1. 1.~12. 31. 지도점검 적발 건에 대한 행정처분(정지, 말소·폐지·중지만 해당) 및 과태료 부과 내역 기재`,
      "  * 과태료 부과시 행정처분이 '시정명령'일 경우에도 시정명령 기재",
      '○ 지도점검일 순 나열',
      '○ 셀병합 금지',
      '○ 행정처분 현황: 정지, 폐원(말소)처분(예정) 현황 작성(처분 결과가 처분예정 결과와 다를 경우 다음 현황 제출 시 수정. 빨간색 표시)',
      '',
      '※ (이 시트) 과태료 부과일 = 대장의 과태료부과(사전의견청취알림) 날짜, 실 납부금액 = 비고에 금액이 적힌 경우만 채웁니다. 감경사유는 직접 적어 주세요.',
    ]);

    [45, 70, 90, 200, 260, 90, 80, 90, 90, 100, 100, 160, 260]
      .forEach((w, k) => sh.setColumnWidth(k + 1, w));
    sh.setRowHeight(3, 45);
    sh.setFrozenRows(3);
    SpreadsheetApp.flush();
  },

  // ═══════════════════════════════════════════════════
  // 3 — 무등록 학원, 미신고 교습소 및 개인과외교습자 적발 현황
  // 학원·교습소 4-1, 개인과외 3-1 위반 (한 번 점검에 한 줄)
  // ═══════════════════════════════════════════════════
  writeUnregistered(ss, sheetName, rows) {
    const NC = 23;
    const sh = this.prepSheet(ss, sheetName, NC);
    const seen = new Set();
    const list = rows
      .filter(r => r.violCode === (r.type === '개인과외' ? '3-1' : '4-1'))
      .filter(r => {
        const k = _U.visitKey(r.date, r.name, r.purpose);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .sort((a, b) => a.date - b.date);

    sh.getRange(1, 1).setValue(`3. 무등록 학원, 미신고 교습소 및 개인과외교습자 적발 현황(${this.YEAR}년)`)
      .setFontSize(14).setFontWeight('bold');

    const hw = this.headWriter(3, NC);   // 0=3행, 1=4행, 2=5행
    hw.put(0, 1, '시도\n교육청', 3);
    hw.put(0, 2, '교육지원청', 3);
    hw.put(0, 3, '점검유형', 2);
    hw.put(2, 3, '1. 자체점검\n2. 신고포상금제 신고에 따른 점검\n3. 신고포상금제 신고 외 민원에 따른 점검');
    hw.put(0, 4, '점검일자', 2, 3);
    hw.put(2, 4, '년'); hw.put(2, 5, '월'); hw.put(2, 6, '일');
    hw.put(0, 7, '적발된 학원등의 유형\n(해당 유형에 "1" 기재)', 2, 3);
    hw.put(2, 7, '학원'); hw.put(2, 8, '교습소'); hw.put(2, 9, '개인과외');
    hw.put(0, 10, '피고발인\n인적사항', 2);
    hw.put(2, 10, '피고발인\n성명');
    hw.put(0, 11, '피고발된 사업장 현황', 2, 3);
    hw.put(2, 11, '상 호');
    hw.put(2, 12, '교습과정');
    hw.put(2, 13, '사업장 주소');
    hw.put(0, 14, '적발당시 교습비등 징수 현황', 2, 2);
    hw.put(2, 14, '적발당시 \n월 교습비등 \n총 징수액\n(단위: 원)');
    hw.put(2, 15, '적발당시\n총 수강생수\n(단위: 명)');
    hw.put(0, 16, '개업일\n(학원등 실지 영업 개시일)', 2, 3);
    hw.put(2, 16, '연'); hw.put(2, 17, '월'); hw.put(2, 18, '일');
    hw.put(0, 19, '처분결과 통지일', 2, 3);
    hw.put(2, 19, '년'); hw.put(2, 20, '월'); hw.put(2, 21, '일');
    hw.put(0, 22, '처분결과', 2);
    hw.put(2, 22, '1. 진행중\n2. 구약식\n3. 기소유예\n4. 무혐의 처분\n5. 경찰 자체 종결\n6. 기타');
    hw.put(0, 23, '비고\n(형벌 사항이 \n있을 경우 \n기재, 벌금액 반드시 기재)', 3);
    this.applyHead(sh, 3, hw);

    const FIRST  = 6;
    const values = list.map(r => {
      const row = Array(NC).fill('');
      row[0] = this.SIDO;
      row[1] = this.ORG;
      row[2] = /포상/.test(r.purpose) ? 2 : /민원|신문고|제보|신고/.test(r.purpose) ? 3 : 1;
      row[3] = r.date.getFullYear();
      row[4] = r.date.getMonth() + 1;
      row[5] = r.date.getDate();
      row[r.type === '학원' ? 6 : r.type === '교습소' ? 7 : 8] = 1;
      row[9]  = r.owner;
      row[10] = r.type === '개인과외' ? '' : r.name;
      row[12] = r.addr;
      row[22] = r.guide;
      return row;
    });
    const cnt = k => values.filter(v => v[k] === 1).length;
    values.push(['계', '', '', '', '', '', cnt(6), cnt(7), cnt(8), '', '', '', list.length, '', '', '', '', '', '', '', '', '', '']);

    const TOTAL_ROW = FIRST + values.length - 1;
    sh.getRange(FIRST, 1, values.length, NC).setValues(values)
      .setFontSize(10).setVerticalAlignment('middle').setHorizontalAlignment('center');
    sh.getRange(TOTAL_ROW, 1, 1, NC).setBackground(this.COLOR.TOTAL).setFontWeight('bold');
    this.thinBorder(sh.getRange(3, 1, TOTAL_ROW - 2, NC));

    this.writeFootNotes(sh, TOTAL_ROW + 2, [
      '* 셀 병합 금지',
      `○ 작성기간: ${this.YEAR}. 1. 1.~12. 31.`,
      `○ 작성대상: ${this.YEAR}. 1. 1.~ 12. 31. 각종 지도점검으로 적발된 무등록 학원, 미신고 교습소 및 개인과외교습자 현황`,
      '',
      '※ (이 시트) 대장 위반내용이 학원·교습소 4-1(미등록·거짓 등록), 개인과외 3-1(미신고 개인과외)인 점검만 모읍니다.',
      '※ (이 시트) 점검유형은 점검목적으로 정합니다 (신고포상금 → 2, 민원·국민신문고 → 3, 그 밖 → 1). 교습과정·교습비·수강생수·개업일·처분결과는 직접 적어 주세요.',
    ]);

    [45, 70, 120, 45, 35, 35, 45, 45, 55, 80, 160, 90, 240, 90, 70, 45, 35, 35, 45, 35, 35, 110, 160]
      .forEach((w, k) => sh.setColumnWidth(k + 1, w));
    sh.setRowHeights(3, 2, 25);
    sh.setRowHeight(5, 110);
    sh.getRange(3, 1, 3, NC).setFontSize(9);
    sh.setFrozenRows(5);
    SpreadsheetApp.flush();
  },
};
