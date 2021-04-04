var OCCUPE = "OCCUPE";
var LIBRE = "LIBRE";
var COL_OCCUPATION = 7; //column in 'Emplacements congélateurs' where occupation status is
var COL_FM = 8;     //column in 'Emplacements congélateurs' where FM id is
var COL_CLIENT = 10; //column in 'Emplacements congélateurs' where customer ref is
var COL_SIAM = 9;  //column in 'Emplacements congélateurs' where SIAM number is
var COL_VALID = 67; // column in 'Souchier Ceva Biovac' where validation checkbox is
var COL_DESTR = 73; // column in 'Souchier Ceva Biovac' where destruction checkbox is
var COL_ARCH = 77; // column in 'Souchier Ceva Biovac' where archivage checkbox is
var COL_ATIK = 80; // column in 'Souchier Ceva Biovac' where Atik checkbox is
var COL_DESV = 83; // column in 'Souchier Ceva Biovac' where Desvac checkbox is
var COL_MS = 22;    // column in 'Souchier Ceva Biovac' where MS emplacement is written
var COL_WS = 24;    // column in 'Souchier Ceva Biovac' where WS emplacement is written
var COL_LOG = 25;   // column in 'Souchier Ceva Biovac' where emplacement follow-up is written
var COL_SOUCH = 6.  // column in 'Souchier Ceva Biovac' where the souche name is

var conf = {
/**
 * Get the configuration data from 'Configuration' sheet to compute
 * storage location line number
 * @return {!Array<Object>} Array of congel object with configuration data of each freezer
 */
  update : function() {
    this.congs = [];
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Configuration');
    this.sheetEmplCong = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Emplacements congélateurs');
    var data = sh.getDataRange().getValues();
    var l=1;
    while( data[l] && data[l][1]){
      var congel = new Object;
      congel.nbEmplacements = data[l][1];
      congel.nbEtageres = data[l][2];
      congel.nbRacks = data[l][3];
      congel.nbPlateaux = data[l][4];
      congel.nbLettres = data[l][5];
      congel.nbLignes = data[l][6];
      this.congs.push(congel);
      l++;
    } // end while
  }, // end update()
  
  /**
   * Compute the line number in the sheet 'Emplacement congelateur' for a specific location
   * @param {Integer} congelateur : the id of the congelateur, starting from 1
   * @param {Integer} etagere : start with 1 to n
   * @param {Integer} rack : start with 1 to n
   * @param {Integer} plateau : start with 1 to n
   * @param {Integer} colonne : start with 1 to n , 1 is A, 2 is B ...
   * @param {Integer} ligne : start with 1 to n
   * @return {Int} the line number in the sheet 'Emplacement congelateur' for a specific location, using firstline constant
 */
  getLineForFreezer : function(empl) {
    if( empl.congelateur > this.congs.length || empl.congelateur <= 0){
      throw "Numero congelateur invalide";
    }
    const cnf = this.congs[empl.congelateur-1];
    const firstLine = 2;
    const taillePlateau = cnf.nbLettres * cnf.nbLignes;
    const tailleRack = taillePlateau * cnf.nbPlateaux;
    const tailleEtagere = tailleRack * cnf.nbRacks;
    if( empl.ligne > cnf.ligne || empl.colonne > cnf.nbLettres || empl.plateau > cnf.nbPlateaux || empl.rack > cnf.nbRacks ||
       empl.etagere > cnf.nbEtageres || empl.ligne <= 0 || empl.colonne <= 0 || empl.plateau <= 0 || empl.rack <= 0 ||
       empl.etagere <= 0){
      throw "Emplacement invalide";
    }
    var nb = this.congs.slice(0,empl.congelateur - 1).reduce(function(total, congel) { return total + congel.nbEmplacements}, 0);
    return firstLine + nb + (empl.etagere - 1 ) * tailleEtagere + (empl.rack - 1) * tailleRack +
      (empl.plateau - 1) * taillePlateau + (empl.ligne - 1) * cnf.nbLettres + empl.colonne - 1 
  },
  
  getNbTotalEmplacements : function() {
    return this.congs.reduce(function (total, congel) { return total + congel.nbEmplacements }, 0);
 },
  
  getRangeForEtagere: function(congel, etag1, etag2) {
    var startCong = this.getLineForEtagere(congel, etag1);
    var cong = this.congs[congel - 1];
    var sizeEtag = cong.nbRacks * cong.nbPlateaux * cong.nbLettres * cong.nbLignes;
    var nb = 1 + etag2 - etag1;
    return this.sheetEmplCong.getRange("H"+ (startCong).toString() + ":L" + (startCong + nb * sizeEtag - 1).toString()); 
  },
  
  getLineForEtagere: function(congel, etag) {
    return this.getLineForFreezer(decodeEmplacement("C" + congel + " E" + etag + " R1 P1 A1"));
  }

} // end conf object




