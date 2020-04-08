/****************************************
** App.js
** by: Michael T Hoffman
**
** Main app handling code
**
** TODO
**
**	- add tooltips for sliders
**	- Fix missing population and bed counts (ongoing)
**
**
****************************************/

class App {

	constructor() {
		this.casesUrl					= "caseinfo.dat";
		this.regionsUrl				= "regioninfo.csv";
		this.DataSetsPath			= "COVID-19-data-resource-hub/";

		this.DataSet					= new DataSetDataWorld();
		this.AppState					= {};
		this.Chart						= null;

		this.CountRatio					= null;
		this.Delta							= null;
		this.Logarithmic				= null;
		this.ChartType					= null;
		this.AlignDayZero				= null;
		this.ShowCountryLabel		= null;
		this.CaseType						= null;
		this.StartDay						= 0;

		this.DefaultSmooth			= 1;
		this.FirstRegion				= true;	 // first time a region is selected, "Global" is deselected
		this.DropZoneAdded			= false;
		this.ButtonDeselectedClass					= "buttonBase button";
		this.RegionButtonSelectedClass	= "buttonBase buttonSelected";
		this.SpecialButtonSelectedClass					= "buttonBase buttonSpecial";

		this.SectionAnimations = {};		// place to manage section animations

		this.UrlParams = this.getUrlVars();

		this.currentChartTitle = "COVID-19 Confirmed Cases by Country";

		CanvasJS.addColorSet("oneColor", ["#880088"]);

		this.Chart = new Chart();

		this.initializeButtons();

		this.setupSectionPanel( "chartOptions");
		this.setupSectionPanel( "countryNames");
		this.setupSectionPanel( "stateNames");

		var regionUrlLoadingDoneFunc = this.regionUrlLoadingDone.bind(this);
		var loadingDoneFunc = this.loadingDone.bind(this);
		var loadingErrorFunc = this.loadingError.bind(this);

		this.DataSet.processUrl("regions", this.DataSetsPath + this.regionsUrl, regionUrlLoadingDoneFunc, loadingErrorFunc );

		window.onresize = this.onWindowResize.bind(this);
	}


	onWindowResize() {
		this.drawChart();
	}


	setupSectionPanel(sectionName ) {
		var node = document.getElementById( sectionName );

		this.SectionAnimations[sectionName] = {};
		this.SectionAnimations[sectionName].Open = true;
		this.SectionAnimations[sectionName].OffsetTop = node.offsetTop;
		this.SectionAnimations[sectionName].OffsetHeight = node.offsetHeight;
	}


	toggleSection( sectionName ) {
		if ( this.SectionAnimations[sectionName].Open ) {
			this.doSectionClose(sectionName);
		} else {
			this.doSectionOpen(sectionName);
		}
	}


	doSectionOpen(sectionName ) {
		this.SectionAnimations[sectionName].Open = true;

		var node = document.getElementById( sectionName );
		var arrowNode = document.getElementById( sectionName + "Arrow" );
		var bottom = this.SectionAnimations[sectionName].OffsetHeight;

		node.style.display = "block";
		arrowNode.className = "downArrow";
		$('#' + sectionName)
			.animate({
				height: bottom.toString() + 'px'
				}, 100);
	}


	doSectionClose(sectionName ) {
		this.SectionAnimations[sectionName].Open = false;

		var bottom = 	this.SectionAnimations[sectionName].OffsetTop;
		var arrowNode = document.getElementById( sectionName + "Arrow" );
		var node = document.getElementById( sectionName );

		arrowNode.className = "rightArrow";

		 $('#' + sectionName)
		 	.animate({
				height : "0px"
			}, 100, null, function() { node.style.display = "none"; });
	}


	addDropZone() {
		if ( !this.DropZoneAdded ) {

			// Setup the dnd listeners.
			var dropZone = document.getElementById('dropZone');
			dropZone.innerHTML = "Drop regioninfo.csv and caseinfo.dat files here for local testing";
			dropZone.className = "dropZone";
			dropZone.addEventListener('dragover', this.handleDragOver.bind(this), false);
			dropZone.addEventListener('drop', this.handleFileSelect.bind(this), false);
			this.DropZoneAdded = true;
		}
	}


