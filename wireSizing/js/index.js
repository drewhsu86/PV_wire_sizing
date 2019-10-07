// ampacity based on NEC 2017 310.15(B) (16)
// first 3 arrays: Copper, 60-75-90
// next 3 arrays: Aluminum, 60-75-90
// nomenclature: chart[metal & temp][wire size]
// second index: same indexes as wire size, and only starts at 12 not 18 (due to missing values from table)
const buriedAmp = [
  [20,30,40,55,70,85,95,110,125,145,165,195,215,240,260,280,320,350,385,400,410,435,455,495,525,545,555],
  [25,35,50,65,85,100,115,130,150,175,200,230,255,285,310,335,380,420,460,475,490,520,545,590,625,650,665],
  [30,40,55,75,95,115,130,145,170,195,225,260,290,320,350,380,430,475,520,535,555,585,615,665,705,735,750],
  [15,25,35,40,55,65,75,85,100,115,130,150,170,195,210,225,260,285,315,320,330,355,375,405,435,455,470],
  [20,30,40,50,65,75,90,100,120,135,155,180,205,230,250,270,310,340,375,385,395,425,445,485,520,545,560],
  [25,35,45,55,75,85,100,115,135,150,175,205,230,260,280,305,350,385,425,435,445,480,500,545,585,615,630]
];

// chapter 9 table 8, first array copper, second array aluminum
const DCohmKFT = [
  [1.98, 1.24, 0.778, 0.491, 0.308, 0.245, 0.194, 0.154, 0.122, 0.0967, 0.0766, 0.0608, 0.0515, 0.0429, 0.0367, 0.0321, 0.0258, 0.0214, 0.0184, 0.0171,
  0.0161, 0.0143, 0.0129, 0.0103, 0.00858, 0.00735, 0.00643],
  [3.25, 2.04, 1.28,0.080, 0.508, 0.403, 0.319, 0.253, 0.201, 0.159, 0.126, 0.100, 0.0847, 0.0707, 0.0605, 0.0529, 0.0424, 0.0353, 0.0235, 0.0212, 0.0169,
  0.0141, 0.0121, 0.0106]
];

const ACXR = [
  [2.0, 1.2, 0.78, 0.49, 0.31, 0.25, 0.19, 0.15, 0.12, 0.10, 0.077, 0.062, 0.052, 0.044, 0.038, 0.033, 0.027, 0.023, 0.019, 0.015],
  [3.2, 2.0, 1.3, 0.81, 0.51, 0.40, 0.32, 0.25, 0.20, 0.16, 0.13, 0.10, 0.085, 0.071, 0.061, 0.054, 0.043, 0.036, 0.029, 0.023]
];

const ACXL = [
  0.054, 0.050, 0.052, 0.051, 0.048, 0.047, 0.045, 0.046, 0.044, 0.043, 0.042, 0.041, 0.041, 0.041, 0.040, 0.040, 0.039, 0.039, 0.038, 0.037
];

// wire sizes from 12 awg to 2000kcmil
const awgs = [
  '12 awg', '10 awg', '8 awg', '6 awg', '4 awg', '3 awg', '2 awg', '1 awg',
  '1/0', '2/0', '3/0', '4/0', '250kcmil', '300kcmil', '350kcmil', '400kcmil', '500kcmil',
  '600kcmil', '700kcmil', '750kcmil', '800kcmil', '900kcmil', '1000kcmil', '1250kcmil',
  '1500kcmil', '1750kcmil', '2000kcmil'
];

const ratedTemps = ['60', '75', '90']; // the 3 temperature ratings on the NEC ampacity table

const metals = ['Copper','Aluminum']; // the two wire options

const breakerSizes = [
  20,30,50,100,150,175,200,300,400,500
];

// start of angular module and controller

