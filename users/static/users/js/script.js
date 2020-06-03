var COVERS = ["dragon.jpg"];

function setCookie(cname, cvalue) {
    let d = new Date();
    d.setTime(d.getTime() + (365*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/;SameSite=Strict";
}

function getCookie(cname) {
    let name = cname + "=";
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
    return "";
}

$(document).ready(function () {
    function setBackgroundImage(image) {
        $('.parallax').css('background-image', `url("/static/users/img/${image}")`);
    }

    function updateBackgroundImage() {
        let cover = getCookie("cover");

        if (cover === "") {
            setCookie("cover", 0);
        } else {
            setCookie("cover", (eval(cover) + 1) % COVERS.length);
        }

        cover = getCookie("cover");
        if ($(window).width() > 1183) {
            setBackgroundImage(COVERS[cover]);
        }
    }

   let gdpr = getCookie("gdpr");

    if (gdpr === "") {
        setCookie("gdpr", "false");
        gdpr = getCookie("gdpr");
        $(".banner").show();
    } else if (gdpr === "false") {
        $(".banner").show();
    } else if (gdpr === "true") {
        $(".banner").hide();
    }

    updateBackgroundImage();

    $(window).resize(function () {
        if ($(window).width() <= 1183) {
            $('menu-item').removeClass("parallax");
            setBackgroundImage("dragon_mobile.jpg");
        } else {
            $('menu-item').addClass("parallax");
            let cover = getCookie("cover");
            setBackgroundImage(COVERS[cover]);
        }
    });

    $(".logo").click(function (e) {
        e.preventDefault();
        $("html, body").animate({
            scrollTop: $(".logo").offset().top
        }, 1000);
    });

    $("#close").click(function (e) {
        e.preventDefault();
        $(".banner").hide();
        setCookie("gdpr", "true");
    });
});