/**
 * this is triggered by each value modification in every sheet
 * React to checkbox in column 'Validation ID' and 'Supression souche' 
 * @param {[Object]} event (you can build it by hand for testing pupose)
 * side effect : modify header background of sheet "Emplacements congélateurs"
 * CAUTION : column is hardcoded, do not insert or delete columns
 * CAUTION : sheet is hard-coded, do not rename the sheet
 * @return : none
 */
function onEdit(e) {
  // in case of multiple selection, e.value is undefined
  var shObj = e.range.getSheet();
  var sh = shObj.getName();

  if(sh != 'Souchier Ceva Biovac') { return; }
  if( e.value === undefined) { return; } // multi-cell range
  const col = e.range.getColumn();
  
  // column validation checked
  if(e.range.getValue() && (col === COL_VALID)) {
     writeUserStamp(e);
  } else
    
   // column archivage checked
  if(e.range.getValue() && (col === COL_ARCH)) {
     writeUserStamp(e);
  } else
    
   // column Atik checked
  if(e.range.getValue() && (col === COL_ATIK)) {
     writeUserStamp(e);
  } else
  
   // column Desvac checked
  if(e.range.getValue() && (col === COL_DESV)) {
     writeUserStamp(e);
  } else
    
  // column destruction checked
  if(e.range.getValue() && (col === COL_DESTR)) {
    if(deleteEmplacement(e)) {
      writeUserStamp(e);
    }
  }else if(!e.range.getValue() && (col === COL_DESTR)) {
  // column destruction unchecked
    SpreadsheetApp.getUi().alert("La destruction est irréversible!");
    e.range.setValue(true);
  } 
}


/**
 *  write the e-mail of the user account and the date in the 2 columns at the right of the current celll
 */
function writeUserStamp(e) {
  var email, dateText;
  if(e.range.getValue()) {
    email = Session.getActiveUser().getEmail();
    email = email == "" ? "utilisateur inconnu" : email;  // when user is not part of the organisation, e-mail is not available
    dateText = Utilities.formatDate(new Date(), "CET", "dd-MM-yyyy");
  }else {
    email = dateText = "";
  }
  e.range.offset(0,2).setValue(email);
  e.range.offset(0,1).setValue(dateText);  
}


/**
 * will set free the emplacement, write date and user account,
 */
function deleteEmplacement(e) {
  var ligne = e.range.getRow();
  var sh = e.range.getSheet();
  var ms = sh.getRange(ligne, COL_MS).getValue();
  var ws = sh.getRange(ligne, COL_WS).getValue();
  var souche = sh.getRange(ligne, COL_SOUCH).getValue();
  var ui = SpreadsheetApp.getUi();
  var deleted = (ms + " " + ws).match(/(C\d+ E\d+ R\d+ P\d+ [A-Z]\d+)/gi) || [];
  var msg;
  if(deleted.length < 1){
     msg = "destruction - pas d'emplacement à libérer";
  } else {
    msg = " destruction - liberation de MS " + ms + " et WS " + ws + "\n";
  }
    
  conf.update();
  var message = "Etes-vous sur de vouloir détruire la souche <" + souche + ">?" + "\n";
  message += "Les emplacements MS " + ms + " et WS " + ws + " seront libérés définitivement à la prochaine mise à jour des emplacements\n";
  message += "Cette action est irréversible";
  var response = ui.alert(message, ui.ButtonSet.YES_NO);

  if (response == ui.Button.YES) {
      // erase emplacement columns
    sh.getRange(ligne, COL_MS).setValue("");
    sh.getRange(ligne, COL_WS).setValue("");
    // clear the sequencer for each etagere impacted by this deletion
    //alert(len(decodeListe(deleted)));
    decodeListe(deleted).forEach(function(emp){
      sequencer.clear(sequencer.get_job_index_for(emp.congelateur,emp.etagere));}
    );      
    // write log
    //logMsg(msg, sh, ligne);
    return true;
  } else { // user said NO
    //e.value = false;
    e.range.setValue(false); // we abort 
  } // end if(response==
  return false;
}


function get_suspected(list1, list2) {
  var lst_code1 = list1 && list1.match(/(C\d+ E\d+ R\d+ P\d+ [A-Z]\d+)/g) || [];
  var lst_code2 = list2 && list2.match(/(C\d+ E\d+ R\d+ P\d+ [A-Z]\d+)/g) || [];
  return decodeListe(lst_code1.concat(lst_code2));
}



function logMsg(msg, sh, ligne) {
   var dateText = Utilities.formatDate(new Date(), "GMT", "dd-MM-yyyy");
   var log = sh.getRange(ligne, COL_LOG);
   log.setValue(dateText + " - " + msg + log.getValue());   
}
 

