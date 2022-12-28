window.controls = window.controls || {};
var path = window.core.getPath('screens.js');

window.controls['screens'] = {
    'on_init':function(){
    },
    'disconnectedCallback':function(){
        clearInterval(this.timer);
    },
    'attributeChangedCallback':function(name, value){
    }
}
