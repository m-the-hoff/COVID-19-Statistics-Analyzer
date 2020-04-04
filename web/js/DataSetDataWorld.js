
/**************************************************
** DataSetDataWorld.js
** by: Michael T Hoffman
**
** Manage datasets retrieved from data.world
** by the COVID-19 Data Resource Hub
**
**		https://data.world/covid-19-data-resource-hub
**
** The data is retrieved by the
** get-data/processDataWorld.py python script
** that converts the large data set into
** a more compact format in two files that
** are then stored in the COVID-19-data-resource-hub
** directory.
**
** Dataset contains:
**	- confirmed
**	- deaths
**
**************************************************/




class Region {
	// used for getting to correct data for sorting comparision
	static ConfirmedAccessorFunc 	= function(a) { return a.Counts.confirmed[ a.Counts.confirmed.length - 1 ]; };
	static DeathsAccessorFunc 		= function(a) { return a.Counts.deaths   [ a.Counts.deaths.length    - 1 ]; };
	static RecoveredAccessorFunc 	= function(a) { return a.Counts.recovered[ a.Counts.recovered.length - 1 ]; };
	static ActiveAccessorFunc 		= function(a) { return a.Counts.active   [ a.Counts.active.length    - 1 ]; };

	constructor( fields ) {


		this.Parent 				= null;																	// set when added to a parent region
		this.SubRegions 		= {};																		// province/state if a country, or county if a state
		this.ID							= parseInt(fields.id);
		this.Type						= fields.regionType;										// "country", "state", "province", "county", "other"
		this.Level					= parseInt(fields.regionLevel);					// 1=country/other, 2=province/state, 3=county
		this.LocationName 	= this.normalizeRegionSynonyms(fields.locationName);
		this.ShortName 			= fields.altLocationName;
		this.Longitude			= parseInt(fields.longitude);
		this.Latitude				= parseInt(fields.latitude);
		this.Showing				= false;
		this.BaseDate				= new Date(2020, 1, 22, 0, 0, 0, 0);	// base date is always 2020-01-22
		this.FirstNonZeroIndex = null;

		if (this.Level < 2 || this.Type == "state") {
			this.Population			= this.lookupPopulation();
			this.Beds						= this.lookupBeds();
		}

		switch( this.Level ) {
			case 0: this.RegionName = "Global";							break;
			case 1: this.RegionName = fields.regionLevel1;	break;
			case 2: this.RegionName = fields.regionLevel2;	break;
			case 3: this.RegionName = fields.regionLevel3;	break;
		}

		this.Counts = {
			"confirmed": 		[],
			"deaths": 			[],
			"recovered": 		[],
			"active": 			[]
		};

	}


	normalizeRegionSynonyms(regionName) {
		if (regionName in gRegionSynonyms) {
			regionName = gRegionSynonyms[regionName];
		}
		return regionName;
	}


	hasSubRegions() {
		return this.SubRegions.keys().length > 0;
	}

	getNthCaseDate( n ) {
		var futureDate = new Date(this.BaseDate);
		futureDate.setDate(futureDate.getDate() + n);
		return futureDate;
	}


	getBeds() {
		return this.Beds;
	}


	getPopulation() {
		return this.Population;
	}


	getLatestCount( caseType ) {
		var caseCounts;

		switch( caseType ) {
			case "confirmed":		caseCounts = this.Counts.confirmed;	break;
			case "deaths":			caseCounts = this.Counts.deaths;		break;
			case "recovered":		caseCounts = this.Counts.recovered;	break;
			case "active":			caseCounts = this.Counts.active;		break;
		}

		return caseCounts[ caseCounts.length - 1 ];
	}


	getLatestDelta( caseType ) {
		var caseCounts = this.getCaseCountsByCaseType( caseType );
		if ( caseCounts.length > 1)
			return caseCounts[ caseCounts.length - 1 ] - caseCounts[ caseCounts.length - 2 ];
		else
			return caseCounts[0];
	}


	getCaseCountsByCaseType( caseType ) {
		switch( caseType ) {
			case "confirmed":		return this.Counts.confirmed;
			case "deaths":			return this.Counts.deaths;
			case "recovered":		return this.Counts.recovered;
			case "active":			return this.Counts.active;
			default:						return null;
		}
	}


