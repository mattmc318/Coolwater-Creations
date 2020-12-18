// Cookies! Adapted from code found on W3Schools
function setCookie(name, value) {
  const date = new Date();
  date.setTime(date.getTime() + 365 * 24 * 60 * 60 * 1000);
  const expires = 'expires=' + date.toUTCString();

  document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict;`;
}

function getCookie(name) {
  const _name = name + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');

  for (let i = 0; i < cookieArray.length; i++) {
    let cookie = cookieArray[i];
    while (cookie.charAt(0) == ' ') {
      cookie = cookie.substring(1);
    }
    if (cookie.indexOf(_name) == 0) {
      return cookie.substring(_name.length, cookie.length);
    }
  }

  return '';
}

// Asynchronous sleep function
const sleep = (milliseconds = 50) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

$(() => {
  // Define useful DOM elements
  const $window = $(window);
  const $body = $('body');
  const $banner = $('.banner');
  const $page = $('#page');
  const $logo = $page.children('.logo');
  const $content = $page.children('.content');

  // GDPR banner
  switch (getCookie('gdpr')) {
    case '':
      setCookie('gdpr', 'false');
    case 'false':
      $banner.show();
      break;
    case 'true':
      $banner.hide();
      break;
  }

  // Dismiss banner and remember clicked state for next visit
  $banner.on('click', '.close', function (event) {
    event.preventDefault();
    $banner.hide();
    setCookie('gdpr', 'true');
  });

  // Update background and blurred container
  const landscape = true;
  const portrait = false;
  let currentBackground = landscape;
  const changeBackground = () => {
    $('#bg, #page').toggleClass('landscape').toggleClass('portrait');
    currentBackground = !currentBackground;
  };

  // Define window dimensions
  let windowDims = {
    width: $window.width(),
    height: $window.height(),
  };

  // Click-to-scroll logo
  $logo.on('click touchstart', (event) => {
    event.preventDefault();
    $content.animate(
      { scrollTop: Math.ceil(windowDims.height - $logo.outerHeight()) },
      1000,
    );
  });

  // Calculate size and layout of various elements when page dimensions change
  const update = async () => {
    // Window dimensions
    windowDims = {
      width: $window.width(),
      height: $window.height(),
    };

    // Some browsers (like Safari) require 100vh to be defined in pixels
    $body.css({
      '--page-height': `${windowDims.height}px`,
    });

    // .content
    let logoHeight = 0;
    const updateContent = () => {
      // get and set height of .logo
      logoHeight = $logo.outerHeight();
      $body.css({
        '--logo-height': `${logoHeight}px`,
      });

      // Switch orientation modes based on values of windowDims
      if (
        (windowDims.width > windowDims.height &&
          currentBackground === portrait) ||
        (windowDims.width <= windowDims.height &&
          currentBackground === landscape)
      ) {
        changeBackground();
      }
    };

    // Keep updating content in 50ms intervals until logo updates with a max.
    // timeout of three seconds
    updateContent();
    for (let i = 0; logoHeight < 100 && i < 60; i++) {
      await sleep();
      updateContent();
    }
  };

  // Set update listener and call initially
  $window.on('resize orientationchange', update);
  update();
});
