// Array of screens
window.screens = window.screens || {};

// Array of controls - custom DOM elements
window.controls = window.controls || {};

// Array of dialogs
window.dialogs = window.dialogs || {};

// URL patch to this script
var path = window.core.getPath('sample.js');

window.screens['sample'] = {
    'menu_weight': 1000,
    'menu_name':'Sample',
    'menu_icon': path+'reports.svg',
    'menu_icon_hover': path+'reportsh.svg',

    // URL link to script page
    'html': path+'sample.html',

     // Array of url links to script files, include into the page header
    'js':[],

     // Styles that are not used when the screen is inactive
    'css':[path+'sample.css'],

    // Array of url links to css files, include into the page header
    'stablecss':[],

    // Array of url links to css files in 'common' directory, include into the page header
    'commonjs':[],

    // Array of url links to css files in 'common' directory, include into the page header
    'commoncss':[],

    // When the screen is "activated" - for example, by pressing a menu
    'on_show':function(r){
        return defaultPromise();
    },

    // When the screen "hides" - for example, due to the activation of another screen
    'on_hide':function(){
        return defaultPromise();
    },

    // When all scripts and styles are loaded. Called once
    'on_ready':function(){
        return defaultPromise();
    },

    // When the screen is initialized for the first time. In order not to do unnecessary work, perhaps not even needed by the user
    'on_init':function(){
        return defaultPromise();
    }
};

window.controls['timer'] = {
     // Array of url links to script files, include into the page header
    'js':[],

    // Array of url links to css files, include into the page header
    'css':[],

    // When all scripts and styles are loaded. Called once
    'on_ready':function(){
        return defaultPromise();
    },

    // Control initialization required. Called once for each control
    // variable 'this' is reference to DOM element
    'on_init':function(){
        this.timer = setInterval(function(element){
 //           $(element).html((new Date).toISOString());
        },100,this);
        return defaultPromise();
    },

    // When control removed
    'disconnectedCallback':function(){
        clearInterval(this.timer);
        return defaultPromise();
    },

    // When control attribute updated
    'attributeChangedCallback':function(name, value){
        return defaultPromise();
    }
}