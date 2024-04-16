
// default i18n
$.t = (key) => key;

$(async function () {
    // load translation file
    const translation = await fetch('/skin/language.json')
        .then((res) => res.json())
        .catch(() => ({}));

    // use plugins and options as needed, for options, detail see
    // https://www.i18next.com
    i18next
        // init i18next
        // for all options read: https://www.i18next.com/overview/configuration-options
        .init({
            debug: false,
            lng: 'en',
            fallbackLng: 'en',
            resources: {
                en: {
                    translation,
                }
            }
        }, (err, t) => {
            if (err) return console.error(err);

            // for options see
            // https://github.com/i18next/jquery-i18next#initialize-the-plugin
            jqueryI18next.init(i18next, $, { useOptionsAttr: true });

            // start localizing, details:
            // https://github.com/i18next/jquery-i18next#usage-of-selector-function
            localize();
        });
});

function localize() {
    window.skin.title     = $.t('head.title');
    window.skin.pageTitle = $.t('head.title');
    window.skin.copyright = $.t('footer.shortCopyright');
    window.skin.bottom_line = `<div style="padding-bottom: 20px;text-align: center;"><a target="_blank" href="${window.skin.privacyPolicy}">${$.t('common.privacyPolicy')}</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a target="_blank" href="${window.skin.termsOfUse}">${$.t('common.termOfUse')}</a></div><div style="color:#808080;text-align:center;line-height: 14px;padding-bottom: 15px;">(c) 2017-2024,<br>${$.t('footer.miniCopyright')}</div>`;
    window.skin.login_bottom_line = `<div style="padding-bottom: 20px;text-align: center;"><a target="_blank" href="${window.skin.privacyPolicy}">${$.t('common.privacyPolicy')}</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a target="_blank" href="${window.skin.termsOfUse}">${$.t('common.termOfUse')}</a></div><div style="color:#808080;text-align:center;line-height: 14px;padding-bottom: 15px;">${$.t('footer.copyright')}</div>`;

    try {
      $('body').localize();
    } catch {}

    $('title').text($.t('head.fullTitle'));
    $('input[placeholder]').each(function () {
      $(this).attr('placeholder', $.t($(this).attr('placeholder')));
    });
}
