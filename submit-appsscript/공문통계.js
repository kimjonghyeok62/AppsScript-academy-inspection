/*******************************************************
 * 공문 통계 생성 — 「학원등 지도ㆍ점검 실적」 엑셀 서식 5종
 * (2026 지도점검(도교육청 제출용) 스프레드시트에 붙는 스크립트)
 *
 * ★ 읽는 탭
 *   학원, 교습소     (gid 0)          → 1-1, 2, 3, 4
 *   개인과외교습자   (gid 1277362376) → 1-2, 2, 3, 4
 *
 * ★ 만드는 시트 (이름 = 엑셀 서식의 시트 이름)
 *   1-1. 행정처분 및 적발현황(학원,교습소)
 *   1-2. 행정처분 및 적발현황(개인과외교습)
 *   행정처분(정지,말소등),과태료부과현황
 *   무등록, 미신고 적발 현황
 *   4. 신고포상금 지급현황
 *
 * ★ 1-1, 1-2, 4 는 행·열 위치가 엑셀 서식과 같다
 *   → 숫자 칸을 복사해 엑셀의 같은 칸에 붙여넣으면 된다 (노란 칸 = 엑셀에서 수식 칸)
 *
 * ★ 월은 점검일의 달력 월 (3.30~31 점검 → 3월, 4.1~ → 4월)
 * ★ 위반내용은 글로만 적혀 있어 낱말로 항목을 고른다 (STAT_.RULES)
 *
 * ★ 이 파일은 다른 스크립트와 이름이 겹치지 않게 STAT_ / _StatGen 만 쓴다
 *******************************************************/


// ═══════════════════════════════════════════════════════
// ★ 공개 함수 — 메뉴 '3. 공문 통계 생성'
// ═══════════════════════════════════════════════════════
function buildOfficialStats() {
  const ui  = SpreadsheetApp.getUi();
  const res = ui.alert(
    '📊 공문 통계 생성',
    [
      '「학원등 지도ㆍ점검 실적」 엑셀 서식과 같은 모양으로 아래 시트를 만듭니다.',
      '',
      ...Object.values(STAT_.OUT).map(n => `  • ${n}`),
      '',
      '  • 시트가 이미 있으면 내용을 지우고 다시 씁니다.',
      '',
      '계속하시겠습니까?'
    ].join('\n'),
    ui.ButtonSet.YES_NO
  );
  if (res !== ui.Button.YES) return;

  const ss = SpreadsheetApp.getActive();
  ss.toast('자료를 읽는 중...', '📊 공문 통계', 10);

  // ★ 자료는 시트를 지우거나 만들기 전에 먼저 다 읽는다 (타임아웃 방지)
  const academy = _StatGen.readAcademy(_StatGen.sheetByGid(ss, STAT_.SRC.학원));
  const tutor   = _StatGen.readTutor(_StatGen.sheetByGid(ss, STAT_.SRC.과외));
  const all     = academy.concat(tutor);

  ss.toast('시트를 만드는 중...', '📊 공문 통계', 20);
  _StatGen.writeMonthly(ss, STAT_.OUT.학원, _StatGen.form('학원'), academy);
  _StatGen.writeMonthly(ss, STAT_.OUT.과외, _StatGen.form('과외'), tutor);
  _StatGen.writeSanctionList(ss, STAT_.OUT.처분, all);
  _StatGen.writeUnregistered(ss, STAT_.OUT.무등록, all);
  _StatGen.writeReward(ss, STAT_.OUT.포상금, all);

  SpreadsheetApp.flush();
  ss.toast('공문 통계 시트 5종 생성 완료!', '✅', 5);
}