	getFirstNonZeroCaseIndex() {
		if ( this.FirstNonZeroIndex == null ) {
			var confirmedCounts = this.getCaseCountsByCaseType( "confirmed" );
			var deathsCounts 		= this.getCaseCountsByCaseType( "deaths" );

			for( var c = 0; c < confirmedCounts.length - 1; c++ ) {
				if ( confirmedCounts[c] > 0 || deathsCounts[c] > 0 ) {
					break;
				}
			}
			this.FirstNonZeroIndex = c;
		}

		return this.FirstNonZeroIndex;
	}


	isShowing() {
		return this.Showing;
	}


	setShowing( showing )
	{
		this.Showing = showing;
	}

	getName() {
		return this.LocationName;
	}

	getShortName() {
		return this.ShortName;
	}

	getShortestName() {
		if (this.ShortName && this.ShortName != "" ) {
			return this.ShortName;
		} else {
			return this.LocationName;
		}
	}

	addSubRegion( region ) {
		region.Parent = this;
		this.SubRegions[ region.RegionName ] = region;
	}


	isStateOrProvince() {
		return this.Type == "state" || this.Type == "province";
	}

	isCountry() {
		return this.Type == "country";
	}


	getSubRegionsList( sortField = null ) {
		var regions = [];

		for( var key in this.SubRegions ) {
			regions.push( this.SubRegions[key] );
		}

		if ( sortField != null) {
			Region.sortRegions( regions, sortField )
		}

		return regions;
	}



	getSubRegionByName( regionName ) {
		if (regionName in this.SubRegions ) {
			return this.SubRegions[ regionName ];
		} else {
			return null;
		}
	}


	setAllCounts( allCounts ) {
		for( var key in allCounts ) {
			this.setCounts( key, allCounts[key] );
		}
	}


	setCounts( category, counts ) {
		if (category in this.Counts ) {
			this.Counts[category] = counts;
		} else {
			console.log("ERROR - category does not exist: " + category );
		}
	}



	lookupBeds()
	 {
		if (this.LocationName in gBedsPer1KLookup && this.LocationName in gPopulationLookup) {
			return gBedsPer1KLookup[this.LocationName] * gPopulationLookup[this.LocationName] / 1000.0;
		} else if (this.ShortName in gBedsPer1KLookup && this.ShortName in gPopulationLookup) {
			return gBedsPer1KLookup[this.ShortName] * gPopulationLookup[this.ShortName] / 1000.0;
		} else {
			console.log("No beds (and population) found for: " + this.LocationName);
			return 0;
		}
	}



	lookupPopulation() {
		if (this.LocationName in gPopulationLookup) {
			return gPopulationLookup[this.LocationName];
		} else if (this.ShortName in gPopulationLookup) {
			return gPopulationLookup[this.ShortName];
		} else {
			console.log("No population found for: " + this.LocationName);
			return 0;
		}
	}


	calculateCountAggregates() {
		// recursively (depth first) calculate all missing
		// aggregates

		for( var key in this.SubRegions ) {
			this.SubRegions[key].calculateCountAggregates();
		}

		this.aggregateCaseCounts( "confirmed" );
		this.aggregateCaseCounts( "deaths" );
		this.aggregateCaseCounts( "recovered" );
		this.aggregateCaseCounts( "active" );
	}


	aggregateCaseCounts( caseType ) {
		var thisRegionCounts = this.Counts[caseType];

		for( var key in this.SubRegions ) {
			var subRegionCounts = this.SubRegions[key].getCaseCountsByCaseType( caseType );
			for( var idx = 0; idx < subRegionCounts.length; idx++ ) {
				if ( idx >= thisRegionCounts.length ) {
					thisRegionCounts.push( subRegionCounts[idx] );
				} else {
					thisRegionCounts[idx] += subRegionCounts[idx];
				}
			}
		}
	}


	// sortField   "Confirmed" | "Deaths" | "Recovered" | "Active" | "Name" | "Population" | "Beds" | "PerCapita"