/**
 * Decode the emplacement in the form of C2 E3 R2 P1 A34 into an object with
 * corresponding numeric value  for congelateur, etagere, ... property
 * @param {String} emplacement : 
 * @return {<Object>}  'emplacement' object with numeric value of each localisation components
 */
function decodeEmplacement(emplacement){
  const empl = {};
  const result = emplacement && /C(\d+) E(\d+) R(\d+) P(\d+) ([A-Z])(\d+)/.exec(emplacement); // no need to slice, we look beginning at 1
  if(!result) {throw ("Impossible de décoder l'emplacement " + emplacement); }
  empl.congelateur = Number(result[1]);
  empl.etagere = Number(result[2]);
  empl.rack = Number(result[3]);
  empl.plateau = Number(result[4]);
  empl.colonne = Number(result[5].charCodeAt(0)-64);
  empl.ligne = Number(result[6]);
  return empl;  
}


/**
* return the string representation of an  emplacements object
*/
function codeEmplacement(empl) {
  var code = "C" + empl.congelateur + " E" + empl.etagere;
  code += " R" + empl.rack + " P" + empl.plateau + " ";
  code += String.fromCharCode(empl.colonne + 64) + empl.ligne;
  return code;
}


/**
 * decode an array of emplacement as string into a list of emplacements object
 */
function decodeListe(listeStrEmplacement){
  return listeStrEmplacement.map(decodeEmplacement);
}


/**
 * decode an array of emplacements object into a string of emplacement representation separated by space
 */
function codeListe(listObjEmpl) {
  return listObjEmpl.map(codeEmplacement).join(' ');
}


/**
 * Launch a full update by reinitialising the sequencer
 * update is done etagere by etagere, scripts are running on time based trigger one after the another
 * the sheet <SEQUENCER> show the status
*/
function fullUpdate() {
  sequencer.init();
}
 
/*
 * Any line of the sequencer in RUNNING wich job is expired is reinitialised, 
 * then all not FINISHED étagères  are updated
*/
function continuousUpdate() {
  sequencer.removeRunning();
  sequencer.launch_next();  
}


/**
 * Update the emplacements of two etageres from one freezer
 * the two etageres are cleraed before updating
 * @param {int} cong 
 * @param {int} de_etag  starting from this etagere
 * @param {int} a_etag to this etagere (if same as de_etag, only one etagere handled)
 */
function init_two_etag(cong, de_etag, a_etag) {
  // Get data from souchier
  var data = SpreadsheetApp.getActiveSpreadsheet()
  .getSheetByName('Souchier Ceva Biovac')
  .getDataRange()
  .getValues(); 

  // get freezer data
  conf.update();  
  var targetRange = conf.getRangeForEtagere(cong, de_etag, a_etag);
  var etagFirstLine = conf.getLineForEtagere(cong, de_etag);
  targetRange.activate();
  conf.sheetEmplCong.getActiveRangeList().clear({contentsOnly: true, skipFilteredRows: false});
  var target = targetRange.getValues();
  var row, ms, ws, emplacements, emplacements_ms, emplacements_ws, status = 0;
  
  for(var l = 1; l < data.length; l++) {
    try{
      row = data[l];
      ms = row[COL_MS - 1];
      ws = row[COL_WS - 1];
      emplacements_ms = ms && ms.match(/(C\d+ E\d+ R\d+ P\d+ [A-Z]\d+)/g) || [];
      emplacements_ws = ws && ws.match(/(C\d+ E\d+ R\d+ P\d+ [A-Z]\d+)/g) || [];
      emplacements = decodeListe(emplacements_ms.concat(emplacements_ws));
      
      for (var e=0; e < emplacements.length; e++) {
        if(emplacements[e].congelateur != cong ||
          emplacements[e].etagere < de_etag || emplacements[e].etagere > a_etag) 
          { continue }
        var ligne = conf.getLineForFreezer(emplacements[e]) - etagFirstLine;  //because first line is row 2, index 0 in array
        if(target[ligne][COL_OCCUPATION - 7] == OCCUPE ) { // conflict detected
            target[ligne][COL_SIAM -7 + 2] += " Interference avec CL n°" + row[2];        
        }else{ // no conflict, write souche data
          target[ligne][COL_OCCUPATION - 7] = OCCUPE;
          target[ligne][COL_SIAM - 7] = row[3];
          target[ligne][COL_FM - 7] = row[2];
          target[ligne][COL_CLIENT - 7] = row[4];
        } //end if
      } //end for emplacements
    }catch(error){ // we add line number to error message
        throw "Ligne " + (l+1).toString() + " erreur : " + error;
    } 
  } // enfor for data.length
  targetRange.setValues(target);
}