// ═══════════════════════════════════════════════════════
// 설정
// ═══════════════════════════════════════════════════════
const STAT_ = {
  YEAR: 2026,
  SIDO: '경기',
  ORG:  '하남',
  INSPECTORS_PER_VISIT: 2,   // 한 번 점검에 나가는 인원 (지도점검 인원 = 점검 수 × 2)

  // 읽는 탭 — gid 로 찾고, 없으면 이름으로
  SRC: {
    학원: { GID: 0,          NAME: '학원, 교습소' },
    과외: { GID: 1277362376, NAME: '개인과외교습자' },
  },

  // '학원, 교습소' 탭 열 (1행 머리글)
  COL_학원: { 점검일: 2, 월: 3, 구분: 4, 명칭: 5, 목적: 6, 처분: 7, 위반: 8,
             과태료부과일: 9, 처분일: 11, 과태료: 12, 비고: 13 },
  // '개인과외교습자' 탭 열 (1행 머리글, 이어지는 위반 행은 연번·이름이 비어 있음)
  COL_과외: { 연번: 1, 점검일: 2, 월: 3, 성명: 4, 목적: 5, 처분: 6, 세부: 7,
             의견알림: 8, 처분일: 10, 과태료: 11, 납부: 12 },

  OUT: {
    학원:   '1-1. 행정처분 및 적발현황(학원,교습소)',
    과외:   '1-2. 행정처분 및 적발현황(개인과외교습)',
    처분:   '행정처분(정지,말소등),과태료부과현황',
    무등록: '무등록, 미신고 적발 현황',
    포상금: '4. 신고포상금 지급현황',
  },

  COLOR: {
    HEAD:   '#E4DFEC',   // 머리글 (엑셀 서식의 연보라)
    YELLOW: '#FFF2CC',   // 엑셀 서식에서 수식이 든 칸
    TOTAL:  '#D9D9D9',   // 계 행
    REF:    '#F3F3F3',   // 참고 열 (엑셀 서식에 없는 열)
  },

  // ── 위반항목 (순서 = 엑셀 서식의 열 순서) ──
  // 대분류가 하나뿐이고 설명도 같은 항목(기타)은 서식처럼 4~5행을 합쳐 쓴다
  ITEMS_학원: [
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
  ITEMS_과외: [
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

  // ── 위반내용 글 → 항목 (공백을 지운 글에 차례로 맞춰 보고 처음 맞는 항목, 안 맞으면 기타) ──
  RULES_학원: [
    ['4-7', /선행학습/],
    ['4-3', /광고.*(교습비|표시|등록번호|게시)/],
    ['4-9', /광고/],                                  // 허위·과대·과장 광고
    ['4-6', /명칭/],
    ['2-1', /초과/],
    ['2-2', /교습비.*(변경|미반환|영수증)|조정명령|미반환|영수증/],
    ['2-3', /교습비|반환기준/],
    ['3-2', /성범죄/],
    ['3-3', /아동학대.*(조회|전력)/],                 // 아동학대 신고의무자 교육 미이수 → 기타
    ['3-4', /인적사항/],
    ['3-5', /임시교습|보조/],
    ['3-1', /강사/],
    ['4-2', /교습과정|교습과목/],
    ['4-8', /교습시간/],
    ['4-4', /장부|서류/],
    ['4-5', /증명서/],
    ['4-10', /연수/],
    ['4-11', /휴원|폐원|휴소|폐소/],
    ['4-12', /보험/],
    ['4-1', /무등록|미등록|미신고|거짓|부정/],
    ['1-1', /시설|위치|숙박/],
  ],
  DEFAULT_학원: '5-1',
  RULES_과외: [
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
  DEFAULT_과외: '4-1',

  // 행정처분 현황 열 (계 다음 6칸)
  SANCT_KEYS: ['말소', '정지', '벌점', '지도', '과태료처분', '고발'],
  SANCT_RULES: {
    말소: /말소|폐지/,
    정지: /(^|[^행])정지|중지/,   // 행정지도의 '정지'는 빼고
    벌점: /벌점|시정|경고/,
    지도: /지도/,
    고발: /고발|수사/,
  },

  // 4. 신고포상금 — 신고로 시작된 점검 (점검목적)
  REWARD_PURPOSE: /신고센터|포상/,
  REWARD_TYPES: [
    { label: '무등록(미신고) 학원/교습소',                          학원: ['4-1'],                      과외: [] },
    { label: '미신고 개인과외교습자',                               학원: [],                           과외: ['3-1'] },
    { label: '교습비등 초과징수, 교습비 등 거짓 표시, 게시, 고지',  학원: ['2-1', '2-3', '4-3'],        과외: ['1-1', '1-3', '3-7'] },
    { label: '교습시간 위반',                                       학원: ['4-8'],                      과외: ['3-5'] },
  ],
};


// ═══════════════════════════════════════════════════════
// 내부 모듈 — _StatGen
// ═══════════════════════════════════════════════════════
const _StatGen = {

  // ── 1-1 / 1-2 서식 정의 ──
  form(kind) {
    const Y = STAT_.YEAR;
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
      '※ (이 시트) 6~17행 C열부터 복사해 엑셀의 같은 칸에 붙여넣으면 됩니다. 노란 칸은 엑셀에서 수식이 든 칸입니다.',
      `※ (이 시트) 지도점검 인원 = 점검 수 × ${STAT_.INSPECTORS_PER_VISIT}명. 숫자 칸의 메모에 해당 이름이 있고, 맨 오른쪽 참고 열은 엑셀 서식에 없는 열입니다.`,
    ];
    const sanctHeads = ['계', '등록말소/폐지', '교습정지', '벌점부과/시정명령/경고', '행정지도', '과태료', '고발(수사의뢰)'];

    if (kind === '과외') {
      return {
        items: STAT_.ITEMS_과외,
        title: `1-2. 개인과외교습자 행정처분 및 적발 현황(${Y}년)`,
        heads: {
          인원: '지도점검 \n인원(명)', 점검: '점검 개인과외교습자 수', 적발: '적발된 개인과외교습자 수',
          적발건수: '적발 건수', 처분: '행정처분 현황(건수)', 금액: '과태료 부과 금액(천원)',
          참고: '적발 교습자(참고)',
        },
        sanctHeads,
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
      items: STAT_.ITEMS_학원,
      title: `1-1. 학원 및 교습소 행정처분 및 적발 현황(${Y}년)`,
      heads: {
        인원: '지도점검 \n인원(명)', 점검: '점검 학원(교습소) 수', 적발: '적발학원\n(교습소) 수',
        적발건수: '적발건수', 처분: '행정처분 현황(건수)', 금액: '과태료 금액(천원)',
        참고: '적발 학원(참고)',
      },
      sanctHeads,
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
  sheetByGid(ss, src) {
    const sh = ss.getSheets().find(s => s.getSheetId() === src.GID) || ss.getSheetByName(src.NAME);
    if (!sh) throw new Error(`시트 없음: "${src.NAME}"`);
    return sh;
  },

  readBlock(sh, nCols) {
    const n = sh.getLastRow() - 1;
    if (n <= 0) return { vals: [], disp: [] };
    const rg = sh.getRange(2, 1, n, nCols);
    return { vals: rg.getValues(), disp: rg.getDisplayValues() };
  },

  // ─── '학원, 교습소' 탭 → 행 목록 (위반 1건 = 1행, 같은 점검이면 연번·명칭이 같다) ───
  readAcademy(sh) {
    const C = STAT_.COL_학원;
    const { vals, disp } = this.readBlock(sh, C.비고);
    const rows = [];

    for (let i = 0; i < disp.length; i++) {
      const d    = disp[i];
      const type = d[C.구분 - 1].trim();
      const name = d[C.명칭 - 1].trim();
      if ((type !== '학원' && type !== '교습소') || !name) continue;
      const date = this.parseDate(vals[i][C.점검일 - 1], d[C.점검일 - 1], d[C.월 - 1]);
      if (!date) continue;

      const sanctRaw = d[C.처분 - 1].trim();
      const viol     = d[C.위반 - 1].trim();
      const fineAmt  = this.parseFine(d[C.과태료 - 1]);
      // '정상운영'이면 위반내용 칸에 점검자 이름이 적혀 있어도 위반이 아니다
      const isViol   = fineAmt > 0 || (!!sanctRaw && !/정상/.test(sanctRaw));

      rows.push({
        date, type, name,
        purpose:   d[C.목적 - 1].trim(),
        addr: '', owner: '',
        viol:      isViol ? viol : '',
        violCode:  isViol ? this.classify(viol, STAT_.RULES_학원, STAT_.DEFAULT_학원) : '',
        sanct:     isViol ? sanctRaw : '',
        fineAmt,
        paidWon:   this.parsePaid(d[C.비고 - 1]),
        fineDate:  fineAmt > 0 ? this.fmtDate(d[C.과태료부과일 - 1]) : '',
        sanctDate: this.fmtDate(d[C.처분일 - 1]),
        remark:    '',
      });
    }
    return rows;
  },

  // ─── '개인과외교습자' 탭 → 행 목록 ───
  readTutor(sh) {
    const C = STAT_.COL_과외;
    const { vals, disp } = this.readBlock(sh, C.납부);
    const rows = [];
    let   lastName = '';

    for (let i = 0; i < disp.length; i++) {
      const d    = disp[i];
      const date = this.parseDate(vals[i][C.점검일 - 1], d[C.점검일 - 1], d[C.월 - 1]);
      if (!date) continue;

      // 이어지는 위반 행은 이름이 비어 있다 → 윗행 이름
      let name = d[C.성명 - 1].trim();
      if (name) lastName = name; else name = lastName;
      if (!name) continue;

      const sanct   = d[C.처분 - 1].trim();
      const detail  = d[C.세부 - 1].trim();
      const fineAmt = this.parseFine(d[C.과태료 - 1]);
      const isViol  = !!detail || fineAmt > 0 || (!!sanct && !/정상|이상없음|^없음$/.test(sanct));

      rows.push({
        date, type: '개인과외', name,
        purpose:   d[C.목적 - 1].trim(),
        addr: '', owner: name,
        viol:      detail,
        violCode:  isViol ? this.classify(detail, STAT_.RULES_과외, STAT_.DEFAULT_과외) : '',
        sanct, fineAmt,
        paidWon:   this.parsePaid(d[C.납부 - 1]),
        fineDate:  fineAmt > 0 ? this.fmtDate(d[C.의견알림 - 1]) : '',
        sanctDate: this.fmtDate(d[C.처분일 - 1]),
        remark:    '',
      });
    }
    return rows;
  },

  classify(text, rules, fallback) {
    const t   = String(text || '').replace(/\s/g, '');
    const hit = rules.find(([, re]) => re.test(t));
    return hit ? hit[0] : fallback;
  },

  // 점검일은 '1.7' · '9.30' · '04-06' 처럼 연도 없이 적혀 있다 (Date 면 그대로)
  // 날짜를 못 읽으면 '9월' 같은 월 칸으로 그 달 1일
  parseDate(v, disp, monthCell) {
    if (v instanceof Date && !isNaN(v.getTime())) return v;
    const s = String(disp || '').trim();
    let m = s.match(/^(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = s.match(/^(\d{1,2})\D+(\d{1,2})/);
    if (m) return new Date(STAT_.YEAR, +m[1] - 1, +m[2]);
    m = String(monthCell || '').match(/(\d{1,2})\s*월/);
    return m ? new Date(STAT_.YEAR, +m[1] - 1, 1) : null;
  },

  // 과태료 → 천원 (탭에는 원 단위 '500,000' / 작은 값은 만원 단위로 본다)
  parseFine(v) {
    const num = parseFloat(String(v || '').replace(/[^0-9.]/g, ''));
    if (isNaN(num) || num <= 0) return 0;
    return num >= 10000 ? Math.round(num / 1000) : Math.round(num * 10);
  },

  // '과태료 납부 완료 (40만원)' 처럼 금액이 적힌 경우만 실 납부금액(원)
  parsePaid(v) {
    const s   = String(v || '');
    const man = s.match(/(\d[\d,]*)\s*만\s*원/);
    if (man) return Number(man[1].replace(/,/g, '')) * 10000;
    const won = s.match(/(\d{1,3}(?:,\d{3})+|\d{5,})\s*원?/);
    return won ? Number(won[1].replace(/,/g, '')) : 0;
  },

  fmtDate(v) {
    const s = String(v || '').trim();
    const m = s.match(/^(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
    if (!m) return '';
    const p = x => String(x).padStart(2, '0');
    return `${m[1]}.${p(m[2])}.${p(m[3])}.`;
  },

  dateText(d) {
    const p = x => String(x).padStart(2, '0');
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}.`;
  },

  // 한 번의 점검 = 같은 날 + 같은 기관 + 같은 점검목적
  visitKey(r) {
    const d = r.date;
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}|${r.name}|${r.purpose}`;
  },

  inMonth(r, m) {
    return r.date.getFullYear() === STAT_.YEAR && r.date.getMonth() + 1 === m;
  },

  // 지난 달까지(이번 달 포함)만 숫자를 채운다
  lastMonth() {
    const t = new Date();
    if (t.getFullYear() > STAT_.YEAR) return 12;
    if (t.getFullYear() < STAT_.YEAR) return 0;
    return t.getMonth() + 1;
  },

  // ═══════════════════════════════════════════════════
  // 집계
  // ═══════════════════════════════════════════════════
  emptyAgg(codes) {
    const violByCode = {}, namesByCode = {};
    codes.forEach(c => { violByCode[c] = 0; namesByCode[c] = []; });
    const sanct = {}, namesBySanct = {};
    STAT_.SANCT_KEYS.forEach(k => { sanct[k] = 0; namesBySanct[k] = []; });
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
    STAT_.SANCT_KEYS.forEach(k => {
      dest.sanct[k] += src.sanct[k];
      dest.namesBySanct[k] = dest.namesBySanct[k].concat(src.namesBySanct[k]);
    });
  },

  // 위반 1행의 행정처분 → { 키: true } (과태료는 금액이 있으면 처분이 시정명령이어도 함께 — 중복 산정)
  sanctionsOf(r) {
    const out = {};
    Object.keys(STAT_.SANCT_RULES).forEach(k => { if (STAT_.SANCT_RULES[k].test(r.sanct)) out[k] = true; });
    if (r.fineAmt > 0 || /과태료/.test(r.sanct)) out.과태료처분 = true;
    return out;
  },

  aggregate(rows, codes) {
    const agg     = this.emptyAgg(codes);
    const checked = new Set();
    const caught  = new Set();

    for (const r of rows) {
      const gk = this.visitKey(r);
      checked.add(gk);
      if (!r.violCode && !(r.fineAmt > 0)) continue;

      caught.add(gk);
      agg.caughtNames.add(r.name);

      if (codes.includes(r.violCode)) {
        agg.violByCode[r.violCode]++;
        agg.namesByCode[r.violCode].push(r.name);
        agg.violTotal++;
      }
      const s = this.sanctionsOf(r);
      Object.keys(s).forEach(k => {
        agg.sanct[k]++;
        agg.namesBySanct[k].push(k === '과태료처분' && r.fineAmt > 0
          ? `${r.name}(${r.fineAmt.toLocaleString()}천원)` : r.name);
      });
      agg.fine += r.fineAmt;
    }
    agg.checked    = checked.size;
    agg.caught     = caught.size;
    agg.inspectors = checked.size * STAT_.INSPECTORS_PER_VISIT;
    // 서식의 계 = 6칸의 합 (=SUM)
    agg.sanctTotal = STAT_.SANCT_KEYS.reduce((sum, k) => sum + agg.sanct[k], 0);
    return agg;
  },

  // ═══════════════════════════════════════════════════
  // 시트 공통
  // ═══════════════════════════════════════════════════

  // 있던 시트는 지우지 않고 비워서 다시 쓴다 (시트 삭제·생성이 타임아웃을 부른다)
  prepSheet(ss, name, nCols) {
    const sh = ss.getSheetByName(name) || ss.insertSheet(name, ss.getSheets().length);
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
      .setBackground(STAT_.COLOR.HEAD).setFontWeight('bold').setFontSize(9).setWrap(true)
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
  },

  writeTitle(sh, text) {
    sh.getRange(1, 1).setValue(text).setFontSize(14).setFontWeight('bold');
    sh.setRowHeight(1, 30);
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

    this.writeTitle(sh, form.title);
    this.writeMonthlyHead(sh, form, L);

    // ── 6~17행 = 1~12월, 18행 = 계 ──
    const FIRST  = 6;
    const lastMo = this.lastMonth();
    const total  = this.emptyAgg(codes);
    const values = [], notes = [];

    for (let m = 1; m <= 12; m++) {
      const a = this.aggregate(rows.filter(r => this.inMonth(r, m)), codes);
      this.addAgg(total, a, codes);
      values.push(this.monthlyRow(STAT_.ORG, m, a, codes, L, m <= lastMo, false));
      notes.push(this.memoRow(a, codes, L));
    }
    values.push(this.monthlyRow(' 계', '', total, codes, L, true, true));
    notes.push(Array(L.LAST).fill(''));

    const TOTAL_ROW = FIRST + 12;
    sh.getRange(FIRST, 1, values.length, L.LAST).setValues(values).setNotes(notes)
      .setFontSize(10).setVerticalAlignment('middle').setHorizontalAlignment('center');
    sh.getRange(FIRST, 3, values.length, L.금액 - 2).setNumberFormat('#,##0;-#,##0;"-"').setHorizontalAlignment('right');
    // 엑셀 서식에서 수식이 든 칸 (적발건수 계 · 행정처분 계)
    sh.getRange(FIRST, 6, 12, 1).setBackground(STAT_.COLOR.YELLOW);
    sh.getRange(FIRST, L.처분계, 12, 1).setBackground(STAT_.COLOR.YELLOW);
    sh.getRange(TOTAL_ROW, 1, 1, L.금액).setBackground(STAT_.COLOR.TOTAL).setFontWeight('bold');
    this.thinBorder(sh.getRange(3, 1, TOTAL_ROW - 2, L.금액));

    // 참고 열 (엑셀 서식에 없는 열)
    sh.getRange(FIRST, L.참고, values.length, 1)
      .setBackground(STAT_.COLOR.REF).setFontSize(9).setHorizontalAlignment('left')
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);

    this.writeFootNotes(sh, TOTAL_ROW + 2, form.notes);

    sh.setColumnWidth(1, 70);  sh.setColumnWidth(2, 35);
    sh.setColumnWidth(3, 60);  sh.setColumnWidth(4, 75);  sh.setColumnWidth(5, 75);
    sh.setColumnWidth(6, 40);
    sh.setColumnWidths(L.VIOL, codes.length, 58);
    sh.setColumnWidths(L.처분계, 7, 52);
    sh.setColumnWidth(L.처분계 + 3, 70);   // 벌점부과/시정명령/경고
    sh.setColumnWidth(L.금액, 70);
    sh.setColumnWidth(L.참고, 300);
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

  // 0 은 빈칸 (서식처럼 흰 칸은 비워 둔다) — 계 행과 수식 칸은 0 그대로 ('-' 로 보인다)
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
    STAT_.SANCT_KEYS.forEach((k, j) => { row[L.처분계 + j] = z(a.sanct[k]); });
    row[L.금액 - 1] = z(a.fine);
    row[L.참고 - 1] = isTotal ? '' : [...a.caughtNames].join(', ');
    return row;
  },

  memoRow(a, codes, L) {
    const row = Array(L.LAST).fill('');
    codes.forEach((code, k) => {
      const names = a.namesByCode[code];
      if (names.length) row[L.VIOL - 1 + k] = names.join('\n');
    });
    STAT_.SANCT_KEYS.forEach((k, j) => {
      const names = a.namesBySanct[k];
      if (names.length) row[L.처분계 + j] = names.join('\n');
    });
    if (a.fine > 0) row[L.금액 - 1] = a.namesBySanct.과태료처분.join('\n');
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
      .filter(r => r.violCode && (r.fineAmt > 0 || /(^|[^행])정지|중지|말소|폐지/.test(r.sanct)))
      .sort((a, b) => a.date - b.date);   // 같은 날은 탭 순서 그대로

    this.writeTitle(sh, `2. 행정처분(정지, 말소 등), 과태료 부과 현황(${STAT_.YEAR}년)`);

    const hw = this.headWriter(1, NC);
    ['시도\n교육청', '교육지원청', '대상', '학원 등, 개인과외고습자 이름', '위반사항', '지도점검일',
     '행정처분(예정)', '행정처분일', '과태료 부과일', '과태료 부과금액(원)', '과태료 실 납부금액(원)',
     '과태료 감경사유', '비고'].forEach((t, k) => hw.put(0, k + 1, t));
    this.applyHead(sh, 3, hw);

    const FIRST  = 4;
    const values = list.map(r => {
      // '시정명령, 과태료' → 시정명령 (과태료는 옆 칸에 따로 적는다)
      const act = r.sanct.split(/[,\s]+/).filter(x => x && x !== '과태료').join(', ') || '해당없음';
      return [
        STAT_.SIDO, STAT_.ORG,
        r.type === '개인과외' ? '개인과외교습자' : r.type,
        r.name,
        r.viol || '기타',
        this.dateText(r.date),
        act,
        r.sanctDate || '처분예정',
        r.fineAmt > 0 ? (r.fineDate || '부과예정') : '-',
        r.fineAmt > 0 ? r.fineAmt * 1000 : '-',
        r.paidWon || '',
        '',
        r.remark,
      ];
    });
    const fineSum = list.reduce((s, r) => s + r.fineAmt * 1000, 0);
    const paidSum = list.reduce((s, r) => s + r.paidWon, 0);
    values.push(['계', '', '', '', list.length, '', '', '', '', fineSum, paidSum, '', '']);

    const TOTAL_ROW = FIRST + values.length - 1;
    sh.getRange(FIRST, 1, values.length, NC).setValues(values)
      .setFontSize(10).setVerticalAlignment('middle').setHorizontalAlignment('center');
    sh.getRange(FIRST, 10, values.length, 2).setNumberFormat('#,##0').setHorizontalAlignment('right');
    sh.getRange(FIRST, 4, values.length, 2).setHorizontalAlignment('left');
    sh.getRange(TOTAL_ROW, 1, 1, NC).setBackground(STAT_.COLOR.TOTAL).setFontWeight('bold');
    this.thinBorder(sh.getRange(3, 1, TOTAL_ROW - 2, NC));

    this.writeFootNotes(sh, TOTAL_ROW + 2, [
      `○ 작성기간: ${STAT_.YEAR}. 1. 1.~12. 31.`,
      `○ 작성대상: ${STAT_.YEAR}. 1. 1.~12. 31. 지도점검 적발 건에 대한 행정처분(정지, 말소·폐지·중지만 해당) 및 과태료 부과 내역 기재`,
      "  * 과태료 부과시 행정처분이 '시정명령'일 경우에도 시정명령 기재",
      '○ 지도점검일 순 나열',
      '○ 셀병합 금지',
      '○ 행정처분 현황: 정지, 폐원(말소)처분(예정) 현황 작성(처분 결과가 처분예정 결과와 다를 경우 다음 현황 제출 시 수정. 빨간색 표시)',
      '',
      '※ (이 시트) 과태료 부과일 = 과태료부과일(사전의견청취알림) 칸, 실 납부금액 = 비고에 금액이 적힌 경우만 채웁니다. 감경사유·비고는 직접 적어 주세요.',
    ]);

    [45, 70, 90, 200, 300, 90, 80, 90, 90, 100, 100, 160, 200]
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
    const NC   = 23;
    const sh   = this.prepSheet(ss, sheetName, NC);
    const seen = new Set();
    const list = rows
      .filter(r => r.violCode === (r.type === '개인과외' ? '3-1' : '4-1'))
      .filter(r => {
        const k = this.visitKey(r);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .sort((a, b) => a.date - b.date);

    this.writeTitle(sh, `3. 무등록 학원, 미신고 교습소 및 개인과외교습자 적발 현황(${STAT_.YEAR}년)`);

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
      row[0] = STAT_.SIDO;
      row[1] = STAT_.ORG;
      row[2] = STAT_.REWARD_PURPOSE.test(r.purpose) ? 2 : /민원|신문고|제보|신고/.test(r.purpose) ? 3 : 1;
      row[3] = r.date.getFullYear();
      row[4] = r.date.getMonth() + 1;
      row[5] = r.date.getDate();
      row[r.type === '학원' ? 6 : r.type === '교습소' ? 7 : 8] = 1;
      row[9]  = r.owner;
      row[10] = r.type === '개인과외' ? '' : r.name;
      row[22] = r.viol;
      return row;
    });
    const cnt = k => values.filter(v => v[k] === 1).length;
    const tot = Array(NC).fill('');
    tot[0] = '계'; tot[6] = cnt(6); tot[7] = cnt(7); tot[8] = cnt(8); tot[12] = list.length;
    values.push(tot);

    const TOTAL_ROW = FIRST + values.length - 1;
    sh.getRange(FIRST, 1, values.length, NC).setValues(values)
      .setFontSize(10).setVerticalAlignment('middle').setHorizontalAlignment('center');
    sh.getRange(TOTAL_ROW, 1, 1, NC).setBackground(STAT_.COLOR.TOTAL).setFontWeight('bold');
    this.thinBorder(sh.getRange(3, 1, TOTAL_ROW - 2, NC));

    this.writeFootNotes(sh, TOTAL_ROW + 2, [
      '* 셀 병합 금지',
      `○ 작성기간: ${STAT_.YEAR}. 1. 1.~12. 31.`,
      `○ 작성대상: ${STAT_.YEAR}. 1. 1.~ 12. 31. 각종 지도점검으로 적발된 무등록 학원, 미신고 교습소 및 개인과외교습자 현황`,
      '',
      '※ (이 시트) 위반내용이 미등록·무등록·미신고(학원·교습소 4-1, 개인과외 3-1)로 분류된 점검만 모읍니다.',
      '※ (이 시트) 점검유형은 점검목적으로 정합니다 (신고센터·포상금 → 2, 민원·국민신문고 → 3, 그 밖 → 1). 피고발인·주소·교습과정·교습비·개업일·처분결과는 직접 적어 주세요.',
    ]);

    [45, 70, 120, 45, 35, 35, 45, 45, 55, 80, 160, 90, 240, 90, 70, 45, 35, 35, 45, 35, 35, 110, 200]
      .forEach((w, k) => sh.setColumnWidth(k + 1, w));
    sh.setRowHeights(3, 2, 25);
    sh.setRowHeight(5, 110);
    sh.setFrozenRows(5);
    SpreadsheetApp.flush();
  },

  // ═══════════════════════════════════════════════════
  // 4 — 신고포상금 지급 현황
  // 점검목적이 신고센터·포상금인 점검의 위반을 유형별로 센다 (위반 1건 = 신고 1건)
  // 지급건수·지급비율·금액·신고반려는 자료에 없어 비워 둔다
  // 행·열 위치는 엑셀 서식과 같다 (5~52행 = 1~12월 × 4유형, 53행 = 소계)
  // ═══════════════════════════════════════════════════
  writeReward(ss, sheetName, rows) {
    const NC    = 15;
    const sh    = this.prepSheet(ss, sheetName, NC);
    const TYPES = STAT_.REWARD_TYPES;
    const reported = rows.filter(r => r.violCode && STAT_.REWARD_PURPOSE.test(r.purpose));

    sh.getRange(1, 1).setValue(`4.  신고포상금 지급 현황(${STAT_.YEAR}년)`).setFontSize(14).setFontWeight('bold');
    sh.setRowHeight(1, 30);

    const hw = this.headWriter(3, NC);   // 0=2행, 1=3행, 2=4행
    hw.put(0, 1, '교육지원청명', 3);
    hw.put(0, 2, '월', 3);
    hw.put(0, 3, '유형별', 3);
    hw.put(0, 4, '*신고건수', 3);
    hw.put(0, 5, '포상결정', 1, 3);
    hw.put(1, 5, '지급건수', 2);
    hw.put(1, 6, '신고대비\n지급비율', 2);
    hw.put(1, 7, '금액(천원)', 2);
    hw.put(0, 8, '행정처분현황', 1, 7);
    ['계', '교습정지', '벌점, 경고,\n시정명령', '고발', '과태료', '적정운영', '신고반려']
      .forEach((t, k) => hw.put(1, 8 + k, t, 2));
    hw.put(0, 15, '과태료 부과 금액(천원)\n(감경전 금액)', 3);
    this.applyHead(sh, 2, hw);

    const FIRST  = 5;
    const lastMo = this.lastMonth();
    const values = [], notes = [];
    const sum    = Array(NC).fill(0);

    for (let m = 1; m <= 12; m++) {
      const mRows = reported.filter(r => this.inMonth(r, m));
      TYPES.forEach((t, k) => {
        const hit = mRows.filter(r => (r.type === '개인과외' ? t.과외 : t.학원).includes(r.violCode));
        const row = Array(NC).fill('');
        row[0] = m === 1 && k === 0 ? STAT_.ORG : '';
        row[1] = k === 0 ? m : '';
        row[2] = t.label;
        if (m <= lastMo) {
          let 정지 = 0, 시정 = 0, 고발 = 0, 과태료 = 0, fine = 0;
          hit.forEach(r => {
            const s = this.sanctionsOf(r);
            if (s.정지) 정지++;
            if (s.벌점) 시정++;
            if (s.고발) 고발++;
            if (s.과태료처분) 과태료++;
            fine += r.fineAmt;
          });
          row[3]  = hit.length || '해당없음';
          row[7]  = 정지 + 시정 + 고발 + 과태료;
          row[8]  = 정지;  row[9] = 시정;  row[10] = 고발;  row[11] = 과태료;
          row[14] = fine;
          [3, 7, 8, 9, 10, 11, 14].forEach(c => { if (typeof row[c] === 'number') sum[c] += row[c]; });
        }
        values.push(row);
        notes.push(Array(NC).fill('').map((_, c) =>
          c === 3 && hit.length ? hit.map(r => `${r.name} — ${r.viol}`).join('\n') : ''));
      });
    }
    const tot = Array(NC).fill('');
    tot[1] = '소계'; tot[2] = '소계';
    [3, 7, 8, 9, 10, 11, 14].forEach(c => { tot[c] = sum[c]; });
    values.push(tot);
    notes.push(Array(NC).fill(''));

    const TOTAL_ROW = FIRST + values.length - 1;
    sh.getRange(FIRST, 1, values.length, NC).setValues(values).setNotes(notes)
      .setFontSize(10).setVerticalAlignment('middle').setHorizontalAlignment('center');
    sh.getRange(FIRST, 3, values.length, 1).setHorizontalAlignment('left').setWrap(true);
    sh.getRange(FIRST, 4, values.length, NC - 3).setNumberFormat('#,##0;-#,##0;0');
    // 엑셀 서식에서 수식이 든 칸 (지급비율 · 처분 계)
    sh.getRange(FIRST, 6, values.length - 1, 1).setBackground(STAT_.COLOR.YELLOW);
    sh.getRange(FIRST, 8, values.length - 1, 1).setBackground(STAT_.COLOR.YELLOW);
    sh.getRange(TOTAL_ROW, 1, 1, NC).setBackground(STAT_.COLOR.TOTAL).setFontWeight('bold');
    this.thinBorder(sh.getRange(2, 1, TOTAL_ROW - 1, NC));

    this.writeFootNotes(sh, TOTAL_ROW + 2, [
      `○ 작성기간: ${STAT_.YEAR}. 1. 1.~12. 31. (향후 매월 현황 취합 예정)`,
      `○ 작성대상: ${STAT_.YEAR}. 1. 1.~ 지급된 신고포상금 내역 기재`,
      '○ 유형 추가 금지',
      '○ 노란색 셀 입력 금지(자동계산)',
      '',
      '※ (이 시트) 점검목적이 신고센터·포상금인 점검의 위반을 점검일 월로 셉니다 (위반 1건 = 신고 1건). 신고 접수월이 다르면 고쳐 주세요.',
      '※ (이 시트) 지급건수·금액·적정운영·신고반려는 자료에 없어 비워 둡니다. 신고건수 칸 메모에 해당 학원과 위반내용이 있습니다.',
    ]);

    [70, 35, 220, 60, 55, 60, 60, 40, 55, 70, 40, 50, 55, 55, 110]
      .forEach((w, k) => sh.setColumnWidth(k + 1, w));
    sh.setRowHeights(2, 2, 25);
    sh.setRowHeight(4, 25);
    sh.setRowHeights(FIRST, values.length, 30);
    sh.setFrozenRows(4);
    sh.setFrozenColumns(3);
    SpreadsheetApp.flush();
  },
};
