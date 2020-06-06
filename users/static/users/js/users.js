var COVERS = ['dragon.jpg'];

function setCookie(cname, cvalue) {
  let d = new Date();
  d.setTime(d.getTime() + (365*24*60*60*1000));
  let expires = 'expires='+ d.toUTCString();
  document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/;SameSite=Strict';
}

function getCookie(cname) {
  let name = cname + '=';
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for (let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
}

$(document).ready(function () {
  function setBackgroundImage(image) {
    $('.parallax').css('background-image', `url('/static/users/img/${image}')`);
  }

  function updateBackgroundImage() {
    let cover = getCookie('cover');

    if (cover === '') {
      setCookie('cover', 0);
    } else {
      setCookie('cover', (eval(cover) + 1) % COVERS.length);
    }

    cover = getCookie('cover');
    if ($(window).width() > 1183) {
      setBackgroundImage(COVERS[cover]);
    }
  }

  let gdpr = getCookie('gdpr');

  if (gdpr === '') {
    setCookie('gdpr', 'false');
    gdpr = getCookie('gdpr');
    $('.banner').show();
  } else if (gdpr === 'false') {
    $('.banner').show();
  } else if (gdpr === 'true') {
    $('.banner').hide();
  }

  updateBackgroundImage();

  let vw = Math.max(
    document.documentElement.clientWidth || 0,
    window.innerWidth || 0
  ),
  vh = Math.max(
    document.documentElement.clientHeight || 0,
    window.innerHeight || 0
  ),
  bottomOffset = $(document).height() - vh;

  $('.logo').click(function (e) {
    e.preventDefault();

    $('html, body').animate({
      'scrollTop': bottomOffset,
    }, 1000);
  });

  $(window).on('resize orientationchange', function () {
    vw = Math.max(
      document.documentElement.clientWidth || 0,
      window.innerWidth || 0
    ),
    vh = Math.max(
      document.documentElement.clientHeight || 0,
      window.innerHeight || 0
    ),
    bottomOffset = $(document).height() - vh;

    if ($(window).width() <= 1183) {
      $('menu-item').removeClass('parallax');
      setBackgroundImage('dragon_mobile.jpg');
    } else {
      $('menu-item').addClass('parallax');
      let cover = getCookie('cover');
      setBackgroundImage(COVERS[cover]);
    }
  });

  $('#close').click(function (e) {
    e.preventDefault();
    $('.banner').hide();
    setCookie('gdpr', 'true');
  });
});
