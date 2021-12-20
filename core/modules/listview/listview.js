window.screens = window.screens || {};
var path = window.core.getPath('listview.js');

window.screens['listview'] = {
    'menu_name':'List view',
//  TODO:
//    'menu_toggle':true,
//    'menu_disabled':true,
    'menu_icon': path+'listview.svg',
    'menu_icon_hover': path+'listviewh.svg',
    'html': path+'listview.html',
    'css':[path+'listview.css'],
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