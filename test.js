

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