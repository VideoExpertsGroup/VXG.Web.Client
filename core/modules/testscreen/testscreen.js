window.screens = window.screens || {};
window.dialogs = window.dialogs || {};
var path = window.core.getPath('testscreen.js');

window.screens['testscreen'] = {
    'menu_name':'Test screen',
//  TODO:
//    'menu_toggle':true,
//    'menu_disabled':true,
    'menu_icon': path+'dialog1.jpg',
    'menu_icon_hover': path+'dialog1h.jpg',
    'html': path+'testscreen.html',
    'css':[path+'testscreen.css'],
// Когда экран "активируется" - например вследствие нажатия меню
    'on_show':function(r){
//        alert('show Test screen');
        return defaultPromise();
    },
// Когда экран "прячется" - например вследствие активации другого экрана
    'on_hide':function(){
//        alert('hide Test screen');
    },
// Когда все скрипты и стили загружены
    'on_ready':function(){
//        alert('on_ready Test screen');
    },
// Когда скрипт инициализируется первый раз (чтоб не выполнять лишнюю работу, возможно даже не нужную пользователю)
    'on_init':function(){
//        alert('on_init Test screen');
        return defaultPromise();
    }
};

window.controls = window.controls || {};

window.dialogs['dialog1'] = {
    'html': this_script_path+'dialog1.html',
    'css':[this_script_path+'dialog1.css'],
    'js':[this_script_path+'dialog1.js'],
    'on_show':function(){},
    'on_hide':function(){}
}
