/****************************************
** Chart.js
** by: Michael T Hoffman
**
** Draw chart using CanvasJS
****************************************/
class Chart {

	constructor() {
	}

	drawChart(caseType, regionsToShow, chartParameters ) {
		var isLogarithmic = chartParameters.Logarithmic;
		var labelInterval;
		var allChartData = [];

		for (var r = 0; r < regionsToShow.length; r++) {
			var data = this.buildChartMetadata(caseType, regionsToShow[r], chartParameters );
			allChartData.push(data);
		}

		var dateSetTypeToTitle = {
			"confirmed":	"COVID-19 Confirmed Cases by Country",
			"deaths":			"COVID-19 Deaths by Country",
			"recovered":	"COVID-19 Recovered Cases by Country",
			"active":			"COVID-19 Active Cases by Country",
			"resolved":		"COVID-19 Resolved Cases by Country"
		};

		var countRatioToTitle = {
			"absolute":		"",
			"per1MPop":		" per 1M Population",
			"perBed":			" as % of Hospital Beds"
		}
		var titleName = dateSetTypeToTitle[caseType];

		titleName += chartParameters.Delta ? " Daily Deltas" : " Cumulative Total";
		titleName += countRatioToTitle[chartParameters.CountRatio];
		titleName += chartParameters.AlignDayZero ? " with Day Zeroes Aligned" : "";

		if ( window.innerWidth > 1200 ) {
			labelInterval = 1;
		} else if ( window.innerWidth > 800 ) {
			labelInterval = 2;
		} else {
			labelInterval = 5;
		}

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
				interval: labelInterval
			},
			data: allChartData
		};

		if (allChartData.length == 1) {
			options.colorSet = "oneColor";
		}

		var chart = new CanvasJS.Chart("chart", options);

		chart.render();
		return titleName;
	}




	buildChartMetadata(caseType, region, chartParameters ) {
		var chartType 		= chartParameters.ChartType;
		var delta 				= chartParameters.Delta;
		var countRatio 		= chartParameters.CountRatio;
		var alignDayZero 	= chartParameters.AlignDayZero;
		var isLogarithmic	= chartParameters.Logarithmic;

		var formatString;
		var dataPts = [];
		var prevCount = 0;
		var firstDateIndex = 0;
		var labelName = region.getName();

		if (alignDayZero) {
			firstDateIndex = region.getFirstNonZeroCaseIndex();
		}

		var x = 1;
		var datum;

		var caseCounts = region.getCaseCountsByCaseType( caseType );

		for (var c = firstDateIndex; c < caseCounts.length; c++ ) {
			var count = caseCounts[c];
			var date = this.dateToLabel( region.getNthCaseDate(c) );
			var labelTxt = alignDayZero ? x : date;

			if (delta) {
				count -= prevCount;
				prevCount = caseCounts[c];
			}

			if (countRatio == "per1MPop") {
				count = 1000000 * parseFloat(count) / parseFloat(region.getPopulation() );

			} else if (countRatio == "perBed") {
				count = parseFloat(count) / parseFloat(region.getBeds() );
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

			if (chartParameters.ShowCountryLabel && c == caseCounts.length - 1) {
				datum.indexLabel = region.getShortestName();
				datum.indexLabelMaxWidth = 120;
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
		} else if ( chartParameters.ShowCountryLabel ){
			// kludge to give enough space for labels
			dataPts.push({ "x": x++, "label": " " });
			dataPts.push({ "x": x++, "label": " " });

		}

		var toolTip;

		switch (countRatio) {
				case "per1MPop": toolTip = "{name} on day {label}: {y}/1M Pop"; break;
				case "perBed": toolTip = "{name} on day {label}: {y}/Bed"; break;
				default: toolTip = "{name} on day {label}: {y}"; break;
			}

		var data = {
			indexLabelFontSize: 9,
			name: labelName,
			toolTipContent: toolTip,
			showInLegend: true,
			type: chartType,
			dataPoints: dataPts,
			markerSize: 4
		};

		return data;
	}


	dateToLabel( date ) {
		return date.getMonth().toString() + '/' + date.getDate().toString();
	}




};
