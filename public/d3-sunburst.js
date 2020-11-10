var currDir = "";
var maxDepth = 2;
var sb;

function init(){
  //if (navigator.userAgent.indexOf('Macintosh') == -1) {
    // assume linux
    //getJson(sb,'/home',maxDepth);
  //} else {
    // assume mac
    getJson(sb,'/Users',maxDepth);
  //}
}


function getJson(sb,dir,levels) {
  currDir = dir;
  $('#upBtn').attr('disabled', 'disabled');
   
  
  // make the AJAX get request for the JSON-formatted du data
  $.ajax({
    url: 'http://localhost:3002/du?dir='+dir+'&levels='+levels,
    dataType: 'json',
    success: function(data, textStatus, xml){
      $('#upBtn').removeAttr('disabled');
      $('#upBtn').text('Go up to ');
      $('#upBtn').text('At '+ currDir +'; Go back up to ' + getParent(currDir));
      console.log(data);

      var margin = {top: 10, right: 10, bottom: 10, left: 10},
      width = $('#infovis').parent().width() - margin.left - margin.right,
          height =  $('#infovis').parent().height() - margin.top - margin.bottom,
          radius = Math.min(width, height) / 2,
    color = d3.scale.category20c();
d3.selectAll("svg").remove(); 
      var vis = d3.select("#infovis").append("svg:svg")
    .attr("width", width)
    .attr("height", height)
  .append("svg:g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
 
var partition = d3.layout.partition()
    .sort(null)
    .size([2 * Math.PI, radius * radius])
    //.children(function(d) { return isNaN(d.value) ? d.value : null; })
    //.children(function(d) { console.log(d.value);return isNaN(d.value) ? d3.entries(d.value) : null; })
    .value(function(d) { return d.value; });
 
var arc = d3.svg.arc()
    .startAngle(function(d) { return d.x; })
    .endAngle(function(d) { return d.x + d.dx; })
    .innerRadius(function(d) { return Math.sqrt(d.y); })
    .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });
 
 

  vis.data([data]).selectAll("path")
      .data(partition)
    .enter().append("svg:path")
      .attr("display", function(d) { return d.depth ? null : "none"; }) // hide inner ring
      .attr("d", arc)
      .attr("stroke", "#fff")
      .attr("fill", function(d) { return color((d.x + d.dx / 2 - Math.PI / 2) / Math.PI * 180); })
      .on("click", click)
      .on("mouseover", mouseover)

      .attr("fill-rule", "evenodd");
  
/* vis.data([data]).selectAll("text.node")
      .data(partition)
    .enter().append("svg:text")
    .attr("transform", function(d) { return "rotate(" + (d.x + d.dx / 2 - Math.PI / 2) / Math.PI * 180 + ")"; })
      .attr("x", function(d) { return Math.sqrt(d.y)/2; })
      .attr("dx", "6") // margin
      .attr("dy", ".35em") // vertical-align
      .attr("display", function(d) { return d.depth > 2 || d.dx < 0.1 ? "none": null; })
      .text(function(d) { return d.fullPath; }); */

 function click(d) {
    getJson(sb, d.fullPath, levels);
  }

  function mouseover(d) {
    console.log(d.fullPath);
    $("#inner-details").empty();
    var html = "<b>Se:</b>" + d.fullPath; 
           
    if("value" in d) {
      console.log("value");
      console.log((d.x + d.dx / 2 - Math.PI / 2) / Math.PI * 180);
      console.log("");

      html += "<br /><b>File size:</b> " + Math.round(d.value / 1024) + " MB";
    }
    $("#inner-details").append(html);
    //$("#inner-details").animate({left:width*Math.cos(((d.x + d.dx / 2 - Math.PI / 2) / Math.PI * 180)/360 * (2*Math.PI)), top:1 }, 50);
  
    
  }

  }});

  
}

function getParent(theCurrDir){
  var lastDirIndex = theCurrDir.lastIndexOf("/");
        if (lastDirIndex > 0) return theCurrDir.slice(0,lastDirIndex);
  else return '/';
}

function goUp(sb){
   var upDir = getParent(currDir);
   getJson(sb,upDir,maxDepth);   
}

function changeMaxDepth(newMaxDepth){
  if (newMaxDepth > 3 || newMaxDepth < 2) return; 
  maxDepth = newMaxDepth;
  if (maxDepth == 3){
    $('#twoBtn').removeAttr('disabled');
    $('#threeBtn').attr('disabled','disabled');
  }
  else if (maxDepth == 2){
    $('#twoBtn').attr('disabled','disabled');
    $('#threeBtn').removeAttr('disabled');
  }
  //alert(maxDepth);
}