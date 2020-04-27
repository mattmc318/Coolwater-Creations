$(document).ready(function () {
    // update filters' text
    var $filters = $('ul.filters > li');

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

    // show appropriate view based on document hash
    if (document.location.hash) {
        setTimeout(function () {
            window.scrollTo(0, 0);
        }, 1);
    }

    if (document.location.hash === '' ||
        document.location.hash === '#' ||
        document.location.hash === '#gallery') {
        $('#gallery').show();
        $('#tabs-gallery').addClass('active');
        updateGalleryFilters();
    } else if (document.location.hash === '#archive') {
        $('#archive').show();
        $('#tabs-archive').addClass('active');
        updateArchiveFilters();
    }

    // determine if element is in viewport
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

    // infinite scrolling and scroll to top
    var galleryPage = archivePage = 2;
    var galleryEmpty = archiveEmpty = false;
    var $scrollToTop = $('.scroll-to-top');
    var $lastGallery;
    var $lastArchive;

    $(window).on('resize scroll', function () {
        // infinite scrolling
        $lastGallery = $('#gallery ul').find('li:last-of-type');
        $lastArchive = $('#archive ul').find('li:last-of-type');

        if (!galleryEmpty && $lastGallery.isInViewport()) {
            getGalleryFiltered();
        } else if (!archiveEmpty && $lastArchive.isInViewport()) {
            getArchiveFiltered();
        }

        // scroll to top display
        if ($(window).scrollTop() >= 180) {
            $scrollToTop.slideDown();
        } else {
            $scrollToTop.slideUp();
        }
    });

    // retrieve filtered data
    var beforeAjaxPosition;
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

    // prevent tab, filter, filter control, and scroll to top behavior on scroll
    $(document).on('touchstart', function () {
        startPosition = $(window).scrollTop();
    });

    // scroll to top event handling
    $(document).on('click touchstart', '.scroll-to-top', function (event) {
        $("html, body").animate({
            scrollTop: 0,
        }, 1000);
    });

    // define tabs behavior
    var $tabs = $('ul.tabs');
    var $tabsChildren = $('ul.tabs > li');
    var $activeTab = $('ul.tabs > li.active');

    $($activeTab.data('href')).show();

    function tabsChildrenClick($tab) {
        $activeTab.addClass('active');
        galleryPage = archivePage = 1;
        galleryEmpty = archiveEmpty = false;

        $tabsChildren.each(function () {
            $($(this).data('href')).hide();
            $(this).removeClass('active')
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
        var changes = event.changedTouches[0];
        var $endElement = $(document.elementFromPoint(changes.pageX, changes.pageY));

        if ($endElement.parent('.tabs').length) {
            tabsChildrenClick($(this));

            $tabsChildren
                .removeClass('active')
                .each(function () {
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

    // define filters behavior
    var visible = false;
    var $filtersButton = $('div.filters-button');
    var $dropdown = $('div.filters-dropdown');

    $filtersButton.on('click touchend', function (event) {
        event.preventDefault();
        event.stopPropagation();

        var endPosition = $(window).scrollTop();

        if (event.type === 'click' ||
            (event.type === 'touchend' && startPosition === endPosition)) {
            if (visible) {
                $dropdown.slideUp(500);

                setTimeout(function () {
                    $filtersButton.html('Show Filters <i class="fas fa-chevron-down"></i>');
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

        var endPosition = $(window).scrollTop();
        galleryPage = archivePage = 1;
        galleryEmpty = archiveEmpty = false;

        if (event.type === 'click' ||
            (event.type === 'touchend' && startPosition === endPosition)) {
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

    // define select all/none behavior
    var $filterControl = $('ul.filter-control > li');

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

        var endPosition = $(window).scrollTop();

        if (event.type === 'click' ||
            (event.type === 'touchend' && startPosition === endPosition)) {
            filterControlClick($(this));
        }
    });
});

