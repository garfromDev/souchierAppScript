/*
Concept
fonction initialisation met à zéro le tableau et lance le 1er script

un script est exécuté, à la fin il demande au séquenceur de lancer le suivant

le suivant est  la prochaine ligne avec statut vide
le séquenceur écrit la date de démarrage, le statut 'RUNNING' et crée un déclencheur pour le script

Pour chaque congélateur, pour chaque étagère, on déclenche le script en lui passant le condélateur et l'etagere en paramètres

*/


/**
 * This object allow the sequencing of scripts execution based on sheet _seqSheet
*/
var sequencer = {
  // configuration of the sheet that will control the sequencer 
  _seqSheet: getSheet('SEQUENCER'), 
  _COL_CONG: 2,
  _COL_ETAG: 3,
  _COL_STATUS: 4,
  _COL_START: 5,
  _COL_END: 6,
  _COL_ID: 7,
  _COL_ID_TO_DEL: 8,
  _SEQ_MAX_LINE: 100,
 
  init : function(){
    var sh = this._seqSheet;
    sh.getRange("D2:H" + this._SEQ_MAX_LINE.toString()).activate();
    sh.getActiveRangeList().clear({contentsOnly: true, skipFilteredRows: false});
    this.launch_next();
  },
  
  
  launch_next : function(){
    var index = this.get_script_index();
    if(index){ //there is still job to launch
      previous_trigger = this._seqSheet.getRange(index, this._COL_ID_TO_DEL).getValue();
      deleteTrigger(previous_trigger);
      var id = ScriptApp.newTrigger('update_chunk')
      .timeBased()
      .after(1000)
      .create()
      .getUniqueId();      
      this.set_id(index, id);  // record the job id in the sequencer
      this.set_id_to_delete(index, id);
    }
  },
    
  
  signal_started: function(index_script){
    this._seqSheet.getRange(index_script, this._COL_STATUS).setValue('RUNNING');
    this._seqSheet.getRange(index_script, this._COL_START).setValue(new Date());
  },
  
  signal_ended: function(index_script) {
    this._seqSheet.getRange(index_script, this._COL_STATUS).setValue('DONE');
    this._seqSheet.getRange(index_script, this._COL_END).setValue(new Date());
  },
  
  get_script_index: function(){
    var index = getFirstEmptyRow(this._seqSheet.getRange(2, this._COL_STATUS, 100, 1)) + 1; //because 1 header row
    if(this._seqSheet.getRange(index,1).getValue() != "") {
      return index;
    }
    return false;
  },
    
  get_next_index: function(index){
    return getFirstEmptyRow(this._seqSheet.getRange(index + 1, this._COL_STATUS, 100 - index, 1)) + index; 
  },
    
  /**
   * the parameters are the congelateur and the etageres in the form 1, 2 meaning from etagere 1 to 2
   * if one etagere, '3,3' or 3 is valid
   *  throws if invalid etagere definition (but does not check if etagere exists or if order is respected)
   */
  get_parameters: function(){
    var sh = this._seqSheet;
    var index_script = this.get_script_index();
    if(!index_script) { }
    var congelateur = sh.getRange(index_script, this._COL_CONG).getValue(); 
    var etageres = sh.getRange(index_script, this._COL_ETAG).getValue().toString().split('-');
    if(!etageres || etageres.length > 2){
      throw "De 1 à 2 etageres par congelateur et par job";
    }
    var etag1 = parseInt(etageres[0]);
    var etag2 = etageres.length > 1 ? parseInt(etageres[1]) : etag1;
    if(isNaN(etag1) || isNaN(etag2)){
      throw "etagere invalide : " + etag1 + "  " + etag2;
    } 
    return { 'congelateur': congelateur, 'de_etagere': etag1, 'a_etagere': etag2, 'index_script': index_script, 'id': this.get_id(index_script)}
  },
   
  removeRunning: function(){
    var sh = this._seqSheet;
    for(l=2; l<=100; l++){
      if(this.get_status(l) == 'RUNNING' || this.get_status(l) == 'ERROR'){ 
        // le job a expiré
        this.clear(l);  // will allow the job to be launched again
      }
    }
  }, 

  /**
   * @throws if no job found matching  etagere and cong
   * @param {int} cong 
   * @param {int} etag 
   */  
  get_job_index_for: function(cong, etag){
    var sh = this._seqSheet;
    var l = 2;
    var inRange = function (etag, range) {
      const etags = range.split('-');
      const min_e = parseInt(etags[0]);
      const max_e = parseInt(etags.pop());
      return etag >= min_e && etag <= max_e;
    } 
    while( cong != sh.getRange(l, this._COL_CONG).getValue() ||
          !inRange(etag, sh.getRange(l, this._COL_ETAG).getValue().toString())
          && l <= this._SEQ_MAX_LINE ){
        l++;
      }
    if(l > this._SEQ_MAX_LINE){
      throw "Couple congelateur / etagere invalide - cong : " + cong + "  etag : " + etag;
    }  
    return l;
  },  
    
  clear: function(index){
    this.set_status(index, "");
    this.set_id(index, "");
  },
  
  get_id: function(index){
    return this._seqSheet.getRange(index, this._COL_ID).getValue();
  },
    
  set_id: function(index, id){
    this._seqSheet.getRange(index, this._COL_ID).setValue(id);
  },
  
  set_id_to_delete: function(index, id){
    var next_index = this.get_next_index(index);
    if( next_index > 0){
      this._seqSheet.getRange(next_index, this._COL_ID_TO_DEL).setValue(id);
    }
  },
  
  get_status: function(index){
     return this._seqSheet.getRange(index, this._COL_STATUS).getValue();
  },
  
  set_status: function(index, status){
    this._seqSheet.getRange(index, this._COL_STATUS).setValue(status);
  },

  _log_error: function(err, index){
    if(index == undefined){ index = this.get_script_index();}
    this._seqSheet.getRange(index, this._COL_STATUS).setValue('ERROR');
    this._seqSheet.getRange(index, this._COL_ID).setValue(err);
  } 
  
} //end of sequencer object definition



function update_chunk() {
  try{
    var parameters = sequencer.get_parameters();
  }catch(error){
    sequencer._log_error(error);
    sequencer.launch_next();
    return;
  }
  sequencer.signal_started(parameters.index_script);
  try{
    init_two_etag(parameters.congelateur, parameters.de_etagere, parameters.a_etagere); 
  } 
  catch(error){
    sequencer._log_error(error, parameters.index_script); 
    sequencer.launch_next();
    return;
  }
  sequencer.signal_ended(parameters.index_script);
  sequencer.launch_next();
}
