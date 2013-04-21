(function($, Robinson, Modernizr) {
  var pickGameElm, playGameElm, endGameElm, helpElm, gameType, overlayElm, rbnsn, canTap, startedTime, currentInfo, canvasElm, ctx, totalPoints;




  var init = function() {
    canTap = false;

    pickGameElm = $('.pick-game').removeClass('hide');
    playGameElm = $('.play-game');
    endGameElm = $('.end-game');
    helpElm = $('.help');
    overlayElm = $('.overlay');
    resultElm = $('.result');

    // start a game
    pickGameElm.on('click', '.play-game', startGame);
    resultElm.on('click', '.next', nextImage);
    $('body').on('click', '.toggle-help', toggleHelp);

    // init the map details
    rbnsn = new Robinson(333, 650, -13);
    setMap();

    setInterval(checkTimer, 400);
  };



  var toggleHelp = function(evt) {
    if (evt) {
      evt.preventDefault();
    }

    if (helpElm.hasClass('hide')) {
      pickGameElm.addClass('hide');
      playGameElm.addClass('hide');
      endGameElm.addClass('hide');
      helpElm.removeClass('hide');
    }
    else {
      pickGameElm.removeClass('hide');
      helpElm.addClass('hide');
    }

  }



  var startGame = function(evt) {
    var typeElm, value;

    // typeElm = $(this);
    // value = typeElm.val();

    // gameType = value;

    totalPoints = 0;

    pickGameElm.addClass('hide');
    playGameElm.removeClass('hide');

    startTimer();

    requestImagery(showImage, requestError);
  };


  var nextImage = function(evt) {
    evt.preventDefault();
    requestImagery(showImage, requestError);
    resultElm.addClass('hide');
    overlayElm.find('img').addClass('hide');
  };


  var stopGame = function() {
    playGameElm.addClass('hide');
    endGameElm.removeClass('hide');
  };


  var requestImagery = function(cb, err) {
    var promise;

    promise = $.ajax('./source.php', {
      cache: false,
      dataType: 'json'
    });

    promise.then(cb, err);

    canTap = true;
  };


  // set map events
  var setMap = function() {
    overlayElm.hammer().on('tap', handleTap);
  };



  var handleTap = function(evt) {
    if (!canTap) {
      return;
    }
    
    var offset, srcEvent;

    offset = $(evt.currentTarget).offset();
    srcEvent = evt.gesture.srcEvent;

    latlng = rbnsn.xy2latlng(srcEvent.clientX - offset.left, srcEvent.clientY - offset.top);

    showAnswer(latlng);

    canTap = false;
  };



  var showImage = function(data) {
    var url;
    url = data.url;
    playGameElm.find('.photo img').attr('src', url);
    currentInfo = data;
  };






  var showAnswer = function(latlng) {
    var lat, lng, xy, dist;

    lat = parseFloat(currentInfo.lat, 10);
    lng = parseFloat(currentInfo.lon, 10);

    xyClicked = rbnsn.latlng2xy(latlng.lat, latlng.lng);
    xyReal = rbnsn.latlng2xy(lat, lng);

    overlayElm.find('img').andSelf().removeClass('hide');
    overlayElm.find('.flag-green').css({left: xyReal.x + 'px', top: xyReal.y + 'px'});
    overlayElm.find('.flag-gray').css({left: xyClicked.x + 'px', top: xyClicked.y + 'px'});
    
    dist = distance(latlng.lat, latlng.lng, lat, lng);
    points = getPoints(dist);

    totalPoints += points;

    $('.thescore').text(totalPoints);

    resultElm.removeClass('hide');
    resultElm.find('.points').text("That's a distance of " + ~~dist + ' kilometers. You scored ' + points + ' points with that!');
  };



  var requestError = function() {
    if (console) {
      console.log('Error');
    }
  };


  var startTimer = function() {
    startedTime = new Date;
  };


  var checkTimer = function() {
    if (!startedTime) {
      return;
    }

    var now, minutes, seconds;

    now = new Date;
    humanTime = 120 - ~~((now.getTime() - startedTime.getTime()) / 1000);

    if (humanTime < 0) {
      stopGame();
    }

    minutes = ~~(humanTime / 60);
    seconds = humanTime % 60;

    seconds = seconds.toFixed(0);

    if (seconds.length  === 1) {
      seconds = '0' + seconds;
    }

    $('.timer').text('Time left: ' + minutes + ':' + seconds);
  };



  var distance = function(lat1, lng1, lat2, lng2) {
    var R, dLat, dLng, a, c;

    R = 6371;
    dLat = (lat2 - lat1) * (Math.PI / 180);
    dLng = (lng2 - lng1) * (Math.PI / 180);
    lat1 = lat1 * (Math.PI / 180);
    lat2 = lat2 * (Math.PI / 180);

    a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2); 
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c; 
  };



  var getPoints = function(dist) {
    if (dist < 0) {
      return 0;
    }
    if (dist > 10000) {
      return 0;
    }
    return 100 - ~~(dist / 100);
  };


  init();
})(jQuery, Robinson, Modernizr);