//get a list of available spectra, and populate the appropriate menu
function populateSpectra(){

	var script = document.createElement('script');

	//little bit of setup first
	//get the header font right
	document.getElementById('headerBanner').style.fontSize = parseInt(document.getElementById('branding').offsetHeight, 10)*0.9+'px';

	//get the body font right
	document.body.style.fontSize = window.innerHeight*0.05/4+'px';	

	//scale the canvas - 1D
	document.getElementById('spectrumCanvas').setAttribute('width', parseInt(document.getElementById('canvasWrap').offsetWidth, 10)*0.95+'px');
	document.getElementById('spectrumCanvas').setAttribute('height', parseInt(document.getElementById('canvasWrap').offsetHeight, 10)*0.8+'px');

	//scale the canvas - 2D
	document.getElementById('fieldCanvas').setAttribute('width', parseInt(document.getElementById('canvasWrap2D').offsetWidth, 10)*0.95+'px');
	document.getElementById('fieldCanvas').setAttribute('height', parseInt(document.getElementById('canvasWrap2D').offsetHeight, 10)*0.8+'px');

	//fix the height of the canvas wrap and spectra list now that they're populated - allow height adjustments only on the recently viewed panel
	document.getElementById('canvasWrap').style.height = document.getElementById('canvasWrap').offsetHeight;
	document.getElementById('sidebarWrap').style.height = document.getElementById('sidebarWrap').offsetHeight;
	document.getElementById('canvasWrap2D').style.height = document.getElementById('canvasWrap').offsetHeight;
	document.getElementById('sidebarWrap2D').style.height = document.getElementById('sidebarWrap').offsetHeight;

	//scale the x-deck
	updateDeckHeight();

	//set up a spectrum viewer - 1D
	viewer = new spectrumViewer('spectrumCanvas');

	//set up a field viewer - 2D
	fieldViewer = new fieldViewer('fieldCanvas');
	//dummy data in the 2D canvas for now
	fieldViewer.plotBuffer = fieldViewer.fakeData.gaussian;
//	fieldViewer.plotData();


	script.setAttribute('src', window.baseURL+'getSpectrumList');
	script.onload = function(){
		deleteDOM('spectraList');
		main();
	}
	script.id = 'spectraList';
	document.head.appendChild(script);
};


//fetch one spectrum from the server
function fetchSpectrum(name, callback){
	var script;

	//get data from server:
	script = document.createElement('script');
	script.setAttribute('src', window.baseURL+'callspechandler&spectrum1='+name);
	if(callback) script.onload = callback
	script.id = 'fetchdata';

	document.head.appendChild(script);
}

//refresh all spectra from server
function fetchAllSpectra(callback){
	var i, URL = window.baseURL+'callspechandler&';

	for(i=0; i<spectraNames.length; i++){
		URL += 'spectrum'+i+'='+spectraNames[i];
		if(i != spectraNames.length-1)
			URL += '&';
	}

	//get data from server:
	script = document.createElement('script');
	script.setAttribute('src', URL);
	script.onload = function(callback){
		var key;
		//manage the viewer object, doesn't exist until main runs the first time through
		if(callback != main){
			//push relevant data to the viewer's buffer, except the first time when we're calling back to main:
			for(key in viewer.plotBuffer)
				viewer.addData(key, spectrumBuffer[key]);

		}
		//dump the script so they don't stack up:
		deleteDOM('fetchdata');

			//replot
			viewer.plotData();

		//callback
		if(callback)
			callback();
	}.bind(null, callback);
	script.id = 'fetchdata'

	document.head.appendChild(script);
}


//refresh spectra that are currently available for plotting
function refreshSpectra(){
	var i, key, URL = window.baseURL+'callspechandler';

	i=0;
	for(key in spectrumBuffer){
		URL += '&spectrum'+i+'='+key;
		i++;
	}

	//get data from server:
	if(i!=0){
		script = document.createElement('script');
		script.setAttribute('src', URL);
		script.onload = function(callback){
			var key;
			//push relevant data to the viewer's buffer
			for(key in viewer.plotBuffer){
				viewer.addData(key, spectrumBuffer[key]);
			}
			//dump the script so they don't stack up:
			deleteDOM('fetchdata');

			viewer.plotData();
		};
		script.id = 'fetchdata'
		//document.head.appendChild(script);
	} else
		viewer.plotData();
}


