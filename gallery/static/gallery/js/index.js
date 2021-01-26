$(() => {
  // Hide scrollbar and nav placeholder
  $('html').css({ 'scrollbar-width': 'none' });
  $('.nav-placeholder').remove();

  // Update page below nav on page load, resize, or orientation change
  const $scroll = $('#scroll');

  const update = () => {
    const windowDims = {
      width: $(window).width(),
      height: $(window).height(),
    };
    const navHeight = windowDims.width < 768 ? 47 : 56;

    $('html').css({ height: `${windowDims.height}px` });
    $scroll.css({ height: `${windowDims.height - navHeight}px` });
  };

  update();
  $(window).on('resize orientationchange', update);

  // Update filters' text
  let $filters = $('ul.filters > li');

  function updateGalleryFilters() {
    $filters.each(function () {
      let name = $(this).data('name');
      let galleryCount = $(this).data('gallery-count');

      $(this).text(`${name} \(${galleryCount}\)`);
    });
  }

  function updateArchiveFilters() {
    $filters.each(function () {
      let name = $(this).data('name');
      let archiveCount = $(this).data('archive-count');

      $(this).text(`${name} \(${archiveCount}\)`);
    });
  }

  // Show appropriate view based on document hash
  if (document.location.hash) {
    setTimeout(function () {
      window.scrollTo(0, 0);
    }, 1);
  }

  if (
    document.location.hash === '' ||
    document.location.hash === '#' ||
    document.location.hash === '#gallery'
  ) {
    $('#gallery').show();
    $('#tabs-gallery').addClass('active');
    updateGalleryFilters();
  } else if (document.location.hash === '#archive') {
    $('#archive').show();
    $('#tabs-archive').addClass('active');
    updateArchiveFilters();
  }

  // Determine if element is in viewport
  $.fn.isInViewport = function () {
    if (!$(this).is(':visible')) {
      return false;
    }

    let elementTop = $(this).offset().top;
    let elementBottom = elementTop + $(this).outerHeight();
    let viewportTop = $(window).scrollTop();
    let viewportBottom = viewportTop + $(window).height();

    return elementBottom >= viewportTop && elementTop <= viewportBottom;
  };

  // Infinite scrolling and scroll to top
  const $scrollToTop = $('.scroll-to-top');

  let galleryPage = (archivePage = 2);
  let galleryEmpty = (archiveEmpty = false);
  let $lastGallery;
  let $lastArchive;
  let cooldown = false;

  $scroll.on('resize scroll', function () {
    $lastGallery = $('#gallery > ul > li:last-of-type');
    $lastArchive = $('#archive > ul > li:last-of-type');

    if (!cooldown) {
      cooldown = true;

      // Infinite scrolling
      if (!galleryEmpty && $lastGallery.isInViewport()) {
        getGalleryFiltered();
      } else if (!archiveEmpty && $lastArchive.isInViewport()) {
        getArchiveFiltered();
      }

      // Scroll to top display
      if ($(this).scrollTop() >= 180) {
        $scrollToTop.slideDown();
      } else {
        $scrollToTop.slideUp();
      }

      setTimeout(() => {
        cooldown = false;
      }, 1000);
    }
  });

  // Retrieve filtered data
  let beforeAjaxPosition;
  function getGalleryFiltered() {
    let data = {
      page: galleryPage++,
    };

    beforeAjaxPosition = $(window).scrollTop();

    filterList = [];
    $('ul.filters > li.active').each(function () {
      filterList.push($(this).data('name'));
    });

    if (filterList.length > 0) {
      data['filterString'] = filterList.join();
    }

    $.get('/gallery/gallery', data, function (response) {
      if (response === undefined) {
        galleryEmpty = true;
        return;
      }

      $('#gallery ul').append(response);
      $('#gallery').show();
      $(window).scrollTop(beforeAjaxPosition);
      $lastGallery = $('#gallery ul').find('li:last-of-type');
    });
  }

  function getArchiveFiltered() {
    let data = {
      page: archivePage++,
    };

    beforeAjaxPosition = $(window).scrollTop();

    filterList = [];
    $('ul.filters > li.active').each(function () {
      filterList.push($(this).data('name'));
    });

    if (filterList.length > 0) {
      data['filterString'] = filterList.join();
    }

    $.get('/gallery/archive', data, function (response) {
      if (response === undefined) {
        archiveEmpty = true;
        return;
      }

      $('#archive ul').append(response);
      $('#archive').show();
      $(window).scrollTop(beforeAjaxPosition);
      $lastArchive = $('#archive ul').find('li:last-of-type');
    });
  }

  function getFiltered($tab) {
    beforeAjaxPosition = $(window).scrollTop();

    if ($tab.data('href') === '#gallery') {
      $('#gallery ul > li').remove();
      getGalleryFiltered();
    } else if ($tab.data('href') === '#archive') {
      $('#archive ul > li').remove();
      getArchiveFiltered();
    }
  }

  // Scroll to top event handling
  $(document)
    .on('touchstart', function () {
      // Prevent tab, filter, filter control, and scroll to top behavior on
      // scroll
      startPosition = $(window).scrollTop();
    })
    .on('click touchend', '.scroll-to-top', function (event) {
      $scroll.animate({ scrollTop: 0 }, 1000);
    });

  // Define tabs behavior
  const $tabs = $('ul.tabs');
  const $tabsChildren = $('ul.tabs > li');
  let $activeTab = $('ul.tabs > li.active');

  $($activeTab.data('href')).show();

  function tabsChildrenClick($tab) {
    $activeTab.addClass('active');
    galleryPage = archivePage = 1;
    galleryEmpty = archiveEmpty = false;

    $tabsChildren.each(function () {
      $($(this).data('href')).hide();
      $(this).removeClass('active');
    });

    let view = $tab.data('href');
    $activeTab = $tab;

    if (view === '#gallery') {
      updateGalleryFilters();
    } else if (view === '#archive') {
      updateArchiveFilters();
    }

    getFiltered($activeTab);
  }

  $tabsChildren.on('click touchstart', function (event) {
    event.preventDefault();
    event.stopPropagation();

    $tabsChildren.removeClass('active');

    if (event.type === 'click') {
      tabsChildrenClick($(this));

      $tabsChildren.each(function () {
        $($(this).data('href')).hide();
      });

      $activeTab = $(this);
      $($(this).data('href')).show();
    } else {
      $(this).addClass('active');
    }
  });

  $tabsChildren.on('touchend', function (event) {
    let changes = event.changedTouches[0];
    let $endElement = $(
      document.elementFromPoint(changes.pageX, changes.pageY),
    );

    if ($endElement.parent('.tabs').length) {
      tabsChildrenClick($(this));

      $tabsChildren.removeClass('active').each(function () {
        $($(this).data('href')).hide();
      });

      $activeTab = $endElement;
      $endElement.addClass('active');
      $($endElement.data('href')).show();
      event.stopPropagation();
    }
  });

  $tabs.mouseenter(function () {
    $activeTab.removeClass('active');
  });
  $tabs.mouseleave(function () {
    $activeTab.addClass('active');
  });

  $(window).on('touchstart', function () {
    $activeTab.addClass('active');
  });
  $(window).on('touchend', function () {
    $tabsChildren.removeClass('active');
    $activeTab.addClass('active');
  });

  // Define filters behavior
  let visible = false;
  const $filtersButton = $('div.filters-button');
  const $dropdown = $('div.filters-dropdown');

  $filtersButton.on('click touchend', function (event) {
    event.preventDefault();
    event.stopPropagation();

    const endPosition = $(window).scrollTop();

    if (
      event.type === 'click' ||
      (event.type === 'touchend' && startPosition === endPosition)
    ) {
      if (visible) {
        $dropdown.slideUp(500);

        setTimeout(function () {
          $filtersButton.html(
            'Show Filters <i class="fas fa-chevron-down"></i>',
          );
        }, 500);
      } else {
        $dropdown.slideDown(500);

        setTimeout(function () {
          $filtersButton.html('Hide Filters <i class="fas fa-chevron-up"></i>');
        }, 500);
      }

      visible = !visible;
    }
  });

  $filters.on('click touchend', function (event) {
    event.preventDefault();
    event.stopPropagation();

    const endPosition = $(window).scrollTop();
    galleryPage = archivePage = 1;
    galleryEmpty = archiveEmpty = false;

    if (
      event.type === 'click' ||
      (event.type === 'touchend' && startPosition === endPosition)
    ) {
      $(this).toggleClass('active');
      getFiltered($('ul.tabs > li.active'));
    }
  });

  $filters.mouseenter(function () {
    $(this).addClass('hover');
  });
  $filters.mouseleave(function () {
    $(this).removeClass('hover');
  });

  // Define select all/none behavior
  let $filterControl = $('ul.filter-control > li');

  function filterControlClick($filterControl) {
    galleryPage = archivePage = 1;
    galleryEmpty = archiveEmpty = false;

    if ($filterControl.is($('ul.filter-control > li:first-of-type'))) {
      $filters.each(function () {
        $(this).addClass('active');
      });
    } else if ($filterControl.is($('ul.filter-control > li:last-of-type'))) {
      $filters.each(function () {
        $(this).removeClass('active');
      });
    }

    getFiltered($('ul.tabs > li.active'));
  }

  $filterControl.on('click touchend', function (event) {
    event.preventDefault();
    event.stopPropagation();

    let endPosition = $(window).scrollTop();

    if (
      event.type === 'click' ||
      (event.type === 'touchend' && startPosition === endPosition)
    ) {
      filterControlClick($(this));
    }
  });
});
