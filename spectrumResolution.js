
function names1(n) { //returns the names of the HPGe detectors as an array 

	var node=document.getElementsByClassName('unhidden')[n]; 
	return node.innerHTML;

};

var	getValues1=(function (j) { // calls the addSpectrum2() function to get and process data
return function(j) {return addSpectrum2(NAME[j],j);} }  ) ();		

function table(peak1,peak2) { // creates a table with headers containing desired peak info

	var x=document.getElementById("peak1");
	x.innerHTML="Resolution of " +peak1+" peak [keV]"

	var h=document.getElementById("peak2");
	h.innerHTML="Resolution of " +peak2+" peak [keV]"

}


function resolveAll () { // Function that gets data, calculates the resolution and stores the values in a table

	NAME=new Array(channels+1); //get the names to put in the table

	for(var n=0;n<=channels;n=n+1) 
	{	NAME[n]=names(n);}
	NAME[channels]='GRG16WN00A_Energy';

	var body = document.getElementById("canvasWrapCalibration"); // create necessary HTML elements for the table

	var tbl = document.createElement("table");
	tbl.id="tableId";
	var tblBody = document.createElement("tbody");
	tblBody.id="bodyId";	

	z=new Array(channels); // array to store energy resolution values

	for (var i = 0,j = 20; i <=channels+2; i++, j=j+60) { // Call the getValues1() function to get the values for the table
  window.setTimeout(function() {
      z[this]=JSON.parse(getValues1(this));
  }.bind(i), j);
	}


setTimeout( function() {

	for (var j = 0; j <channels; j++) {

			var y=document.getElementById("res"+j); // Puts the resolution values in the appropriate row in the table
			y.innerHTML=z[j+2][0];
		
			var q=document.getElementById("RES"+j);
			q.innerHTML=z[j+2][1];

}

 
},3950);

}


function resolveAllPlot () { // Returns the values of the resolution to be used as information for the dygraph

	NAME=new Array(channels+1); //get the names to put in the table

	for(var n=0;n<=channels;n=n+1) 
	{	NAME[n]=names(n);}

	z=new Array(channels); // array to store energy resolution values

	for (var i = 0,j = 20; i <=channels+1; i++, j=j+60) { // Call the getValues1() function to get the values for the table
  window.setTimeout(function() {
      z[this]=JSON.parse(getValues1(this));
  }.bind(i), j);
	}

return z;

}

function checkPeaks() { // Function to check for ill-defined peaks

for (var j=0;j<channels;j++) {

	var i=j+1;
	var x=document.getElementById('res'+j).innerHTML;
	var z=document.getElementById('res'+i).innerHTML;

	var y=document.getElementById('RES'+j).innerHTML;
	var q=document.getElementById('RES'+i).innerHTML;

		if (x == 'NaN'){   // If the resolution is NaN,peak is ill-defined

			document.getElementById('res'+j).style.backgroundColor= '#1F1F1F'; 
			document.getElementById('res'+j).innerHTML='Peak is ill-defined';	
		
			}

		if (y == 'NaN'){

			document.getElementById('RES'+j).style.backgroundColor= '#1F1F1F'; 
			document.getElementById('RES'+j).innerHTML='Peak is ill-defined';	

			}

} 

}


function createTable1() { // Function to create a table with 3 columns. Fills the first column with the names of HPGe detectors

	NAME=new Array(channels+1); //get the names to put in the table

	for(var n=0;n<=channels;n=n+1) 
	{	NAME[n]=names1(n);}
	//NAME[channels]=NAME[channels-1];


	var body = document.getElementById("canvasWrapCalibration"); // create necessary HTML elements

	var tbl = document.createElement("table");
	tbl.id="tableId1";
	var tblBody = document.createElement("tbody");
	tblBody.id="bodyId";	


	for (var j = -1; j <channels; j++) { 

		var row = document.createElement("tr");

			for (var i = 0; i <= 2; i++) { //number of columns
			
				if (j==-1 && i==0) {

				var cell = document.createElement("td");    
				var cellText = document.createTextNode("Spectrum Name"); 
				cell.appendChild(cellText);
				row.appendChild(cell);


				}			


				else if (j==-1 && i==1) { // first peak header cell

				var cell = document.createElement("td");    
				var cellText = document.createTextNode(""); 
				cell.setAttribute("id", "peak1")
				cell.appendChild(cellText);
				row.appendChild(cell);


				}

				else if (j==-1 && i==2) { // second peak header cell

				var cell = document.createElement("td");    
				var cellText = document.createTextNode(""); 
				cell.setAttribute("id", "peak2")
				cell.appendChild(cellText);
				row.appendChild(cell);


				}

				else if(i==1) {	// create cells to be filled with resolution of first peak
				var cell = document.createElement("td");  
				
				if (j%4==0) { 
				var cellText = document.createTextNode(""); 
				cell.style.backgroundColor='#5C5C5C'; // Colour the background of every fourth row 
				}  
				
				var cellText = document.createTextNode(""); 
				cell.setAttribute("id", "res" +j)
				
				cell.appendChild(cellText);
				row.appendChild(cell);
				}

				else if(i==2) { // create cells to be filled with resolution of second peak
				var cell = document.createElement("td");    
	
				if (j%4==0) { 
				var cellText = document.createTextNode(""); 
				cell.style.backgroundColor='#5C5C5C'; // Colour the background of every fourth row 
				}  

				var cellText = document.createTextNode(""); 

				cell.setAttribute("id", "RES" +j)
				
				cell.appendChild(cellText);
				row.appendChild(cell);
				}


				else if(i==0) {  //column of spectrum names
				var cell = document.createElement("td");   
				if (j%4==0) { 
				var cellText = document.createTextNode(NAME[j+1]);

				cell.style.backgroundColor='#5C5C5C'; // Colour the background of every fourth row 
				}
	
				else if(j==63) {
				cellText = document.createTextNode('GRG16WN00A_Energy'); 

				}				

				else {
				cellText = document.createTextNode(NAME[j+1]); 
				}
			
				cell.setAttribute("id", "Name" +j)
				cell.appendChild(cellText);
				row.appendChild(cell);
				
				}
}
	tblBody.appendChild(row); // Append all the information to the main div for display
}
	tbl.appendChild(tblBody);
	body.appendChild(tbl);
	document.getElementById('GRGeTITLE').click();
}





