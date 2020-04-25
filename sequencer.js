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
  // delay after with a job result is considered as obsolete : in ms, we choose 24 hours
  _OBSOLETE: 1000 * 60 * 60 * 24,
 
  init : function(){
    var sh = this._seqSheet;
    sh.getRange("D2:H100").activate();
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
    
  get_parameters: function(){
    var sh = this._seqSheet;
    var index_script = this.get_script_index();
    if(!index_script) { }
    var congelateur = sh.getRange(index_script, this._COL_CONG).getValue(); 
    var etagere = sh.getRange(index_script, this._COL_ETAG).getValue();
    return { 'congelateur': congelateur, 'etagere': etagere, 'index_script': index_script, 'id': this.get_id(index_script)}
  },
   
  removeRunning: function(){
    for(l=2; l<=100; l++){
      if(this.get_status(l) == 'RUNNING'){ 
        // le job a expiré
        this.clear(l);  // will allow the job to be launched again
      }
    }
  }, 
  
  removeObsolete: function(){
    var today = new Date();
    for(l=2; l<=100; l++){
      if(today - this.get_end_date(l) > this._OBSOLETE ){ 
        // le job est obsolète
        this.clear(l);  // will allow the job to be launched again
      }
    }    
  },
    
  get_job_index_for: function(cong, etag){
    var sh = this._seqSheet;
    var l = 2;
    etag = etag - 1 + etag % 2  // 1->1, 2->1, 3->3, 4->3  
    while( cong != sh.getRange(l, this._COL_CONG).getValue() ||
          etag != sh.getRange(l, this._COL_ETAG).getValue()){
        l++;
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
  
  get_end_date: function(index) {
    return this._seqSheet.getRange(index, this._COL_END).getValue();
  }
  
  
  
} //end of sequencer object definition



function update_chunk() {
  var parameters = sequencer.get_parameters();
  sequencer.signal_started(parameters.index_script)
  init_two_etag(parameters.congelateur, parameters.etagere); 
  sequencer.signal_ended(parameters.index_script);
  sequencer.launch_next();
}
