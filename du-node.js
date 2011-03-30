var util   = require('util'),
    spawn = require('child_process').spawn;

var express = require('express');
var app = express.createServer();

app.configure(function (){
  // user express to serve up static files (HTML, CSS, JS)
  app.use(express.staticProvider(__dirname + '/public'));
});

// also create a 'route' for the JSON service at /du
app.get('/du', function(req, res){

  // get query parameters
  var levels = req.query['levels'];
  var dir = req.query['dir'];
 
  // spawn the du command (actually a shell script to allow for piping if needed etc 
  var du = spawn('sh', ['dus.sh', ''+levels, ''+dir]);

  var duResult = "";
  
  // store the result of du in a tree structure
  var tree = {}

  // JIT needs the children nodes in a children:[]
  tree.children = new Array();

  // recursive function to locate where in the tree a single line from du goes
  tree.insertPath = function (treePart, pathPart, size,fullPath){
    var index;
    var found = -1;
    for (index = 0; index < treePart.children.length; index++){
      if (treePart.children[index] != null){
        //util.print("ID: "+treePart.children[index].id+"\n");
        if (treePart.children[index].id == pathPart[0].toString()){
          found = index;
          if (pathPart.length < 2){
            // full path done
            //util.print("< 2: "+pathPart+"\n");
            treePart.children[index].size = (size*1)+1;
            treePart.children[index].name=fullPath;
            treePart.children[index].fullPath=fullPath;
          }
          else {
            //util.print("GT 2: "+pathPart+"\n");
            if (treePart.children[index].children == null)treePart.children[index].children = new Array();
            //util.print("TREE: "+ treePart.children[index].id+"\n");
            tree.insertPath(treePart.children[index], pathPart.slice(1), size, fullPath);
          }   
        }
      }	
    }
    if (found == -1){
     // util.print("PATHPART:"+pathPart+"\n");
      var elem = treePart.children.push({children:[],id:pathPart[0].toString(),size:1});
      tree.insertPath(treePart, pathPart, size,fullPath);
    }

  }; 

  
  // Nice Node.JS stuff here
  // asynch read and write to stdin/stdout/stderr

  du.stdout.on('data', function (data) {
    //util.print('STDOUT: ' + data.toString());
    duResult += ''+data.toString().replace('\n','\t');  

  });

  du.stderr.on('data', function (data) {
   util.print('stderr: ' + data);
  });


  // once du is done we can return the data
  du.on('exit', function (code) {
    console.log('child process exited with code ' + code);
    // parse the full du result
    var duResults = duResult.toString().replace(/\n/gi,'\t').split('\t');
    var index;
    tree.id = dir;

    // actually do the insert into the tree data structure
    for(index = 0; index < duResults.length-1; index++){
      var size = duResults[index].toString();
      var path = duResults[index+1].toString();
      
      if (path == dir){
	//tree.id = path;
        tree.size = size;
      }
      else
      {
        var fullPath = path.split('/');
	fullPath = fullPath.slice(1);
 //util.print("Path to be inserted: "+path+";"+fullPath+"\n");
        if (dir != "/") fullPath = path.replace(dir,'').split('/').slice(1);
         
        tree.insertPath(tree, fullPath, size,path);        
      }
      index++;	
    }
    
   
    // sort the tree so that JIT displays it in a sane way
    tree.sortFunc = function(a,b){
         return a.size - b.size;
      }
      
      tree.doSort = function(treePart){
         if(treePart.children.length > 0){
           treePart.children.sort(tree.sortFunc);
	   var index = 0;
           for(index = 0; index < treePart.children.length; index++){
             tree.doSort(treePart.children[index]); 
           }
         }
      }

    tree.doSort(tree);


    // actually return the result as stringified JSON

    //util.print(JSON.stringify(tree));
    res.writeHead(200, {'Content-Type': 'application/json','Content-Length':JSON.stringify(tree).length});
    res.end(JSON.stringify(tree));
    
     

  });

});


// start the server
app.listen(3000,'127.0.0.1');