//deploy a new histo to the viewer: fetch it, draw it, and populate the recently viewed list
function addSpectrum(name){

	//get the spectrumfetch
	fetchSpectrum(name,function(name)
	{
		//document.cookie="x; expires=Thu, 18 Dec 2013 12:00:00 UTC";
		
		//append to spectrum viewer's data store:
	
		viewer.addData(name, spectrumBuffer[name]); //collects spectrum data
		//var valuesArray=gainMatch(spectrumData); //returns calibration values as [slope,offset]
		//var string=JSON.stringify(valuesArray)
	//redraw the spectra
		viewer.plotData();
		viewer.unzoom();

		//resize the xdeck
		updateDeckHeight();

	}.bind(null, name)	) 
	

};


//add a row to the recently viewed table
function addRow(name){
	
	if(document.getElementById('recent'+name))
		return;
	
	//wrapper
	injectDOM('div', 'recent'+name, 'recentSpectra', {'class':'recentWrap'});

	//color swatch
	injectDOM('div', 'color'+name, 'recent'+name, {'class':'colorSwatch', 'style':'background-color:'+viewer.dataColor[viewer.colorAssignment.indexOf(name)]});

	//name
	injectDOM('div', 'name'+name, 'recent'+name, {'class':'recentName', 'innerHTML':name});


	//toggle
	toggleSwitch('recent'+name, 'toggle'+name, 'x', 'Show', 'Hide', viewer.toggleSpectrum.bind(viewer, name, false), viewer.toggleSpectrum.bind(viewer, name, true), 1);

	//fit target
	injectDOM('div', 'fitTargetWrap'+name, 'recent'+name, {'class':'fitTargetWrap'})
	injectDOM('input', 'fitTargetRadio'+name, 'fitTargetWrap'+name, {'type':'radio', 'name':'fitTarget', 'checked':true, 'class':'fitTargetRadio', 'value':name});
	injectDOM('label', 'fitTarget'+name, 'fitTargetWrap'+name, {'for':'fitTargetRadio'+name});
	document.getElementById('fitTargetRadio'+name).onchange = function(){
		viewer.fitTarget = document.querySelector('input[name="fitTarget"]:checked').value;
	}
	viewer.fitTarget = document.querySelector('input[name="fitTarget"]:checked').value;


	//fit results
	injectDOM('div', 'fit'+name, 'recent'+name, {'class':'fitResults', 'innerHTML':'-'})

	//kill button
	injectDOM('div', 'kill'+name, 'recent'+name, {'class':'killSwitch', 'innerHTML':String.fromCharCode(0x2573)});
	document.getElementById('kill'+name).onclick = function(){
		var name = this.id.slice(4,this.id.length);

		//remove the data from the viewer buffer
		viewer.removeData(name);
		//kill the row in the recents table
		deleteDOM('recent'+name);
		//also remove the data from the plot buffer to prevent periodic re-fetch:
		delete spectrumBuffer[name];
		//unzoom the spectrum
		viewer.unzoom();
		//shrink the deck height
		updateDeckHeight();
	};
	



};

//handle the server callback, currently hardcoded as callSpectrumHandler
function callSpectrumHandler(data){

	var key, response;

	for(key in data){
		spectrumBuffer[key] = [];
		for(i=0; i<data[key].length; i++)
			spectrumBuffer[key][i] = data[key][i];

	}
var allData=data;
return allData;
};

function MenuToggle(menutype, subtype){
	for(i=0; i<spectraNames.length; i++){
	    if( (spectraNames[i].indexOf( menutype ) > -1) && (spectraNames[i].indexOf( subtype ) > -1) ){ 
		if(document.getElementById(spectraNames[i]).className=="hidden"){
document.getElementById(spectraNames[i]).className = document.getElementById(spectraNames[i]).className.replace( /(?:^|\s)hidden(?!\S)/g , 'unhidden' ) }
		else { document.getElementById(spectraNames[i]).className = document.getElementById(spectraNames[i]).className.replace( /(?:^|\s)unhidden(?!\S)/g , 'hidden' ) }
	    }
	    else{
	if(document.getElementById(spectraNames[i]).className=="unhidden"){
document.getElementById(spectraNames[i]).className = document.getElementById(spectraNames[i]).className.replace( /(?:^|\s)unhidden(?!\S)/g , 'hidden' ) }
	    }
	}
}

