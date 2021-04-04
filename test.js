function check(){
  Logger.log("test getLineForFreezer");  
  conf.update();

  if( conf.getLineForFreezer(decodeEmplacement("C1 E1 R1 P1 A1")) != 2){
    Logger.log("C1 E1 R1 P1 A1 != 2");
  }

  if(codeEmplacement(decodeEmplacement("C1 E1 R1 P1 A1")) != "C1 E1 R1 P1 A1") {
     Logger.log("decodage incorrect");
  }
              
  Logger.log("fin test getLineForFreezer");
}

function test_auto_trigger() {
  var compteur = getSheet('SCRIPT').getRange("A1");
  var compte = compteur.getValue();
  if(compte > 0){
    compteur.setValue(compte - 1);
    toast("execution " + compte);
    ScriptApp.newTrigger('test_auto_trigger')
    .timeBased()
    .after(2000)
    .create();
  }
  else{
      toast("execution terminée");
  }
}

function test_para(){
     ScriptApp.newTrigger('init_C1E1')
    .timeBased()
    .after(200)
    .create();
  
    ScriptApp.newTrigger('init_C1E2')
    .timeBased()
    .after(300000)
    .create();
  
      ScriptApp.newTrigger('init_C1E3')
    .timeBased()
    .after(600000)
    .create();
}

function test_découpe() {
  conf.update();
  var target = conf.sheetEmplCong;
  maj_tranche(2, 1002, target);
}

function setD() {
  getSheet('SCRIPT').getRange("C2").setValue(new Date());
}

function test_seq(){
  //alert(sequencer.get_script_index());
  //alert(sequencer._COL_STATUS);
  //alert(sequencer.get_parameters().congelateur);
    //alert(sequencer.get_parameters().etagere);
  //alert(sequencer.get_parameters().index_script);
  parameters = sequencer.get_parameters();
  init_etag(parameters.congelateur, parameters.etagere); 
  //sequencer.launch_next();
}

function test_etag() {
  conf.update();
  //alert(conf.getRangeForEtagere(1,1, 2).getA1Notation());
  //sequencer.removeRunning();
//  init_etag(1,2);
  //var l = sequencer.get_job_index_for(1, 4);
  //alert(l);
  //sequencer.clear(4);
  sequencer.removeRunning();
 // init_two_etag(1,1);
  //alert(sequencer.get_next_index(5));
  
}

function testTRig(){
  var allTriggers = ScriptApp.getProjectTriggers();
  alert(allTriggers.length);
}