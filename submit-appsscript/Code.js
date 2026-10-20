// 1. 스프레드시트를 열 때 상단 메뉴 1개에 하위 항목 2개를 만듭니다.
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 업무 자동화')
    .addItem('1. 등록신고번호 가져오기', 'fillRegistrationNumbers') // 첫 번째 단추
    .addItem('2. 한글 표 복사용 만들기', 'createHangulFormat')      // 두 번째 단추 (새로 추가)
    .addItem('3. 공문 통계 생성', 'buildOfficialStats')             // 세 번째 단추 (공문통계.js)
    .addToUi();
}

// -------------------------------------------------------------------
// 기능 1: 외부 DB에서 등록신고번호 가져오기 (빨간색 강조 포함)
// -------------------------------------------------------------------
function fillRegistrationNumbers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const targetSheet = ss.getActiveSheet();
  
  const lastRow = targetSheet.getLastRow();
  if (lastRow < 2) return; 
  
  const targetData = targetSheet.getRange(2, 2, lastRow - 1, 3).getValues();
  
  const dbSpreadsheetId = '158ZNBb88raJ1kzBL3eFcgPZS9CGs5in0YtPtiPWfdic';
  const dbSs = SpreadsheetApp.openById(dbSpreadsheetId);
  
  const academySheet = getSheetByGid(dbSs, 1863320151);
  const tutoringSheet = getSheetByGid(dbSs, 1929773080);
  
  if (!academySheet || !tutoringSheet) {
    SpreadsheetApp.getUi().alert('DB 스프레드시트에서 해당 시트를 찾을 수 없습니다.');
    return;
  }
  
  const academyMap = createDataMap(academySheet);
  const tutoringMap = createDataMap(tutoringSheet);
  
  const outputValues = [];
  const fontColors = []; 
  
  for (let i = 0; i < targetData.length; i++) {
    const type = String(targetData[i][0]).replace(/\s/g, ''); 
    const name = targetData[i][2]; 
    let regNumber = targetData[i][1]; 
    let color = 'black'; 
    
    if (name && String(name).trim() !== "") {
      const searchName = String(name).replace(/\s/g, ''); 
      
      if (type === '학원') {
        regNumber = academyMap[searchName] || 'DB에 학원명 없음';
      } else if (type === '교습소') {
        regNumber = tutoringMap[searchName] || academyMap[searchName] || 'DB에 교습소명 없음';
      }
      
      if (regNumber.includes('없음')) {
        color = 'red';
      }
    }
    
    outputValues.push([regNumber]);
    fontColors.push([color]); 
  }
  
  const targetRange = targetSheet.getRange(2, 3, outputValues.length, 1);
  targetRange.setValues(outputValues);
  targetRange.setFontColors(fontColors);
  
  SpreadsheetApp.getUi().alert('업데이트가 완료되었습니다.');
}

function getSheetByGid(spreadsheet, gid) {
  const sheets = spreadsheet.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === gid) return sheets[i];
  }
  return null;
}

function createDataMap(sheet) {
  const data = sheet.getDataRange().getValues(); 
  const headers = data[0];
  
  let nameIndex = -1;
  let numberIndex = -1;
  
  for (let i = 0; i < headers.length; i++) {
    const headerStr = String(headers[i]).replace(/\s/g, '');
    if (nameIndex === -1 && (headerStr === '학원명' || headerStr === '교습소명' || headerStr === '명칭')) {
      nameIndex = i;
    }
    if (numberIndex === -1 && (headerStr === '등록번호' || headerStr === '신고번호' || headerStr === '등록신고번호')) {
      numberIndex = i;
    }
  }
  
  if (nameIndex === -1) nameIndex = 1; 
  if (numberIndex === -1) numberIndex = 0; 

  const map = {};
  for (let i = 1; i < data.length; i++) {
    const nameRaw = data[i][nameIndex];
    const numRaw = data[i][numberIndex];
    
    if (nameRaw) {
      const keyName = String(nameRaw).replace(/\s/g, '');
      const numStr = String(numRaw || '').trim();
      
      const isNumValid = numStr && numStr.replace(/[-\s]/g, '') !== '';
      
      if (!map[keyName] || map[keyName] === 'DB에 번호 없음') {
        if (isNumValid) {
          map[keyName] = numStr; 
        } else if (!map[keyName]) {
          map[keyName] = 'DB에 번호 없음'; 
        }
      }
    }
  }
  return map;
}