var app = angular.module('myApp', []);
app.controller('myCtrl', function($scope) {
  $scope.savedWires = [];

  $scope.wireName = "Enter Wire Name Here";
  $scope.wireNum = 1; // total number of currents per wire
  $scope.wireCurrent = 10; // in amps
  $scope.selWireSize = awgs;
  $scope.condNum = 1; // total number of parallel conductors/count 3ph as just one

  $scope.selWireMetal = metals;
  $scope.selAmpTemp =  ratedTemps; // ampacity rating in Celcius

  $scope.wireSize = '10 awg';
  $scope.wireMetal = 'Copper';
  $scope.ampTemp = '75';

  $scope.wireDist = 20;

  $scope.currentTypes = ['DC','AC'];
  $scope.currentType = 'DC';

  $scope.ampacity = 0;

  $scope.vBase = 1000;
  $scope.vPF = 1.0;

  $scope.vDropThres = 2;  // number in %

  $scope.PVImp = '';  // if empty string, do not use

  // a method for printing the ampacity (for testing)
  $scope.showAmpacity = function() {
    $scope.ampacity = buriedLookup($scope.wireSize, $scope.wireMetal, $scope.ampTemp);
  }

  $scope.showAmpacity();

  $scope.removeWire = function(index) {
    $scope.savedWires.splice(index,1);
  }

  // a method for pushing an object to savedWires, which will save the wire we are currently working on
  $scope.addWire = function() {

    $scope.showAmpacity();

    let factor = ampFactor($scope.currentType);
    let ampCheck = ($scope.ampacity*$scope.condNum >= $scope.wireNum*$scope.wireCurrent*factor);
    let breaker = suggestBreaker($scope.wireNum*$scope.wireCurrent*factor);
    let breakerCheck = ($scope.ampacity*$scope.condNum >= breaker);

    let thisWire = {
      wireName: $scope.wireName,
      wireNum: parseFloat($scope.wireNum),
      wireCurrent: parseFloat($scope.wireCurrent),
      condNum: parseFloat($scope.condNum),

      wireSize: $scope.wireSize,
      wireMetal: $scope.wireMetal,
      ampTemp: $scope.ampTemp,

      wireDist: parseFloat($scope.wireDist),
      currentType: $scope.currentType,
      vBase: $scope.vBase,
      vPF: $scope.vPF,
      vDropThres: $scope.vDropThres,
      PVImp: parseFloat($scope.PVImp),

      ampacity: buriedLookup($scope.wireSize, $scope.wireMetal, $scope.ampTemp),
      ampFact: parseFloat(ampFactor(this.currentType)),
      ampGood: ampCheck, // true or false

      recBreaker: breaker,
      breakerGood: breakerCheck,

      recWire: buriedLowest(breaker/$scope.condNum, $scope.wireMetal, $scope.ampTemp),
      recWire2: buriedLowest(breaker/$scope.condNum, ($scope.wireMetal === "Copper" ? "Aluminum" : "Copper"), $scope.ampTemp),

      vDrop: vDropPercent($scope.currentType, (isNaN(parseFloat($scope.PVImp)) ? parseFloat($scope.wireCurrent*$scope.wireNum/$scope.condNum) : parseFloat($scope.PVImp)*parseFloat($scope.wireNum)/parseFloat($scope.condNum)), $scope.wireSize, $scope.wireMetal, $scope.wireDist, $scope.vBase, $scope.vPF), // is a percentage
      vDropThresDist: distancePerVDrop($scope.currentType, (isNaN(parseFloat($scope.PVImp)) ? parseFloat($scope.wireCurrent*$scope.wireNum/$scope.condNum) : parseFloat($scope.PVImp)*parseFloat($scope.wireNum)/parseFloat($scope.condNum)), $scope.wireSize, $scope.wireMetal, $scope.vDropThres, $scope.vBase, $scope.vPF) // is dist in ft


    } // end thisWire


      $scope.savedWires.push(thisWire);
      console.log($scope.ampacity*$scope.condNum +' > '+$scope.wireNum*$scope.wireCurrent*factor+' : '+ampCheck);

      // reset name, number, operating current, distance
      $scope.wireName = '';
      // $scope.PVImp = '';
      // $scope.wireNum = 1;
      // $scope.wireCurrent = 0;
      // $scope.wireDist = 20;

    } // end addWire ()



});

