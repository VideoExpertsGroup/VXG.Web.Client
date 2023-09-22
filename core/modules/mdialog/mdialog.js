window.dialogs = window.dialogs || {};
var path = window.core.getPath('mdialog.js');


window.dialogs['mdialog'] = {
    'html': path+'mdialog.html',
    'css':[path+'mdialog.css'],
    'js':[],
    'on_show':function(html){
        let self = this;
        if (html) this.wrapper.html('<form>'+html+'</form>');
        this.promise = $.Deferred();

        $(this.wrapper).find('button').click(function(event){
            self.promise.resolve({'button':$(event.originalEvent.currentTarget).attr('name'),'form':self.getFormData(self.wrapper.find('form'))});
            event.preventDefault();
        });
        $(this.wrapper).find('form').submit(function(event){
            event.preventDefault();
        });
        return this.promise;
    },
    getFormData:function(form){
        var unindexed_array = form.serializeArray();
        var indexed_array = {};
        $.map(unindexed_array, function(n, i){
            indexed_array[n['name']] = n['value'];
        });
        return indexed_array;
    },
    'on_hide':function(){
        this.promise.reject();
        delete this.promise;
        return defaultPromise();
    }
}

window.dialogs['idialog'] = {
    'no_modal':true,
    'on_show':function(html, delay){
        let self = this;
        let ele = `
            <div class="infodialog">
                <div class="infowrapper">
                    <i class="fa fa-check-square-o" aria-hidden="true"></i>
                    ${html}
                </div>
            </div>
        `;
        $("body").append($(ele));
        if (!delay || delay<100) delay=1000;
        setTimeout(function(){$(".infodialog").remove();},delay);

        return defaultPromise();
    }
}