// -------------------------------------------------------------------
// 기능 2: 한글 점검표 맞춤형 복사용 시트 생성 (빈 칸 교차 배열)
// -------------------------------------------------------------------
function createHangulFormat() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getActiveSheet();
  
  const lastRow = sourceSheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('변환할 데이터가 없습니다.');
    return;
  }
  
  // A열(연번)부터 D열(이름)까지 데이터 가져오기
  const data = sourceSheet.getRange(2, 1, lastRow - 1, 4).getValues();
  const formattedItems = [];
  
  // 1. 텍스트 결합 (예: 1_학원_1873_목동유쌤영어학원)
  for (let i = 0; i < data.length; i++) {
    const num = data[i][0];
    const type = data[i][1];
    const regNum = data[i][2];
    const name = data[i][3];
    
    if (name && String(name).trim() !== "") {
      formattedItems.push(`${num}_${type}_${regNum}_${name}`);
    }
  }
  
  const outputData = [];
  
  // 2. 한글 표 양식(위칸 사진 여백, 아래칸 글자)에 맞춘 2열 교차 배열 생성
  for (let i = 0; i < formattedItems.length; i += 2) {
    // 홀수 행: 사진이 들어갈 2열 빈칸
    outputData.push(["", ""]);
    
    // 짝수 행: 텍스트 2열
    const col1 = formattedItems[i];
    const col2 = formattedItems[i + 1] ? formattedItems[i + 1] : "";
    outputData.push([col1, col2]);
  }
  
  // 3. 임시 시트 생성 및 초기화 (이름을 직관적으로 변경)
  let targetSheetName = "엑셀변환용"; 
  let targetSheet = ss.getSheetByName(targetSheetName);
  if (!targetSheet) {
    targetSheet = ss.insertSheet(targetSheetName);
  } else {
    targetSheet.clear();
  }
  
  // 4. 데이터 일괄 출력 및 열 너비 조절
  targetSheet.getRange(1, 1, outputData.length, 2).setValues(outputData);
  targetSheet.autoResizeColumn(1);
  targetSheet.autoResizeColumn(2);
  
  // 5. 엑셀 다운로드용 링크 생성 및 팝업 창 띄우기
  const ssId = ss.getId();
  const sheetId = targetSheet.getSheetId();
  
  // 구글 시트의 내보내기 기능을 활용한 엑셀 파일 다운로드 URL
  const downloadUrl = `https://docs.google.com/spreadsheets/d/${ssId}/export?format=xlsx&gid=${sheetId}`;
  
  // 화면에 띄울 HTML 팝업 디자인
  const htmlOutput = HtmlService.createHtmlOutput(
    `<div style="font-family: sans-serif; text-align: center; padding: 20px;">
      <p style="font-size: 15px; margin-bottom: 20px;">한글 표 복사용 데이터 배열이 완료되었습니다.</p>
      <a href="${downloadUrl}" target="_blank" 
         style="display: inline-block; padding: 12px 24px; background-color: #1a73e8; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
         📥 엑셀 파일 다운로드
      </a>
      <p style="font-size: 13px; color: #555; margin-top: 25px; line-height: 1.5;">
        <b>[다음 단계]</b><br>
        1. 위 버튼을 눌러 엑셀 파일을 엽니다.<br>
        2. 데이터를 복사(Ctrl+C)합니다.<br>
        3. 한글(HWP) 표의 첫 칸을 클릭하고 F5를 누른 뒤<br>
        붙여넣기(Ctrl+V) ➔ <b>내용만 덮어쓰기</b>를 선택하세요.
      </p>
    </div>`
  ).setWidth(400).setHeight(250);
  
  // 팝업 실행
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '🚀 엑셀 변환 완료');
}