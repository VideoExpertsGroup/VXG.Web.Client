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
    $('title').text(window.skin.pageTitle);
//    $('.logo-container').attr('href', window.skin.logourl);
    setTimeout(() => {
        $('.bottom-global-menu').prepend(`<a class="vxgbutton-rounded upgrade" target="_blank" href="${window.skin.contactUs}">${$.t('action.contactUs')}</a><span style="color: lightgray;"><br><br>${$.t('layout.contactUsDescription')}</span>`);
    }, 500)
});