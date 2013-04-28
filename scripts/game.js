(function($, Robinson, Modernizr) {
  var pickGameElm, playGameElm, playAgainElm, endGameElm, helpElm, gameType, overlayElm, rbnsn, canTap, startedTime, currentInfo, canvasElm, ctx, totalPoints, textsForPoints, collected, playing, hintUsed;


  textsForPoints = {
    'p500': ['Spot On', 'Bulls Eye', 'On target'],
    'p1500': ['Spot On', 'Bulls Eye', 'On target'],
    'p3000': ['Nice one', 'Super close', 'Well done'],
    'p5000': ['Getting close', 'Not bad', 'Almost'],
    'p10000': [' Not quite', 'Oops', 'Wrong guess'],
    'p100000': ['Not even near', 'Other continent', 'Big miss']
  }


  var init = function() {
    var id;

    canTap = false;
    playing = false;

    pickGameElm = $('.pick-game').removeClass('hide');
    playGameElm = $('.play-game');
    playAgainElm = $('.play-again');
    endGameElm = $('.end-game');
    helpElm = $('.help');
    overlayElm = $('.overlay');
    resultElm = $('.result');

    // start a game
    pickGameElm.on('click', '.go-play-game', startGame);
    resultElm.on('click', '.next', nextImage);
    $('body').on('click', '.toggle-help', toggleHelp);
    playGameElm.on('click', '.hint', openHint);
    playAgainElm.on('click', startGame);

    // init the map details
    rbnsn = new Robinson(333, 650, -13);
    setMap();

    setInterval(checkTimer, 400);

    id = parseInt(location.hash.substr(1), 10);

    if (id) {
      startGame(id);
    }
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
  };



  var startGame = function(evt) {
    var id;
    if (typeof evt === 'number') {
      id = evt;
    }
    else {
      evt.preventDefault();
      id = false;
    }

    playing = true;

    totalPoints = 0;
    collected = [];

    endGameElm.addClass('hide');
    pickGameElm.addClass('hide');
    playGameElm.removeClass('hide');

    startTimer();

    requestImagery(showImage, requestError, id);
  };


  var nextImage = function(evt) {
    evt.preventDefault();
    requestImagery(showImage, requestError);
    resultElm.addClass('hide');
    overlayElm.find('img').addClass('hide');
  };


  var stopGame = function() {
    if (!playing) {
      return;
    }

    var id, url;

    playing = false;
    playGameElm.addClass('hide');
    endGameElm.removeClass('hide');

    id = collected[~~(Math.random() * collected.length)].id;

    url = 'http://whereonthebluemarble.com/photo?id=' + id;

    endGameElm.find('.twitter').html('<a href="https://twitter.com/share" class="twitter-share-button" data-url="http://whereonthebluemarble.com" data-text="I scored ' + totalPoints + ' points by guessing this picture of our #BlueMarble ' + url + ' Try and beat me!" data-size="large" data-count="none" data-dnt="true">Tweet</a>');

    !function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');
  };


  var requestImagery = function(cb, err, id) {
    var promise, url;

    if (id !== false && id) {
      url = './serveRandomImage.php?id=' + id;
    }
    else {
      url = './serveRandomImage.php';
    }

    currentInfo = false;

    playGameElm.find('.photo img').addClass('hide');

    promise = $.ajax(url, {
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
    
    var offset, pos;

    offset = $(evt.currentTarget).offset();
    pos = evt.gesture.touches[0];

    latlng = rbnsn.xy2latlng(pos.pageX - offset.left, pos.pageY - offset.top);

    showAnswer(latlng);
  };



  var showImage = function(data) {
    var url;
    url = data.url;
    playGameElm.find('.photo img').removeClass('hide').attr('src', url);
    playGameElm.find('.hint').attr('data-title', 'The photo shows some part of ' + data.hint + '.').addClass('closed');
    currentInfo = data;
    collected.push(data);
    hintUsed = false;
  };






  var showAnswer = function(latlng) {
    if (!currentInfo) {
      return;
    }
    canTap = false;

    var lat, lng, xy, dist, details, toPush;

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
    resultElm.find('.points').text("That's a distance of " + ~~dist + ' kilometers. You scored ' + points + ' points with that!' + (hintUsed ? ' It would be ' + points * 2 + " points if you'd done it without a hint." : ''));
    resultElm.find('.awesome-text').text(getAwesomeText(dist));

    details = [];

    // if (currentInfo.feat && currentInfo.feat.length) {
    //   toPush = 'It features ' + currentInfo.feat;

    //   if (currentInfo.geon && currentInfo.geon.length) {
    //     toPush += ' in ' + currentInfo.geon;
    //   }

    //   toPush += '.';
    //   details.push(toPush);
    // }

    // if (currentInfo.mission && currentInfo.mission.length) {
    //  toPush = 'The photo was taken during the ' + currentInfo.mission + ' mission';

    //   if (currentInfo.mission_start && currentInfo.mission_end) {
    //     toPush += ', which took place between ' + currentInfo.mission_start + ' and ' + currentInfo.mission_end;
    //   }

    //   toPush += '.';
    //   details.push(toPush);
    // }

    // if (currentInfo.cloudpercentage) {
    //   details.push('The cloud percentage is ' + currentInfo.cloudpercentage + '%.');
    // }

    details.push(currentInfo.info);

    resultElm.find('.details').text(details.join(' '));
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
    var points = ((dist / 1000) - 10);
    points = points * points;
    if (hintUsed) {
      points = points / 2;
    }
    points = Math.floor(points);
    return points;
  };


  var getAwesomeText = function(p) {
    var randomText = function(arr) {
      return arr[~~(Math.random() * arr.length)]
    }

    p = parseInt(p, 10);

    if (p < 500) {
      return randomText(textsForPoints.p500);
    }
    if (p < 1500) {
      return randomText(textsForPoints.p1500);
    }
    if (p < 3000) {
      return randomText(textsForPoints.p3000);
    }
    if (p < 5000) {
      return randomText(textsForPoints.p5000);
    }
    if (p < 10000) {
      return randomText(textsForPoints.p10000);
    }
    return randomText(textsForPoints.p100000);
  };


  var openHint = function(evt) {
    evt.preventDefault();
    playGameElm.find('.hint').removeClass('closed');
    hintUsed = true;
  }


  init();
})(jQuery, Robinson, Modernizr);