	changeCaseType(caseType, doDrawChart = true ) {
		this.CaseType = caseType;

		this.sortBy("Country", "Count");
		this.sortBy("State", "Count");
		this.drawChart(doDrawChart);
	}




	drawChart(drawChart = true) {
		if (drawChart ) {
			var chartParameters = {
				"CountRatio":				this.CountRatio,
				"Delta":						this.Delta,
				"Logarithmic":			this.Logarithmic,
				"ChartType":				this.ChartType,
				"AlignDayZero":			this.AlignDayZero,
				"ShowCountryLabel": this.ShowCountryLabel,
				"StartDay":					parseInt(this.StartDay),
				"Smooth":						parseInt(this.Smooth)
			};

			var showingRegions = this.DataSet.getAllShowingRegions();
			showingRegions = Region.sortRegions( showingRegions, "Count", this.CaseType );

			this.currentChartTitle = this.Chart.drawChart(this.CaseType, showingRegions, chartParameters);
			this.updatePageUrl( showingRegions );	// if we need to update chart, we also need to update the url (for sharing)
		}
	}


	setCaseType(caseType, doDrawChart = true) {
		var allowedTypes = ["confirmed", "deaths"];

		if (allowedTypes.includes(caseType)) {
			this.CaseType = caseType;
			this.toggleButtonSet(allowedTypes, caseType);

			this.changeCaseType( caseType, doDrawChart );
		}
	}


	selectAllCountries( state, doDrawChart = true ) {
		var countryList = this.DataSet.getCountryList();
		this.selectAllRegions( countryList, state, doDrawChart )
	}


	selectAllStates( state, doDrawChart = true ) {
		var regionUSA = this.DataSet.getCountryByName( "US" );
		if ( regionUSA ) {
			var statesOfUSA = regionUSA.getSubRegionsList();
		this.selectAllRegions( statesOfUSA, state, doDrawChart )
		}
	}


	selectAllRegions(regionList, state, doDrawChart = true) {

		for (var r = 0; r < regionList.length; r++) {
				this.setLocationState(regionList[r].getName(), state, false);
		}

		this.setLocationState("Global", !state, false);
		this.drawChart(doDrawChart);
	}


	setAlignDayZero(isAlignDayZero, doDrawChart = true) {
		if (isAlignDayZero != this.AlignDayZero) {
			this.AlignDayZero = isAlignDayZero;
			this.toggleButtonPair("alignDayZero", "absoluteDates", isAlignDayZero);
			if (isAlignDayZero) {
				this.setStartDay( 0 );
			}

			this.drawChart(doDrawChart);
		}
	}


	setCountRatio(ratioType, doDrawChart = true) {
		var allowedTypes = ["absolute", "per1MPop", "perBed" ];

		if (allowedTypes.includes(ratioType) && ratioType != this.CountRatio) {
			this.CountRatio = ratioType;
			this.toggleButtonSet(allowedTypes, ratioType)
			this.drawChart(doDrawChart);
		}
	}


	setChartType(chartType, doDrawChart = true) {
		var allowedTypes = ["line", "stackedArea", "stackedColumn"];
		if (chartType != this.ChartType && allowedTypes.includes(chartType) ) {
			this.ChartType = chartType;
			this.toggleButtonSet(allowedTypes, chartType)
			this.drawChart(doDrawChart);

			if (chartType != "line") {
				this.setCountRatio("absolute", false);
			}
		}
	}


	sortBy( category, sortType, caseType = null ) {
		var allowedSortTypes = ["Count", "Name", "PerCapita"];

		if (allowedSortTypes.includes(sortType) && this.DataSet ) {

			var thisField = "sort" + category + sortType + (caseType?caseType:"");

			if ( sortType == "Count" )
				caseType = this.CaseType;

			switch( category ) {
				case "Country":	this.addCountryNameButtons(sortType, caseType);	break;
				case "State": 	this.addStateNameButtons(sortType, caseType);		break;
			}

			// disambiguate element IDs
			var fullFields = [];

			var fieldPrefix = "sort" + category;
			var fieldSuffixes = [
				"Count",
				"Name",
				"PerCapitaConfirmed",
				"PerCapitaDeaths"
			];

			for( var fs = 0; fs < fieldSuffixes.length; fs++ ) {
				var fullField = fieldPrefix + fieldSuffixes[fs];

				fullFields.push( fullField );
			}

			this.toggleButtonSet(fullFields, thisField);
		}
	}


