const SHEET_ID = 'YOUR_SHEET_ID_HERE';

function doGet(e) {
  const action = e.parameter.action;
  const agent = e.parameter.agent || '';
  if (action === 'fetchLeaderboard') return fetchLeaderboard(agent);
  if (action === 'fetchBadges') return fetchBadges(agent);
  return jsonResponse({ error: 'unknown action' });
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  if (data.action === 'submit') return submitScore(data);
  if (data.action === 'awardBadge') return awardBadge(data);
  return jsonResponse({ error: 'unknown action' });
}

function submitScore(data) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Players');
  sheet.appendRow([
    new Date().toISOString(),
    data.agent,
    data.batchId,
    data.game,
    data.attempt,
    data.scorePct,
    data.stars,
    data.passed
  ]);
  return jsonResponse({ ok: true });
}

function awardBadge(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('Badges');
  const rows = sheet.getDataRange().getValues();
  const alreadyEarned = rows.some((row) => row[1] === data.agent && row[2] === data.badgeId);
  if (alreadyEarned) return jsonResponse({ ok: true, skipped: true });
  sheet.appendRow([
    new Date().toISOString(),
    data.agent,
    data.badgeId,
    data.badgeName,
    new Date().toLocaleDateString()
  ]);
  return jsonResponse({ ok: true, awarded: true });
}

function fetchLeaderboard(currentAgent) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Leaderboard');
  const rows = sheet.getDataRange().getValues();
  const data = rows.slice(1)
    .filter((row) => row[0])
    .map((row) => ({
      agent: row[0],
      totalStars: Number(row[1]) || 0,
      gamesPassed: Number(row[2]) || 0,
      badgeCount: Number(row[3]) || 0
    }));
  data.sort((a, b) => b.totalStars - a.totalStars);
  const top10 = data.slice(0, 10);
  const idx = data.findIndex((row) => row.agent === currentAgent);
  const currentRow = idx >= 0 ? { ...data[idx], rank: idx + 1 } : null;
  return jsonResponse({ top10, currentRow });
}

function fetchBadges(agent) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Badges');
  const rows = sheet.getDataRange().getValues();
  const badges = rows.slice(1)
    .filter((row) => row[1] === agent)
    .map((row) => ({ badgeId: row[2], badgeName: row[3], earnedOn: row[4] }));
  return jsonResponse({ badges });
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
