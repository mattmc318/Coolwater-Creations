$(document).ready(function () {
    // show appropriate view based on document hash
    if (document.location.hash) {
        setTimeout(function () {
            window.scrollTo(0, 0);
        }, 1);
    }

    if (document.location.hash === '' ||
        document.location.hash === '#' ||
        document.location.hash === '#bio') {
        $('#bio').show();
        $('#tabs-bio').addClass('active');
    } else if (document.location.hash === '#updates') {
        $('#updates').show();
        $('#tabs-updates').addClass('active');
    } else if (document.location.hash === '#contact') {
        $('#contact').show();
        $('#tabs-contact').addClass('active');
    }

    // infinite scrolling and scroll to top
    let updatesPage = 2;
    let updatesEmpty = false;
    let $scrollToTop = $('.scroll-to-top');
    let $lastUpdate;

    $(window).on('resize scroll', function () {
        // infinite scrolling
        $lastUpdate = $('#updates ul').find('li:last-of-type');

        if (!updatesEmpty && $lastUpdate.isInViewport()) {
            getPosts();
        }

        // scroll to top display
        if ($(window).scrollTop() >= 180) {
            $scrollToTop.slideDown();
        } else {
            $scrollToTop.slideUp();
        }
    });

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

    // retrieve data
    let beforeAjaxPosition;
    function getPosts() {
        let data = {
            page: updatesPage++,
        };

        beforeAjaxPosition = $(window).scrollTop();

        $.get('/about/get_posts', data, function (response) {
            if (response === undefined) {
                updatesEmpty = true;
                return;
            }

            $('#updates ul').append(response);
            $(window).scrollTop(beforeAjaxPosition);
            $lastUpdate = $('#updates ul').find('li:last-of-type');
        });
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
    let $activeTab = $('ul.tabs > li.active');
    let $tabs = $('ul.tabs');
    let $tabsChildren = $('ul.tabs > li');

    $tabsChildren.on('click touchstart', function (event) {
        event.preventDefault();
        event.stopPropagation();

        $tabsChildren.removeClass('active');

        if (event.type === 'click') {
            $tabsChildren
                .removeClass('active')
                .each(function () {
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
        let $endElement = $(document.elementFromPoint(changes.pageX, changes.pageY));

        if ($endElement.parent('.tabs').length) {
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
});
