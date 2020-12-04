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
  const update = () => {
    // Window dimensions
    windowDims = {
      width: $(window).width(),
      height: $(window).height(),
    };

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
    const logoHeight = $logo.outerHeight();
    const footerHeight = $footer.outerHeight();
    const contentHeight = 2 * windowDims.height - logoHeight - footerHeight;
    const contentPaddingBottom = logoHeight - footerHeight;

    const labelHeight = Math.max(
      ...$label.map(function () {
        return $(this).outerHeight();
      }),
    );

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

    $content.css({
      height: `${contentHeight}px`,
      'padding-bottom': `${contentPaddingBottom}px`,
    });
    $buttons.hide();

    const diameter = Math.min(
      initButtonDiameter,
      $li.first().width() - 2 * initButtonBorderWidth,
      $li.first().height() - aGap - labelHeight - 2 * initButtonBorderWidth,
    );

    const scale = (4 * diameter) / initButtonDiameter;
    if (scale < 1) {
      $buttons.hide();
    } else {
      $buttons.show();

      $buttons.css({
        height: `${diameter}px`,
        width: `${diameter}px`,
        'border-width': `${Math.ceil(scale)}px`,
      });

      $icons.css({ 'font-size': `${scale}em` });
    }
  };

  $(window).on('resize orientationchange', update);
  update();
});