// outside of angular module
// expected length of console.log arrays is 27
for (array of buriedAmp) {
  console.log('buriedAmp lengths: ' + array.length);
}

console.log('awgs lengths: ' + awgs.length);

console.log('Ampacity test ' + buriedLookup('250kcmil', 'Aluminum', 75)); // need to confirm ampacity table works

console.log('Breaker Ceiling test ' + suggestBreaker(195)); // need to confirm suggest breaker function

console.log('Breaker Ceiling test ' + buriedLowest(195, 'Aluminum', 75)); // need to confirm ampacity table reverse lookup

console.log(ACXL[(awgs.indexOf('250kcmil'))]);  // test array of AC reactance

console.log(Math.sqrt(3)*317.6*((100*0.085*0.98/1000) + (100*0.041*Math.sin(Math.acos(0.98))/1000))/480); // test AC vdrop

console.log('parseFloat of string test: ' + parseFloat('help')); // test of parseFloat

console.log((isNaN(parseFloat('')) ? 1 : 2));

// start of functions (which do not use $scope variables directly)

// look up table for buried amps NEC 2017 310.15(B) (16)
function buriedLookup(wireSize, wireMetal, ampTemp) {
  let firstIndex = ratedTemps.indexOf(ampTemp);  // first index refers to which temp and metal
  let secondIndex = awgs.indexOf(wireSize); // second index refers to which wire size

  // error finding
  if (firstIndex === -1) {
    console.log('-- buriedLookup: rated temp not in rated temps');
    return '-- buriedLookup: rated temp not in rated temps';
  }
  if (secondIndex === -1) {
    console.log('-- buriedLookup: wire size not in awg list');
    return '-- buriedLookup: wire size not in awg list';
  }

  if (wireMetal === 'Aluminum') {
    firstIndex += 3;
  } else if (wireMetal !== 'Copper') {
    console.log('-- buriedLookup: wire metal not in metal list');
    return '-- buriedLookup: wire metal not in metal list';
  }

  return buriedAmp[firstIndex][secondIndex];  // return ampacity as a number (based on table buriedAmp)
}

// suggest breaker of lowest hundreds denomination that is still higher than given amps
function suggestBreaker(amps) {
  if (amps > breakerSizes[breakerSizes.length-1]) {
    return Math.ceil(amps/100)*100;
  } else {
    for (sizeIndex in breakerSizes) {
      if (breakerSizes[sizeIndex] > amps) {
        return breakerSizes[sizeIndex];
      }
    }
  }

}

// sort of the inverse of buriedLookup, basically find the lowest wire size that has high enough ampacity
function buriedLowest(amps, wireMetal, ampTemp) {

  let firstIndex = ratedTemps.indexOf(ampTemp);  // first index refers to which temp and metal
  // error finding
    if (firstIndex === -1) {
      console.log('-- buriedLowest: rated temp not in rated temps');
      return '-- buriedLowest: rated temp not in rated temps';
    }
    if (wireMetal === 'Aluminum') {
      firstIndex += 3;
    } else if (wireMetal !== 'Copper') {
      console.log('-- buriedLowest: wire metal not in metal list');
      return '-- buriedLowest: wire metal not in metal list';
    }

    let relevantScale = buriedAmp[firstIndex];

    for (ampacityIndex in relevantScale) {
      if (relevantScale[ampacityIndex] >= amps) { // if the ampacity on the table is greater than or equal, stop
        return [relevantScale[ampacityIndex], awgs[ampacityIndex]]; // return an array containing the ampacity as well as the size
      }
    }

    // if previous for loop did not return anything, the ampacity asked for is too high
    console.log('-- buriedLowest: ampacity too high for chart');
    return '-- buriedLowest: ampacity too high for chart';
}

function ampFactor (currentType){
  if (currentType === 'DC') {
    return 1.25*1.25;
  } else {
    return 1.25;
  }
}