	setDelta(deltaType, doDrawChart = true) {
		var allowedTypes = ["cumulative", "deltaCount", "deltaDeltaCount", "deltaPercent"];
		if (allowedTypes.includes(deltaType) && deltaType != this.Delta) {
			this.Delta = deltaType;
			this.toggleButtonSet(allowedTypes, deltaType)
			if (deltaType == "deltaDeltaCount" ) {
				this.setCountRatio("absolute", false);
				this.setLogarithmic(false, false);
			}
			this.drawChart(doDrawChart);
		}
	}


	setLogarithmic(isLog, doDrawChart = true) {
		if (isLog != this.Logarithmic) {
			this.Logarithmic = isLog;
			this.toggleButtonPair("logarithmic", "linear", isLog);
			if (isLog && this.deltaType == "deltaDeltaCount") {
				this.setDelta("cumulative", false);
			}
			this.drawChart(doDrawChart);
		}
	}


	toggleButtonPair(trueNodeId, falseNodeId, state) {
		this.setButtonState(trueNodeId, state, this.SpecialButtonSelectedClass);
		this.setButtonState(falseNodeId, !state, this.SpecialButtonSelectedClass);

	}


	toggleButtonSet(nodeIdList, curState) {
		for (var i = 0; i < nodeIdList.length; i++) {
			var node = document.getElementById(nodeIdList[i]);
			if (node) {
				node.className = (node.id == curState ? this.SpecialButtonSelectedClass : this.ButtonDeselectedClass);
			}
		}
	}


	setButtonState(nodeId, state, selectedClass = this.RegionButtonSelectedClass) {
		var node = document.getElementById(nodeId);
		node.className = (state ? selectedClass : this.ButtonDeselectedClass);
	}


	toggleCountryLabel(doDrawChart = true) {
		this.ShowCountryLabel = !this.ShowCountryLabel;
		this.setCountryLabel(this.ShowCountryLabel, doDrawChart);
	}


	setCountryLabel(state, doDrawChart = true) {
		this.ShowCountryLabel = state;
		this.setButtonState("countryLabel", state);
		this.drawChart(doDrawChart);
	}


	toggleLocation(locationName, doDrawChart = true) {
		var loc = this.DataSet.getRegionByName( locationName );

		this.setLocationState(locationName, !loc.isShowing(), doDrawChart);
	}


	setLocationState(locationName, state, doDrawChart = true) {
		var region = this.DataSet.getRegionByName( locationName );

		region.setShowing(state);
		this.setButtonState(locationName, state);
		this.drawChart(doDrawChart);
	}


	addCountryNameButtons(sortField, sortCaseType = null) {
		var countryContainerNode = document.getElementById("countryNames");

		countryContainerNode.innerHTML = "";

		var self = this;

		this.createSpecialButton( "countryNames", "All", function() { self.selectAllCountries(true); } );
		this.createSpecialButton( "countryNames", "None", function() { self.selectAllCountries(false); } );

		var globalRegion = this.DataSet.getRegionByName("Global");

		if ( globalRegion ) {
			this.createRegionButton( globalRegion );
		}

		var countries = this.DataSet.getCountryList( sortField, sortCaseType );

		for (var c = 0; c < countries.length; c++) {
			this.createRegionButton(countries[c]);
		}
	}


	addStateNameButtons(sortField, sortCaseType = null) {
		var locsStr = "";

		var stateContainerNode = document.getElementById("stateNames");
		stateContainerNode.innerHTML = "";

		var self = this;

		this.createSpecialButton( "stateNames", "All", function() { self.selectAllStates(true); } );
		this.createSpecialButton( "stateNames", "None", function() { self.selectAllStates(false); } );

		var subRegions = this.DataSet.getSubRegionsForCountry( "US", sortField, sortCaseType );

		for (var sr = 0; sr < subRegions.length; sr++) {
				this.createRegionButton( subRegions[sr], true );
		}
	}