	static sortRegions( regionList, sortField ) {
		var compareFunc;
		var accessorFunc;

		var countCompareDescendingFunc = function(a, b) {
				return accessorFunc(b) - accessorFunc(a);
		};

		var strCompareFunc = function(a, b) {
			var strA = a[sortField];
			var strB = b[sortField];

			return strA.localeCompare(strB);
		}

		compareFunc = countCompareDescendingFunc;

		switch( sortField.toLowerCase() ) {
			case "confirmed":		accessorFunc = Region.ConfirmedAccessorFunc;		break;
			case "deaths":			accessorFunc = Region.DeathsAccessorFunc;				break;
			case "recovered":		accessorFunc = Region.RecoveredAccessorFunc;		break;
			case "active":			accessorFunc = Region.ActiveAccessorFunc;				break;

			case "name":	sortField = "LocationName";
										compareFunc = strCompareFunc
										break;
		}

		return regionList.sort(compareFunc);
	}


}; // end of class Region




class DataSetDataWorld {

	constructor() {
		this.Loaded = false;
		this.RegionByName = {};						// Access regions by their LocationName field
		this.RegionByID = {};							// Access regions by their unique ID
		this.RegionsList = [];						// Full sorted list of regions for displaying sorted lists/buttons

		var globalFields = {
			"id":								0,
			"regionType":				"global",
			"regionLevel":			0,
			"regionName":				"Global",
			"locationName":			"Global",
			"altLocationName":	"",
			"longitude":				0,
			"latitude":					0
		};

		this.GlobalRegion = this.createRegion( globalFields );

		this.NextID = 10000;
	}


	getRegionByName( regionName ) {
		if ( regionName in this.RegionByName ) {
			return this.RegionByName[regionName];
		} else {
			return null;
		}
	}


	showDefaultRegions( defaultParams ) {
		for ( var key in defaultParams ) {
			if ( key in this.RegionByName ) {
				this.RegionByName[ key ].Showing = true;
			}
		}
	}


	anyShowing() {
		for (var r = 0; r < this.RegionsList.length; r++) {
			var region = this.RegionsList[r];
			if (region.getName() != "Global" && region.isShowing() )
				return true;
		}
		return false;
	}



	getCountryByName( countryName ) {
		return this.GlobalRegion.getSubRegionByName( countryName );
	}


	getCountryList( sortField = null ) {
		return this.GlobalRegion.getSubRegionsList( sortField );
	}


	getSubRegionsForCountry( countryName, sortField = null ) {
		var country = this.getCountryByName( countryName );
		if ( country ) {
			return country.getSubRegionsList( sortField );
		} else {
			return [];
		}
	}


	getAllShowingRegions() {
		var showingRegions = [];

		for(var r=0; r < this.RegionsList.length; r++) {
			var region = this.RegionsList[r];
			if ( region.isShowing() ) {
				showingRegions.push(region);
			}
		}

		return showingRegions;
	}



	processUrl(type, url, doneFunc, errorFunc, privateData = null ) {
		var self = this;

		// read text from URL location
		var request = new XMLHttpRequest();
		request.open('GET', url, true);

		if (type == "cases")
			request.responseType = "arraybuffer";

		request.setRequestHeader( "Cache-Control", "must-revalidate" );

		request.onreadystatechange = function() {
			if (request.readyState === 4 ) {
				if (request.status === 200) {
					var contentType = request.getResponseHeader('Content-Type');

					if (type == "regions")
						self.processRegionCSV(request.responseText);
					else if (type == "cases")
						self.processCasesDat(request.response);

					this.Loaded = true;
					doneFunc(self, privateData);
				} else {
					errorFunc(self, privateData);
				}
			}
		};

		request.send(null);
	}


	processFile(type, file, doneFunc, errorFunc, privateData = null ) {
		var self = this;
		var reader = new FileReader();
		reader.onload = function() {

			if (type == "regions")
				self.processRegionCSV(reader.result);
			else if (type == "cases")
				self.processCasesDat(reader.result);

			doneFunc( self, privateData );
		};

		if (type == "regions")
			reader.readAsText(file);
		else if (type == "cases")
			reader.readAsArrayBuffer(file);
	}


	processRegionCSV(text) {
		var regionList = this.extractAllRegions(text);
		this.createRegionObjectsFromFields(regionList);
	}


