/* ATTENTION: Do not edit this file for no good reason!!!. This is a kernel file, and the performance of the entire system depends on its contents. */

window.screens = window.screens || {};
window.dialogs = window.dialogs || {};
window.controls = window.controls || {};
window.core = window.core || {
    screen_order:[],
    last_screen_name:'',
    last_screen_args:{},
};
window.attrlistener = window.attrlistener || {};
window.attrlistener.click = window.attrlistener.click || {};
window.attrlistener.click.onclick_toscreen = 'window.core.onclick_toscreen';

function defaultPromise(){
    return new Promise(function(resolve, reject){setTimeout(function(){resolve();}, 0);});
}
function rejectPromise(){
    return new Promise(function(resolve, reject){setTimeout(function(){reject();}, 0);});
}

window.controls['screenbutton'] = {
    'on_init':function(){
    },
    'disconnectedCallback':function(){
        clearInterval(this.timer);
    },
    'attributeChangedCallback':function(name, value){
    }
}
window.core.cache={attrlist:[]};
window.core.isMobile = function() { 
    if(navigator.userAgent.match(/Android/i)
        || navigator.userAgent.match(/webOS/i)
        || navigator.userAgent.match(/iPhone/i)
        || navigator.userAgent.match(/iPad/i)
        || navigator.userAgent.match(/iPod/i)
        || navigator.userAgent.match(/BlackBerry/i)
        || navigator.userAgent.match(/Windows Phone/i)
    ) return true;
    return false;
}

window.core.isWindows = function () {
    let user_agent = window.navigator && window.navigator.userAgent || '';
    var is_windows = /Windows/i.test(user_agent);
    return is_windows;
}

window.core.isIos = function () {
    var is_Ios = ["iPhone", "iPad", "iPod"].includes(window.navigator.platform);
    return is_Ios;
}

window.core.globalmenu = {
    init : function(){
        $('.global-menu').on("click","li",function(){
            window.screens[$(this).attr('screen_id')].activate();
        });
    },
    addMenu: function(screen_id, menu_name, menu_icon, weight){
        let li = core.elements['global-menu'].find('li');
        if (!li.length) core.elements['global-menu'].append('<li class="menu-item '+screen_id+'" weight="'+weight+'"><span class="menu-icon">'+menu_icon+'</span> <span class="menu-name">'+menu_name+'</span></li>');
        for (let i=0; i<li.length; i++){
            let w = $(li[i]).attr('weight');
            if (w>weight) {
                $(li[i]).before('<li class="menu-item '+screen_id+'" weight="'+weight+'"><span class="menu-icon">'+menu_icon+'</span> '+menu_name+'</li>');
                break;
            }
            if (i==li.length-1)
                $(li[i]).after('<li class="menu-item '+screen_id+'" weight="'+weight+'"><span class="menu-icon">'+menu_icon+'</span> '+menu_name+'</li>');
        }
        core.elements['global-menu'].find('.'+screen_id).attr('screen_id',screen_id);
    }
};

window.core.activateFirstScreen = function(screen_name, token = null){
    let weight = Number.MAX_VALUE;
    let pos='';
    let hash_pos='';
    for (let i in window.screens){
        if (!pos) pos=i;
        if (window.location.hash.substr(0,1+i.length)=='#'+i && typeof window.screens[i]['get_args'] === 'function')
            hash_pos = i;
        if (typeof window.screens[i].menu_weight === 'number'){
            if (weight > window.screens[i].menu_weight){
                weight = window.screens[i].menu_weight;
                pos = i;
            }
        }
    }
    if (hash_pos) {
        let args = decodeURI(window.location.hash.substr(hash_pos.length+2)+',');
        if (args=',') args='';
        let ar = args ? ((args+',').split('",')): [];
        for (let i=0; i< ar.length; i++){
            if (ar[i]==',') {
                delete ar[i];
                continue;
            }
            ar[i] = ar[i].substr(1);
        }

        if (screen_name == "tagsview" && token) 
            return window.screens[screen_name].activate(token);

        return window.screens[hash_pos].activate.apply(window.screens[hash_pos],ar);
    }

    if (screen_name == "tagsview" && token) 
        return window.screens[screen_name].activate(token);

    if (window.screens[screen_name])
        return window.screens[screen_name].activate();
    if (window.screens[pos])
        return window.screens[pos].activate();
    return defaultPromise();
}

