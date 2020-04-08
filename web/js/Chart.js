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
		var earliestFirstDayIdx = 0;

		if ( chartParameters.AlignDayZero ) {
			earliestFirstDayIdx = this.findEarliestFirstDayIndex( regionsToShow );
		}

		for (var r = 0; r < regionsToShow.length; r++) {
			var data = this.buildChartMetadata(caseType, regionsToShow[r], earliestFirstDayIdx, chartParameters );
			allChartData.push(data);
		}

		var doCumulative = chartParameters.ChartType != "line";
		var maxValue = this.calculateMaximumValue(allChartData, doCumulative);
		maxValue = 		 this.calculateChartMaxFromDataMax(maxValue);

		if (isLogarithmic) {
			maxValue = Math.pow(10, Math.ceil( Math.log10(maxValue) ) );
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
		};

		var deltaToTitle = {
			"cumulative":				" Cumulative Total",
			"deltaCount":				" Daily Deltas (\u0394)",
			"deltaDeltaCount":	" Daily Acceleration (\u0394\u0394)",
			"deltaPercent":			" Daily Delta %"
		};

		var titleName = dateSetTypeToTitle[caseType];

		titleName += deltaToTitle[ chartParameters.Delta ];
		titleName += countRatioToTitle[chartParameters.CountRatio];
		titleName += chartParameters.AlignDayZero ? " with Day Zeroes Aligned" : "";

		if ( window.innerWidth > 1300 ) {
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
				maximum:						maxValue,
				includeZero: 				true,
				logarithmic: 				isLogarithmic,
				labelFontSize: 			11,
				valueFormatString:	chartParameters.CountRatio == "perBed" || chartParameters.Delta == "deltaPercent"? "0.##%" : "#,###,###"
			},
			axisX: {
				labelFontSize: 			11,
				labelAngle: 				90,
				interval: 					labelInterval
			},
			toolTip: {
			  fontSize: 12
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


	calculateDoublingData( caseType, region ) {
		var doublings = {};
		var caseCounts = region.getCaseCountsByCaseType( caseType );


		var y = caseCounts[caseCounts.length - 1];

		var nextIntegralX = caseCounts.length;
		var nextActualX = caseCounts.length;

		var halfCount = y / 2.0;

		doublings[caseCounts.length] = { "x": caseCounts.length, "y": y, "multiplier": 2 };
		for(var i = caseCounts.length - 2; i >= 0; i-- ) {
			var multiplier = 2;
			// if we've doubled more than once in a single day,
			// we need to keep halving on same day to avoid a divide by zero
			while ( caseCounts[i] && halfCount >= caseCounts[i] ) {
				var actualX = i + 1 + (halfCount - caseCounts[i]) / (caseCounts[i+1] - caseCounts[i]);
				var closestX = Math.round(actualX);

				doublings[closestX] = { "x": actualX, "y": halfCount, "multiplier": 2, "tDouble": 0 };
				doublings[nextIntegralX]["tDouble"] = nextActualX - actualX;
				doublings[nextIntegralX]["multiplier"] = multiplier;

				multiplier *= 2;
				nextIntegralX = closestX;
				nextActualX 	= actualX
				halfCount /= 2.0;
			}
		}
		return doublings;
	}

	// Note: not using this because there is no easy way to integrate
	// these "in between" values onto the existing lines of a region.
	addDoublingDataPoints( caseType, region, minX, doublingData, dataPts ) {
		var labelTxt;

		for( var i = 0; i < doublingData.length; i++ ) {
			if ( i < doublingData.length - 1 ) {
				var deltaX = doublingData[i].x - doublingData[i+1].x;
				labelTxt = "Doubled in " + 	App.numberFormatter( deltaX, 1 ) + " days";
			}
			else {
				labelTxt = "";
			}

			if ( doublingData[i].x >= minX ) {
				var datum = {
				  "markerType": "triangle",
			    "markerSize": 8,
					"toolTipContent": labelTxt,
					"x": doublingData[i].x,
					"y": doublingData[i].y
				};
				dataPts.push(datum);
			}
		}
	}


	buildChartMetadata(caseType, region, earliestFirstDayIdx, chartParameters ) {
		var chartType 		= chartParameters.ChartType;
		var delta 				= chartParameters.Delta;
		var countRatio 		= chartParameters.CountRatio;
		var alignDayZero 	= chartParameters.AlignDayZero;
		var isLogarithmic	= chartParameters.Logarithmic;
		var smoothSize 		= chartParameters.Smooth;

		var dataPts = [];
		var firstDateIndex = 0;
		var labelName = region.getName();
		var x = 1;
		var deltaTitle;

		if (alignDayZero) {
			firstDateIndex = region.getFirstNonZeroCaseIndex();
		}

		firstDateIndex += chartParameters.StartDay;
		x = chartParameters.StartDay + 1;

		var datum;

		var caseCounts = region.getCaseCountsByCaseType( caseType );

		if (smoothSize > 1) {
			caseCounts = this.calcMovingAverageTrailing( caseCounts, smoothSize );
		}

		var doublingData = {};

		if ( delta == "cumulative") {
			var doublingData = 	this.calculateDoublingData( caseType, region );
		}

		var toolTipFormat;

		switch( delta ) {
			case "cumulative":				deltaTitle = "Total";					break;
			case "deltaCount":				deltaTitle = "\u0394";				break;
			case "deltaDeltaCount":		deltaTitle = "\u0394\u0394";	break;
			case "deltaPercent":			deltaTitle = "\u0394";				break;
			default:									deltaTitle = "Total ";				break;
		}

		switch (countRatio) {
				case "per1MPop":	toolTipFormat = "{name}: " + deltaTitle + " " + caseType + " on day {label}: {y}/1M Pop"; break;
				case "perBed": 		toolTipFormat = "{name}: " + deltaTitle + " " + caseType + " on day {label}: {y}/Bed"; 		break;
				default: 					toolTipFormat = "{name}: " + deltaTitle + " " + caseType + " on day {label}: {y}"; 				break;
			}

		if ( smoothSize > 1 ) {
			toolTipFormat += " (" + smoothSize.toString() + " pt moving avg)";
		}

		for (var c = firstDateIndex; c < caseCounts.length; c++ ) {
			var prevCount = 0;
			var prevDelta = 0;
			var count = 0;
			var date = this.dateToLabel( region.getNthCaseDate(c) );
			var labelTxt = alignDayZero ? x : date;
			var formatString = null;
			var deltaTminus1 = 0;
			var deltaTminus2 = 0;

			if ( c >= 1 ) {
				deltaTminus1 = caseCounts[c] - caseCounts[c-1];
			}
			if ( c >= 2 ) {
				deltaTminus2 = caseCounts[c-1] - caseCounts[c-2];
			}

			switch( delta ) {
				default:									count = 0.0;													break;
				case "cumulative":				count = caseCounts[c];								break;
				case "deltaCount":				count = deltaTminus1;									break;
				case "deltaDeltaCount":		count = deltaTminus1 - deltaTminus2;	break;
				case "deltaPercent":
					var prevCount = caseCounts[c] - deltaTminus1;
					if (prevCount) {
						count = parseFloat(deltaTminus1) / parseFloat(prevCount);
					} else {
						count = 0.0;
					}
					formatString = "0.##%";
					break;
			}

			if (countRatio == "per1MPop") {
				count = 1000000 * parseFloat(count) / parseFloat(region.getPopulation() );
			} else if (countRatio == "perBed") {
				count = parseFloat(count) / parseFloat(region.getBeds() );
				formatString = "0.##%";
			}

			if ( isLogarithmic && count == 0)
				count = 1;	//count of 0 does not work for logarithm scale

			if ( formatString == null) {
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

			if ( x in doublingData && doublingData[x].tDouble ) {
				var dbl = doublingData[x];
				var multiplierTxt = "Doubled";
				var toolTip = toolTipFormat;

				if (dbl.multiplier > 2) {
					multiplierTxt = dbl.multiplier.toString() + "X";
				}

				toolTip = toolTip.replace("{name}", labelName);
				toolTip = toolTip.replace("{label}", labelTxt);
				toolTip = toolTip.replace("{y}", App.numberFormatter( count, 2 ) );

				toolTip += ". " + multiplierTxt + " in " + 	App.numberFormatter( dbl.tDouble, 1 ) + " days";

				datum.markerType = "square";
				datum.markerSize = 6;
				datum.toolTipContent = toolTip;
			}

			if (chartParameters.ShowCountryLabel && c == caseCounts.length - 1) {
				datum.indexLabel = region.getShortestName();
				datum.indexLabelMaxWidth = 120;
			}
			dataPts.push(datum);
			x++;
		}


		if (alignDayZero) {
			// fill rest of data set w/o y values
			for (var dk = 0; dk < firstDateIndex - earliestFirstDayIdx - chartParameters.StartDay; dk++) {
				dataPts.push({
					"x": x++
				});
			}
		} else if ( chartParameters.ShowCountryLabel && caseCounts.length - chartParameters.StartDay > 30){
			// kludge to give enough space for labels
			dataPts.push({ "x": x++, "label": " " });
			dataPts.push({ "x": x++, "label": " " });

		}


		var data = {
			lineThickness: 1,
			indexLabelFontSize: 9,
			name: labelName,
			toolTipContent: toolTipFormat,
			showInLegend: true,
			type: chartType == "line" ? "spline" : chartType,
			dataPoints: dataPts,
			markerSize: 4
		};

		return data;
	}


	calcMovingAverageRMS(data, size) {
		var outData = [];
		size--;		// change from 1 based to 0 based
		for( var i = 0; i < data.length; i++ ) {
			var halfSize = size >> 1;
			if (halfSize > i ) halfSize = i;
			if (halfSize > data.length - i - 1) halfSize = data.length - i - 1;

			var sum = 0;
			for( var a = i - halfSize; a <= i + halfSize; a++) {
				sum += data[a] * data[a];
			}

			var rmsAvg = Math.sqrt( sum / (halfSize * 2 + 1) );

			outData.push( rmsAvg );
		}

		return outData;
	}


	calcMovingAverage(data, size ) {
		var outData = [];
		size--;		// change from 1 based to 0 based

		for( var i = 0; i < data.length; i++ ) {
			var halfSize = size >> 1;
			if (halfSize > i ) halfSize = i;
			if (halfSize > data.length - i - 1) halfSize = data.length - i - 1;

			var sum = 0;
			for( var a = i - halfSize; a <= i + halfSize; a++) {
				sum += data[a];
			}
			var avg = sum / (halfSize * 2 + 1);
			outData.push( avg );
		}

		return outData;
	}


	calcMovingAverageTrailing(data, maxSize ) {
		var outData = [];
		var size = --maxSize;

		for( var i = 0; i < data.length; i++ ) {
			size = maxSize;
			if (size > i ) size = i;

			var sum = 0;
			for( var a = i - size; a <= i; a++) {
				sum += data[a];
			}
			var avg = sum / (size+1);
			outData.push( avg );
		}

		return outData;
	}


	findEarliestFirstDayIndex( regionsToShow ) {
		var earliestFirstDayIdx = 99999;
		for (var r = 0; r < regionsToShow.length; r++) {
			var region1stDay = regionsToShow[r].getFirstNonZeroCaseIndex();
			if (earliestFirstDayIdx > region1stDay) {
				earliestFirstDayIdx = region1stDay;
			}
		}
		return earliestFirstDayIdx;
	}


	calculateMaximumValue( allRegionsData, doCumulative ) {
		var maxCount = -999999999999;

		if (doCumulative && allRegionsData.length >= 2) {
			var dailyCounts = [];

			var points = allRegionsData[0].dataPoints;
			for( var ptIdx = 0; ptIdx < points.length; ptIdx++ ) {
				if ( "y" in points[ptIdx]) {
					dailyCounts.push( points[ptIdx].y );
				} else {
					dailyCounts.push( 0 );
				}
			}

			for( var r = 1; r < allRegionsData.length; r++ ) {
				var points = allRegionsData[r].dataPoints;
				for( var ptIdx = 0; ptIdx < points.length; ptIdx++ ) {
					if ( "y" in points[ptIdx]) {
						dailyCounts[ptIdx] += points[ptIdx].y;
					}
				}
			}

			for( var i = 0; i < dailyCounts.length; i++ ) {
				if ( maxCount < dailyCounts[i] ) {
					maxCount = dailyCounts[i];
				}
			}

		} else {
			for( var r = 0; r < allRegionsData.length; r++ ) {
				var points = allRegionsData[r].dataPoints;
				for( var ptIdx = 0; ptIdx < points.length; ptIdx++ ) {
					if ( maxCount < points[ptIdx].y ) {
						maxCount = points[ptIdx].y;
					}
				}
		}
		}

		return maxCount;
	}


	calculateChartMaxFromDataMax(maxValue) {
		/*************************************************************************
		** Example desired max chart values
		**
		**   maxCount  maxCountExp	chartMaxExp	chartBase		chartMax
		**   .07				-1.16				-1					1						.1				1 * 10^-1
		**   5.6				0.748				0						6						6					6 * 10^0
		**   172     		2.235				2						2		 		    200				2 * 10^2
		**  3728				3.571				3						4						4000			4 * 10^3
		*************************************************************************/
		var maxCountExp = Math.log10(maxValue);
		var chartMaxExp;

		if (maxCountExp > 0)
			chartMaxExp = Math.floor(maxCountExp);
		else
			chartMaxExp = Math.ceil(maxCountExp);

		var chartBase = Math.ceil( maxValue / Math.pow(10, chartMaxExp) );

		var maxChartValue = chartBase * Math.pow(10, chartMaxExp);
		var delta = maxChartValue / 10.0;

		// Now go down 1/10 of the max value until we're closer to max value
		while( maxChartValue - delta > maxValue ) {
			maxChartValue -= delta;
		}

		return maxChartValue;
	}


	dateToLabel( date ) {
		return date.getMonth().toString() + '/' + date.getDate().toString();
	}




};
