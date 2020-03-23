/****************************************
** DataSet.js
** by: Michael T Hoffman
**
** Manage one of the following datasets
** from the Johns Hopkins CSSE data
** retrieved from:
**
**		https://github.com/CSSEGISandData/COVID-19
**
**	- confirmed
**	- deaths
**	- recovered
**
****************************************/


class DataSet {

	constructor(dataSetType) {
		this.Loaded = false;
		this.Type = dataSetType;
		this.Keys = [];
		this.DateKeys = [];
		this.MostRecentKey = "";
		this.LocationByName = {};
		this.Locations = [];
		this.CSVFieldToAttributeName = {
			"Country/Region": "Country_Region",
			"Province/State": "Province_State"
		};

	}


	processUrl(url, doneFunc, errorFunc ) {
		var self = this;

		// read text from URL location
		var request = new XMLHttpRequest();
		request.open('GET', url, true);
		request.setRequestHeader( "Cache-Control", "must-revalidate" );

		request.onreadystatechange = function() {
			if (request.readyState === 4 ) {
				if (request.status === 200) {
					var type = request.getResponseHeader('Content-Type');
					if (type.indexOf("text") !== 1) {
						self.processCSVData(request.responseText);
						doneFunc(self);
					}
				} else {
				errorFunc(self);
				}
			}
		};

		request.send(null);
	}

	processFile(file, doneFunc, errorFunc ) {
		var self = this;
		var reader = new FileReader();
		reader.onload = function() {
			self.processCSVData(reader.result);
			doneFunc( self );
		};

		reader.readAsText(file);
	}


	processCSVData(text) {
		this.extractAllData(text);
		this.addGlobalAggregate();
		this.sortBy("Count");
		this.Loaded = true;
	}