window.core.getActiveScreen = function(){
    let screen_id = $('body').data('screenid');
    if (!window.screens[screen_id]) return false;
    return window.screens[screen_id];
}

window.core.onclick_toscreen = function(e){
    let screen;
    if (typeof e == "string")
        screen = e;
    else
        e.preventDefault();

    if (!screen) screen = $(this).attr('onclick_toscreen');

    if (window.screens[screen]) {
        window.screens[screen].src = this;
        window.screens[screen].from_screen = $('body').data('screenid');
        if(screen == 'tagsview' && window.screens[screen].from_screen == 'cameras') {
            var id = this.channelID ? this.channelID : $(this).attr("channelID");
            if (id) sessionStorage.setItem("backToCam", id);
        }
        window.screens[screen].activate().then(function(){
            delete this.src;
            delete this.from_screen;
        });
    }
    if (screen=='back') {
        window.core.screen_order.pop();
        var t = window.core.screen_order;
        if (window.core.screen_order.filter(Boolean).length == 0) {
            if (!core.isMobile()) window.screens['reports'].activate()
            else window.screens['cameras'].activate()
        }

        let s = window.screens[window.core.screen_order.pop()]
        if (s){
            s.from_back = true;
            s.activate();
            delete s.from_back;
        }
    }
}
/*
window.core.vxgsubmit = function(){
    function setvalue(obj,index,value){
        let s = index.match(/([^\[]+)*[\[](.*)[\]]/i);
        if (s===null){
            obj[index]=value;
            return;
        }
        obj[s[1]] = {};
        setvalue(obj[s[1]],s[2],value);
    }

    let data = $(this).parent('form').serializeArray();
    let req = {};
    for (let i in data){
        setvalue(req,data[i].name,data[i].value);
    }
}
*/

window.core.sendEventToScreens = function(name){
    for (let i in window.screens){
        if (typeof window.screens[i][name]==='function')
            window.screens[i][name]();
    }
}

window.core.dynamicLoadCss = function(src){
    window.core.loaded_files = window.core.loaded_files || [];
    let filename = src.substr(src.lastIndexOf('/')+1);
    if (window.core.loaded_files.indexOf(filename)>=0) return defaultPromise();
    window.core.loaded_files.push(filename);
    
    let load_promise = $.Deferred();
    let css=document.createElement("link");
    css.setAttribute("rel","stylesheet");
    css.setAttribute("media","all")
    css.setAttribute("type","text/css");
    css.setAttribute("href",src)
    document.head.append(css);
    css.onload = function() {load_promise.resolve();}
    css.onerror = function() {load_promise.resolve();}
    return load_promise;
}

window.core.dynamicLoadJs = function(src){
    window.core.loaded_files = window.core.loaded_files || [];
    let filename = src.substr(src.lastIndexOf('/')+1);
    if (window.core.loaded_files.indexOf(filename)>=0) return defaultPromise();
    window.core.loaded_files.push(filename);

    let load_promise = $.Deferred();
    let script = document.createElement('script');
    script.src = src;
    document.head.append(script);
    script.onload = function() {load_promise.resolve();}
    script.onerror = function() {load_promise.resolve();}
    return load_promise;
}

window.core.getPath = function(script_name){
    let scripts = document.getElementsByTagName('script');
    for (let i=0; i<scripts.length;i++){
        if (scripts[i].src.indexOf(script_name)===-1) continue;
        return scripts[i].src.split('?')[0].split('/').slice(0, -1).join('/')+'/';
    }
    return '';
}

