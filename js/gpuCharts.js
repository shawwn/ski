
$('document').ready(function() {

var defaultOptions = {
	bezierCurve : false,
	animation : false,
	scaleFontSize : 18,
	scaleFontFamily : "'HelveticaNeue-Light'",
	scaleOverride : true,
	scaleStartValue : 0
};

var labelsVal =  ["2¹²","2¹³","2¹⁴","2¹⁵","2¹⁶","2¹⁷","2¹⁸","2¹⁹","2²⁰","2²¹","2²²","2²³","2²⁴"];

var cpuDataset = 		{
			fillColor : "rgba(0,0,0,0.05)",
			strokeColor : "rgba(160,160,160,1)",
			pointColor : "rgba(220,220,220,1)",
			pointStrokeColor : "rgba(160,160,160,1)",
			data : [1,1,1,1,1,1,1,1,1,1,1,1,1]
		};
		
var gpuDatasetDefault = {
			fillColor : "rgba(151,187,205,0.1)",
			strokeColor : "rgba(104, 156, 182, 1)",
			pointColor : "rgba(221, 232, 237, 1)",
			pointStrokeColor : "rgba(104, 156, 182, 1)"
			};
			
var riseDataset = {
	data : [0.0063,0.0030,0.0089,0.0153,0.0638,0.0436,0.0626,0.1022,0.1546,0.2466,0.2274,0.3021,0.3110]
}

var riseOptions = {
	scaleSteps : 11,
	scaleStepWidth : 0.1,
}

$.extend(riseDataset, gpuDatasetDefault);
$.extend(riseOptions, defaultOptions);

var riseData = {
	labels : labelsVal,
	datasets : [
			cpuDataset,
			riseDataset
	]
}
var riseCtx = document.getElementById("riseChart").getContext("2d");
var riseChart = new Chart(riseCtx).Line(riseData,riseOptions);

var plotDataset = {
			data : [0.10345074,0.169525843,0.31554204,0.588850928,0.799641229,1.374019085,1.712292371,2.131951255,2.510562696,2.837662799,3.887670621,4.74751362,5.012159274]
			}
			
var plotOptions = {
	scaleSteps : 11,
	scaleStepWidth : 0.5,
}

$.extend(plotDataset, gpuDatasetDefault);
$.extend(plotOptions, defaultOptions);

var plotData = {
	labels : labelsVal,
	datasets : [
			cpuDataset,
			plotDataset
	]
}

var plotCtx = document.getElementById("plotChart").getContext("2d");
var plotChart = new Chart(plotCtx).Line(plotData,plotOptions);

var simDataset = {
			data : [1.969150815,5.059513353,6.763164526,14.32869589,20.04077337,26.24252781,36.02983233,38.46409597,45.11903762,58.04196409,63.21264709,63.78631844,64.12498807]
			}
			
var simOptions = {
	scaleSteps : 14,
	scaleStepWidth : 5,
}


$.extend(simDataset, gpuDatasetDefault);
$.extend(simOptions, defaultOptions);

var simData = {
	labels : labelsVal,
	datasets : [
			cpuDataset,
			simDataset
	]
}



var simCtx = document.getElementById("simChart").getContext("2d");
var simChart = new Chart(simCtx).Line(simData,simOptions);

});

