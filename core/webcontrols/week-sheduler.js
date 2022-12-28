class CWeekSheduler extends HTMLElement {
    static get observedAttributes() {
    }
    constructor() {
        super();
    }
    static get formAssociated() {
        return true;
    }
    static get properties() {
        return {
            name: { type: String, reflect: true },
            required: { type: Boolean, reflect: true },
            value: { type: String }
        };
    }

    get form() { return this.internals.form; }
    get name() { return this.getAttribute('name'); }
    get type() { return this.localName; }
    get value() { return this.innerHTML; }
    set value(v) { this.parseData(v); }

    parseData(v){
        let tz = -new Date().getTimezoneOffset()/60;
        let data = [];
        try{data = JSON.parse(v);}catch(e){}
        let table = this.shadow.querySelector('table tbody').children;
        for (let w=0;w<7;w++){
            for (let h=0;h<24;h++){
                let h2 = h+tz;
                let w2 = w;
                if (h2>23){h2-=24;w2++;}
                else if (h2<0){h2+=24;w2--;}
                if (w2>6) w2=0;
                else if (w2<0) w2=6;
                let el = this.shadow.querySelector('table tbody').children[1+h2].children[1+w2];
                if (data && data.length==7 && data[w][h]) el.setAttribute('checked','');
                else el.removeAttribute('checked');
            }
        }
    }
    serialize(){
        let tz = -new Date().getTimezoneOffset()/60;
        let res = [];
        let table = this.shadow.querySelector('table tbody').children;
        for (let w=0;w<7;w++){
            let t=[];
            for (let h=0;h<24;h++){
                let h2 = h+tz;
                let w2 = w;
                if (h2>23){h2-=24;w2++;}
                else if (h2<0){h2+=24;w2--;}
                if (w2>6) w2=0;
                else if (w2<0) w2=6;
                let el = this.shadow.querySelector('table tbody').children[1+h2].children[1+w2];
                t.push(el.getAttribute('checked')!==null ? 1 : 0);
            }
            res.push(t);
        }
        this.innerHTML = JSON.stringify(res);
        this.internals.setFormValue(this.innerHTML);
    }
    connectedCallback() {
        let self=this;
        this.internals = this.attachInternals();
        this.internals.role = 'input';
        if (!this.innerHTML) this.innerHTML = "[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]]";
        this.shadow = this.attachShadow({mode: 'open'});
        let time_name = ['12:00 a.m.','1:00 a.m.','2:00 a.m.','3:00 a.m.','4:00 a.m.','5:00 a.m.','6:00 a.m.','7:00 a.m.','8:00 a.m.','9:00 a.m.','10:00 a.m.','11:00 a.m.','12:00 p.m.','1:00 p.m.','2:00 p.m.','3:00 p.m.','4:00 p.m.','5:00 p.m.','6:00 p.m.','7:00 p.m.','8:00 p.m.','9:00 p.m.','10:00 p.m.','11:00 p.m.'];

        this.shadow.innerHTML = CWeekSheduler.css;
        let weeks = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        let tz = -new Date().getTimezoneOffset()/60;
        let html ='<table><tr><th>UTC'+(tz>=0?'+':'')+tz+'</th>';
        for (let w=0;w<7;w++)
            html +='<th><div>'+weeks[w]+'</div></th>';
        html +='</tr>';
        for (let h=0;h<24;h++){
            html +='<tr><td class="time">'+time_name[h]+'</td>';
            for (let w=0;w<7;w++){
                html +='<td></td>';
            }
            html +='</tr>';
        }
        html +='</table>';
        this.shadow.innerHTML += html;
        this.shadow.querySelectorAll('td').forEach(function(el){
            el.onclick=function(){
                if (this.classList.contains('time')){
                    this.parentElement.querySelectorAll('td:not(:first-child)').forEach(function(e){
                        if (e.getAttribute('checked')===null)
                            e.setAttribute('checked','');
                        else
                            e.removeAttribute('checked');
                    });
                } else {
                    if (this.getAttribute('checked')===null)
                        this.setAttribute('checked','');
                    else
                        this.removeAttribute('checked');
                }
                self.serialize();
            }
        });
    }
    attributeChangedCallback(name, oldValue, newValue) {
        this.internals.setFormValue('[]');
    }
    static get css() {
        return `<style>
table{
border-spacing: 0px;
width:100%;
border-right:1px solid lightgray;
border-bottom:1px solid lightgray;
}
table td,table th{
border-left:1px solid lightgray;
border-top:1px solid lightgray;
height: 20px;
cursor:pointer;
}
table tr td:first-child{
text-align:center;
}
body:not(.mobile) table tr td:not(:first-child):not([checked]):hover{
background: #F24949;
}
body:not(.mobile) table tr td[checked]:not(:first-child):hover{
background: #F2494940;
}
body:not(.mobile) table tr td:first-child:hover ~ td:not([checked]){
background: #F24949;
}
body:not(.mobile) table tr td:first-child:hover ~ td[checked]{
background: #F2494940;
}
table th > div{
overflow: hidden;
    text-overflow: ellipsis;
    max-width: 9vw;
}
table td[checked]{
background:#7BB247;
}
</style>`;
    }

}

window.customElements.define('week-sheduler', CWeekSheduler);
