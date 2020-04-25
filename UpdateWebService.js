var CELL_RESULT = "H1";

/**
This web service will answer to GET request with a 'result' key not empty
Souchier update has failed, with an empty dictionary if successful 
*/
function doGet(e) {
  var result = sequencer._seqSheet.getRange(CELL_RESULT).getValue();
  var msg = { }
  if(result){
    msg['result'] = result;
  }
  return ContentService.createTextOutput(JSON.stringify(msg))
    .setMimeType(ContentService.MimeType.JSON);
}