	createSpecialButton( containerName, label, clickFunc ) {
		var containerNode = document.getElementById(containerName);
		var specialEle = document.createElement("span");

		specialEle.className = this.SpecialButtonSelectedClass;
		specialEle.id = label;
		specialEle.onclick = clickFunc;
		specialEle.innerHTML = label;
		containerNode.appendChild(specialEle);
	}



	createRegionButton( region, isAState = false ) {
		var locName = region.getName();
		var containerNode;
		var regionEle = document.createElement("span");
		var self = this;
		var label = locName;

		if ( region.isStateOrProvince() ) {
			label = region.getShortestName();
			containerNode = document.getElementById("stateNames");
		} else {
			containerNode = document.getElementById("countryNames");
		}

		label = label.replace(" ", "&nbsp;");

		var templateHtml = '{label}<div class="tooltiptext"><table>'
			+ '<tr><td>Region:</td><td>{name}</td></tr>'
			+ '<tr><td>Population:</td><td>{population}</td></tr>'
			+ '<tr><td>Beds/1K:</td><td>{beds}</td></tr>'
			+ '<tr><td>Confirmed:</td><td>{confirmed}</td></tr>'
			+ '<tr><td></td><td>{confirmedPerM}/1M Pop</td></tr>'
			+ '<tr><td>Deaths:</td><td>{deaths}</td></tr>'
			+ '<tr><td></td><td>{deathsPerM}/1M Pop</td></tr>'
		  + '</table><i></i></div>';

		var confirmed 			= region.getLatestCount("confirmed");
		var deaths 					= region.getLatestCount("deaths");
		var population 			= region.getPopulation();
		var confirmedPer1M 	= 1000000.0 * parseFloat(confirmed) / parseFloat(population);
		var deathsPer1M 		= 1000000.0 * parseFloat(deaths)    / parseFloat(population);
		var bedsPer1K				= region.getBeds() * 1000.0 / population;

		templateHtml = templateHtml.replace("{label}", 					label );
		templateHtml = templateHtml.replace("{name}", 					region.getName() );
		templateHtml = templateHtml.replace("{population}", 		App.numberFormatter( population, 		2) );
		templateHtml = templateHtml.replace("{beds}", 					App.numberFormatter( bedsPer1K, 			1) );
		templateHtml = templateHtml.replace("{confirmed}", 			App.numberFormatter( confirmed, 			2) );
		templateHtml = templateHtml.replace("{confirmedPerM}",	App.numberFormatter( confirmedPer1M,	2) );
		templateHtml = templateHtml.replace("{deaths}", 				App.numberFormatter( deaths, 				2) );
		templateHtml = templateHtml.replace("{deathsPerM}", 		App.numberFormatter( deathsPer1M,		2) );

		var clickFunc = function() {
			if ( !region.isShowing() && self.FirstRegion ) {
				self.setLocationState("Global", false, false );
				this.FirstRegion = false;
			}
			self.toggleLocation(locName);

		}

		regionEle.className = region.isShowing() ? this.RegionButtonSelectedClass : this.ButtonDeselectedClass;
		regionEle.id = locName;
		regionEle.onclick = clickFunc;
		regionEle.innerHTML = templateHtml;
		containerNode.appendChild(regionEle);
	}


	static numberFormatter( value, decimals=4 ) {
		var suffix = "";
		var fractStr = "";

		if ( value > 1000000000 ) {
			value = parseFloat(value) / 1000000000;
			suffix = "B"
		} else if ( value > 1000000 ) {
			value = parseFloat(value) / 1000000;
			suffix = "M"
		} else if ( value > 1000 ) {
			value = parseFloat(value) / 1000;
			suffix = "K"
		}

		var whole = parseInt(value);

		if (decimals > 0 && value != parseInt(value)) {
			value = value + 5 / Math.pow( 10, decimals+1 );		// round
			whole = parseInt(value);

			fractStr = ".";
			var fraction = value - whole;
			for(var i = 0; i < decimals; i++) {
				fraction *= 10.0;
				var fractDigit = parseInt(fraction);
				fractStr += fractDigit.toString();
				fraction -= fractDigit;
			}
		}

		return whole + fractStr + suffix;
	}