	sortBy( field ) {
		var sortKey;
		var ascending = true;
		var compareFunc;

		var valueCompareFunc = function(a, b) {
			var countA = a[sortKey];
			var countB = b[sortKey];

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
			case "Count":	sortKey = this.MostRecentKey;
										ascending=false;
										compareFunc = valueCompareFunc;
										break;	// key to count for most recent date

			case "Name":	sortKey = "LocationName";
										compareFunc = strCompareFunc
										break;
		}

		this.Locations = this.Locations.sort(compareFunc);
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

	showDefaultRegions( defaultParams ) {
		for ( var key in defaultParams ) {
			if ( key in this.LocationByName ) {
				this.LocationByName[ key ].Showing = true;
			}
		}
	}

	extractAllData(text) {
		var firstLine = true;

		var lines = text.split('\n');

		for (var lineIdx = 0; lineIdx < lines.length; lineIdx++) {

			if (lines[lineIdx].length > 0) {
				var entries = this.parseLine(lines[lineIdx]);

				if (firstLine) {
					this.MostRecentKey = entries[entries.length - 1];

					for (var k = 0; k < entries.length; k++) {
						var key = entries[k];
						if (key in this.CSVFieldToAttributeName) {
							key = this.CSVFieldToAttributeName[key];
						}

						if (this.isDate(key)) {
							this.DateKeys.push(key);
						}
						this.Keys.push(key);
					}

					firstLine = false;
				} else {
					var locationInfo = this.extractLocationInfo(entries);
					this.addAndResolveSplitEntries(locationInfo);   // was needed when dataset was messier

					if (locationInfo.RegionType == "state") {
						this.LocationByName[locationInfo.Abbreviation] = locationInfo;
					}
				}
			}
		}

		this.addCombinedCountryData();


	}



	addAndResolveSplitEntries(newLocation) {
		var locName = newLocation.LocationName;

		if (locName in this.LocationByName) {
			var existingLocation = this.LocationByName[locName];

			if ( newLocation.Country_Region === existingLocation.Country_Region ) {
				// move non-zero entries
				console.log("Found split entry for " + locName );
				var dateKeys = this.DateKeys;
				for (var dk = 0; dk < dateKeys.length; dk++) {
					var dateKey = dateKeys[dk];
					if (existingLocation[dateKey] && existingLocation[dateKey] != newLocation[dateKey]) {
						console.log("ERROR. Split country " + locName + ", " + newLocation.Province_State + " with conflicting values: " + dateKey + " = [" + existingLocation[dateKey] + "," + newLocation[dateKey] + "]");
					}

					if (existingLocation[dateKey] == 0) {
						existingLocation[dateKey] = newLocation[dateKey];
					}
				}
			}
		} else {
			// not a duplicate, so add
			this.Locations.push(newLocation);
			this.LocationByName[newLocation.LocationName] = newLocation;
		}

	}



	isDate(key) {
		return key[0] >= '0' && key[0] <= '9';
	}


	extractLocationInfo(entries) {
		var locationInfo = {};
		var foundNonZero = false;
		var dateIndex = 0;
		var lastCount = 0;

		for (var k = 0; k < this.Keys.length; k++) {
			var key = this.Keys[k];

			if (this.isDate(key)) {
				var count;

				if (entries[k].length)
					count = parseInt(entries[k]);		// # provided
				else
					count = lastCount;							// # missing from dataset

				lastCount = count;
				locationInfo[key] = count;

				if (locationInfo[key] != 0 && foundNonZero == false) {
					locationInfo.FirstNonZeroDateIndex = dateIndex;
					foundNonZero = true;
				}

				dateIndex++;

			} else {
				locationInfo[key] = entries[k];
			}
		}

		this.processProvinceAndCountry(locationInfo);
		locationInfo.Showing = false;
		return locationInfo;
	}



	processProvinceAndCountry(locationInfo) {
		var locationName;
		var countryName = locationInfo.Country_Region.trim().replace(/(^"|"$)/g, '');
		var provinceName = locationInfo.Province_State.trim().replace(/(^"|"$)/g, '');

		countryName = locationInfo.Country_Region = this.normalizeCountrySynonyms(locationInfo.Country_Region);
		provinceName = this.normalizeProvinceSynonyms(locationInfo.Province_State);

		locationInfo.Abbreviation = "";

		if (provinceName === "") {
			locationName 						= countryName;
			locationInfo.RegionType = "country";
			locationInfo.Population = this.lookupPopulation(countryName);
			locationInfo.Beds 			= this.lookupBeds(countryName);
		} else {
			if ( provinceName === countryName ) {
				locationName = countryName;
			} else {
				locationName = provinceName + ", " + countryName;
			}
			locationInfo.RegionType = "province";
			locationInfo.Population = 0;
			locationInfo.Beds 			= 0;

			if (countryName === "US") {
				this.extractCountyCityState( locationInfo );
				if ( locationInfo.RegionType == "state" ) {
					locationInfo.Population 		= this.lookupPopulation(provinceName);
					locationInfo.Beds 					= this.lookupBeds(provinceName);
				}
			}

		}

		locationInfo.LocationName = locationName;
	}

	extractCountyCityState( loc ) {
		var provinceName = this.normalizeProvinceSynonyms(loc.Province_State);

		if (provinceName.includes("D.C.")) {
			loc.Province_State = provinceName;
			loc.RegionType = "capital";
		} else if (provinceName.includes("County")) {
			var pieces = provinceName.split(",");

			loc.Province_State = pieces[1].trim();
			loc.County = pieces[0].trim();
			loc.RegionType = "county";
		} else if ( provinceName in gPrimaryRegionsUSA ) {
			loc.Abbreviation 	= gPrimaryRegionsUSA[provinceName];
			loc.RegionType 		= "state";
		} else if ( provinceName.includes(",") ) {
			var pieces = provinceName.split(",");
			loc.Province_State = pieces[1].trim();		// 2 letter state abbrev
			loc.City = pieces[0].trim();
			loc.RegionType = "city";
		} else {
			loc.Province_State = provinceName;
			loc.RegionType = "other";
		}


	}

	addCombinedCountryData() {

		for (var l = 0; l < this.Locations.length; l++) {
			var curLocation = this.Locations[l];
			var countryName = curLocation.Country_Region;


			if (curLocation.RegionType != "country") {
				if (countryName in this.LocationByName) {
					// add province/state counts to the country counts
					var dateIndex = 0;
					var foundNonZero = false;

					var countryInfo = this.LocationByName[countryName];

					// just add to sums
					var dateKeys = this.DateKeys;
					for (var dk = 0; dk < dateKeys.length; dk++) {
						var dateKey = dateKeys[dk];

						var count = curLocation[dateKey];

						countryInfo[dateKey] += count;

						if (countryInfo[dateKey] != 0 && foundNonZero == false) {
							countryInfo.FirstNonZeroDateIndex = dateIndex;
							foundNonZero = true;
						}

						dateIndex++;
					}
				} else {
					// first region of this country, so add a new entry for entire country
					var countryInfo = {};
					var keys = this.Keys;
					for (var k = 0; k < keys.length; k++) {
						var key = keys[k];
						countryInfo[key] = curLocation[key];
					}

					countryInfo.Province_State 	= ""
					countryInfo.Abbreviation 		= "";
					countryInfo.LocationName 		= countryName;
					countryInfo.RegionType 			= "country";

					countryInfo.Population = this.lookupPopulation(countryName);
					countryInfo.Beds 			= this.lookupBeds(countryName);

					this.Locations.push(countryInfo);
					this.LocationByName[countryName] = countryInfo;
				}
			}
		}
	}


	normalizeCountrySynonyms(countryName) {
		if (countryName in gCountrySynonyms) {
			countryName = gCountrySynonyms[countryName];
		}
		return countryName;
	}


	normalizeProvinceSynonyms(provinceName) {
		if (provinceName in gProvinceSynonyms) {
			provinceName = gProvinceSynonyms[provinceName];
		}
		return provinceName;
	}



	lookupBeds(regionName) {
		if (regionName in gBedsPer1KLookup && regionName in gPopulationLookup) {
			return gBedsPer1KLookup[regionName] * gPopulationLookup[regionName] / 1000.0;
		} else {
			console.log("No beds (and population) found for: " + regionName);
			return 0;
		}
	}



	lookupPopulation(regionName) {
		if (regionName in gPopulationLookup) {
			return gPopulationLookup[regionName];
		} else {
			console.log("No population found for: " + regionName);
			return 0;
		}
	}




	dateGreater(dateKey, targetM, targetD, targetY) {
		var mdy = dateKey.split('/');
		var m = parseInt(mdy[0]);
		var d = parseInt(mdy[1]);
		var y = parseInt(mdy[2]);

		if (y > targetY) return true;
		if (y == targetY) {
			if (m > targetM) return true;
			if (m == targetM && d > targetD) return true;
		}

		return false;
	}


	addGlobalAggregate() {
		var globalName = "Global";
		var globalInfo = {
			"RegionType": "global",
			"LocationName": globalName,
			"Country/Province": "",
			"Province/State": "",
			"Population": 7800000000,
			"FirstNonZeroDateIndex": 0,
			"Showing": false
		};

		// set initial count for every day to zero

		for (var dk = 0; dk < this.DateKeys.length; dk++) {
			globalInfo[this.DateKeys[dk]] = 0;
		}


		for (var l = 0; l < this.Locations.length; l++) {
			var curLocation = this.Locations[l];

			if (curLocation.RegionType == "country") {
				for (var k = 0; k < this.Keys.length; k++) {
					var key = this.Keys[k];

					if (this.isDate(key)) {
						globalInfo[key] += curLocation[key];
					} else {
						globalInfo[key] = curLocation[key];
					}
				}
			}
		}

		this.Locations.push(globalInfo);
		this.LocationByName[globalName] = globalInfo;
	}


	anyShowing() {
		for (var l = 0; l < this.Locations.length; l++) {
			var curLocation = this.Locations[l];
			if (curLocation.LocationName != "Global" && curLocation.Showing)
				return true;
		}
		return false;
	}


};