	extractAllRegions(text) {
		var firstLine = true;
		var fieldNames = [];
		var allRegions = [];

		var lines = text.split('\n');

		for (var lineIdx = 0; lineIdx < lines.length; lineIdx++) {

			if (lines[lineIdx].length > 0) {
				var entries = this.parseLine(lines[lineIdx]);

				if (firstLine) {
					for (var k = 0; k < entries.length; k++) {
						fieldNames.push( entries[k] );
					}

					firstLine = false;
				} else {
					var fields = {}

					for( var f = 0; f < fieldNames.length; f++ ) {
						fields[ fieldNames[f] ] = entries[f];
					}

					allRegions.push(fields);
				}
			}
		}

		return allRegions;
	}



	parseLine(line) {
		var entries = [];
		var inQuote = false;
		var val = "";

		for (var i = 0; i < line.length; i++) {
			if (line[i] != '\n' && line[i] != '\r') {
				if (line[i] == '"') {
					inQuote = !inQuote;
				} else {
					if (inQuote) {
						val = val + line[i];
					} else {
						if (line[i] == ',') {
							entries.push(val);
							val = "";
						} else {
							val = val + line[i];
						}
					}
				}
			}
		}

		entries.push(val);

		return entries;
	}


	createRegionObjectsFromFields( regionList ) {

		// Make sure to add level 1 regions, then level 2, then 3

		regionList = this.sortRegionsByLevel( regionList );

		for( var r = 0; r < regionList.length; r++ ) {
			this.addRegionAtCorrectLevel( regionList[r] );
		}
	}



	sortRegionsByLevel( allRegions ) {
		var sortedRegions = allRegions.sort( function(a,b) {
				return a["regionLevel"] - b["regionLevel"];
			});

		return sortedRegions;
	}


	createRegion(fields) {
		var newRegion = new Region(fields);
		this.RegionByID[ newRegion.ID ] = newRegion;
		this.RegionByName[ newRegion.LocationName ] = newRegion;

		if (newRegion.ShortName != "") {
			this.RegionByName[ newRegion.ShortName ] = newRegion;
		}

		this.RegionsList.push(newRegion);
		return newRegion;
	}


	addRegionAtCorrectLevel( fields ) {
		/****
		* Expected fields:
		*
		*	id
		*	regionLevel				which level this region represents: 1, 2, 3
		* regionLevel1			country / region
		* regionLevel2			province / state
		* regionLevel3			county (of state)
		* regionType				"country", "province", "state", "county", "other"
		* locationName			full name
		* altLocationName		abbreviated alternative name
		* latitude					where region is located (center of region)
		* longitude
		*
		****/

		var newRegion = this.createRegion( fields );

		if ( fields.regionLevel == 1 ) {
			// we're adding a country level region

			if ( this.GlobalRegion.getSubRegionByName( fields.regionLevel1 )) {
				console.log("ERROR - Duplicate Level 1 Region: " + fields.regionLevel1 );
			} else {
				this.GlobalRegion.addSubRegion( newRegion );					// add country/region
			}
		} else {
			// we're either adding a level 2 or 3, so get the country from region level 1

			var regionLevel1 = this.GlobalRegion.getSubRegionByName( fields.regionLevel1 );

			if ( regionLevel1 == null ) {
				regionLevel1 = this.addRegionLevel(this.GlobalRegion, "country", 1, fields.regionLevel1);
				console.log("WARNING - Adding missing Region level 1: " + fields.regionLevel1 );
			}

			var regionLevel2 = regionLevel1.getSubRegionByName( fields.regionLevel2 );

			if (fields.regionLevel == 2 ) {
				// if we're adding a region level 2 and it's already there, then that's an error
				if (regionLevel2 != null ) {
					console.log("ERROR - Duplicate Level 2 Region: " + fields.regionLevel2 + ", " + fields.regionLevel1 );
				} else {
					regionLevel1.addSubRegion( newRegion );
				}
			} else {
				// region level 3
				if ( regionLevel2 == null ) {
					var type;

					if (fields.regionLevel1 === "US") {
						type = "state";
					} else {
						type = "province";
					}
					regionLevel2 = this.addRegionLevel(regionLevel1, type, 2, fields.regionLevel2);
					console.log("WARNING - Adding missing Region level 2: " + fields.regionLevel2 + ", " + fields.regionLevel1);
				}

				if ( regionLevel2.getSubRegionByName( fields.regionLevel3 ) ) {
					console.log("ERROR - Duplicate Level 3 Region: " + fields.regionLevel3 + ", " + fields.regionLevel2 );
				} else {
					regionLevel2.addSubRegion( newRegion );
				}
			}
		}
	}