//handle the spectrum list fetch, currently hardcoded as getSpectrumList
function getSpectrumList(data){

	var i,
		spectrumListHIT = document.getElementById('availableSpectraHIT'),
		spectrumListSUM = document.getElementById('availableSpectraSUM'),
		spectrumListGRGe = document.getElementById('availableSpectraGRGe'),
		spectrumListGRGt = document.getElementById('availableSpectraGRGt'),
		spectrumListGRGp = document.getElementById('availableSpectraGRGp'),
		spectrumListGRGw = document.getElementById('availableSpectraGRGw'),
		spectrumListSEPe = document.getElementById('availableSpectraSEPe'),
		spectrumListSEPt = document.getElementById('availableSpectraSEPt'),
		spectrumListSEPp = document.getElementById('availableSpectraSEPp'),
		spectrumListSEPw = document.getElementById('availableSpectraSEPw'),
		spectrumListDSCe = document.getElementById('availableSpectraDSCe'),
		spectrumListDSCt = document.getElementById('availableSpectraDSCt'),
		spectrumListDSCp = document.getElementById('availableSpectraDSCp'),
		spectrumListDSCw = document.getElementById('availableSpectraDSCw'),
		spectrumListDSCz = document.getElementById('availableSpectraDSCz'),
		spectrumListDSCl = document.getElementById('availableSpectraDSCl'),
		spectrumListDSCs = document.getElementById('availableSpectraDSCs'),
		listElement;

	//clear the old list in the sidebar
	spectrumListHIT.innerHTML = '';  //dump old entries first
	spectrumListSUM.innerHTML = '';  //dump old entries first
	spectrumListGRGe.innerHTML = '';  //dump old entries first
	spectrumListGRGt.innerHTML = '';  //dump old entries first
	spectrumListGRGp.innerHTML = '';  //dump old entries first
	spectrumListGRGw.innerHTML = '';  //dump old entries first
	spectrumListSEPe.innerHTML = '';  //dump old entries first
	spectrumListSEPt.innerHTML = '';  //dump old entries first
	spectrumListSEPp.innerHTML = '';  //dump old entries first
	spectrumListSEPw.innerHTML = '';  //dump old entries first
	spectrumListDSCe.innerHTML = '';  //dump old entries first
	spectrumListDSCt.innerHTML = '';  //dump old entries first
	spectrumListDSCp.innerHTML = '';  //dump old entries first
	spectrumListDSCw.innerHTML = '';  //dump old entries first
	spectrumListDSCz.innerHTML = '';  //dump old entries first
	spectrumListDSCl.innerHTML = '';  //dump old entries first
	spectrumListDSCs.innerHTML = '';  //dump old entries first

// Add a title entry for each type
		listElement = document.createElement('li');
    listElement.id = "HITTITLE";
listElement.innerHTML = "HIT PATTERNS";
spectrumListHIT.appendChild(listElement);
    document.getElementById("HITTITLE").onclick = MenuToggle.bind(null, "HIT", "_") ;

		listElement = document.createElement('li');
    listElement.id = "SUMTITLE";
listElement.innerHTML = "SUM Spectra";
spectrumListSUM.appendChild(listElement);
    document.getElementById("SUMTITLE").onclick = MenuToggle.bind(null, "SUM", "_") ;

		listElement = document.createElement('li');
    listElement.id = "GRGeTITLE";
listElement.innerHTML = "HPGe Energies";
spectrumListGRGe.appendChild(listElement);
    document.getElementById("GRGeTITLE").onclick = MenuToggle.bind(null, "GRG", "Energy") ;
		listElement = document.createElement('li');

    listElement.id = "GRGtTITLE";
listElement.innerHTML = "HPGe Times";
spectrumListGRGt.appendChild(listElement);
    document.getElementById("GRGtTITLE").onclick = MenuToggle.bind(null, "GRG", "Time") ;
		listElement = document.createElement('li');
    listElement.id = "GRGpTITLE";
listElement.innerHTML = "HPGe Pulse Heights";
spectrumListGRGp.appendChild(listElement);
    document.getElementById("GRGpTITLE").onclick = MenuToggle.bind(null, "GRG", "Pulse_Height") ;
		listElement = document.createElement('li');
    listElement.id = "GRGwTITLE";
listElement.innerHTML = "HPGe Waveforms";
spectrumListGRGw.appendChild(listElement);
    document.getElementById("GRGwTITLE").onclick = MenuToggle.bind(null, "GRG", "Waveform") ;

		listElement = document.createElement('li');
    listElement.id = "SEPeTITLE";
listElement.innerHTML = "SCEPTAR Energies";
spectrumListSEPe.appendChild(listElement);
    document.getElementById("SEPeTITLE").onclick = MenuToggle.bind(null, "SEP", "Energy") ;
		listElement = document.createElement('li');
    listElement.id = "SEPtTITLE";
listElement.innerHTML = "SCEPTAR Times";
spectrumListSEPt.appendChild(listElement);
    document.getElementById("SEPtTITLE").onclick = MenuToggle.bind(null, "SEP", "Time") ;
		listElement = document.createElement('li');
    listElement.id = "SEPpTITLE";
listElement.innerHTML = "SCEPTAR Pulse Heights";
spectrumListSEPp.appendChild(listElement);
    document.getElementById("SEPpTITLE").onclick = MenuToggle.bind(null, "SEP", "Pulse_Height") ;
		listElement = document.createElement('li');
    listElement.id = "SEPwTITLE";
listElement.innerHTML = "SCEPTAR Waveforms";
spectrumListSEPw.appendChild(listElement);
    document.getElementById("SEPwTITLE").onclick = MenuToggle.bind(null, "SEP", "Waveform") ;

		listElement = document.createElement('li');
    listElement.id = "DSCeTITLE";
listElement.innerHTML = "DESCANT Energies";
spectrumListDSCe.appendChild(listElement);
    document.getElementById("DSCeTITLE").onclick = MenuToggle.bind(null, "DSC", "Energy") ;
		listElement = document.createElement('li');
    listElement.id = "DSCtTITLE";
listElement.innerHTML = "DESCANT Times";
spectrumListDSCt.appendChild(listElement);
    document.getElementById("DSCtTITLE").onclick = MenuToggle.bind(null, "DSC", "Time") ;
		listElement = document.createElement('li');
    listElement.id = "DSCpTITLE";
listElement.innerHTML = "DESCANT Pulse Heights";
spectrumListDSCp.appendChild(listElement);
    document.getElementById("DSCpTITLE").onclick = MenuToggle.bind(null, "DSC", "Pulse_Height") ;
		listElement = document.createElement('li');
    listElement.id = "DSCwTITLE";
listElement.innerHTML = "DESCANT Waveforms";
spectrumListDSCw.appendChild(listElement);
    document.getElementById("DSCwTITLE").onclick = MenuToggle.bind(null, "DSC", "Waveform") ;
		listElement = document.createElement('li');
    listElement.id = "DSCzTITLE";
listElement.innerHTML = "DESCANT Zero-Crossings";
spectrumListDSCz.appendChild(listElement);
    document.getElementById("DSCzTITLE").onclick = MenuToggle.bind(null, "DSC", "Zero_Crossing") ;
		listElement = document.createElement('li');
    listElement.id = "DSClTITLE";
listElement.innerHTML = "DESCANT Long Int.";
spectrumListDSCl.appendChild(listElement);
    document.getElementById("DSClTITLE").onclick = MenuToggle.bind(null, "DSC", "Long_Integration") ;
		listElement = document.createElement('li');
    listElement.id = "DSCsTITLE";
listElement.innerHTML = "DESCANT Short Int.";
spectrumListDSCs.appendChild(listElement);
    document.getElementById("DSCsTITLE").onclick = MenuToggle.bind(null, "DSC", "Short_Integration") ;

// Copy the new spectrum list fetched from the server to the local list
	spectraNames = [];
        for(i=0; i<data.spectrumlist.length; i++){ spectraNames[i] = data.spectrumlist[i]; }

//Create the new list in the sidebar
	for(i=0; i<spectraNames.length; i++){
		listElement = document.createElement('li');
		listElement.id = spectraNames[i];
	    if( spectraNames[i].indexOf( 'HIT' ) > -1 ){ spectrumListHIT.appendChild(listElement); }
	    if( spectraNames[i].indexOf( 'SUM' ) > -1 ){ spectrumListSUM.appendChild(listElement); }
/*	    if( spectraNames[i].indexOf( 'GRG' ) > -1 ){
                           if(spectraNames[i].indexOf( 'Energy' ) ){ spectrumListGRGe.appendChild(listElement); }
                           if(spectraNames[i].indexOf( 'Time' ) ){ spectrumListGRGt.appendChild(listElement); }
                           if(spectraNames[i].indexOf( 'Pulse' ) ){ spectrumListGRGp.appendChild(listElement); }
                           if(spectraNames[i].indexOf( 'Waveform' ) ){ spectrumListGRGw.appendChild(listElement); }
              }*/
	    if( spectraNames[i].indexOf( 'GRG' ) > -1 && (spectraNames[i].indexOf( 'Energy' )) ){ spectrumListGRGe.appendChild(listElement); }
	    if( spectraNames[i].indexOf( 'GRG' ) > -1 && (spectraNames[i].indexOf( 'Time' )) ){ spectrumListGRGt.appendChild(listElement); }
	    if( spectraNames[i].indexOf( 'GRG' ) > -1 && (spectraNames[i].indexOf( 'Pulse' )) ){ spectrumListGRGp.appendChild(listElement); }
	    if( spectraNames[i].indexOf( 'GRG' ) > -1 && (spectraNames[i].indexOf( 'Waveform' )) ){ spectrumListGRGw.appendChild(listElement); }
	    if( spectraNames[i].indexOf( 'SEP' ) > -1 ){
                           if(spectraNames[i].indexOf( 'Energy' ) ){ spectrumListSEPe.appendChild(listElement); }
                           if(spectraNames[i].indexOf( 'Time' ) ){ spectrumListSEPt.appendChild(listElement); }
                           if(spectraNames[i].indexOf( 'Pulse' ) ){ spectrumListSEPp.appendChild(listElement); }
                           if(spectraNames[i].indexOf( 'Waveform' ) ){ spectrumListSEPw.appendChild(listElement); }
              }

	    if( spectraNames[i].indexOf( 'DSC' ) > -1 ){
                           if(spectraNames[i].indexOf( 'Energy' ) ){ spectrumListDSCe.appendChild(listElement); }
                           if(spectraNames[i].indexOf( 'Time' ) ){ spectrumListDSCt.appendChild(listElement); }
                           if(spectraNames[i].indexOf( 'Pulse' ) ){ spectrumListDSCp.appendChild(listElement); }
                           if(spectraNames[i].indexOf( 'Waveform' ) ){ spectrumListDSCw.appendChild(listElement); }
                           if(spectraNames[i].indexOf( 'Zero' ) ){ spectrumListDSCz.appendChild(listElement); }
                           if(spectraNames[i].indexOf( 'Long' ) ){ spectrumListDSCl.appendChild(listElement); }
                           if(spectraNames[i].indexOf( 'Short' ) ){ spectrumListDSCs.appendChild(listElement); }
              }

		document.getElementById(spectraNames[i]).innerHTML = spectraNames[i];
		document.getElementById(spectraNames[i]).onclick = addSpectrum.bind(null, spectraNames[i]) ;
	    document.getElementById(spectraNames[i]).className += "hidden";
	}
}