// returns raw numbers (ratio) so needs to be converted to percent by multiplying result by 100
function vDropPercent(currentType, wireCurrent, wireSize, wireMetal, wireDist, vBase, vPF) {
  // DC : ((factor=2)*(current (A))*(dist)*(ohms/kft)/1000)/(voltage base)
  // AC : sqrt(3)*(current (A)) * [ (dist*XR/1000) * cos(acos(PF)) + (dist*XL/1000) * sin(acos(PF))] / voltage base
  let firstIndex = 0; // default Copper

  if (wireMetal === 'Aluminum') {
    firstIndex = 1;
  }

  console.log(currentType);
  // different formulas for dc and ac
  if (currentType === 'DC') {
    console.log('Ohms per kft: '+DCohmKFT[firstIndex][(awgs.indexOf(wireSize))]);
    let result = 2*wireCurrent*wireDist*DCohmKFT[firstIndex][(awgs.indexOf(wireSize))]/(1000*vBase);
    console.log('vDrop Result: ' + result);
    return 100*result;
  } else {
    if (awgs.indexOf(wireSize) > ACXL.length-1) {
        return false;
    } else {
      console.log('XL per kft: '+ACXL[(awgs.indexOf(wireSize))]);
      console.log('XR per kft: '+ACXR[firstIndex][(awgs.indexOf(wireSize))]);
      console.log(currentType +', '+ wireCurrent +', '+ wireSize +', '+ wireMetal +', '+ wireDist +', '+ vBase +', '+ vPF)
      let  result = Math.sqrt(3)*wireCurrent*((wireDist*ACXR[firstIndex][awgs.indexOf(wireSize)]*vPF/1000) + (wireDist*ACXL[awgs.indexOf(wireSize)]*Math.sin(Math.acos(vPF))/1000))/vBase;
      console.log('vDrop Result: ' + result);
      return 100*result;
    }

  }
}

// given vDrop as a %, return distance that returns this vDrop
function distancePerVDrop(currentType, wireCurrent, wireSize, wireMetal, vDropThres, vBase, vPF) {
  // DC : ((factor=2)*(current (A))*(dist)*(ohms/kft)/1000)/(voltage base)
  // AC : sqrt(3)*(current (A)) * [ (dist*XR/1000) * cos(acos(PF)) + (dist*XL/1000) * sin(acos(PF))] / voltage base
  let firstIndex = 0; // default Copper
  vDropThres = vDropThres/100;

  if (wireMetal === 'Aluminum') {
    firstIndex = 1;
  }

  console.log(currentType);
  // different formulas for dc and ac
  if (currentType === 'DC') {
    console.log('Ohms per kft: '+DCohmKFT[firstIndex][(awgs.indexOf(wireSize))]);
    console.log(currentType +', '+ wireCurrent +', '+ wireSize +', '+ wireMetal +', '+ vDropThres +', '+ vBase +', '+ vPF);
    let result = (1000*vBase*vDropThres)/(2*wireCurrent*DCohmKFT[firstIndex][(awgs.indexOf(wireSize))]);
    console.log('distancePerVDrop Result: ' + result);
    return result;
  } else {
    if (awgs.indexOf(wireSize) > ACXL.length-1) {
        return false;
    } else {
      console.log('XL per kft: '+ACXL[(awgs.indexOf(wireSize))]);
      console.log('XR per kft: '+ACXR[firstIndex][(awgs.indexOf(wireSize))]);
      console.log(currentType +', '+ wireCurrent +', '+ wireSize +', '+ wireMetal +', '+ vDropThres +', '+ vBase +', '+ vPF);
      let  result = (vDropThres*vBase)/(Math.sqrt(3)*wireCurrent*((ACXR[firstIndex][awgs.indexOf(wireSize)]*vPF/1000) + (ACXL[awgs.indexOf(wireSize)]*Math.sin(Math.acos(vPF))/1000)));
      console.log('distancePerVDrop Result: ' + result);
      return result;
    }

  }
}