	handleFileSelect(evt) {
		evt.stopPropagation();
		evt.preventDefault();

		var files = evt.dataTransfer.files; // FileList object.
		var regionFile = null;
		var caseFile = null;

		// files is a FileList of File objects. List some properties.
		for (var i = 0, f; f = files[i]; i++) {
			var caseType;

			if ( f.name.includes(".dat"))	caseFile = f;
			if ( f.name.includes(".csv"))	regionFile = f;
		}

		if ( regionFile ) {
			this.DataSet.processFile("regions", regionFile, this.regionFileLoadingDone.bind(this), this.loadingError.bind(this), caseFile );
		} else if ( caseFile ){
			this.DataSet.processFile("cases", caseFile, this.loadingDone.bind(this), this.loadingError.bind(this) );
		}
	}



	regionFileLoadingDone( dataSet, caseFile ) {
		dataSet.processFile("cases", caseFile, this.loadingDone.bind(this), this.loadingError.bind(this) );
	}



	regionUrlLoadingDone( dataSet, privateData ) {
		dataSet.processUrl("cases", this.DataSetsPath + this.casesUrl, this.loadingDone.bind(this), this.loadingError.bind(this) );
	}



	loadingDone(dataSet) {
		// now that all the counts have been loaded,
		// calculate the missing aggregates (if any)
		// from each region's subregions.

		dataSet.calculateCountAggregates();

		dataSet.showDefaultRegions( this.UrlParams );

		if (!dataSet.anyShowing()) {
			this.setLocationState("Global", true, false );
		}

		this.setupSectionPanel( "countryNames");
		this.setupSectionPanel( "stateNames");

		var dropZone = document.getElementById('dropZone');
		dropZone.style.visibility = "hidden";

		this.initSlider( "startDay", 0, this.getMaxStartDay(), this.startDayChanged.bind(this) );
		this.initSlider( "smooth", 1, this.getMaxSmooth(), this.smoothChanged.bind(this) );

		this.setStartDay( this.defaultInteger("day", 0, this.getMaxStartDay(), 0), false);
		this.setSmooth( this.defaultInteger("smooth", 1, this.getMaxSmooth(), this.DefaultSmooth), false);

		this.sortBy("Country", "Count");
		this.sortBy("State", "Count");

		this.drawChart();
	}

	loadingError(dataSet) {
		console.log("Error, could not load dataset.");
		this.addDropZone();
	}



	handleDragOver(evt) {
		evt.stopPropagation();
		evt.preventDefault();
		evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
	}



	initSlider( name, min, max, changedFunc ) {
		var slider = document.getElementById(name);
		var output = document.getElementById(name + "Value");
		output.innerHTML = slider.value;

		slider.min = min;
		slider.max = max;

		slider.oninput = function() {
		  output.innerHTML = this.value;
			changedFunc( parseInt(this.value) );
		}
	}


	smoothChanged( newValue ) {
		this.Smooth = newValue;
		this.drawChart();
	}

	setSmooth( smooth ) {
		this.setSlider( "smooth", smooth );
		this.Smooth = smooth;
	}


	getMaxStartDay() {
		return this.DataSet.getTotalDays() - 5;
	}

	getMaxSmooth() {
		return 10;
	}

	startDayChanged( newValue ) {
		this.StartDay = newValue;
		this.drawChart();
	}

	setStartDay( startDay ) {
		this.setSlider( "startDay", startDay );
		this.StartDay = startDay;
	}

	setSlider( name, value ) {
		var slider = document.getElementById(name);
		var output = document.getElementById(name + "Value");

		slider.value = value;
		output.innerHTML = value.toString();

	}