//callback for peak fit
function fitCallback(center, width){
	var name = viewer.fitTarget,
		reportDiv = document.getElementById('fit'+name);

	if(reportDiv.innerHTML == '-')
		reportDiv.innerHTML = '';

	reportDiv.innerHTML += 'Center: ' + center.toFixed(2) + ', Width: ' + width.toFixed(2) + '<br>';
}


//DOM injector; <properties> is an object containing property.value pairs for all properties to be set: 
function injectDOM(element, id, wrapperID, properties){
    var key, elt,
        newElement = document.createElement(element);
    //explicit ID
    newElement.setAttribute('id', id);
    //append to document:
    if(wrapperID == 'body')
        document.body.appendChild(newElement)
    else
        document.getElementById(wrapperID).appendChild(newElement);
    elt = document.getElementById(id);

    //some things need to be set specially:
    if(properties['innerHTML'] || properties['innerHTML'] === 0){
        elt.innerHTML = properties['innerHTML'];
        delete properties['innerHTML'];
    }
    if(properties['onclick']){
        elt.onclick = properties['onclick'];
        delete properties['onclick'];
    }
    //send in the clowns:
    for(key in properties){
        elt.setAttribute(key, properties[key]);
    }

};

//delete a dom element by ID
function deleteDOM(id){
	var element = document.getElementById(id);
    element.parentNode.removeChild(element);
};