	addRegionLevel( parentRegion, type, level, name ) {
		var region1fields = {
			"id":									this.NextID++,
			"regionLevel":				level,
			"regionLevel1":				name,
			"regionLevel2":				"",
			"regionLevel3":				"",
			"regionType":					type,
			"locationName":				name,
			"altLocationName":		"",
			"latitude":						0,
			"longitude":					0
		};

		var region = this.createRegion( region1fields );
		parentRegion.addSubRegion( region );
		return region;
	}

	readCountSeries( byteStream ) {
		var counts = [];
		var max = byteStream.readVarInt();
		for( var i = 0; i < max; i++ ) {
			counts.push( byteStream.readVarInt() );
		}

		return counts;
	}


	processCasesDat(arrayBuffer) {
		var byteStream = new ByteStream( arrayBuffer );

		var numEntries = byteStream.readVarInt();
		for( var e = 0; e < numEntries; e++ ) {
			var id = byteStream.readVarInt();
			var counts = { "confirmed": [], "deaths": [], "recovered": [], "active": [] };

			counts["confirmed"] 	= this.readCountSeries(byteStream);
			counts["deaths"] 			= this.readCountSeries(byteStream);
			counts["recovered"] 	= this.readCountSeries(byteStream);
			counts["active"] 			= this.readCountSeries(byteStream);

			if (id in this.RegionByID) {
				var region = this.RegionByID[ id ];
				region.setAllCounts( counts );
			} else {
				console.log("Region not found for ID: " + id.toString() );
			}

		}
	}




	sortBy( field ) {
		var sortKey;
		var ascending = true;
		var compareFunc;

		var countCompareFunc = function(a, b) {
			var countA;
			var countB;

			switch( sortKey ) {
				case "confirmed":		countA = a.Counts.confirmed;
														countB = b.Counts.confirmed;
														break;

				case "deaths":			countA = a.Counts.deaths;
														countB = b.Counts.deaths;
														break;

				case "recovered":		countA = a.Counts.recovered;
														countB = b.Counts.recovered;
														break;

				case "active":			countA = a.Counts.active;
														countB = b.Counts.active;
														break;

			}

			if ( ascending ) {
				return countA - countB;
			} else {
				return countB - countA;
			}
		};

		var strCompareFunc = function(a, b) {
			var strA = a[sortKey];
			var strB = b[sortKey];

			return strA.localeCompare(strB);
		}

		switch( field ) {
			case "Count":	sortKey = field;
										ascending=false;
										compareFunc = countCompareFunc;
										break;	// key to count for most recent date

			case "Name":	sortKey = "LocationName";
										compareFunc = strCompareFunc
										break;
		}

		this.RegionsList = this.RegionsList.sort(compareFunc);
	}


	calculateCountAggregates() {
		this.GlobalRegion.calculateCountAggregates();
	}

};	// end of DataSetDataWorld  class


class ByteStream {

	constructor( arrayBuffer ) {
		this.ByteArray = new Uint8Array(arrayBuffer);
		this.CurPos = 0;
	}

	readVarInt() {
		var value = 0;
		var shiftAmt = 0;

		for( var i = 0; i < 5; i++ ) {
			var b = this.readByte();

			value += (b & 0x7f) << shiftAmt;
			shiftAmt += 7;
			if ( b & 0x80 )
				return value;
		}

	return value;
	}

	readByte() {
		var b = this.peekByte();
		if ( b != -1 )
			this.CurPos++;
		return b;
	}

	peekByte() {
		if ( this.eof() )
			return -1;
		else
			return this.ByteArray[ this.CurPos ];
	}

	eof() {
		return this.CurPos >= this.ByteArray.length;
	}

};