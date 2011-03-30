var labelType, useGradients, nativeTextSupport, animate;

// From the Sunburst Example

(function() {
  var ua = navigator.userAgent,
      iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i),
      typeOfCanvas = typeof HTMLCanvasElement,
      nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'),
      textSupport = nativeCanvasSupport 
        && (typeof document.createElement('canvas').getContext('2d').fillText == 'function');
  //I'm setting this based on the fact that ExCanvas provides text support for IE
  //and that as of today iPhone/iPad current text support is lame
  labelType = (!nativeCanvasSupport || (textSupport && !iStuff))? 'Native' : 'HTML';
  nativeTextSupport = labelType == 'Native';
  useGradients = nativeCanvasSupport;
  animate = !(iStuff || !nativeCanvasSupport);
})();

var Log = {
  elem: false,
  write: function(text){
    if (!this.elem) 
      this.elem = document.getElementById('log');
    this.elem.innerHTML = text;
    this.elem.style.left = (500 - this.elem.offsetWidth / 2) + 'px';
  }
};

var currDir = "";
var maxDepth = 2;
var sb;
function init() {

    //init Sunburst
     sb = new $jit.Sunburst({
        //id container for the visualization
        injectInto: 'infovis',
        //Distance between levels
        levelDistance: 60,
        //Change node and edge styles such as
        //color, width and dimensions.

        Node: {
          overridable: true,
          type: useGradients? 'gradient-multipie' : 'multipie' , lineWidth: 4

        },
        //Select canvas labels
        //'HTML', 'SVG' and 'Native' are possible options
        Label: {
          type: labelType
        },
        //Change styles when hovering and clicking nodes
        NodeStyles: {
          enable: true,
          type: 'Native',
          stylesClick: {
            'color': '#33dddd'
          }
        },
        //Add tooltips
        Tips: {
          enable: true,
          type: 'Native',
          onShow: function(tip, node) {
            var html = "<div class=\"tip-title\">" + node.id + "</div>"; 
            var data = node.data;
            if("fullPath" in data) {
              html += "<b>Path:</b> " + data.fullPath + "";
            }
            if("size" in data) {
              html += "<br /><b>File size:</b> " + Math.round(data.size / 1024) + "MB";
            }
            tip.innerHTML = html;
          }
        },
        //implement event handlers
        Events: {
          enable: true,
          //enableForEdges: true,
          type: 'Native',
          onClick: function(node) {
            if(!node) return;

            //Build detailed information about the file/folder
            //and place it in the right column.
            writeDetails(node.data);
	    ndata = node.data;
            getJson(sb,ndata.fullPath,maxDepth);
        
          },
          onMouseEnter: function(node) {
            if (node.id == '/') alert("ENTER");
          }

        },
        // Only used when Label type is 'HTML' or 'SVG'
        // Add text to the labels. 
        // This method is only triggered on label creation
        onCreateLabel: function(domElement, node){
          var labels = sb.config.Label.type,
              aw = node.getData('angularWidth');
          if (labels === 'HTML' && (node._depth < 2 || aw > 2000)) {
            domElement.innerHTML = node.name;
          } else if (labels === 'SVG' && (node._depth < 2 || aw > 2000)) {
            domElement.firstChild.appendChild(document.createTextNode(node.name));
          }
        },
        // Only used when Label type is 'HTML' or 'SVG'
        // Change node styles when labels are placed
        // or moved.
        onPlaceLabel: function(domElement, node){
          var labels = sb.config.Label.type;
          if (labels === 'SVG') {
            var fch = domElement.firstChild;
            var style = fch.style;
            style.display = '';
            style.cursor = 'pointer';
            style.fontSize = "0.8em";
            fch.setAttribute('fill', "#fff");
          } else if (labels === 'HTML') {
            var style = domElement.style;
            style.display = '';
            style.cursor = 'pointer';
            style.fontSize = "0.8em";
            style.color = "#ddd";
            var left = parseInt(style.left);
            var w = domElement.offsetWidth;
            style.left = (left - w / 2) + 'px';
          }
        }
   });

  getJson(sb,'/home',maxDepth);
   
  }  