//build a toggle switch out of divs:
function toggleSwitch(parentID, id, title, enabled, disabled, onActivate, onDeactivate, initialState){

	//wrapper div:
	injectDOM('div', 'toggleWrap'+id, parentID, {'class':'toggleWrap', 'style':( (title=='') ? 'text-align:center;' : '' )});
	//label: (hacked in here, usually only the first one and only on title argument)
	if(disabled != '')
		injectDOM('div', 'LtoggleLabel'+id, 'toggleWrap'+id, {'class':'toggleLabel', 'innerHTML':disabled});
	//toggle groove:
	injectDOM('div', 'toggleGroove'+id, 'toggleWrap'+id, {'class':'toggleGroove', 'style':( (title=='') ? '' : 'float:left;' )});
	//extra hack-in label:
	if(disabled != '')
		injectDOM('div', 'RtoggleLabel'+id, 'toggleWrap'+id, {'class':'toggleLabel', 'innerHTML':enabled});
	//toggle switch:
	injectDOM('div', 'toggleSwitch'+id, 'toggleGroove'+id, {'class':'toggleSwitch', 'style':((initialState) ? 'left:1em;' : 'left:0em;')});
	document.getElementById('toggleSwitch'+id).onmousedown = function(event){
		document.getElementById('toggleWrap'+id).ready = 1;
	};
	document.getElementById('toggleSwitch'+id).onmouseup = function(event){
		flipToggle(event, id, enabled, disabled, onActivate, onDeactivate);
	};
	document.getElementById('toggleSwitch'+id).onmouseout = function(event){
		flipToggle(event, id, enabled, disabled, onActivate, onDeactivate)
	};
	//state description
	/*
	if(title=='')
		injectDOM('br', 'break', 'toggleWrap'+id, {});
	injectDOM('div', 'toggleDescription'+id, 'toggleWrap'+id, {
		'class' : 'toggleDescription',
		'style' : ( (title=='') ? 'width:100%' : '' ),
		'innerHTML' : ((initialState) ? enabled : disabled)
	})
	*/

};

