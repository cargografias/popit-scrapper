var request = require('request');
var fs = require('fs');
var zlib = require('zlib');


var args = process.argv.slice(2);
if (args.length < 2){
  console.log('Oops....');
  console.log('Please specify the Database and entities');
  console.log('node scrapper.js DATABASE ENTITY COMPRESSED');
  console.log('Examples:');
  console.log('node scrapper.js cargografias all       //Generates all entities');
  console.log('node scrapper.js cargografias persons   //Generates just that file');
  process.exit(1);
}


var database = args[0];
var entity = args[1];
var entities = ['persons','posts','memberships','organizations'];
if (entity != 'all'){
  entities = [entity];
}

var gzipIt = false;
if (args.length === 3){
  var lastArg = args[2]; 
  if (lastArg.toLowerCase() === 'compressed'){
    gzipIt = true;
  }
  else{
      console.log('Oops....');
      console.log('We were not able to understand the last argument');
      console.log('Do you want to gzip the result? Add the compress keyword at the end');
      console.log('node scrapper.js DATABASE ENTITY COMPRESSED ');
      console.log('Examples:');
      console.log('node scrapper.js cargografias all compressed      //Generates all entities');
      console.log('node scrapper.js cargografias persons compressed  //Generates just that database');
      process.exit(1);
  }
}





var startRecursiveRequest = function(database,entity,target){
	console.log('starting : ', database , ' >> ',entity);
	var url = 'http://'+ database +'.popit.mysociety.org/api/v0.1/'+entity+'?per_page=200';
	doRecursiveRequest(url,entity,[]);
}
var doRecursiveRequest = function(url,entity,target){
	request(url, 
		function (error, response, body) {
		  if (!error && response.statusCode == 200) {
		    var APIResult = JSON.parse(body);
		    Array.prototype.push.apply(target,APIResult.result);
		    if (APIResult.has_more)
		    {
		    	console.log('Now on:',target.length,'- going to:', APIResult.next_url);
		    	doRecursiveRequest(APIResult.next_url,entity,target);
		    	
		    }
		    else {

		    	requestReady(entity, target);
		    }
		  }
      else {
        console.log('Oops....');
        console.log('We were not able to find information for DATABASE:' + database + "- ENTITY:" + entity);
        console.log('Please check that ' + database + ' has data on PopIt') ;
        process.exit(1);
      }
	});
}
var requestReady = function(entity, target){
  if (target.length === 0){
      console.log('Oops....');
      console.log('It seems that ' + entity + ' does not have any information');
      console.log('Please check that ' + database + ' has data on PopIt') ;
      process.exit(1);
  }
	var targetJSONString = JSON.stringify(target);

	var outputFilename = 'dumped/' + database + '-' + entity + '-popit-dump.json';
  if (gzipIt){
    zlib.gzip(targetJSONString, function (error, result) {
    if (error) throw error;
      fs.writeFile(outputFilename, result, function(err) {
          if(err) {
            console.log(err);
          } else {
            console.log("JSON saved to " + outputFilename);
          }
      }); 
    })    
  }
  else {
    fs.writeFile(outputFilename, targetJSONString, function(err) {
          if(err) {
            console.log(err);
          } else {
            console.log("JSON saved to " + outputFilename);
          }
      }); 
	}
}




for (var i = 0; i < entities.length; i++) {
	
	startRecursiveRequest(database,entities[i]);
};