// Write the full path and size to the page
function writeDetails(data){

	    //var data = node.data;
            
            var html = "<h4>PATH:" + data.fullPath + "</h4>"; 
           
            if("size" in data) {
              html += "<br /><b>File size:</b> " + Math.round(data.size / 1024) + "MB";
            }
           $jit.id('inner-details').innerHTML = html;


}


// Handle pressing the up button
function goUp(sb){
   
   var upDir = getParent(currDir);
   getJson(sb,upDir,maxDepth);
   
}

function changeMaxDepth(newMaxDepth){
  if (newMaxDepth > 3 || newMaxDepth < 2) return; 
  maxDepth = newMaxDepth;
  if (maxDepth == 3){
    document.getElementById('twoBtn').disabled = false;
    document.getElementById('threeBtn').disabled = true;
  }
  else if (maxDepth == 2){
    document.getElementById('twoBtn').disabled = true;
    document.getElementById('threeBtn').disabled = false;
  }
  //alert(maxDepth);
}

function getParent(theCurrDir){

	var lastDirIndex = theCurrDir.lastIndexOf("/");
        if (lastDirIndex > 0) return theCurrDir.slice(0,lastDirIndex);
	else return '/';
}


// Get JSON data from the server for the current directory, down a number of levels in the tree

function getJson(sb,dir,levels) {
  currDir = dir;
  document.getElementById('upBtn').disabled = true;
  document.getElementById('upBtn').innerHTML = "Go up to " + getParent(currDir); 
  
  // make the AJAX get request for the JSON-formatted du data
  $.ajax({
    url: 'http://127.0.0.1:3000/du?dir='+dir+'&levels='+levels,
    dataType: 'json',
    success: function(data, textStatus, xml){
  document.getElementById('upBtn').disabled = false;

  // Recurse through the JSON and modify the data to match the JIT input format
  data.modify = function(dataz){
      var index = 0;
      var acc = dataz.acc;
      for (index = 0; index < dataz.children.length; index++){
        // set the RGB of the node - rotate through R, G and B
        dataz.children[index].acc = acc;
        var rot = (acc/data.size)*360;
	var red = 0, green = 0, blue = 0;
        if (rot < 120){
		red = (-15/120)*rot + 15;
		green = 0;
		blue = (15/120)*rot;
        }
        else if (120 <= rot && rot < 240){
		red = 0;
		green = (15/120)*rot - 15;
		blue = (-15/120)*rot + 30;
	}
	else {
		red = (15/120)*rot - 30;
		green = (-15/120)*rot + 45;
		blue = 0;
	}    
        // convert these numbers to a HEX character
        var redc = Math.floor(red).toString(16);
        var greenc = Math.floor(green).toString(16);
        var bluec =   Math.floor(blue).toString(16);

	// add the JIT structure into the current element
        dataz.children[index].data = {'$angularWidth': dataz.children[index].size, 'size':dataz.children[index].size, '$color':'#'+redc+greenc+bluec, 'fullPath':dataz.children[index].fullPath};
	
	// if it is a small node make the name an empty string - avoids badness
        if((dataz.children[index].size/data.size) < 0.1) dataz.children[index].name = '';
       // dataz.children.rads = rads;
        
        if (dataz.children[index].children != null) {
          data.modify(dataz.children[index]);
        }
 	acc+=dataz.children[index].size;
      }
    }

    data.acc = 0;
    data.modify(data);

    data.data = {};
    data.data.size = data.size;
    data.data.fullPath = data.id; 
    writeDetails(data.data);
    data.name='';
    //load modified JSON data into the Sunburst
    sb.loadJSON(data);
    //compute positions and plot.
    sb.refresh();
  }
})}