function flipToggle(event, id, enabled, disabled, onActivate, onDeactivate){
	var switchID = 'toggleSwitch'+id,
	//grooveID = 'toggleGroove' + id,
	descriptionID = 'toggleDescription' + id;
	if(document.getElementById('toggleWrap'+id).ready != 1) return

	if(document.getElementById(switchID).style.left == '0em'){
		document.getElementById(switchID).style.left = '1em';
		//document.getElementById(descriptionID).innerHTML = enabled;
		onActivate();
	} else{
		document.getElementById(switchID).style.left = '0em';
		//document.getElementById(descriptionID).innerHTML = disabled;
		onDeactivate();
	}

	document.getElementById('toggleWrap'+id).ready =0;	
}

//set a toggle to the state given by the boolean activate
function setToggle(toggleID, activate){
	var toggle = document.getElementById(toggleID);
	if( (activate && toggle.style.left == '0em') || (!activate && toggle.style.left == '1em') ){
		toggle.onmousedown();
		toggle.onmouseup();
	}
}

function queryString(){
	var query = window.location.search.substring(1),
		i, buffer;

	queryVars = {};

	query = query.split('&')

	for(i=0; i<query.length; i++){
		queryVars[query[i].split('=')[0]] = query[i].split('=')[1] ;
	}
}

//x-deck needs its height babysat - todo: CSS solution?
function updateDeckHeight(){
	document.getElementById('mainDeck').style.height = document.getElementById('canvasWrap').offsetHeight + document.getElementById('recentSpectra').offsetHeight + parseFloat(document.body.style.fontSize)*3; //ie 3 ems worth of margins
}



///////////////////////////////////////////////////////////////// Calibration code
///////////////////////////////////////////////////////////////

function addSpectrum1(name,n){ // Function used to perform gain matching

	//get the spectrumfetch
	fetchSpectrum(name,function(name)
	{

		var spectrumData=viewer.addData1(name, spectrumBuffer[name]); //collects spectrum data
		var valuesArray=gainMatch(spectrumData); //returns calibration values as [slope,offset]
		var string=JSON.stringify(valuesArray);
		document.cookie=string;
		//document.cookie=JSON.stringify([n,n]);	
		
	}.bind(null,name)	) 
	
	return document.cookie;


}; 

function addSpectrum2(name,n){ // Function used to check the energy resolution

	//get the spectrumfetch
	fetchSpectrum(name,function(name)
	{

		var spectrumData=viewer.addData1(name, spectrumBuffer[name]); //collects spectrum data
		var peakResolution=getRes(spectrumData); //returns calibration values as [slope,offset]
		var string=JSON.stringify(peakResolution)
		document.cookie=string;
		//document.cookie=JSON.stringify([n,n]);	


	}.bind(null, name)	) 
	
	return document.cookie;

};

channels=64; // Number of channles, is used as a global variable throughout


