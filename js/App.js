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
		this.DataSetsPath			= "COVID-19/csse_covid_19_data/csse_covid_19_time_series/";
		this.ConfirmedDataUrl = "time_series_19-covid-Confirmed.csv";
		this.DeathsDataUrl		= "time_series_19-covid-Deaths.csv";
		this.RecoveredDataUrl = "time_series_19-covid-Recovered.csv";
		this.DataSets					= {};
		this.AppState					= {};
		this.CurrentDataSet		= null;
		this.Chart						= null;

		this.CountRatio					= null;
		this.Delta							= null;
		this.Logarithmic				= null;
		this.ChartType					= null;
		this.AlignDayZero				= null;
		this.ShowCountryLabel		= null;
		this.DataSetType				= null;

		this.FirstCountry				= true;	 // first time a country is selected, "Global" is deselected
		this.DropZoneAdded			= false;
		this.RegionButtonClass					= "buttonBase button";
		this.RegionButtonSelectedClass	= "buttonBase buttonSelected";
		this.SpecialButtonClass					= "buttonBase buttonSpecial";

		this.SectionAnimations = {};		// place to manage section animations

		this.UrlParams = this.getUrlVars();

		CanvasJS.addColorSet("oneColor", ["#880088"]);

		this.Chart = new Chart();

		this.initializeButtons();

		var loadingDoneFunc = this.loadingDone.bind(this);
		var loadingErrorFunc = this.loadingError.bind(this);

		new DataSet("confirmed").processUrl(this.DataSetsPath + this.ConfirmedDataUrl, this.UrlParams, loadingDoneFunc, loadingErrorFunc );
		new DataSet("deaths").processUrl(this.DataSetsPath + this.DeathsDataUrl, this.UrlParams, loadingDoneFunc, loadingErrorFunc );
		new DataSet("recovered").processUrl(this.DataSetsPath + this.RecoveredDataUrl, this.UrlParams, loadingDoneFunc, loadingErrorFunc );

		this.setupSectionPanel( "chartOptions");
		this.setupSectionPanel( "countryNames");
		this.setupSectionPanel( "stateNames");
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


	loadingDone(dataSet) {
		this.DataSets[dataSet.Type] = dataSet;

		if (dataSet.Type == this.DataSetType || this.DataSetType == null) {
			dataSet.showDefaultRegions( this.UrlParams );

			this.setDataSetType( dataSet.Type );

			if (!dataSet.anyShowing()) {
				this.setLocationState("Global", true, false );
			}

		this.setupSectionPanel( "countryNames");
		this.setupSectionPanel( "stateNames");
		this.drawChart();
		}
	}

	loadingError(dataSet) {
		console.log("Error, could not load dataset.");
		this.addDropZone();
	}

	addDropZone() {
		if ( !this.DropZoneAdded ) {

			// Setup the dnd listeners.
			var dropZone = document.getElementById('dropZone');
			dropZone.innerHTML = "Drop csse_covid_19_data csv file here";
			dropZone.className = "dropZone";
			dropZone.addEventListener('dragover', this.handleDragOver.bind(this), false);
			dropZone.addEventListener('drop', this.handleFileSelect.bind(this), false);
			this.DropZoneAdded = true;
		}
	}

	changeDataSet(dataSet) {
		this.DataSetType = dataSet.Type;
		var locNamesToShow = this.getAllShowingLocationNames();
		this.CurrentDataSet = dataSet;
		this.setLocationsToShow( locNamesToShow );
		this.addCountryNameButtons();
		this.addStateNameButtons();
		this.drawChart();
	}

	getAllShowingLocationNames() {
		var allShowing = [];

		if (this.CurrentDataSet) {
			for(var l = 0; l < this.CurrentDataSet.Locations.length; l++ ) {
				if ( this.CurrentDataSet.Locations[l].Showing)
					allShowing.push( this.CurrentDataSet.Locations[l].LocationName );
			}
		}

		return allShowing;
	}

	setLocationsToShow( locationNames ) {
		if (this.CurrentDataSet) {
			for(var l = 0; l < locationNames.length; l++ ) {
				if ( locationNames[l] in this.CurrentDataSet.LocationByName ) {
					this.CurrentDataSet.LocationByName[ locationNames[l] ].Showing = true;
				}
			}
		}
	}

	drawChart(drawChart = true) {
		if (drawChart && this.CurrentDataSet != null) {
			var chartParameters = {
				"CountRatio":				this.CountRatio,
				"Delta":						this.Delta,
				"Logarithmic":			this.Logarithmic,
				"ChartType":				this.ChartType,
				"AlignDayZero":			this.AlignDayZero,
				"ShowCountryLabel": this.ShowCountryLabel
			};

			this.Chart.drawChart(this.CurrentDataSet, chartParameters);
			this.updatePageUrl();	// if we need to update chart, we also need to update the url (for sharing)
		}
	}


	setDataSetType(dataSetType, doDrawChart = true) {
		var allowedTypes = ["confirmed", "deaths", "recovered"];

		if (allowedTypes.includes(dataSetType)) {
			this.DataSetType = dataSetType;
			this.toggleButtonSet(allowedTypes, dataSetType);

			if ( dataSetType in this.DataSets ) {
				this.changeDataSet( this.DataSets[dataSetType] );
			}
		}
	}

	selectAllCountries( state, doDrawChart = true ) {
		this.selectAllRegions( "country", state, doDrawChart )
	}

	selectAllStates( state, doDrawChart = true ) {
		this.selectAllRegions( "state", state, doDrawChart )
	}

	selectAllRegions(regionType, state, doDrawChart = true) {
		var dataSet = this.CurrentDataSet;
		var locations = dataSet.Locations;

		for (var loc = 0; loc < locations.length; loc++) {
			if (locations[loc].RegionType == regionType)
				this.setLocationState(locations[loc].LocationName, state, false);
		}

		this.setLocationState("Global", !state, false);
		this.drawChart(doDrawChart);
	}


	setAlignDayZero(isAlignDayZero, doDrawChart = true) {
		if (isAlignDayZero != this.AlignDayZero) {
			this.AlignDayZero = isAlignDayZero;
			this.toggleButtonPair("alignDayZero", "absoluteDates", isAlignDayZero);
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
				this.setCountRatio(this.defaultString("ratio", "absolute"), false);
			}
		}
	}


	setDelta(isDelta, doDrawChart = true) {
		if (isDelta != this.Delta) {
			this.Delta = isDelta;
			this.toggleButtonPair("delta", "cumulative", isDelta);
			if (isDelta) {
				this.setCountRatio(this.defaultString("ratio", "absolute"), false);
				this.setChartType( this.defaultString("chart", "stackedColumn"), false);
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
		this.setButtonState(trueNodeId, state);
		this.setButtonState(falseNodeId, !state);

	}


	toggleButtonSet(nodeIdList, curState) {
		for (var i = 0; i < nodeIdList.length; i++) {
			var node = document.getElementById(nodeIdList[i]);
			node.className = (node.id == curState ? this.RegionButtonSelectedClass : this.RegionButtonClass);
		}
	}


	setButtonState(nodeId, state) {
		var node = document.getElementById(nodeId);
		node.className = (state ? this.RegionButtonSelectedClass : this.RegionButtonClass);
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
		var loc = this.CurrentDataSet.LocationByName[locationName];

		this.setLocationState(locationName, !loc.Showing, doDrawChart);
	}


	setLocationState(locationName, state, doDrawChart = true) {
		if ( this.CurrentDataSet != null) {
			var loc = this.CurrentDataSet.LocationByName[locationName];

			loc.Showing = state;
			this.setButtonState(locationName, state);
			this.drawChart(doDrawChart);
		}
	}


	addCountryNameButtons() {
		var locs = this.CurrentDataSet.Locations;
		var locsStr = "";

		var countryContainerNode = document.getElementById("countryNames");

		countryContainerNode.innerHTML = "";

		var self = this;

		this.createSpecialButton( "countryNames", "All", function() { self.selectAllCountries(true); } );
		this.createSpecialButton( "countryNames", "None", function() { self.selectAllCountries(false); } );

		if ( "Global" in this.CurrentDataSet.LocationByName) {
			this.createRegionButton(this.CurrentDataSet.LocationByName["Global"] );
		}

		for (var l = 0; l < locs.length; l++) {
			if (locs[l].RegionType == "country") {
				this.createRegionButton(locs[l]);
			}
		}
	}

	addStateNameButtons() {
		var locs = this.CurrentDataSet.Locations;
		var locsStr = "";

		var stateContainerNode = document.getElementById("stateNames");
		stateContainerNode.innerHTML = "";

		var self = this;

		this.createSpecialButton( "stateNames", "All", function() { self.selectAllStates(true); } );
		this.createSpecialButton( "stateNames", "None", function() { self.selectAllStates(false); } );

		for (var l = 0; l < locs.length; l++) {
			if (locs[l].RegionType == "state") {
				this.createRegionButton( locs[l], true );
			}
		}
	}


	createSpecialButton( containerName, label, clickFunc ) {
		var containerNode = document.getElementById(containerName);
		var specialEle = document.createElement("span");

		specialEle.className = this.SpecialButtonClass;
		specialEle.id = label;
		specialEle.onclick = clickFunc;
		specialEle.innerHTML = label;
		containerNode.appendChild(specialEle);
	}


	createRegionButton( loc, isAState = false ) {
		var locName = loc.LocationName
		var containerNode;
		var countryEle = document.createElement("span");
		var self = this;
		var label = locName;

		if ( isAState ) {
			label = loc.Province_State;
			containerNode = document.getElementById("stateNames");
		} else {
			containerNode = document.getElementById("countryNames");
		}

		label = label.replace(" ", "&nbsp;");

		var clickFunc = function() {
			if ( !self.CurrentDataSet.LocationByName[locName].Showing && self.FirstCountry ) {
				self.setLocationState("Global", false, false );
				this.FirstCountry = false;
			}
			self.toggleLocation(locName);

		}

		countryEle.className = loc.Showing ? this.RegionButtonSelectedClass : this.RegionButtonClass;
		countryEle.id = locName;
		countryEle.onclick = clickFunc;
		countryEle.innerHTML = label;
		containerNode.appendChild(countryEle);
	}


	handleFileSelect(evt) {
		evt.stopPropagation();
		evt.preventDefault();

		var files = evt.dataTransfer.files; // FileList object.

		// files is a FileList of File objects. List some properties.
		for (var i = 0, f; f = files[i]; i++) {
			var dataSetType;

			if ( f.name.includes("Confirmed"))	dataSetType = "confirmed";
			if ( f.name.includes("Deaths"))			dataSetType = "deaths";
			if ( f.name.includes("Recovered"))	dataSetType = "recovered";

			this.DataSets[dataSetType] = new DataSet(dataSetType);
			this.DataSets[dataSetType].processFile(f, this.UrlParams, this.loadingDone.bind(this), this.loadingError.bind(this) );
		}
	}




	handleDragOver(evt) {
		evt.stopPropagation();
		evt.preventDefault();
		evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
	}




	initializeButtons() {
		this.setDelta(this.defaultBool("delta", false), false);
		this.setLogarithmic( this.defaultBool("log", false), false);
		this.setAlignDayZero(this.defaultBool("align0", false), false);
		this.setCountryLabel(this.defaultBool("label", true), false);

		this.setCountRatio(this.defaultString("ratio", "absolute"), false);
		this.setDataSetType(this.defaultString("type", "confirmed"), false);
		this.setChartType( this.defaultString("chart", "line"), false);
	}


	defaultString(key, defaultValue) {
		if (key in this.UrlParams && typeof this.UrlParams[key] !== "undefined" ) {
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


	updatePageUrl() {
		var params = [];

		if (this.Delta)							params.push("delta");
		if (this.Logarithmic)				params.push("log");
		if (this.AlignDayZero)			params.push("align0");
		if (this.ShowCountryLabel)	params.push("label");

		params.push("ratio=" + this.CountRatio);
		params.push("chart=" + this.ChartType);
		params.push("type=" + this.CurrentDataSet.Type);

		for(var l=0; l < this.CurrentDataSet.Locations.length; l++) {
			var loc = this.CurrentDataSet.Locations[l];
			if ( loc.Showing ) {
				if ( loc.Abbreviation != "" )
					params.push( loc.Abbreviation );
				else
					params.push( loc.LocationName );
			}
		}

		var paramString = params.join("&");
		var url = window.location.origin + window.location.pathname + "?" + paramString;

		window.history.replaceState( null, "", url );
	}


	getUrlVars() {
		var vars = {};
		var uri = decodeURIComponent( window.location.href);

		var parts = uri.replace(/[?&]+([^=&]+)=?([^&]*)?/gi, function(m,key,value) {
			vars[key] = value;
			});
		return vars;
	}

};
