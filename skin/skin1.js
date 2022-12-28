////////////////////////////////////////////////////////////////////////////////////////// 
// Please do not modify this file unless absolutely necessary
//////////////////////////////////////////////////////////////////////////////////////////


window.fillTitle = () => {
    $('.title').each(function (){
        $(this).text(window.skin.title)
    });
    $('.lgn.footer').each(function (){
        $(this).text(window.skin.copyright)
    });
}

//$('head').append('<link rel="shortcut icon" href="'+window.skin.favicon+'" type="image/x-icon">')

// 
$( document ).ready(function() {
//    $('title').text(window.skin.pageTitle);
//    $('.logo-container').attr('href', window.skin.logourl);
    $('.bottom-global-menu').prepend('<a class="vxgbutton-rounded upgrade" target="_blank" href="https://www.videoexpertsgroup.com">Contact us</a><span style="color: lightgray;"><br><br>Please contact us to enable recording control and integration tools.</span>');
});

let images = [];
function preload() {
    for (i = 0; i < preload.arguments.length; i++) {
        images[i] = new Image()
        images[i].src = preload.arguments[i]
    }
}
preload(
    "skin/img/menu/reports.svg",
    "skin/img/menu/reportsh.svg",
    "skin/img/menu/users.svg",
    "skin/img/menu/usersh.svg",
    "skin/img/menu/cameras.svg",
    "skin/img/menu/camerash.svg",
    "skin/img/menu/activity.svg",
    "skin/img/menu/activityh.svg",
    "skin/img/menu/map.svg",
    "skin/img/menu/maphover.svg",
)