function names(n) { //returns the names of the HPGe detectors as an array

	var node=document.getElementsByClassName('unhidden')[n]; 
	return node.innerHTML;

}; 

var	getValues=(function (j) { // Function to call addSpectrum1(), gets and processes the data
return function(j) {return addSpectrum1(NAME[j],j);} }  ) ();		

function calibrateAll() {

	NAME=new Array(channels+1); //get the names to put in the table

	for(var n=0;n<=channels;n=n+1) 
	{	
	NAME[n]=names(n);

	}

	var body = document.getElementById("canvasWrapCalibration"); // create the necessary HTML elements for a table
	var tbl = document.createElement("table");
	tbl.id="tableId";
	var tblBody = document.createElement("tbody");
	tblBody.id="bodyId";

	w=new Array(channels); // array to store slope and offset values
	for (var i = 0,j = 20; i <=channels+1; i++, j=j+60) { // Call the getValues() function to get the values for the table
  window.setTimeout(function() {
      w[this]=JSON.parse(getValues(this));
  }.bind(i), j);
	}

setTimeout( function() { // Take the data and place the values in the table

	for (var j = 0; j <channels; j++) { // Indexing is [j+2] as the table index starts at row -1

			var b=parseFloat(w[j+2][0].toString());
			var y=document.getElementById("slope"+j);
			y.innerHTML=b;


			var q=parseFloat(w[j+2][1].toString());
			var z=document.getElementById("offset"+j);
			z.innerHTML=q;			
}

 
},3960);

return w;

}

function ODB() { // Function to send all the values that have been checkmarked to the ODB
	
	result=window.confirm("Send all checked values to the ODB?"); //only send to odb after verification from user
	if (result==true) { 

		for (var n=1;n<=channels;n=n+1) { 
		
			var y=document.getElementById("checkButton" +n);

			if (y.checked==true)
			{ 
				var z=document.getElementById("slope" +n).innerHTML; //slope value to send to ODB
				var w=document.getElementById("offset" +n).innerHTML; //offset value to send to ODB

				var path1="/DAQ/MSC/gain["+n+"]"; // Path for the variables in the ODB
				var path2="/DAQ/MSC/offset["+n+"]";
				
				ODBSet(path1,z); //set the slope, function in mhttpd.js
				ODBSet(path2,w); //set the offset, function in mhttps.js

			}

		}
	}

}

function uncheck() { // Unchecks all the values

			for (var n=0;n<=channels;n=n+1) { 
							var y=document.getElementById("checkButton" +n);
							y.checked=false;
			}

}

function check() { // Checks all the values

			for (var n=0;n<=channels;n=n+1) {
							var y=document.getElementById("checkButton" +n);
							y.checked=true;
			}

}

function checkValues(data) { // Function to determine if any values are outliers, or can obviously be ignored

var slope=new Array(channels); // Initialize variables
var offset=new Array(channels);
var sumSlope=0;
var sumOffset=0;
var slopeCounter=0;
var offsetCounter=0;


	
	for(var n=1;n<=channels;n=n+1) // Create a new set of data to manipulate without changing original values
	{
	slope[n-1]=Number(data[n][0]);	
	offset[n-1]=Number(data[n][1]);
	}


	for (var n=1; n<=channels;n++){	// Check for any obvious outliers - they are excluded from the new data set
			if (slope[n] > 2) {
			slope[n]=0;
			slopeCounter=slopeCounter+1;

			}
			
			if (Math.abs(offset[n]) > Math.abs(13*offset[1])) {	
			offset[n]=0;
			offsetCounter=offsetCounter+1;

			}

		}

	for (var i = 0; i < slope.length; i++) { 

	sumSlope=sumSlope+slope[i];
	sumOffset=sumOffset+offset[i]; 
	}

var averageSlope=sumSlope/(slope.length-slopeCounter);
var averageOffset=Math.abs(sumOffset)/(offset.length-offsetCounter);


for(var n=0;n<=channels;n=n+1) {

	if(n==0){
	var h=0;
	}

	else {
	var h=n-1;

	}

if (slope[n]!=0) {
	if ( Math.abs( (slope[n]-averageSlope)/((slope[n]+averageSlope)/2)) > 0.45) // Outlier condition for the slope
	{
		document.getElementById('slope'+h).style.backgroundColor= '#993333'; 
		var y=document.getElementById("checkButton" +h);
		y.checked=false;
	}
}

else if (slope[n]==0) { // Slope value to be ignored
		document.getElementById('slope'+h).style.backgroundColor= '#A37547'; 
		var y=document.getElementById("checkButton" +h);
		y.checked=false;
}

if (offset[n]!=0) { // Outlier condition for the offset
if (Math.abs(offset[n]) >9 )
	{
		document.getElementById('offset'+h).style.backgroundColor= '#993333'; 
		var y=document.getElementById("checkButton" +h);
		y.checked=false;
	}
	
}

if (offset[n]==0) { // Offset value can be ignored
		document.getElementById('offset'+h).style.backgroundColor= '#A37547'; 
		var y=document.getElementById("checkButton" +h);
		y.checked=false;
	
}
}
document.getElementById('GRGpTITLE').click();

}


