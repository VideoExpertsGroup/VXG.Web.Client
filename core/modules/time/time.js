window.controls = window.controls || {};
var path = window.core.getPath('time.js');

window.controls['time_zone_select'] = {
//    'js':[this_script_path+'moment.min.js'],
//    'css':[this_script_path+'time_zone_select.css'],
    'on_init':function(){
        this.timer = setInterval(function(element){
 //           $(element).html((new Date).toISOString());
        },1000,this);
    },
    'disconnectedCallback':function(){
        clearInterval(this.timer);
    },
    'attributeChangedCallback':function(changed_attribute_name){
    }
}

window.controls['timer'] = {
    'on_init':function(){
        this.timer = setInterval(function(element){
//            $(element).html((new Date).toISOString());
        },1000,this);
    },
    'disconnectedCallback':function(){
        clearInterval(this.timer);
    },
    'attributeChangedCallback':function(changed_attribute_name){
    }
}