	initializeButtons() {
		this.setStartDay( this.defaultInteger("day", 0, this.getMaxStartDay(), 0), false);
		this.setSmooth( this.defaultInteger("smooth", 1, this.getMaxSmooth(), 1), false);

		this.setLogarithmic( this.defaultBool("log", false), false);
		this.setAlignDayZero(this.defaultBool("align0", false), false);
		this.setCountryLabel(this.defaultBool("label", true), false);

		this.setDelta(this.defaultString("delta", "cumulative"), false);
		this.setCountRatio(this.defaultString("ratio", "absolute"), false);
		this.setCaseType(this.defaultString("type", "confirmed"), false);
		this.setChartType( this.defaultString("chart", "line"), false);
	}


	defaultString(key, defaultValue) {
		if (key in this.UrlParams && typeof this.UrlParams[key] !== "undefined" && this.UrlParams[key] != "") {
			return this.UrlParams[key];
		}
		return defaultValue;
	}

	defaultBool(key, defaultValue ) {
		if (key in this.UrlParams) {
			if (this.UrlParams[key] == 'true' || typeof this.UrlParams[key] === "undefined" ) {
				return true;
			} else {
				return false;
			}
		}
		return defaultValue;
	}

	defaultInteger(key, minValue, maxValue, defaultValue ) {
		if (key in this.UrlParams && typeof this.UrlParams[key] !== "undefined") {
			var value = parseInt(this.UrlParams[key]);
			if ( value < minValue) value = minValue;
			if ( value > maxValue) value = maxValue;
			return value;
		} else {
			return defaultValue;
		}
	}


	updatePageUrl( showingRegions ) {
		var params = [];

		if (this.Logarithmic)				params.push("log");
		if (this.AlignDayZero)			params.push("align0");
		if (this.ShowCountryLabel)	params.push("label");

		if (parseInt(this.StartDay))					params.push("day=" + this.StartDay.toString() );
		if (parseInt(this.Smooth))						params.push("smooth=" + this.Smooth.toString() );

		params.push("delta=" + this.Delta);
		params.push("ratio=" + this.CountRatio);
		params.push("chart=" + this.ChartType);
		params.push("type=" + this.CaseType);

		for(var r=0; r < showingRegions.length; r++) {
			var region = showingRegions[r];
			if ( region.isShowing() ) {
				params.push( region.getShortestName() );
			}
		}

		var paramString = params.join("&");
		var url = window.location.origin + window.location.pathname + "?" + paramString;

		window.history.replaceState( null, "", url );

		/**** NOTE: DOES NOT WORK FOR DYNAMICALLY UPDATING ***/
		/* Still useful for FB? */
		var metaNode = document.querySelector('meta[property="og:url"]');
		metaNode.setAttribute("content", url);

		/**** NOTE: DOES NOT WORK FOR DYNAMICALLY UPDATING
		var shareThisNode = document.getElementById( "sharethis" );
		shareThisNode.setAttribute("data-url", url );
		shareThisNode.setAttribute("data-title", this.currentChartTitle );
		***/

		/**** NOTE: DOES NOT WORK FOR DYNAMICALLY UPDATING
		var shareThisNodes = document.getElementsByClassName("st-btn");
		for(var idx=0; idx < shareThisNodes.length; idx++) {
			shareThisNodes[idx].setAttribute("data-url", url );
			shareThisNodes[idx].setAttribute("data-title", this.currentChartTitle );
		}
		****/

		/**** NOTE: DOES NOT WORK FOR DYNAMICALLY UPDATING
		window.__sharethis__.load('sharethis-inline-share-buttons', {
		  url: url,
		  title: this.currentChartTitle
		});
		****/

		/**** NOTE: DOES NOT WORK FOR DYNAMICALLY UPDATING
		window.__sharethis__.initialize();
		****/

		window.__sharethis__.href = url;


	}


	getUrlVars() {
		var vars = {};
		var uri = decodeURIComponent( window.location.href);

		var parts = uri.replace(/[?&]+([^=&]+)=?([^&]*)?/gi, function(m,key,value) {
			vars[key] = value;
			});
		return vars;
	}



	addToolTip( nodeID, helpText ) {
		var node = document.getElementByID( nodeID );
		var tooltipNode = document.createElement("span");

		tooltipNode.className = "tooltiptext";
		tooltipNode.innerHTML = helpText;

		node.appendChild(tooltipNode);

	}
};
