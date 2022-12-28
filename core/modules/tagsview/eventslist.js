class CEventsList extends HTMLElement {
    static get observedAttributes() {
        return ['access_token']; 
    }
    constructor() {
        super();
    }
    connectedCallback() {
        let self = this;
        this.shadow = this.attachShadow({mode: 'open'});
        this.shadow.innerHTML = CEventsList.css+'<div class="body">!!!</div>';
        let access_token = $(this).attr('access_token');
        this.update();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (name=='access_token') this.update();
    }
    getBaseURLFromToken = function(access_token) {
        let _at;
        try{
        _at = JSON.parse(atob(access_token));
        } catch(e){};
        if (!_at) return '';
        let _url = _at['api'] ? _at['api'] : vxg.api.cloud.apiSrc;
        if (_url === vxg.api.cloud.apiSrc) {
            return _url;
        }
        let port = location.protocol=='https:' ? (_at['api_sp'] ? ':' + _at['api_sp'] : "") : (_at['api_p'] ? ':' + _at['api_p'] : "");
        return location.protocol+"//" + _url + port +(_at['path']?'/'+_at['path']:'');
    }
    getEvents() {
        let access_token = $(this).attr('access_token');
        let base_url = this.getBaseURLFromToken(access_token);
        if (!base_url) 
            return new Promise(function(resolve, reject){setTimeout(function(){reject();}, 0);});
        let args = {};

        return $.ajax({
            type: 'GET',
            url: base_url + '/api/v2/storage/events/',
            headers: {'Authorization': 'Acc ' + access_token},
            contentType: "application/json",
            data: args
        });
    }
    update(){
        let access_token = $(this).attr('access_token');
        this.getEvents();
    }
    static get css() {
        return `<style>

.body{position: relative;overflow: hidden;width: 100%;height: 100%;}

</style>`;
    }

}

window.customElements.define('events-list', CEventsList);
