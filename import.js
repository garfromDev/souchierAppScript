var importSheetf = getSheet('Import FM final');
var importSheet = getSheet('Import FM');
var targetSheet = getSheet('Souchier Ceva Biovac');


/**
* copy data from import sheet (value only mode) and erase import after copy 
*/
function ImportToSouchier() {

  // 1 - get import data
  toast("Import en cours...", 300);
  var lign = getLastRowForColumn(importSheetf.getRange("B:B"));
  var impf1 = importSheetf.getRange(1, 1, lign, 4);
  var impf2 = importSheetf.getRange(1, 7, lign, 16);
  // 2 - find target location = first empty line of target sheet
  var souchLign = getLastRowForColumn(targetSheet.getRange("C:C")) + 1;
  var targetCell1 = targetSheet.getRange(souchLign, 2);
  var targetCell2 = targetSheet.getRange(souchLign, 8); 
  // 3 copy data
  impf1.copyTo(targetCell1,{contentsOnly:true});
  impf2.copyTo(targetCell2,{contentsOnly:true});
  // 4 clear import in initial sheet
  var imp = importSheet.getDataRange();
  imp.clearContent();  
  toast("Import terminé");
}

/**
* copy data from import sheet (value only mode) and erase import after copy 
* INITIAL IMPORT, COPY ALL COLUMNS FROM 1 TO 16
* Pour executer ce script, sélectionner 'ImportInitialToSouchier' dans le menu en haut
* et appuyer sur le triangle "Play"
*/
function ImportInitialToSouchier() {

  // 1 - get import data
  toast("Import initial en cours...", 300);
  var lign = getLastRowForColumn(importSheetf.getRange("B:B"));
  var impf = importSheetf.getRange(1, 1, lign, 16);

  // 2 - find target location = first empty line of target sheet
  var souchLign = getLastRowForColumn(targetSheet.getRange("C:C")) + 1;
  var targetCell = targetSheet.getRange(souchLign, 2);
  
  // 3 copy data
  impf.copyTo(targetCell,{contentsOnly:true});
  
  // 4 clear import in initial sheet
  var imp = importSheet.getDataRange();
  imp.clearContent();  
  toast("Import initial terminé");
}


// pour référence, enregistrement manuel d'une protection/déprotection de feuille complète
function ProtectionDeprotection() {
  var spreadsheet = SpreadsheetApp.getActive();
  spreadsheet.getRange('A1').activate();
  var allProtections = spreadsheet.getActiveSheet().getProtections(SpreadsheetApp.ProtectionType.SHEET);
  var protection = allProtections[0];
  protection.remove();
  protection = spreadsheet.getActiveSheet().protect();
  protection.removeEditors(['lea.legrand@ceva.com', 'nelly.lesceau@ceva.com', 'magali.bossiere@ceva.com', 'garfrom@gmail.com', 'alexandre.brechet@ceva.com']);
};