window.core.loadControls = function(js_list){
    let promises = [];
    for (let i in js_list){
        let load_promise = $.Deferred();
        let script = document.createElement('script');
        script.src = js_list[i];
        document.head.append(script);
        script.onload = function() {load_promise.resolve();}
        script.onerror = function() {load_promise.resolve();}
        promises.push(load_promise);
    }
    $('body').removeClass('initialized');

    return Promise.all(promises).then(window.core.loadScreens).then(function(){
        for (let i in window.screens)  if ( typeof window.screens[i]['on_ready'] === "function")  window.screens[i]['on_ready']();
        for (let i in window.dialogs)  if ( typeof window.dialogs[i]['on_ready'] === "function")  window.dialogs[i]['on_ready']();
        for (let i in window.controls) if (typeof window.controls[i]['on_ready'] === "function") window.controls[i]['on_ready']();
        $('body').addClass('initialized');
        return defaultPromise();
    });
}


window.core.loadScreens = function(){

    function checkCommon(file){
        window.core.common = window.core.ommon || [];
        if (window.core.common.indexOf(file)>0) return false;
        window.core.common.push(file);
        return true;
    }

    function load(obj,tag){
        return new Promise(function(res,rej){
            $.ajax({
                url: obj[tag],
                context: {obj:obj,tag:tag},
                cache:true
            }).then(function(r) {
                this.obj[this.tag] = r;
                res();
            }).fail(function() {
                this.obj[this.tag] = '';
                res();
            });
        });
    }

    var cssWait = $.Deferred();
    let promises = [];
    for (let i in window.screens){
        if (window.screens[i].is_loaded) continue;
        if (window.screens[i]['html'])
            promises.push(load(window.screens[i],'html'));
        if (window.screens[i]['commoncss'] && window.screens[i]['commoncss'].length>0)
            for (let j in window.screens[i]['commoncss'])
                if (checkCommon(window.screens[i]['commoncss'][j]))
                    promises.push(window.core.dynamicLoadCss(core.common_path+window.screens[i]['commoncss'][j]));
        if (window.screens[i]['stablecss'] && window.screens[i]['stablecss'].length>0)
            for (let j in window.screens[i]['stablecss'])
                if (checkCommon(window.screens[i]['stablecss'][j]))
                    promises.push(window.core.dynamicLoadCss(window.screens[i]['stablecss'][j]));
        if (window.screens[i]['css'] && window.screens[i]['css'].length>0)
            for (let j in window.screens[i]['css'])
                promises.push(load(window.screens[i]['css'],j));
        if (window.screens[i]['commonjs'] && window.screens[i]['commonjs'].length>0)
            for (let j in window.screens[i]['commonjs'])
                if (checkCommon(window.screens[i]['commonjs'][j]))
                    promises.push(window.core.dynamicLoadJs(core.common_path+window.screens[i]['commonjs'][j]));
        if (window.screens[i]['js'] && window.screens[i]['js'].length>0)
            for (let j in window.screens[i]['js'])
                promises.push(window.core.dynamicLoadJs(window.screens[i]['js'][j]));
        window.screens[i].is_loaded=true;
    }
    for (let i in window.controls){
        if (window.controls[i].is_loaded) continue;
        if (window.controls[i]['commoncss'] && window.controls[i]['commoncss'].length>0)
            for (let j in window.controls[i]['commoncss'])
                if (checkCommon(window.controls[i]['commoncss'][j]))
                    promises.push(window.core.dynamicLoadCss(core.common_path+window.controls[i]['commoncss'][j]));
        if (window.controls[i]['css'] && window.controls[i]['css'].length>0)
            for (let j in window.controls[i]['css'])
                promises.push(window.core.dynamicLoadCss(window.controls[i]['css'][j]));
        if (window.controls[i]['commonjs'] && window.controls[i]['commonjs'].length>0)
            for (let j in window.controls[i]['commonjs'])
                if (checkCommon(window.controls[i]['commonjs'][j]))
                    promises.push(window.core.dynamicLoadJs(core.common_path+window.controls[i]['commonjs'][j]));
        if (window.controls[i]['js'] && window.controls[i]['js'].length>0)
            for (let j in window.controls[i]['js'])
                promises.push(window.core.dynamicLoadJs(window.controls[i]['js'][j]));
        window.controls[i].is_loaded=true;
    }
    for (let i in window.dialogs){
        if (window.dialogs[i].is_loaded) continue;
        if (window.dialogs[i]['html'])
            promises.push(load(window.dialogs[i],'html'));
        if (window.dialogs[i]['css'] && window.dialogs[i]['css'].length>0)
            for (let j in window.dialogs[i]['css'])
                promises.push(window.core.dynamicLoadCss(window.dialogs[i]['css'][j]));
        if (window.dialogs[i]['js'] && window.dialogs[i]['js'].length>0)
            for (let j in window.dialogs[i]['js'])
                promises.push(window.core.dynamicLoadJs(window.dialogs[i]['js'][j]));
        window.dialogs[i].is_loaded=true;
    }
    return Promise.all(promises).then(appendScreens,appendScreens);


    function activateDialog(){
        let self = this;
        if (window.dialogs[this.id]['no_modal']){
            if (typeof window.dialogs[this.id]['on_show'] === "function") 
                return window.dialogs[this.id]['on_show'].apply(window.dialogs[this.id],arguments);
            return defaultPromise();
        }
        $('body').addClass('dialog');
        $('body > .dialogs > .active').removeClass('active');
        $('body .dialogs').click(function(e){
            let el = document.elementFromPoint(e.pageX, e.pageY);
            if ($('body > .dialogs')[0]!==el) return;
            window.dialogs[self.id]['on_hide'].apply(window.dialogs[self.id]);
            $('body').removeClass('dialog');
        });
        let dialog = window.dialogs[this.id].wrapper;
        dialog.addClass('active');
        let p;
        if (typeof window.dialogs[this.id]['on_show'] === "function") 
            p = window.dialogs[this.id]['on_show'].apply(window.dialogs[this.id],arguments);
        if (p) return p.then(function(r){$('body').removeClass('dialog');return r;},function(r){$('body').removeClass('dialog');return r;});
        p = $.Deferred();
        dialog.find('button').click(function(){
            $('body').removeClass('dialog');
            p.resolve();
        });
        return p;
    }

    function activateScreen(){

        let p;
        if (typeof window.screens[this.id]['on_before_show'] === "function") {
            window.screens[this.id].from_screen = $('body').data('screenid');
            p = window.screens[this.id]['on_before_show'].apply(window.screens[this.id],arguments);
            delete window.screens[this.id].from_screen;
        } else
            p = defaultPromise();
        let self=this;
        let args = arguments;

        return p.then(function(){
            var from_screen = $('body').data('screenid');
            if (from_screen == 'tagsview' && self.id != 'cameras') {
                sessionStorage.setItem("backToCam", "");
            }

            for (let i in window.screens){
                if (window.screens[i].is_active === true){
//                    if (self.id==i) return defaultPromise();
                    if (typeof window.screens[i]['on_hide'] === "function") 
                        window.screens[i]['on_hide']();
                    $('body').data('screenid','');
                    $('.global-menu li.active').removeClass('active');
                }
                $('body').removeClass(i);
                window.screens[i].is_active = false;
            }
            core.elements['screens'].find('> div').hide();
            core.elements['screencss'].html('');
    
            if (!self.src || $(self.src).attr('noback')!=='')
                window.core.screen_order.push(self.id);
            if (typeof window.screens[self.id]['get_args'] === "function"){
                let args = window.screens[self.id]['get_args']();
                let args_string='';
                if (args && args.length>0) for (let a in args)
                    args_string += (args_string?',':'')+'"'+args[a].toString().replace('"','\\"')+'"';
                window.location.hash = self.id+(args_string?'=':'')+args_string;
            }
    
            let title = '';
            if (window.screens[self.id]['header_name']) title = window.screens[self.id]['header_name'];
            if (!title && window.screens[self.id]['menu_name']) title = window.screens[self.id]['menu_name'];
            if (!title) title = self.id;
            core.elements['header-center'].text(title);
    
            window.screens[self.id].is_active = true;
            $('body').addClass(self.id);
            $('body').data('screenid',self.id);
            $('.global-menu li.'+self.id).addClass('active');
    
            function _activateScreen(){
                window.screens[self.id]['is_initialized'] = true;
                let csshtml = '';
                for (let j in window.screens[self.id]['css'])
                    csshtml += '<style>'+window.screens[self.id]['css'][j]+'</style>';
    
                core.elements['screencss'].html(csshtml);
    
                core.elements['screens'].find('> .'+self.id).show();

                if (typeof window.screens[self.id]['on_show'] === "function") 
                    return window.screens[self.id]['on_show'].apply(window.screens[self.id],args);
                return defaultPromise();
            }
            if (!window.screens[self.id]['is_initialized'] && typeof window.screens[self.id]['on_init'] === "function") {
                let p = window.screens[self.id]['on_init'].apply(window.screens[self.id],[]);
                window.screens[self.id]['is_initialized'] = true;
                let thisid = self.id;
                if (p.then) {
                    p.then(function(){
                        _activateScreen.apply(window.screens[thisid],arguments);
                    },function(){
                        _activateScreen.apply(window.screens[thisid],arguments);
                    });
                    return p;
                }
            }
            return _activateScreen.apply(window.screens[self.id],arguments);
        });
    }

    function collectListeners(){

        function merge(current, update) {
            Object.keys(update).forEach(function(key) {
                if (current.hasOwnProperty(key) && typeof current[key] === 'object'&& !(current[key] instanceof Array)) {
                    merge(current[key], update[key]);
                } else {
                    current[key] = update[key];
                }
            });
          return current;
        }
        for (let i in window.screens)
            if (window.screens[i]['attrlistener'])
                window.attrlistener = merge(window.attrlistener,window.screens[i]['attrlistener']);
        for (let i in window.dialogs)
            if (window.dialogs[i]['attrlistener'])
                jQuery.extend(window.attrlistener,window.dialogs[i]['attrlistener']);
        for (let i in window.controls)
            if (window.controls[i]['attrlistener'])
                jQuery.extend(window.attrlistener,window.controls[i]['attrlistener']);
    }

    function appendScreens(){
        for (let i in window.screens){
            if (window.screens[i]['html']===undefined) continue;
            if (core.elements['screens'].find('> .'+i).length>0) continue;
            core.elements['screens'].append('<div class="'+i+'">'+window.screens[i]['html']+'</div>');
            window.screens[i].wrapper = core.elements['screens'].find('> .'+i);
        }
        for (let i in window.dialogs){
            window.dialogs[i].id = i;
            window.dialogs[i].activate = activateDialog;
            if (!window.dialogs[i]['html']) continue;
            if ($('body > .dialogs .'+i).length>0) continue;
            $('body > .dialogs').append('<div class="'+i+'">'+window.dialogs[i]['html']+'</div>');
            window.dialogs[i].wrapper = $('body > .dialogs .'+i);
        }
        for (let i in window.screens){
            window.screens[i].activate = activateScreen;
            window.screens[i].is_active = false;
            window.screens[i].id = i;
            if (!window.screens[i]['menu_name']) continue;
            window.core.globalmenu.addMenu(i, window.screens[i]['menu_name'],window.screens[i]['menu_icon'],window.screens[i]['menu_weight']!==undefined ? window.screens[i]['menu_weight'] : 0);
        }

        for (let i in window.controls){
            let el = document.getElementsByTagName(i);
            for (let j =0; j<el.length; j++){
                if (!el[j].initialized) 
                    window.controls[i]['on_init'].apply(el[j], [el[j]]);
                el[j].initialized=true;
            }
        }
        collectListeners();
        window.core.updateListiners();
        core.elements['global-loader'].hide();

        window.core.cache = window.core.cache || {};
        window.core.cache.attrlist = [];
        for (let j in window.controls)
            if (typeof window.controls[j]['observedAttributes'] === "function")
                window.core.cache.attrlist = window.core.cache.attrlist.concat(window.controls[j]['observedAttributes']());
/*
        $('[ifscreen]').each(function(){
            if (window.screens[this.attr('ifscreen')]===undefined)
                this.hide();
            else
                this.removeAttr('style');
        });
*/
    }
}

