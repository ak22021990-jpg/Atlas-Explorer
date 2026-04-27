var SPREADSHEET_ID = 'REPLACE_WITH_YOUR_SPREADSHEET_ID';
var SHEET_NAME = 'Scores';

function doPost(e) {
  try {
    var payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    appendScore(payload);
    return jsonResponse({
      ok: true,
      leaderboard: getLeaderboard(payload.waveCode)
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: String(error)
    });
  }
}

function doGet(e) {
  var waveCode = e && e.parameter ? e.parameter.waveCode : '';
  return jsonResponse({
    ok: true,
    leaderboard: getLeaderboard(waveCode)
  });
}

function appendScore(payload) {
  var sheet = getSheet();
  sheet.appendRow([
    new Date(),
    payload.name || '',
    payload.waveCode || '',
    payload.trainerName || '',
    Number(payload.game1 || 0),
    Number(payload.game2 || 0),
    Number(payload.game3 || 0),
    Number(payload.game4 || 0),
    Number(payload.total || 0),
    Number(payload.stars || 0),
    payload.passFail || 'Fail',
    payload.flagged || 'No'
  ]);
}

function getLeaderboard(waveCode) {
  var values = getSheet().getDataRange().getValues();
  if (values.length <= 1) return [];

  return values
    .slice(1)
    .filter(function(row) {
      return !waveCode || row[2] === waveCode;
    })
    .map(function(row) {
      return {
        timestamp: row[0],
        name: row[1],
        waveCode: row[2],
        trainerName: row[3],
        game1: row[4],
        game2: row[5],
        game3: row[6],
        game4: row[7],
        total: row[8],
        stars: row[9],
        passFail: row[10],
        flagged: row[11]
      };
    })
    .sort(function(a, b) {
      return b.total - a.total || b.stars - a.stars;
    });
}

function getSheet() {
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
  ensureHeader(sheet);
  return sheet;
}

function ensureHeader(sheet) {
  if (sheet.getLastRow() > 0) return;
  sheet.appendRow([
    'Timestamp',
    'Agent Name',
    'iCube Wave Code',
    'Trainer Name',
    'Game 1 Score',
    'Game 2 Score',
    'Game 3 Score',
    'Game 4 Score',
    'Total Score',
    'Stars Earned',
    'Pass / Fail',
    'Flagged for Trainer Review'
  ]);
}

function jsonResponse(result) {
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
