/*
  Robinson.js
  * To convert X/Y to Lat/Long
  * To concert Lat/Long to X/Y

  Inspired by https://github.com/afar/robinson_projection/blob/master/robinson.js

  License: MIT
*/
var Robinson = (function() {
  var AA, BB, sign, roundToNearest, radian, earthRadius, Robinson;

  AA = [0.8487,0.84751182,0.84479598,0.840213,0.83359314,0.8257851,0.814752,0.80006949,0.78216192,0.76060494,0.73658673,0.7086645,0.67777182,0.64475739,0.60987582,0.57134484,0.52729731,0.48562614,0.45167814];

  BB = [0,0.0838426,0.1676852,0.2515278,0.3353704,0.419213,0.5030556,0.5868982,0.67182264,0.75336633,0.83518048,0.91537187,0.99339958,1.06872269,1.14066505,1.20841528,1.27035062,1.31998003,1.3523];


  sign = function(value) {
    return value < 0 ? -1 : 1;
  };



  roundToNearest = function(roundTo, value) {
    return Math.floor(value / roundTo) * roundTo;
  };


  findIndex = function(arr, value) {
    for (var i = 0, l = arr.length; i < l; ++i) {
      if (arr[i] > value) {
        return i - 1;
      }
    }
    return arr.length - 1;
  };


  radian = Math.PI / 180;


  Robinson = function(height, width, offsetX, offsetY) {
    this.height = height;
    this.width = width;
    this.offsetX = offsetX || 0;
    this.offsetY = offsetY || 0;
    this.earthRadius = (width / 2.666269758) / 2;
  };


  Robinson.prototype.latlng2xy = function(lat, lng) {
    var latSign, lngSign, low, high, lowIndex, highIndex, ratio, adjAA, adjBB, x, y;

    latSign = sign(lat);
    lngSign = sign(lng);

    lat = Math.abs(lat);
    lng = Math.abs(lng);

    low = roundToNearest(5, lat - 0.0000000001);
    low = (lat == 0) ? 0 : low;
    high = low + 5;

    lowIndex = low / 5;
    highIndex = high / 5;
    ratio = (lat - low) / 5;

    adjAA = ((AA[highIndex] - AA[lowIndex]) * ratio) + AA[lowIndex];
    adjBB = ((BB[highIndex] - BB[lowIndex]) * ratio) + BB[lowIndex];

    x = (adjAA * lng * radian * lngSign * this.earthRadius) + this.offsetX;
    y = (adjBB * latSign * this.earthRadius) + this.offsetY;


    return {
      x: (x + (this.width / 2)),
      y: ((this.height / 2) - y)
    };
  };



  Robinson.prototype.xy2latlng = function(x, y) {
    var origX, origY, latSign, lngSign, low, high, lowIndex, highIndex, ratio, adjAA, adjBB, x, y, lat, lng;

    origX = x - (this.width / 2) - this.offsetX;
    origY = -1 * (y - this.height / 2) - this.offsetY;

    xSign = sign(origX);
    ySign = sign(origY);

    origX = Math.abs(origX);
    origY = Math.abs(origY);

    adjAA = origX / (this.earthRadius * radian);
    adjBB = origY / (this.earthRadius);

    highIndex = findIndex(BB, adjBB);
    lowIndex = highIndex - 1;

    if (lowIndex < 0) {
      lowIndex = 0;
      highIndex = 1;
    }

    ratio = (adjBB - BB[lowIndex]) / (BB[highIndex] - BB[lowIndex]);

    realAA = ((AA[highIndex] - AA[lowIndex]) * ratio) + AA[lowIndex];

    lng = adjAA / realAA;

    low = lowIndex * 5;
    high = highIndex * 5;

    lat = ratio * 5 + low;

    return {
      lat: lat * ySign,
      lng: lng * xSign
    };
  };


  return Robinson;
})();