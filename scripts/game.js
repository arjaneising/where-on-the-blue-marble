(function($, Robinson) {
  var pickGameElm, playGameElm, gameType, rbnsn;





  var init = function() {
    pickGameElm = $('.pick-game').removeClass('hide');
    playGameElm = $('.play-game');

    // start a game
    pickGameElm.on('change', 'input', startGame);

    // init the map details
    rbnsn = new Robinson(333, 650, -13);
    setMap();
  };



  var startGame = function(evt) {
    var typeElm, value;

    typeElm = $(this);
    value = typeElm.val();

    gameType = value;

    pickGameElm.addClass('hide');
    playGameElm.removeClass('hide');

    requestImagery(showImage, requestError);
  };


  var requestImagery = function(cb, err) {
    var promise;

    promise = $.ajax('./source.php', {
      cache: false,
      dataType: 'json'
    });

    promise.then(cb, err);
  };


  // set map events
  var setMap = function() {
    var map;

    map = $('.map');

    map.hammer().on('tap', function(evt) {
      var offset, srcEvent;

      offset = $(evt.currentTarget).offset();
      srcEvent = evt.gesture.srcEvent;

      latlng = rbnsn.xy2latlng(srcEvent.clientX - offset.left, srcEvent.clientY - offset.top);

      console.log('LAT', latlng.lat);
      console.log('LNG', latlng.lng);
    });
  }



  var showImage = function(data) {
    var url;
    url = data.url;
    playGameElm.find('.photo img').attr('src', url);
  };



  var requestError = function() {
    if (console) {
      console.log('Error');
    }
  }


  init();
})(jQuery, Robinson);