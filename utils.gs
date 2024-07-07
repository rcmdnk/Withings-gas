function getSheet(name, cols=[], formatA='yyyy/MM/dd HH:mm:ss') {
  const ss = SpreadsheetApp.getActive();
  ss.setSpreadsheetTimeZone(TIME_ZONE);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // remain 1 additional row, to frozen first row
    // (need additional rows to fix rows)
    sheet.deleteRows(1, sheet.getMaxRows()-2);
    var nCols = cols.length != 0 ? cols.length: 1;
    sheet.deleteColumns(1, sheet.getMaxColumns() - nCols);
    cols.forEach(function(c, i) {
      sheet.getRange(1, i+1).setValue(c);
    });
    sheet.getRange('A:A').setNumberFormat(formatA);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function fillValues(sheetName, columns, data, formatA='yyyy/MM/dd HH:mm:ss') {
  const sheet = getSheet(sheetName, columns, formatA);
  const datetimes = sheet.getRange('A:A').getDisplayValues().flat();
  const data_new = [];
  data.forEach(function(d) {
    if (datetimes.includes(d[0])) return;
    data_new.push(d);
  });
  if (data_new.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1,
        data_new.length, columns.length).setValues(data_new);
    sheet.getRange(2, 1, sheet.getLastRow()-1, sheet.getLastColumn()).sort(1);
  }
}

function getDate(unixtime=null, timezone=null, format='yyyy/MM/dd HH:mm:ss'){
  if (!timezone) timezone = TIME_ZONE;
  if (!unixtime) {
    return Utilities.formatDate(new Date(), timezone, format);
  }
  return Utilities.formatDate(new Date(unixtime * 1000), timezone, format);
}