window.skin = {}

// Login page
// Title
window.skin.pageTitle = $.t('head.title');
window.skin.copyright = $.t('footer.shortCopyright');

// Window setting
// Title
window.skin.title     = $.t('head.title');
// Page icon
window.skin.favicon = '/skin/fav-icon.png';
// URL that is used when an user clicks on logo
window.skin.logourl = '#';

// People and Viecle counting
// Color of the average curve
window.skin.color_of_average_curve = '#7BB247';
// Color of the max curve
window.skin.color_of_max_curve = '#676a6c';
// Color of the min curve
window.skin.color_of_min_curve = '#7BB247';


// Filter for activity
// motion - only motion event , motion,
//window.skin.events_filter = "motion";

window.skin.privacyPolicy = "#";
window.skin.termsOfUse = "#";
window.skin.contactUs = "#";

window.skin.bottom_line = `<div style="padding-bottom: 20px;text-align: center;"><a target="_blank" href="${window.skin.privacyPolicy}" data-i18n="common.privacyPolicy">${$.t('common.privacyPolicy')}</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a target="_blank" href="${window.skin.termsOfUse}" data-i18n="common.termOfUse">${$.t('common.termOfUse')}</a></div><div style="color:#808080;text-align:center;line-height: 14px;padding-bottom: 15px;" data-i18n="${window.skin.copyright}">${window.skin.copyright}</div>`;
window.skin.login_bottom_line = `<div style="padding-bottom: 20px;text-align: center;"><a target="_blank" href="${window.skin.privacyPolicy}" data-i18n="common.privacyPolicy">${$.t('common.privacyPolicy')}</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a target="_blank" href="${window.skin.termsOfUse}" data-i18n="common.termOfUse">${$.t('common.termOfUse')}</a></div><div style="color:#808080;text-align:center;line-height: 14px;padding-bottom: 15px;" data-i18n="${window.skin.copyright}">${window.skin.copyright}</div>`;

window.no_check_local_addresses = true;
