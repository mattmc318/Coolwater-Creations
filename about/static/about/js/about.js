$(() => {
  // show appropriate view based on document hash
  if (document.location.hash) {
    setTimeout(function () {
      window.scrollTo(0, 0);
    }, 1);
  }

  if (
    document.location.hash === '' ||
    document.location.hash === '#' ||
    document.location.hash === '#bio'
  ) {
    $('#bio').show();
    $('#tabs-bio').addClass('active');
  } else if (document.location.hash === '#updates') {
    $('#updates').show();
    $('#tabs-updates').addClass('active');
  } else if (document.location.hash === '#contact') {
    $('#contact').show();
    $('#tabs-contact').addClass('active');
  }

  // define useful variables and constants
  const $window = $(window);
  const $scrollToTop = $('.scroll-to-top');
  const $content = $('#content');

  let updatesPage = 2;
  let updatesEmpty = false;
  let $lastUpdate;

  // infinite scrolling and scroll to top
  function update() {
    // infinite scrolling
    $lastUpdate = $('#updates > ul > li:last-of-type');

    if (!updatesEmpty && $lastUpdate.isInViewport()) {
      getPosts();
    }

    // scroll to top display
    if ($(this).scrollTop() >= 180) {
      $scrollToTop.slideDown();
    } else {
      $scrollToTop.slideUp();
    }
  }

  $window.on('resize', update);
  $content.on('scroll', update);

  // determine if element is in viewport
  $.fn.isInViewport = function () {
    if (!$(this).is(':visible')) {
      return false;
    }

    const elementTop = $(this).offset().top;
    const elementBottom = elementTop + $(this).outerHeight();
    const viewportTop = $window.scrollTop();
    const viewportBottom = viewportTop + $window.height();

    return elementBottom >= viewportTop && elementTop <= viewportBottom;
  };

  // retrieve data
  let beforeAjaxPosition;
  function getPosts() {
    let data = {
      page: updatesPage++,
    };

    beforeAjaxPosition = $window.scrollTop();

    $.get('/about/get_posts', data, function (response) {
      if (response === undefined) {
        updatesEmpty = true;
        return;
      }

      $('#updates ul').append(response);
      $window.scrollTop(beforeAjaxPosition);
      $lastUpdate = $('#updates > ul > li:last-of-type');
    });
  }

  // prevent tab, filter, filter control, and scroll to top behavior on scroll
  $(document).on('touchstart', function () {
    startPosition = $window.scrollTop();
  });

  // scroll to top event handling
  $scrollToTop.on('click touchstart', function () {
    $content.animate(
      {
        scrollTop: 0,
      },
      1000,
    );
  });

  // define tabs behavior
  const $tabs = $('ul.tabs');
  const $tabsChildren = $tabs.children('li');

  let $activeTab = $tabs.children('li.active');

  $tabsChildren
    .on('click touchstart', function (event) {
      event.preventDefault();
      event.stopPropagation();

      $tabsChildren.removeClass('active');

      if (event.type === 'click') {
        $tabsChildren.removeClass('active').each(function () {
          $($(this).data('href')).hide();
        });

        $activeTab = $(this);
        $($(this).data('href')).show();
      } else {
        $(this).addClass('active');
      }
    })
    .on('touchend', function (event) {
      let changes = event.changedTouches[0];
      let $endElement = $(
        document.elementFromPoint(changes.pageX, changes.pageY),
      );

      if ($endElement.parent('.tabs').length) {
        $tabsChildren.removeClass('active').each(function () {
          $($(this).data('href')).hide();
        });

        $activeTab = $endElement;
        $endElement.addClass('active');
        $($endElement.data('href')).show();
        event.stopPropagation();
      }
    });

  $tabs
    .on('mouseenter', () => {
      $activeTab.removeClass('active');
    })
    .on('mouseleave', () => {
      $activeTab.addClass('active');
    });

  $window
    .on('touchstart', () => {
      $activeTab.addClass('active');
    })
    .on('touchend', () => {
      $tabsChildren.removeClass('active');
      $activeTab.addClass('active');
    });
});
