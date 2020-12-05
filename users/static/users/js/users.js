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
  // Define useful DOM elements and constants
  const $banner = $('.banner');
  const $bg = $('.bg');
  const $logo = $('.logo');
  const $content = $('.content');
  const $container = $content.children('.content-container');
  const $ul = $container.children('ul');
  const $li = $ul.children('li');
  const $anchors = $li.children('a');
  const $buttons = $anchors.children('button');
  const $icons = $buttons.children('svg');
  const $label = $anchors.children('label');
  const $footer = $('footer');

  const initButtonDiameter = 150;
  const aGap = 16;
  const initButtonBorderWidth = 4;

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
    $bg.toggleClass('landscape').toggleClass('portrait');
    currentBackground = !currentBackground;
  };

  // Define window dimensions
  let windowDims = {
    width: $(window).width(),
    height: $(window).height(),
  };

  // Click-to-scroll logo
  const logoCallback = () =>
    $bg.animate(
      { scrollTop: Math.ceil(windowDims.height - $logo.outerHeight()) },
      1000,
    );

  $logo.on('click', (event) => {
    event.preventDefault();
    logoCallback();
  });

  // Calculate size and layout of various elements when page dimensions change
  const update = async () => {
    // Window dimensions
    windowDims = {
      width: $(window).width(),
      height: $(window).height(),
    };

    // Some browsers require 100vh to be defined in pixels
    $('.bg, .bg::before, .bg::after').css({ height: `${windowDims.height}px` });

    // .logo
    const $h1 = $logo.children('h1');
    if (windowDims.width < 358) {
      $h1.css({ 'letter-spacing': 'normal', 'font-size': '1.75rem' });
    } else if (windowDims.width < 439) {
      $h1.css({ 'letter-spacing': 'normal', 'font-size': '2.0rem' });
    } else if (windowDims.width < 553) {
      $h1.css({ 'letter-spacing': 'normal', 'font-size': '2.5rem' });
    } else {
      $h1.css({ 'letter-spacing': '6px', 'font-size': '2.5rem' });
    }

    // .content
    let logoHeight;
    const updateContent = () => {
      // Define useful variable and constants
      logoHeight = $logo.outerHeight();
      const footerHeight = $footer.outerHeight();
      const contentHeight = 2 * windowDims.height - logoHeight - footerHeight;
      const contentPaddingBottom = Math.max(logoHeight - footerHeight, 16);
      const labelHeight = Math.max(
        ...$label.map(function () {
          return $(this).outerHeight();
        }),
      );

      // Switch orientation modes based on values of windowDims
      if (windowDims.width > windowDims.height) {
        $ul.css({ 'flex-direction': 'row' });
        if (currentBackground === portrait) {
          changeBackground();
        }
      } else {
        $ul.css({ 'flex-direction': 'column' });
        if (currentBackground === landscape) {
          changeBackground();
        }
      }

      // Prepare styling for rending next two constants
      $content.css({
        height: `${contentHeight}px`,
        'padding-top': `${windowDims.height}px`,
        'padding-bottom': `${contentPaddingBottom}px`,
      });
      $buttons.hide();

      // Define three more constants that have to come after orientation change
      const liDims = {
        width: Math.max(...$li.map((index, li) => $(li).width())),
        height: Math.max(...$li.map((index, li) => $(li).height())),
      };
      const diameter = Math.min(
        initButtonDiameter,
        liDims.width - 2 * initButtonBorderWidth,
        liDims.height - aGap - labelHeight - 2 * initButtonBorderWidth,
      );
      const scale = (4 * diameter) / initButtonDiameter;

      // Show and scale buttons if scale value is large enough
      if (scale >= 1) {
        $buttons.css({
          display: 'block',
          height: `${diameter}px`,
          width: `${diameter}px`,
          'border-width': `${Math.ceil(scale)}px`,
        });

        $icons.css({ 'font-size': `${scale}em` });
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
  $(window).on('resize orientationchange', update);
  update();
});