window.core.updateListiners = function(target){
    if (!target) target = $('body');
    for (let i in window.attrlistener)
        for (let j in window.attrlistener[i])
            $(target).find('['+j+']').off(i).on(i,eval(window.attrlistener[i][j]));
}

window.core.flashInputBackgroundColor = function (e) {
    e.css('background-color', 'red').focus();
    setTimeout(function () {e.css('background-color', '');},200);
}

window.core.init= function (elements) {
    if (window.core.initialized) {
        console.log('Already initialized');
        return;
    }
    window.core.initialized = true;

//    window.vxgcore.options.setBackendSrc(window.location.origin);
    window.core.elements = elements || {};
    $('body').append('<div class="screencss"></div>');
    if (window.core.elements['global-loader']===undefined) window.core.elements['global-loader'] = $('.global-loader');
    if (window.core.elements['before-global-menu']===undefined) window.core.elements['before-global-menu'] = $('.before-global-menu');
    if (window.core.elements['global-menu-header']===undefined) window.core.elements['global-menu-header'] = $('body > .body > .leftblock > .left-top');
    if (window.core.elements['global-menu']===undefined) window.core.elements['global-menu'] = $('.global-menu > ul');
    if (window.core.elements['global-menu-footer']===undefined) window.core.elements['global-menu-footer'] = $('body > .body > .leftblock > .left-bottom');
    if (window.core.elements['after-global-menu']===undefined) window.core.elements['after-global-menu'] = $('.after-global-menu');
    if (window.core.elements['bottom-global-menu']===undefined) window.core.elements['bottom-global-menu'] = $('.bottom-global-menu');
    if (window.core.elements['header-left']===undefined) window.core.elements['header-left'] = $('.header-wrapper  td.header-left');
    if (window.core.elements['header-search']===undefined) window.core.elements['header-search'] = $('.header-wrapper  td.header-search');
    if (window.core.elements['header-center']===undefined) window.core.elements['header-center'] = $('.header-wrapper  td.header-center');
    if (window.core.elements['header-right']===undefined) window.core.elements['header-right'] = $('.header-wrapper  td.header-right');
    if (window.core.elements['screens']===undefined) window.core.elements['screens'] = $('.screens-wrapper.screens');
    window.core.elements.screencss = $('body > .screencss');

    core.elements['global-loader'].show();
       
    var observer = new MutationObserver(function(mutations) {
        for (let i in mutations){
/*
            if (mutations[i].type=='attributes' && window.core.cache.attrlist.indexOf(mutations[i].attributeName)!=-1)
                if (window.controls[mutations[i].target.localName] && typeof window.controls[mutations[i].target.localName]['attributeChangedCallback']==="function")
                    window.controls[mutations[i].target.localName]['attributeChangedCallback'].apply(mutations[i].target, [mutations[i].attributeName]);
*/
            if (mutations[i].type=='childList' && mutations[i].addedNodes.length>0)
                window.core.updateListiners(mutations[i].target);

            for (let j=0;j<mutations[i].addedNodes.length;j++){
                let ifscreen = $(mutations[i].addedNodes[j]).find('[ifscreen]');
                if ($(mutations[i].addedNodes[j]).attr('ifscreen'))
                    ifscreen.push(mutations[i].addedNodes[j]);
                if (ifscreen.length>0) for(let w=0;w<ifscreen.length; w++){
                    let screenname = $(ifscreen[w]).attr('ifscreen');
                    if (window.screens[screenname]===undefined)
                        $(ifscreen[w]).hide();
                }
/*
                if (window.controls[mutations[i].addedNodes[j].localName] && typeof window.controls[mutations[i].addedNodes[j].localName]['on_init'] === "function")
                    window.controls[mutations[i].addedNodes[j].localName]['on_init'].apply(mutations[i].addedNodes[j]);
*/
                for (let w in window.controls){
                    if (typeof window.controls[w]['on_init'] !== "function") continue;
                    let r = $(mutations[i].addedNodes[j]).find(w);
                    let tagname = $(mutations[i].addedNodes[j]).prop("tagName");
                    if (tagname) tagname = tagname.toLowerCase();
                    if (tagname==w)
                        r.push(mutations[i].addedNodes[j]);

                    for (c=0; c<r.length;c++){
                        if (!r[c].initialized) window.controls[w]['on_init'].apply(r[c], [r[c]]);
                        r[c].initialized=true;
                    }
                }
            }

            for (let j=0;j<mutations[i].removedNodes.length;j++) {
                for (let w in window.controls){
                    if (typeof window.controls[w]['disconnectedCallback'] !== "function") continue;
                    let r = $(mutations[i].removedNodes[j]).find(w);
                    let tagname = $(mutations[i].removedNodes[j]).prop("tagName");
                    if (tagname) tagname = tagname.toLowerCase();
                    if (tagname==w)
                        r.push(mutations[i].removedNodes[j]);

                    for (c=0; c<r.length;c++)
                        window.controls[w]['disconnectedCallback'].apply(r[c]);
                }
            }

            if (window.core.cache.attrlist.indexOf(mutations[i].attributeName)>=0)
                for (let j in window.controls){
                    if (typeof window.controls[j]['observedAttributes'] === "function" && window.controls[j]['observedAttributes']().indexOf(mutations[i].attributeName)>=0 && typeof window.controls[j]['attributeChangedCallback'] === "function"){
                        let r;
                        if ($(mutations[i].target).prop('tagName').toLowerCase()==j)
                            r = [mutations[i].target];
                        else
                            r = $(mutations[i].target).find(j);
                        for (let k=0; k<r.length; k++) 
                            window.controls[j]['attributeChangedCallback'].apply(r[k],[mutations[i].attributeName, $(mutations[i].target).attr(mutations[i].attributeName)]);
                    }
    
                        
    
                }

        };
    });

    function onresize(){
        let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile || $( window ).width()<576)
            $('body').addClass('mobile');
        else
            $('body').removeClass('mobile');
        if (document.documentElement.clientWidth > document.documentElement.clientHeight) 
            $('body').addClass('landscape');
        else
            $('body').removeClass('landscape');
    }
    window.addEventListener("resize", function(){onresize()}, false);
    onresize();

    if(document.querySelector('body > .body > .leftblock')!==null)
    document.querySelector('body > .body > .leftblock').addEventListener("click", function(){
        document.querySelector('#mobile-menu-btn').checked = false;
    }, false);
 
    observer.observe(document.querySelector('body'),  { attributes: true, childList: true, characterData: false, subtree : true } );

    window.core.globalmenu.init();

    jQuery.fn.serializeObject = function () {
        let formData = {};
        let formArray = this.serializeArray();
        function realMerge(to, from) {
            for (n in from) {
                if (typeof to[n] != 'object') {
                    to[n] = from[n];
                } else if (typeof from[n] == 'object') {
                    to[n] = realMerge(to[n], from[n]);
                }
            }
            return to;
        };
        function supp(name,value){
            let r = name.match(/([^[]+)\[(.*)\]/);
            let ret={};
            if (!r){
                ret[name]=value;
                return ret;
            }
            ret[r[1]] = supp(r[2],value);
            return ret;
        }
        for (let i = 0, n = formArray.length; i < n; ++i){
            let v = formArray[i].value;
            if (parseInt(v)==v) v = parseInt(v); else if (parseFloat(v)==v) v = parseFloat(v);
            formData = realMerge(formData, supp(formArray[i].name,v));
        }
        return formData;
    };

    jQuery.fn.getNearParentAtribute = function (attr_name) {
        let a = this.attr(attr_name);
        if (a!==undefined) return a;
        let r = this.parents('['+attr_name+']');
        if (r[0]!==undefined) return $(this.parents('['+attr_name+']')[0]).attr(attr_name);
        return undefined;
    };

    window.core.common_path = window.core.getPath('core.js')+'common/';

    return window.core.loadScreens().then(function(){
        for (let i in window.screens)
            if (typeof window.screens[i]['on_ready'] === "function") window.screens[i]['on_ready']();
        window.core.activateFirstScreen().then(function(){
            $('body').addClass('initialized');
        });
    });

}

$( document ).ready(function() {
    setTimeout(function(){
        if (window.core.initialized) return;
        let screens_element = $('.screens');
//        if (!screens_element.length) return;
        window.core.init({'screens' : screens_element});

    },500);
});
