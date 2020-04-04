/****************************************
** App.js
** by: Michael T Hoffman
**
** Main app handling code
**
** TODO
**
**	- Disambiguate when provinces from different countries are same name, like "Diamond Princess"
**			Make sure this fixes duplicated entry in US States
**			and fixes split country for Diamond Princess
**	- Only turn "Global" line on when no countries OR states are selected
**	- Add "per beds" capability
**	- Ability to sort countries and states
**	- Fix missing gPopulationLookup and bed counts
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

		this.FirstCountry				= true;	 // first time a country is selected, "Global" is deselected
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
				"StartDay":					parseInt(this.StartDay)
			};

			var showingRegions = this.DataSet.getAllShowingRegions();
			showingRegions = Region.sortRegions( showingRegions, this.CaseType );

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


	sortBy( category, sortType ) {
		var allowedFields = ["Count", "Name"];
		if (allowedFields.includes(sortType) && this.DataSet ) {
			var sortField = sortType;

			if ( sortField == "Count" )
				sortField = this.CaseType;

			switch( category ) {
				case "Country":	this.addCountryNameButtons(sortField);	break;
				case "State": 	this.addStateNameButtons(sortField);		break;
			}

			// disambiguate element IDs
			var fullFields = [];
			for( var f = 0; f < allowedFields.length; f++ ) {
				var fullField = "sort" + category + allowedFields[f];
				fullFields.push( fullField );
				if ( sortType === allowedFields[f] )  sortType = fullField;
			}

			this.toggleButtonSet(fullFields, sortType);
		}
	}


	setDelta(deltaType, doDrawChart = true) {
		var allowedTypes = ["cumulative", "deltaCount", "deltaPercent"];
		if (allowedTypes.includes(deltaType) && deltaType != this.Delta) {
			this.Delta = deltaType;
			this.toggleButtonSet(allowedTypes, deltaType)
			if (deltaType != "cumulative") {
				this.setCountRatio("absolute", false);
				this.setChartType("stackedColumn", false);
			}
			this.drawChart(doDrawChart);
		}
	}


	setLogarithmic(isLog, doDrawChart = true) {
		if (isLog != this.Logarithmic) {
			this.Logarithmic = isLog;
			this.toggleButtonPair("logarithmic", "linear", isLog);
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
			node.className = (node.id == curState ? this.SpecialButtonSelectedClass : this.ButtonDeselectedClass);
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


	addCountryNameButtons(sortField) {
		var countryContainerNode = document.getElementById("countryNames");

		countryContainerNode.innerHTML = "";

		var self = this;

		this.createSpecialButton( "countryNames", "All", function() { self.selectAllCountries(true); } );
		this.createSpecialButton( "countryNames", "None", function() { self.selectAllCountries(false); } );

		var globalRegion = this.DataSet.getRegionByName("Global");

		if ( globalRegion ) {
			this.createRegionButton( globalRegion );
		}

		var countries = this.DataSet.getCountryList( sortField );

		for (var c = 0; c < countries.length; c++) {
			this.createRegionButton(countries[c]);
		}
	}


	addStateNameButtons(sortField) {
		var locsStr = "";

		var stateContainerNode = document.getElementById("stateNames");
		stateContainerNode.innerHTML = "";

		var self = this;

		this.createSpecialButton( "stateNames", "All", function() { self.selectAllStates(true); } );
		this.createSpecialButton( "stateNames", "None", function() { self.selectAllStates(false); } );

		var subRegions = this.DataSet.getSubRegionsForCountry( "US", sortField );

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
		var countryEle = document.createElement("span");
		var self = this;
		var label = locName;

		if ( region.isStateOrProvince() ) {
			label = region.getShortestName();
			containerNode = document.getElementById("stateNames");
		} else {
			containerNode = document.getElementById("countryNames");
		}

		label = label.replace(" ", "&nbsp;");

		var clickFunc = function() {
			if ( !region.isShowing() && self.FirstCountry ) {
				self.setLocationState("Global", false, false );
				this.FirstCountry = false;
			}
			self.toggleLocation(locName);

		}

		countryEle.className = region.isShowing() ? this.RegionButtonSelectedClass : this.ButtonDeselectedClass;
		countryEle.id = locName;
		countryEle.onclick = clickFunc;
		countryEle.innerHTML = label;
		containerNode.appendChild(countryEle);
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

		this.changeCaseType("confirmed", false );

		this.setupSectionPanel( "countryNames");
		this.setupSectionPanel( "stateNames");

		var dropZone = document.getElementById('dropZone');
		dropZone.style.visibility = "hidden";

		this.initSlider();

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



	initSlider() {
		var slider = document.getElementById("startDay");
		var output = document.getElementById("startDayValue");
		var appSelf = this;
		output.innerHTML = slider.value = 0;

		slider.max = this.getMaxStartDay();

		slider.oninput = function() {
		  output.innerHTML = this.value;
			appSelf.startDayChanged( parseInt(this.value) );
			appSelf.drawChart();
		}
	}


	getMaxStartDay() {
		return this.DataSet.getTotalDays() - 5;
	}


	startDayChanged( newValue ) {
		this.StartDay = newValue;
	}

	setStartDay( startDay ) {
		var slider = document.getElementById("startDay");
		var output = document.getElementById("startDayValue");

		slider.value = startDay;
		output.innerHTML = startDay.toString();
		this.StartDay = startDay;
	}


	initializeButtons() {
		this.setStartDay( this.defaultInteger("day", 0, this.getMaxStartDay(), 0), false);

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

		if (this.StartDay)					params.push("day" + this.StartDay.toString() );
		if (this.Delta)							params.push("delta");
		if (this.Logarithmic)				params.push("log");
		if (this.AlignDayZero)			params.push("align0");
		if (this.ShowCountryLabel)	params.push("label");

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
