/****************************************
** Chart.js
** by: Michael T Hoffman
**
** Draw chart using CanvasJS
****************************************/
class Chart {

	constructor() {
	}

	drawChart(dataSet, chartParameters ) {
		var isLogarithmic = chartParameters.Logarithmic;

		var allChartData = [];

		for (var loc = 0; loc < dataSet.Locations.length; loc++) {
			var location = dataSet.Locations[loc];

			if (location.Showing) {
				var data = this.buildChartMetadata(dataSet, location, chartParameters );

				allChartData.push(data);
			}
		}

		var dateSetTypeToTitle = {
			"confirmed":	"COVID-19 Confirmed Cases by Country",
			"deaths":			"COVID-19 Deaths by Country",
			"recovered":	"COVID-19 Recovered Cases by Country"
		};

		var countRatioToTitle = {
			"absolute":		"",
			"per1MPop":		" per 1M Population",
			"perBed":			" as % of Hospital Beds"
		}
		var titleName = dateSetTypeToTitle[dataSet.Type];

		titleName += chartParameters.Delta ? " Daily Deltas" : " Cumulative Total";
		titleName += countRatioToTitle[chartParameters.CountRatio];
		titleName += chartParameters.AlignDayZero ? " with Day Zeroes Aligned" : "";

		var options = {
			animationEnabled: false,
			theme: "light2",
			legend: {
				fontSize: 11
			},
			title: {
				text: titleName,
				fontSize: 18
			},
			axisY: {
				includeZero: true,
				logarithmic: isLogarithmic,
				labelFontSize: 11,
				valueFormatString: chartParameters.CountRatio == "perBed" ? "0.##%" : "#,###,###"
			},
			axisX: {
				labelFontSize: 11,
				labelAngle: 90,
				interval: 1
			},
			data: allChartData
		};

		if (allChartData.length == 1) {
			options.colorSet = "oneColor";
		}

		var chart = new CanvasJS.Chart("chart", options);

		chart.render();
	}




	buildChartMetadata(dataSet, loc, chartParameters ) {
		var dateKeys = dataSet.DateKeys;
		var chartType = chartParameters.ChartType;
		var delta = chartParameters.Delta;
		var countRatio = chartParameters.CountRatio;
		var alignDayZero = chartParameters.AlignDayZero;
		var isLogarithmic = chartParameters.Logarithmic;
		var formatString;
		var dataPts = [];

		var prevCount = 0;

		var firstDateIndex = 0;
		if (alignDayZero) {
			firstDateIndex = loc.FirstNonZeroDateIndex;
		}

		var x = 1;

		for (var dk = firstDateIndex; dk < dateKeys.length; dk++) {
			var date = dateKeys[dk];
			var count = loc[date];
			var datum;
			var labelTxt = alignDayZero ? x : this.dateToLabel(date);
			var shortName = (loc.RegionType == "state" ? loc.Province_State : loc.LocationName);

			if (delta) {
				count -= prevCount;
				prevCount = loc[date];
			}

			if (countRatio == "per1MPop") {
				count = 1000000 * parseFloat(count) / parseFloat(loc.Population );

			} else if (countRatio == "perBed") {
				count = parseFloat(count) / parseFloat(loc.Beds);
				formatString = "0.##%";
			}

			if ( isLogarithmic && count == 0)
				count = 1;	//count of 0 does not work for logarithm scale

			if ( countRatio != "perBed") {
				if (count >= 100)
					formatString = "#,###,###";
				else if (count >= 1 )
					formatString = "#.#";
				else if ( count >= 0.01 )
					formatString = "0.###";
				else if ( !count )
					formatString = "#";
				else
					formatString = "0.######";
			}

			datum = {
				"yValueFormatString" : formatString,
				"label": labelTxt,
				"x": x,
				"y": count
			};

			if (chartParameters.ShowCountryLabel && dk == dateKeys.length - 1) {
				datum.indexLabel = shortName;
			}
			dataPts.push(datum);
			x++;
		}

		if (alignDayZero) {
			// fill rest of data set w/o y values
			for (var dk = 0; dk < firstDateIndex; dk++) {
				dataPts.push({
					"x": x++
				});
			}
		}

		var data = {
			indexLabelFontSize: 9,
			name: shortName,
			toolTipContent: "{name} on day {label}: {y}",
			showInLegend: true,
			type: chartType,
			dataPoints: dataPts,
			markerSize: 1
		};

		return data;
	}


	dateToLabel(dateKey) {
		var dmy = dateKey.split('/');
		return dmy[0] + '/' + dmy[1];
	}

};