function createTable() {

	NAME=new Array(channels+1); //get the names to put in the table
	
	for(var n=0;n<channels;n=n+1) 
	{	NAME[n]=names(n);}
	NAME[channels]=NAME[channels-1];


	var body = document.getElementById("canvasWrapCalibration"); // Create an HTML div for the table
	var tbl = document.createElement("table");
	tbl.id="tableId";
	var tblBody = document.createElement("tbody");
	tblBody.id="bodyId";	


	for (var j = -1; j <channels; j++) { 

		var row = document.createElement("tr");

			for (var i = 0; i < 4; i++) { //number of columns
			
				if (j==-1 && i==0) {

				var cell = document.createElement("td");    
				var cellText = document.createTextNode("Spectrum Name"); 
				cell.appendChild(cellText);
				row.appendChild(cell);


				}			


				else if (j==-1 && i==1) { // Header cell for the slope

				var cell = document.createElement("td");    
				var cellText = document.createTextNode("Slope"); 
				cell.appendChild(cellText);
				row.appendChild(cell);


				}


				else if (j==-1 && i==2) { // Header cell for the offset

				var cell = document.createElement("td");    
				var cellText = document.createTextNode("Offset"); 
				cell.appendChild(cellText);
				row.appendChild(cell);


				}

				else if (j==-1 && i==3) { // Header cell for the confirmation of values

				var cell = document.createElement("td");    
				var cellText = document.createTextNode("Confirm Values"); 
				cell.appendChild(cellText);
				row.appendChild(cell);


				}

				else if(i==0) {  //column of spectrum names
				var cell = document.createElement("td");   
				if (j%4==0) { 
				var cellText = document.createTextNode(NAME[j+1]); // Colour the background of every fourth cell
				cell.style.backgroundColor='#5C5C5C';
				}

				else if(j==63) {
				cellText = document.createTextNode('GRG16WN00A_Pulse_Height'); 
				}	


				else { 
				cellText = document.createTextNode(NAME[j+1]); 
				}
				cell.setAttribute("id", "Name" +j)
				cell.appendChild(cellText);
				row.appendChild(cell);
				
				}


				else if(i==1) { // Create cells to be filled with the slope values
				var cell = document.createElement("td");    

				if (j%4==0) { 
				var cellText = document.createTextNode(""); 
				cell.style.backgroundColor='#5C5C5C'; // Colour the background of every fourth row 
				}  

				var cellText = document.createTextNode(""); 

				cell.setAttribute("id", "slope" +j)
				
				cell.appendChild(cellText);
				row.appendChild(cell);
				}
				
				else if(i==2) {  // Create cells to be filled with the offset values
				var cell = document.createElement("td");    
				if (j%4==0) { 
				var cellText = document.createTextNode(""); 
				cell.style.backgroundColor='#5C5C5C'; // Colour the background of every fourth row 
				}  
	
				var cellText = document.createTextNode(""); 
				cell.setAttribute("id", "offset" +j);
				
				cell.appendChild(cellText);
				row.appendChild(cell);
				}
				
				else if(i==3) {  // Input/select all button to send to ODB
				
				var cell = document.createElement("td");  
				cell.setAttribute("id", "sendValues");
				var cellText = document.createTextNode("Confirm"); 
				cell.appendChild(cellText);
				row.appendChild(cell);
				
				var x = document.createElement("INPUT");
		    		x.setAttribute("type", "checkbox");
		    		x.setAttribute("value", "Click me");
		    		x.setAttribute("id","checkButton" +j); //will allow to determine which values to send
		    		x.checked=true; // Default to be checked
		    		cell.appendChild(x);	
				
				}
				
			} 
		
			tblBody.appendChild(row); // Append all the information to the appropriate div
			
}
  		tbl.appendChild(tblBody);
  		body.appendChild(tbl);

}














