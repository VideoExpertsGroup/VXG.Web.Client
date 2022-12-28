class CTimeLinePicker extends HTMLElement {
    static get observedAttributes() {
        return ['scale','centerutctime','selectutctime','utc']; 
    }
    constructor() {
        super();
        this.event_moved = new Event('moved',{cancelable: false, bubbles: true});
        this.event_moving = new Event('moving',{cancelable: false, bubbles: true});
        this.event_change = new Event('change',{cancelable: false, bubbles: true});
        this.default_scale = 100;
        this.min_frame_width = 18;
        this.min_sec_frame_width = 155;
        this.min_hoursec_width = 57;
        this.min_year_width = 32;
    }
    recalcWidths(){
        this.min_year_width = this.textWidth('0000');
        this.min_months_width = this.textWidth('M');
        this.min_year_month_width = this.textWidth('2020 May')+6;
        this.min_day_width = this.textWidth('00')+10;
        this.min_day_hour_width = this.textWidth('22 Feb 2020')+2;
        this.min_hour_width = this.textWidth('00:00');
        this.min_hoursec_width = this.textWidth('00:00:00');
        this.min_frame_width = this.textWidth('00')+2;
        this.min_sec_frame_width = this.textWidth('22 Feb 2020, 00:00:000')+2;
        this.default_scale = 60*60*24*365/(this.min_year_width*1);
    }
    connectedCallback() {
        let self = this;
        this.addEventListener("mousewheel", function(e) { 
            if (e.wheelDeltaX==0 && e.offsetX < self.getBoundingClientRect().width/2){
                let scale = self.getAttribute('scale');
                scale = scale===null ? self.default_scale : (scale);
                if(e.wheelDelta /120 > 0) {
                    scale = (scale/1.5);
                    let req_frames = self.getAttribute('frames') || 1;
                    if (req_frames>1 && req_frames*frames <= 1/scale)
                        scale = 1 / self.min_frame_width / req_frames;
                    if (req_frames<=1 && 1/scale > self.min_hoursec_width)
                        scale = 1 / self.min_hoursec_width;
                }
                else{
                    let new_scale = (scale*1.5);
                    if (self.min_year_width <= 60*60*24*365*1000 / new_scale)
                        scale = new_scale;
                }
                if (!isNaN(parseInt(self.getAttribute('maxscale'))) && scale>parseInt(self.getAttribute('maxscale')))
                    scale = parseInt(self.getAttribute('maxscale'));
                self.loc_change=true;
                self.setAttribute('scale',scale>1?scale:1);
                self.loc_change=undefined;
            } else {
                let new_time = parseInt(self.getAttribute('centerutctime')||0) + this.one_shift_time*e.wheelDelta/120;
                self.loc_change=true;
                self.setAttribute('centerutctime',new_time);
                self.loc_change=undefined;
            }
            e.stopPropagation();
            e.preventDefault();
            return false;
        });

        let handleMouseUp = function(event){
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousemove', handleMouseMove);
            delete self.down_mouse_posx;
            delete self.down_mouse_time;
            setTimeout(function(){self.dispatchEvent(self.event_moved);},0);
        };
        let handleMouseMove = function(event){
            let scale = parseFloat(self.getAttribute('scale')||100);
            let pixel_shift = event.pageX - self.down_mouse_posx;
            let new_time = parseInt(self.down_mouse_time - pixel_shift*scale);
            self.loc_change=true;
            self.setAttribute('centerutctime',new_time);
            self.loc_change=undefined;
        };
        this.addEventListener('mousedown', function(event){
            self.down_mouse_posx = event.pageX;
            self.down_mouse_time = parseInt(self.getAttribute('centerutctime'));
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('mousemove', handleMouseMove);
            setTimeout(function(){self.dispatchEvent(self.event_moving);},0);
            return event.preventDefault ? event.preventDefault() : event.returnValue = false;
        })
        window.addEventListener("resize", function() {
            self.update();
        }, false);

        this.recalcWidths();

        this.style.display="block";
        this.shadow = this.attachShadow({mode: 'open'});
        this.shadow.innerHTML = CTimeLinePicker.css;
//        $(this).css('position','relative').css('overflow','hidden');
        let databar = this.getAttribute('databar')!==null ? ' databar':'';
        this.shadow.innerHTML += '<div class="body"'+databar+'><div class="centerpos"></div><div class="wrap"><div class="twrap"><div class="range"></div><div class="databar"></div><table><tr><td>123</td></tr><tr></tr></table></div></div></div>';
        this.centerpos= this.shadow.querySelector('.centerpos');
        this.wrap= this.shadow.querySelector('.wrap');
        this.twrap= this.shadow.querySelector('.twrap');
        this.table = this.shadow.querySelector('table');
        this.databar = this.shadow.querySelector('.databar');;
        this.line1 = this.shadow.querySelector('table tr:first-child');
        this.line2 = this.shadow.querySelector('table tr:last-child');
        if (this.getAttribute('scale')===null || this.getAttribute('centerutctime')===null){
            this.loc_change=true;
            if (this.getAttribute('scale')===null)
                this.setAttribute('scale', this.default_scale); // 50 pixels per year
            if (this.getAttribute('centerutctime')===null)
                this.setAttribute('centerutctime', (Date.now()));
            this.loc_change=false;
        }
        else
            this.attributeChangedCallback();
    }
    disconnectedCallback(){
        delete this.event_moved;
        delete this.event_moving;
    }
    attributeChangedCallback(name, oldValue, newValue) {
        let self = this;
        if (!this.table) {
            if (name=='scale')
                this.default_scale = parseInt(newValue);
            return;
        }
        if (name=='centerutctime'){
            let shift_time = parseInt(oldValue) - parseInt(newValue);
            let scale = parseInt(self.getAttribute('scale')||100);
            if (this.down_mouse_posx!==undefined)
                self.update(!self.loc_change);
            else
                if (shift_time!=0 && !isNaN(shift_time))
                    this.moveAnimate(parseInt(shift_time / scale),!self.loc_change);
                else this.update(!this.loc_change);
            return;
        }
        if (name=='scale'){
            this.scaleAnimate(parseFloat(oldValue),!self.loc_change);
            return;
        }
        this.update(!self.loc_change);
    }
    scaleAnimate(oldscale, from_out){
        let self = this;

        if (this.scale_timer) return;
        this.scale_timer = setTimeout(function(){
            let scale = parseFloat(self.getAttribute('scale')||100);
            scale = oldscale/scale;

            self.table.style.transform='scaleX(1)';
            let animate = self.table.parentElement.parentElement.animate([{ transform: 'scaleX('+(scale || 1)+')' }], 100);
            animate.onfinish = function() {
                self.table.parentElement.parentElement.style.transform = 'scaleX(1)';
                self.update(from_out);
                delete self.scale_timer;
            }
        },0);
    }
    moveAnimate(animate_move_pixels, from_out){
        let self = this;
        this.last_move_pixels = animate_move_pixels + (this.last_move_pixels!==undefined?this.last_move_pixels:0);
        if (this.animate_move_pixels!==undefined) 
            return;
        this.animate_move_pixels = this.last_move_pixels;
        delete self.last_move_pixels;

        let animate = this.twrap.animate([{ left: this.animate_move_pixels+'px' }], 100);
        animate.onfinish = function() {
            if (self.last_move_pixels!==undefined){
                delete self.animate_move_pixels;
                setTimeout(function(){
                    self.moveAnimate(0);
                },0);
                return;
            }
            delete self.animate_move_pixels;
            self.twrap.style.left = 0;
            self.update(from_out);
        };
    }
    divider(val,arr){
        for (let i=0; i<arr.length; i++)
            if (val>arr[i]) return arr[i];
        return val;
    }
    static get RANGES(){
        return;
    }
    update(from_out){
        let self = this;
        if (!this.table) return;
        let screen_width = this.getBoundingClientRect().width;
        if (!screen_width) return;
        if (!this.min_year_width) this.recalcWidths();
        if (!this.min_year_width) return;
//        if (this.update_timer) clearTimeout(this.update_timer);
//        if (!screen_width) {this.update_timer = setTimeout(function(){delete self.update_timer;self.update();},500);return;}

        const scale = parseFloat(this.getAttribute('scale')||0);
        const MAX_PIXELS_PER_YEAR = parseInt(60*60*24*365*1000 / scale);
        const MAX_PIXELS_PER_MONTH = parseInt(60*60*24*31*1000 / scale);
        const PIXELS_PER_DAY = 60*60*24*1000 / scale;
        const PIXELS_PER_HOUR = 60*60*1000 / scale;
        const PIXELS_PER_MINUTE = 60*1000 / scale;
        const PIXELS_PER_SECOND = 1000 / scale;

        const MONTHS_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
//            let MONTHS_NAMES = ['January','February','March','April','May','June','Jule','August','September','October','November','December'];

        this.one_shift_time = 1000;

        // Seconds per pixel
        let centerutctime = parseInt(this.getAttribute('centerutctime') || Date.now());
        if (centerutctime===undefined || scale===undefined) return;

        let left_time = parseInt(centerutctime - scale*screen_width*1.5);
        let right_time = parseInt(centerutctime + scale*screen_width*1.5);

        let left_date = new Date(left_time+this.getTimeOffset());
        let right_date = new Date(right_time+this.getTimeOffset());

        // as "only years" mode
        let only_years_mode = this.min_months_width >= MAX_PIXELS_PER_MONTH;
        let seconds_frame_mode = this.min_sec_frame_width < PIXELS_PER_SECOND;
        let day_seconds_mode = seconds_frame_mode ? false : this.min_hoursec_width < PIXELS_PER_HOUR/2;
        let day_hour_mode = seconds_frame_mode||day_seconds_mode ? false : this.min_day_hour_width <= PIXELS_PER_DAY;
        let months_day_mode = seconds_frame_mode||day_hour_mode||day_seconds_mode ? false : this.min_year_month_width < MAX_PIXELS_PER_MONTH;
        let year_months_mode = seconds_frame_mode||months_day_mode||day_hour_mode||day_seconds_mode ? false : (this.min_months_width < MAX_PIXELS_PER_MONTH);

        let left_day_time = this.roundDayDown(left_time);
        let right_day_time = this.roundDayUp(right_time);

        let line1 = '', line2='';
        this.ranges = [];
        if (only_years_mode || year_months_mode){
            let prev_pos = 0, sum_milli_seconds=0;
            let i = new Date(left_date);
            do{
                sum_milli_seconds+=this.getYearSeconds(i.getFullYear());
                let next_pos = sum_milli_seconds/scale;
                let ys = Math.round(next_pos - prev_pos);

                let text = i.getFullYear();
                if (screen_width/2 < 365*24*60*60*1000 / scale){
                    let g = Math.ceil(365*24*60*60*1000 / scale / screen_width)+1;
                    let text2=text;text='';
                    for (let ii=0;ii<g;ii++)
                        text += '<div>'+text2+'</div>';
                }

                line1 += '<td style="min-width:'+ys+'px;max-width:'+ys+'px"'+(only_years_mode?' rowspan=2':'')+(year_months_mode?' colspan=12':'')+'><div>'+text+'</div></td>';
                this.ranges.push([i.getTime(),ys]);
                prev_pos += ys;
            } while (i<right_date && i.setFullYear(i.getFullYear()+1));
            let left_day = new Date(left_date.getFullYear(),0,1,0,0,0);
            this.table_left_time = left_day.getTime();
            this.one_shift_time = 60*60*24*365*1000;
        }

        if (year_months_mode){
            this.ranges = [];
            let prev_pos=0,month_seconds_sum=0;
            let i = new Date(left_date.getFullYear(), 0,1,0,0,0);
            this.table_left_time = i.getTime() - this.getTimeOffset();;
            let e = new Date(right_date.getFullYear()+1, 0,1,0,0,0);
            do{
                month_seconds_sum += this.getMonthSeconds(i.getFullYear(),i.getMonth());
                let next_pos = month_seconds_sum/scale;
                let ms = Math.round(next_pos - prev_pos);
                line2 += '<td style="min-width:'+ms+'px;max-width:'+ms+'px";"><div>'+MONTHS_NAMES[i.getMonth()]+'</div></td>';
                this.ranges.push([i.getTime(),ms]);
                prev_pos += ms;
            } while (i<e && i.setMonth(i.getMonth()+1));
            this.one_shift_time = 60*60*24*30*1000;
        }

        if (months_day_mode){
            let prev_pos=0,msilliseconds_sum=0;
            let i = new Date(left_date.getFullYear(), left_date.getMonth(),1,0,0,0);
            this.table_left_time = i.getTime()-this.getTimeOffset();
            let e = new Date(right_date.getFullYear(), right_date.getMonth()+1,1,0,0,0);
            do{
                let dim = this.getDaysInMonth(i.getFullYear(),i.getMonth());
                let month_divider = this.divider(MAX_PIXELS_PER_MONTH / this.min_day_width, [dim,10,6,4,3,2,1]);
                let text = MONTHS_NAMES[i.getMonth()]+' '+i.getFullYear();
                if (screen_width/2 - this.min_day_hour_width < MAX_PIXELS_PER_MONTH){
                    let g = Math.ceil(MAX_PIXELS_PER_MONTH / screen_width)+1;
                    let text2=text;text='';
                    for (let ii=0;ii<g;ii++)
                        text += '<div>'+text2+'</div>';
                }
                line1 += '<td colspan='+month_divider+'><div>'+text+'</div></td>';
                let d = new Date(i); let de = new Date(d.getFullYear(),d.getMonth()+1,1,0,0,0);
                let divs_count=month_divider;
                do{
                    divs_count--;
                    let next_pos = (d.getTime() - this.getTimeOffset() - this.table_left_time + parseInt(dim/month_divider)*24*60*60*1000 )/scale;
                    if (!divs_count)
                        next_pos = (i.getTime() - this.getTimeOffset() + dim*24*60*60*1000 - this.table_left_time)/scale;
                    let dw = Math.round(next_pos - prev_pos);
                    let style = ' style="width:'+dw+'px;min-width:'+dw+'px;max-width:'+dw+'px;"';
                    line2 += '<td'+style+'><div>'+d.getDate()+'</div></td>';
                    this.ranges.push([d.getTime(),dw]);
                    prev_pos += dw;
                    if (!divs_count) break;
                    d.setDate(d.getDate()+parseInt(dim/month_divider));
                } while (d<de);
                i.setMonth(i.getMonth()+1);
            } while (i<e);
            this.one_shift_time = 60*60*24*1000;
        }

        if (day_hour_mode){
            let day_divider = this.divider(PIXELS_PER_DAY / this.min_hour_width, [24,12,8,6,4,3,2,1]);
            let prev_pos=0;
            let i = new Date(left_date);
            do{
                let text = (i.getDate())+' '+MONTHS_NAMES[i.getMonth()]+' '+i.getFullYear();

                if (screen_width/2 < 24*60*60*1000 / scale){
                    let g = Math.ceil(24*60*60*1000 / scale / screen_width)+1;
                    let text2=text;text='';
                    for (let ii=0;ii<g;ii++)
                        text += '<div>'+text2+'</div>';
                }

                line1 += '<td colspan='+day_divider+'><div>'+text+'</div></td>';
                for (let hour = 0; hour<24; hour+= 24 / day_divider){
                    let next_pos = (i.getTime() - left_date.getTime()+(hour+24 / day_divider)*60*60*1000)/scale;
                    let full_width = Math.round(next_pos - prev_pos);
                    line2 += '<td style="width:'+full_width+'px;min-width:'+full_width+'px;max-width:'+full_width+'px;">&nbsp;<div>'+hour+':00</div></td>';
                    this.ranges.push([i.getTime() + hour*60*60*1000,full_width]);
                    prev_pos += full_width;
                }
            } while (i<right_date && i.setDate(i.getDate()+1));
            let left_day = new Date(left_date.getFullYear(),left_date.getMonth(),left_date.getDate(),0,0,0);
            this.table_left_time = left_day.getTime() - this.getTimeOffset();;
            this.one_shift_time = parseInt(60*60*24*1000/day_divider);
        }

        if (day_seconds_mode){

            let day_width = 60*60*24*1000 / scale;
            let hour_divider = this.divider(day_width / this.min_hoursec_width / 24,[60*60,60*30,60*12,60*10,60*6,60*4,60*3,60*2,60,30,20,15,12,10,6,5,4,3,2,1]);

            let left_sec_time = parseInt(left_time / (60*60*1000/hour_divider)) * (60*60*1000/hour_divider);
            let r = parseInt(right_time / (60*60*1000/hour_divider)) * (60*60*1000/hour_divider) + 60*60*1000/hour_divider;
            let right_sec_time = r == right_time + 60*60*1000/hour_divider ?  right_time : r;

            let border_mode = (new Date(left_sec_time+this.getTimeOffset())).getDate() != (new Date(right_sec_time+this.getTimeOffset())).getDate();
            let seconds_before_border = left_day_time + 60*60*24*1000 - left_sec_time;
            let full_width = parseInt((right_sec_time - left_sec_time) / scale);
            let cols_count = parseInt((right_sec_time - left_sec_time) / (60*60*1000/hour_divider));
            let cols_count_before = parseInt(seconds_before_border / (60*60*1000/hour_divider));
            let col_width = 60*60*1000/hour_divider / scale;

            let ldate = new Date(left_sec_time+this.getTimeOffset());
            let rdate = new Date(right_sec_time+this.getTimeOffset());
            let style = '';
            let style_first = 'text-align:right;';
            let t = parseInt((right_sec_time - left_sec_time - seconds_before_border)/scale);
            let style_last = 'text-align:left;';

            let text='',text2 = ldate.getDate()+' '+MONTHS_NAMES[ldate.getMonth()]+' '+ldate.getFullYear();
            for (let ii=0;ii<3;ii++) text += '<div>'+text2+'</div>';
            let text4='',text3 = rdate.getDate()+' '+MONTHS_NAMES[rdate.getMonth()]+' '+rdate.getFullYear();
            for (let ii=0;ii<3;ii++) text4+= '<div>'+text3+'</div>';

            if (!border_mode)
                line1 = '<td colspan='+cols_count+' style="'+style+'"><div style="text-align:center;">'+text+'</div></td>';
            else
                line1 = '<td colspan='+cols_count_before+' style="'+style_first+'"><div>'+text+'</div></td>'+
                '<td colspan='+(cols_count-cols_count_before)+' style="'+style_last+'"><div>'+text4+'</div></td>';
            let has_seconds = false;
            let prev_pos=0;
            for (let utc = left_sec_time; utc < right_sec_time; utc += 60*60*1000/hour_divider){
                let next_pos = ((utc - left_sec_time + 60*60*1000/hour_divider)/(60*60*1000)) * PIXELS_PER_HOUR;
                let hw = Math.round(next_pos - prev_pos);
                let d = new Date(utc); d = new Date(utc+this.getTimeOffset());
                if (!has_seconds) has_seconds = d.getSeconds()>0;
                let datetext = d.getHours();
                if (col_width > this.min_hour_width) datetext += ':'+(d.getMinutes()<10?'0':'')+d.getMinutes();
                if (has_seconds) datetext += '<sup>:'+(d.getSeconds()<10?'0':'')+d.getSeconds()+'</sup>';
                line2 += '<td style="width:'+hw+'px;min-width:'+hw+'px;max-width:'+hw+'px;">&nbsp;<div>'+datetext+'</div></td>';
                this.ranges.push([utc,hw]);
                prev_pos += hw;
            }
            this.table_left_time = left_sec_time;

            this.one_shift_time = parseInt(60*60*1000/hour_divider);
        }
    
        if (seconds_frame_mode){
            let req_frames = parseInt(this.getAttribute('frames') || 1);
            let max_frames = parseInt(PIXELS_PER_SECOND / this.min_frame_width);
            let frame_divider;
            for (frame_divider = max_frames; frame_divider>1; frame_divider--)
                if (!(req_frames % frame_divider)) break;
            let prev_pos=0;
            let left_seconds = new Date(left_date.getFullYear(), left_date.getMonth(), left_date.getDate(), left_date.getHours(), left_date.getMinutes(), left_date.getSeconds());
            let right_seconds = new Date(right_date.getFullYear(), right_date.getMonth(), right_date.getDate(), right_date.getHours(), right_date.getMinutes(), right_date.getSeconds());
            let i = new Date(left_seconds);
            do{
                let text = i.toLocaleTimeString() + ', ' + i.getDate()+' '+MONTHS_NAMES[i.getMonth()]+' '+i.getFullYear();
                if (screen_width < 1000 / scale){
                    let g = Math.ceil(1000 / scale / screen_width);
                    let text2=text;text='';
                    for (let ii=0;ii<g;ii++)
                        text += '<div>'+text2+'</div>';
                }
                line1 += '<td colspan='+frame_divider+'><div>'+text+'</div></td>';
                for (let frame = 0; frame < req_frames; frame += req_frames / frame_divider){
                    let next_pos = PIXELS_PER_SECOND*((i.getTime()-left_seconds.getTime())/1000 + 1/frame_divider+frame/req_frames);
                    let ws = Math.round(next_pos - prev_pos);
                    line2 += '<td style="width:'+ws+'px;min-width:'+ws+'px;max-width:'+ws+'px;">&nbsp;<div>'+frame+'</div></td>';
                    this.ranges.push([i.getTime() + 1000 / req_frames * frame,ws]);
                    prev_pos += ws;
                }
            } while (i<right_seconds && i.setSeconds(i.getSeconds()+1));
            this.table_left_time = left_seconds.getTime() - this.getTimeOffset();
            this.one_shift_time = parseInt(1000/frame_divider);
        }

        this.line1.innerHTML = line1;
        this.line2.innerHTML = line2;

        let wrap_shift_left = Math.floor(-screen_width/2);
        this.wrap.style.left = ''+wrap_shift_left+'px';
        let twrap_shift_left = - wrap_shift_left - Math.round((centerutctime - this.table_left_time)/scale - parseInt(screen_width/2));
        this.twrap.style.marginLeft = ''+twrap_shift_left+'px';
        this.centerpos.style.left = Math.round(screen_width/2-20.5)+'px';
        this.summary_shift = wrap_shift_left + twrap_shift_left;

        while (this.getAttribute('databar')!==null && typeof this.ongetranges === "function"){
            let ranges = this.ongetranges(parseInt(centerutctime - scale*screen_width/2), parseInt(centerutctime + scale*screen_width/2));
            this.databar.innerHTML = '';
            if (ranges.length<2) {
                this.databar.innerHTML = '';
                break;
            }
            let start, end;
            for (let i=0; i<ranges.times.length; i++){
                if (ranges.times[i]<this.table_left_time) start=i;
                if (Math.abs(ranges.durations[i]) >= right_time && end===undefined) {end=i+1;break;}
            }
            if (start===undefined) start=0;
            if (end===undefined) end=ranges.times.length;
            let timeline_html='';

            let prev_pos=0;
            for (let i=start; i<end; i++){
                let st = parseInt((ranges.times[i] - this.table_left_time)/scale);
                if (st<0) st=0;
                let et = parseInt((ranges.times[i] + Math.abs(ranges.durations[i]) - this.table_left_time)/scale);
                let w = et - st;
                let n = st - prev_pos;
                timeline_html += '<div '+(ranges.durations[i]<0?'e ':'')+'style="width:'+w+'px; margin-left:'+n+'px;"></div>';
                prev_pos = et;
            }
            this.databar.innerHTML = timeline_html;
            break;
        }
        if (this.getAttribute('selectutctime')!==null){
            let selectutctime = parseInt(this.getAttribute('selectutctime'));
            let lt = centerutctime > selectutctime ? selectutctime : centerutctime;
            let mar_left = parseInt(this.getBoundingClientRect().width/2 - (centerutctime - lt)/scale) - wrap_shift_left - twrap_shift_left;
            let range_width = (centerutctime > selectutctime ? centerutctime - selectutctime : selectutctime - centerutctime)/scale;
            this.shadow.querySelector('.range').style.width = ''+range_width+'px';
            this.shadow.querySelector('.range').style.marginLeft = ''+mar_left+'px';
            this.shadow.querySelector('.range').style.display = 'block';
        } else
            this.shadow.querySelector('.range').style.display = 'none';
        if (!from_out){
            setTimeout(function(){self.dispatchEvent(self.event_change);},0);
        }
    }
    getTimeOffset(){
        let utc = this.getAttribute('utc');
        if (utc!==null) return (new Date().getTimezoneOffset())*60*1000+parseInt(utc)*60*60*1000;
        return 0;
    }

    roundDayDown(utctime){
        let d = new Date(utctime+this.getTimeOffset());
        return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).getTime() - this.getTimeOffset();
    }
    roundDayUp(utctime){
        let d = new Date(utctime+this.getTimeOffset());
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()+1, 0, 0, 0).getTime() - this.getTimeOffset();
    }
    getYearSeconds(year) {
        let utc1 = Date.UTC(year, 0, 1, 0, 0, 0);
        let utc2 = Date.UTC(year+1, 0, 1, 0, 0, 0);
        return parseInt((utc2 - utc1) );
    }
    getMonthSeconds(year, month) {
        let utc1 = Date.UTC(year, month, 1, 0, 0, 0);
        let utc2 = Date.UTC(year, month+1, 1, 0, 0, 0);
        return parseInt((utc2 - utc1) );
    }
    getDaysInMonth(year, month) {
        let utc1 = Date.UTC(year, month, 1, 0, 0, 0);
        let utc2 = Date.UTC(year, month+1, 1, 0, 0, 0);
        return parseInt((utc2 - utc1) / 1000 / 24/60/60);
    }
    textWidth(text, fontSize, fontFamily){
        let el = document.createElement('div');
        el.style.position = 'absolute';
        el.style.float = "left";
        el.style.whiteSpace = 'nowrap';
        el.style.visibility = 'hidden';
        el.style.fontSize = fontSize ? fontSize : this.style.fontSize;
        el.style.fontFamily = fontFamily ? fontFamily : this.style.fontFamily;
        el.innerHTML = text;
        if (!document.body) return 0;
        el = document.body.appendChild(el);
        let w = el.offsetWidth;
        document.body.removeChild(el);
        return w;
    }
    getRanges() {
        return this.ranges!==undefined ? this.ranges : [];
    }
    getSummaryShift() {
        return this.summary_shift ? this.summary_shift : 0;
    }
    static get css() {
        return `<style>
table{border-spacing:0px;height:100%;min-height:3em;color:inherit;}
table tr td{padding:0;}
.body:not(:not([databar])) table tr:first-child td{padding-bottom:3px;}
.body:not([databar]) .databar{display:none;}
.databar{text-align:left;height:5px;position:absolute;min-width:100%;display:block;top:1em;z-index:20;line-height:0px;white-space:nowrap;background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAAAXNSR0IB2cksfwAAAAZQTFRF////AAAAVcLTfgAAAAJ0Uk5TZmbh5cV0AAAADElEQVR4nGNwYGgAAAFEAME6ehxWAAAAAElFTkSuQmCC);}
table tr:first-child td{box-shadow:1px 0px 0px white;vertical-align:middle;height:1em;}
.body:not([databar]) table tr:first-child td{height:1.2em;}
table tr:first-child td:first-child > div{text-align:right;}
table tr:first-child td:last-child > div{text-align:left;}
table tr:first-child td > div{padding:0px 3px;text-align:center;height:1.1em;overflow:hidden;white-space:nowrap;display:flex;flex-direction:row;align-content:space-between;justify-content:space-between;}
table tr:last-child td > div{height:1.2em;word-break:break-all;overflow:hidden;width:100%;position:absolute;text-align:center;top:4px;left:-50%;}
table tr:last-child td{height:min-content;text-align:left;vertical-align:middle;position:relative;}
table tr:last-child td.year{border-left:1px solid gray;border-top:2px solid gray;}
.body:not([databar]) table tr:last-child td:not(.year){border-top:2px solid gray;}
table tr:last-child td:not(.year):before{margin-left:0px;content:'';width:0px;height:5px;border-left:1px solid;position:absolute;top:0;border-left-color:inherit;}
table tr:last-child td.odd{background-color:#80808040;}
table td sup{vertical-align:baseline;}
.centerpos{width:41px;background:none;background:linear-gradient(90deg, #0000, #f888 40%,#f888 45%, #f88f 49%,#0000 50%, #f88f 51%, #f888 55%, #f888 60%, #0000);height:100%;position:absolute;left:calc(50% - 20.5px);top:0;z-index:10;}
.centerpos div{margin:0 auto;width:1px;height:100%;background:red;}
*{-moz-user-select:none;-webkit-user-select:none;-ms-user-select:none;user-select:none;}
.body{position:relative;overflow:hidden;width:100%;height:100%;}
.wrap{position:absolute;left:-50%;height:100%;right:-50%;}
.twrap{position:absolute;height:100%;}
.databar > [e]{background-color:black;}
.databar > :not([e]){box-shadow:-1px 0 1px black;}
.databar > div{height:5px;height:4px;background-color:white;margin-top:1px;display:inline-block;}
.databar > div.e{background-color:white;}
.range{height:40px;background-color:#f888;margin-top:1px;position:absolute;}
</style>`;
    }

}
window.customElements.define('k-timeline-picker', CTimeLinePicker);

/* 2021, dev mail bigandrez@gmail.com, license type has not been selected yet */

class CKControl extends HTMLElement {
    getType(){
        return 'min';
    }
    static get observedAttributes() {
        return []; 
    }
    constructor() {
        super();
        let self = this;
    }
    connectedCallback() {
        let self = this;
        this.style.position='relative';
        this.style.width='100%';
        this.style.height='100%';
        this.style.display='block';
        this.shadow = this.attachShadow({mode: 'open'});
        this.shadow.innerHTML = '<style>'+this.css()+'</style>';
    }
    attributeChangedCallback(name, oldValue, newValue) {
    }
    setPlayer(player){
        this.player = player;
    }
    css() {
        return `
`;
    }
}

window.customElements.define('k-control', CKControl);
/* 2021, dev mail bigandrez@gmail.com, license type has not been selected yet */

class CKControlFullscreen extends CKControl {
    getType(){
        return 'min';
    }
    static get observedAttributes() {
        return []; 
    }
    customFullScreen(){
        if (this.player.classList.contains('fullscreen')){
            this.player.classList.remove('fullscreen');
            let p = document.getElementById('fullscreenstyle');
            if (p) p.remove();
            return;
        }
        if (document.getElementById('fullscreenstyle')===null)
            document.body.insertAdjacentHTML('beforeend','<div id="fullscreenstyle"><style>body{overflow:hidden!important;}body .fullscreen{position:fixed!important;left:0!important;right:0!important;top:0!important;bottom:0!important;z-index:2000000!important;width:100%!important;height:100%!important;}</style></div>')
        this.player.classList.add('fullscreen');
    }
    constructor() {
        super();
        let self = this;
    }
    connectedCallback() {
        super.connectedCallback();
        let self = this;
        this.shadow.innerHTML += '<div class="fsbtn"></div>';
        this.shadow.querySelector('.fsbtn').onclick = function(){
            self.customFullScreen();
        }
    }
    onPlay(){
    }
    onPause(){
    }
    attributeChangedCallback(name, oldValue, newValue) {
    }
    css() {
        return super.css()+`
.fsbtn{
height: 100%;
    width: 100%;
    background: url(data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPGc+CjxwYXRoIGQ9Ik0xMjgsMzJWMEgxNkM3LjE2MywwLDAsNy4xNjMsMCwxNnYxMTJoMzJWNTQuNTZMMTgwLjY0LDIwMy4ybDIyLjU2LTIyLjU2TDU0LjU2LDMySDEyOHoiIGZpbGw9IiNmZmYiLz4KPHBhdGggZD0iTTQ5NiwwSDM4NHYzMmg3My40NEwzMDguOCwxODAuNjRsMjIuNTYsMjIuNTZMNDgwLDU0LjU2VjEyOGgzMlYxNkM1MTIsNy4xNjMsNTA0LjgzNywwLDQ5NiwweiIgZmlsbD0iI2ZmZiIvPgo8cGF0aCBkPSJNNDgwLDQ1Ny40NEwzMzEuMzYsMzA4LjhsLTIyLjU2LDIyLjU2TDQ1Ny40NCw0ODBIMzg0djMyaDExMmM4LjgzNywwLDE2LTcuMTYzLDE2LTE2VjM4NGgtMzJWNDU3LjQ0eiIgZmlsbD0iI2ZmZiIvPgo8cGF0aCBkPSJNMTgwLjY0LDMwOC42NEwzMiw0NTcuNDRWMzg0SDB2MTEyYzAsOC44MzcsNy4xNjMsMTYsMTYsMTZoMTEydi0zMkg1NC41NkwyMDMuMiwzMzEuMzZMMTgwLjY0LDMwOC42NHoiIGZpbGw9IiNmZmYiLz4KPC9nPgo8L3N2Zz4K) no-repeat;
    background-size: 70%;
    background-position: center;
   transition-property: background-size;transition-duration: .1s;
}
.fsbtn:hover{
   transition-property: background-size;transition-duration: .1s;
   background-size: 80%;
cursor:pointer;
}
`;
    }
}

window.customElements.define('k-control-fullscreen', CKControlFullscreen);
/* 2021, dev mail bigandrez@gmail.com, license type has not been selected yet */

class CKControlPlay extends CKControl {
    getType(){
        return 'min';
    }
    static get observedAttributes() {
        return []; 
    }
    constructor() {
        super();
        let self = this;
    }
    connectedCallback() {
        super.connectedCallback();
        let self = this;
        this.shadow.innerHTML += '<div class="playbtn disabled"></div>';
        this.shadow.querySelector('.playbtn').onclick = function(){
            if (!self.shadow.querySelector('.playbtn').classList.contains('pause'))
                self.player.play().catch(function(){});
            else
                self.player.pause().catch(function(){});
        }
        setTimeout(function(){
            self.player.player.addEventListener("statusupdate", function(event){
                if (event.status==='invalidtoken')
                    self.shadow.querySelector('.playbtn').classList.add('disabled');
                else if (event.status!=='loading')
                    self.shadow.querySelector('.playbtn').classList.remove('disabled');
            },{once:false});
        },0);
    }
    onPlay(){
        if (!this.shadow.querySelector('.playbtn').classList.contains('pause'))
            this.shadow.querySelector('.playbtn').classList.add('pause');
    }
    onPause(){
        if (this.shadow.querySelector('.playbtn').classList.contains('pause'))
            this.shadow.querySelector('.playbtn').classList.remove('pause');
    }
    attributeChangedCallback(name, oldValue, newValue) {
    }
    css() {
        return super.css()+`
.playbtn.disabled{pointer-events:none;}
.playbtn{
height: 100%;
    width: 100%;
    background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0yMyAxMmwtMjIgMTJ2LTI0bDIyIDEyem0tMjEgMTAuMzE1bDE4LjkxMi0xMC4zMTUtMTguOTEyLTEwLjMxNXYyMC42M3oiIGZpbGw9IiNmZmZmZmYiLz48L3N2Zz4=) no-repeat;
    background-size: 70%;
    background-position: center;
   transition-property: background-size;transition-duration: .1s;
}
.playbtn:hover{
   transition-property: background-size;transition-duration: .1s;
   background-size: 80%;
cursor:pointer;
}
.playbtn.pause{
    background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE4LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgdmlld0JveD0iMCAwIDMxNCAzMTQiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDMxNCAzMTQ7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxnPg0KCTxwYXRoIGQ9Ik05MS40NywwSDc1LjM0M0M1OC41MzgsMCw0NC44NjcsMTMuNjcxLDQ0Ljg2NywzMC40NzZ2MjUzLjA0OGMwLDE2LjgwNSwxMy42NzEsMzAuNDc3LDMwLjQ3NiwzMC40NzdIOTEuNDcNCgkJYzE2LjgwNSwwLDMwLjQ3Ny0xMy42NzIsMzAuNDc3LTMwLjQ3N1YzMC40NzZDMTIxLjk0NiwxMy42NzEsMTA4LjI3NCwwLDkxLjQ3LDB6IE0xMDcuOTQ2LDI4My41MjMNCgkJYzAsOS4wODUtNy4zOTIsMTYuNDc3LTE2LjQ3NywxNi40NzdINzUuMzQzYy05LjA4NSwwLTE2LjQ3Ni03LjM5Mi0xNi40NzYtMTYuNDc3VjMwLjQ3NkM1OC44NjcsMjEuMzkxLDY2LjI1OCwxNCw3NS4zNDMsMTRIOTEuNDcNCgkJYzkuMDg1LDAsMTYuNDc3LDcuMzkxLDE2LjQ3NywxNi40NzZWMjgzLjUyM3oiIGZpbGw9IiNmZmZmZmYiLz4NCgk8cGF0aCBkPSJNMjM4LjY1NywwSDIyMi41M2MtMTYuODA1LDAtMzAuNDc3LDEzLjY3MS0zMC40NzcsMzAuNDc2djI1My4wNDhjMCwxNi44MDUsMTMuNjcyLDMwLjQ3NywzMC40NzcsMzAuNDc3aDE2LjEyNw0KCQljMTYuODA1LDAsMzAuNDc2LTEzLjY3MiwzMC40NzYtMzAuNDc3VjMwLjQ3NkMyNjkuMTMzLDEzLjY3MSwyNTUuNDYyLDAsMjM4LjY1NywweiBNMjU1LjEzMywyODMuNTIzDQoJCWMwLDkuMDg1LTcuMzkxLDE2LjQ3Ny0xNi40NzYsMTYuNDc3SDIyMi41M2MtOS4wODUsMC0xNi40NzctNy4zOTItMTYuNDc3LTE2LjQ3N1YzMC40NzZjMC05LjA4NSw3LjM5Mi0xNi40NzYsMTYuNDc3LTE2LjQ3Ng0KCQloMTYuMTI3YzkuMDg1LDAsMTYuNDc2LDcuMzkxLDE2LjQ3NiwxNi40NzZWMjgzLjUyM3oiIGZpbGw9IiNmZmZmZmYiLz4NCjwvZz4NCjwvc3ZnPg0K);
}
`;
    }
}

window.customElements.define('k-control-play', CKControlPlay);
/* 2021, dev mail bigandrez@gmail.com, license type has not been selected yet */

class CKControlSpeed extends CKControl {
    getType(){
        return 'top';
    }
    static get observedAttributes() {
        return []; 
    }
    constructor() {
        super();
        let self = this;
    }
    connectedCallback() {
        super.connectedCallback();
        let self = this;
        this.style.position='absolute';
        this.style.width='50px';
        this.style.height='100%';
        this.style.left='0';
        this.style.top='50%';
        this.style.maxHeight='200px';

        this.shadow.innerHTML += '<div class="body disabled"><div class="value">1x</div><input class="slider" orient="vertical" type="range" min="-16" max="16" step="1" value="1"><div class="info">SPEED</div></div>';
        this.slider = this.shadow.querySelector('.slider');
        this.speedval = this.shadow.querySelector('.value');
        this.slider.addEventListener("input", function(event){
            self.speedval.innerHTML = self.slider.value+'x';
            self.player.playbackRate = parseInt(self.slider.value);
            event.preventDefault();
            event.stopPropagation();
            return false;
        });
        this.slider.addEventListener("click", function(event){
            event.preventDefault();
            event.stopPropagation();
            return false;
        });
        setTimeout(function(){
            if (self.player.getAttribute('noreverse')!==null)
                self.slider.setAttribute('min',0);
        },0)
        setTimeout(function(){
            self.player.player.addEventListener("statusupdate", function(event){
                clearTimeout(self.enable_timeout);
                if (event.status==='invalidtoken')
                    self.shadow.querySelector('.body').classList.add('disabled');
                else if (event.status!=='loading')
                    self.enable_timeout = setTimeout(function(){
                        self.shadow.querySelector('.body').classList.remove('disabled');
                    },300);
            },{once:false});
        },0);
    }
    attributeChangedCallback(name, oldValue, newValue) {
    }
    css() {
        return super.css()+`
.body.disabled{display:none;}
.body{
    width: 100%;
    height: 100%;
    position: absolute;
    top: -50%;
background:#0004;
padding:10px 0;
}
.value{height:20px;color:white;text-align:center;}
input[type="range"]{
-webkit-appearance: slider-vertical;
width: 50px;
height: calc(100% - 40px);
margin: 0;
}
.info{
color:white;
font-size:55%;
text-align:center;
}
`;
    }
}

window.customElements.define('k-control-speed', CKControlSpeed);
/* 2021, dev mail bigandrez@gmail.com, license type has not been selected yet */

class CKControlTimeinfo extends CKControl {
    getType(){
        return 'double';
    }
    static get observedAttributes() {
        return []; 
    }
    constructor() {
        super();
        let self = this;
    }
    connectedCallback() {
        super.connectedCallback();
        let self = this;
        this.shadow.innerHTML += '<div class="timearea">2021-06-23<br>18:58:15</div>';
        this.timearea = this.shadow.querySelector('.timearea');
        setTimeout(function(){
            self.player.addEventListener("timeupdate", function(){
                let utc = parseInt(self.player.getAttribute('utc'));
                utc = !isNaN(utc) ? utc : -(new Date()).getTimezoneOffset()/60;
                let time = new Date(self.player.currentUtcTime);
//if (time<100000) debugger;
                time.setHours(time.getHours()+utc);
                self.timearea.innerHTML = (time).toISOString().substr(0,19).replace('T','<br>');
            },{once:false});
            if (self.player.getAttribute('utc')===null)
                self.removeAttribute('utc');
            else
                self.setAttribute('utc',self.player.getAttribute('utc'));
        },0);

    }
    attributeChangedCallback(name, oldValue, newValue) {
    }
    css() {
        return super.css()+`
.timearea{
height: calc(100% - 4px);
    width: 100%;
    white-space: nowrap;
    padding: 4px 0px 0 0px;
    line-height: 16px;
    text-align: center;
    color: white;
    font-size: 14px;
}
`;
    }
}

window.customElements.define('k-control-timeinfo', CKControlTimeinfo);
/* 2021, dev mail bigandrez@gmail.com, license type has not been selected yet */

class CKControlTimepicker extends CKControl {
    getType(){
        return 'full';
    }
    static get observedAttributes() {
        return []; 
    }
    constructor() {
        super();
        let self = this;
    }
    connectedCallback() {
        super.connectedCallback();
        let self = this;
        this.shadow.innerHTML += '<k-timeline-picker databar frames="25" scale="52"></k-timeline-picker>';
        this.picker = this.shadow.querySelector('k-timeline-picker');
        setTimeout(function(){
            self.picker.addEventListener("moving", function(e){
                self.early_playing = self.player.isPlaying();
                self.player.pause().catch(function(){});
            },{once:false});
            self.picker.addEventListener("moved", function(e){
                if (self.early_playing)
                    self.player.play().catch(function(){});
            },{once:false});
            self.player.addEventListener("timeupdate", function(e){
                if (self.skip_next_timeupdate){
                    delete self.skip_next_timeupdate;
                    return;
                }
//                if (!self.player.isPlaying()) return;
                let time = self.player.currentUtcTime;
                self.picker.setAttribute('centerutctime',time);
            },{once:false});
            self.picker.addEventListener("change", function(e){
                clearTimeout(self.change_time_timer);
                self.change_time_timer = setTimeout(function(){
                    let time = parseInt(self.picker.getAttribute('centerutctime'));
                    self.player.currentUtcTime = time;
                    self.skip_next_timeupdate=true;
                    self.player.sendTimeUpdate();
                },10);
            },{once:false});
            self.player.player.addEventListener("rangeupdate", function(e){
                self.range = {times:e.times,durations:e.durations};
                self.picker.update(true);
            },{once:false});

            self.picker.ongetranges = function(from, to, interval){
                self.player.player.rangeRequest(from, to);
                return self.range!==undefined ? self.range : {times:[],durations:[]};
            };
            if (self.player.getAttribute('utc')===null)
                self.picker.removeAttribute('utc');
            else
                self.picker.setAttribute('utc',self.player.getAttribute('utc'));
        },0);
    }
    attributeChangedCallback(name, oldValue, newValue) {
    }
    css() {
        return super.css()+`
k-timeline-picker{
height: 100%;
    width: 100%;
display:block;
color:white;
    background: #00000080;
}
`;
    }
}

window.customElements.define('k-control-timepicker', CKControlTimepicker);
/* 2021, dev mail bigandrez@gmail.com, license type has not been selected yet */

class CKControlVolume extends CKControl {
    getType(){
        return 'top';
    }
    static get observedAttributes() {
        return []; 
    }
    constructor() {
        super();
        let self = this;
    }
    connectedCallback() {
        super.connectedCallback();
        let self = this;
        this.style.position='absolute';
        this.style.width='50px';
        this.style.height='100%';
        this.style.right='0';
        this.style.top='50%';
        this.style.maxHeight='200px';

        this.shadow.innerHTML += '<div class="body disabled"><div class="value">0.0</div><input class="slider" orient="vertical" type="range" min="0" max="1" step=".1" value="0"><div class="info">VOLUME</div></div>';
        this.slider = this.shadow.querySelector('.slider');
        this.volume = this.shadow.querySelector('.value');
        this.slider.addEventListener("input", function(event){
            self.volume.innerHTML = parseFloat(self.slider.value).toFixed(1);
            self.player.volume = parseFloat(self.slider.value).toFixed(1);
            event.preventDefault();
            event.stopPropagation();
            return false;
        });
        this.slider.addEventListener("click", function(event){
            event.preventDefault();
            event.stopPropagation();
            return false;
        });
        setTimeout(function(){
            self.slider.value = self.player.volume.toFixed(1);
            self.volume.innerHTML = parseFloat(self.slider.value).toFixed(1);
        },0)
        setTimeout(function(){
            self.player.player.addEventListener("statusupdate", function(event){
                clearTimeout(self.enable_timeout);
                if (event.status==='invalidtoken')
                    self.shadow.querySelector('.body').classList.add('disabled');
                else if (event.status!=='loading')
                    self.enable_timeout = setTimeout(function(){
                        self.shadow.querySelector('.body').classList.remove('disabled');
                    },300);
            },{once:false});
        },0);
    }
    attributeChangedCallback(name, oldValue, newValue) {
    }
    css() {
        return super.css()+`
.body.disabled{display:none;}
.body{
    width: 100%;
    height: 100%;
    position: absolute;
    top: -50%;
background:#0004;
padding:10px 0;
}
.value{height:20px;color:white;text-align:center;}
input[type="range"]{
-webkit-appearance: slider-vertical;
width: 50px;
height: calc(100% - 40px);
margin: 0;
}
.info{
color:white;
font-size:55%;
text-align:center;
}
`;
    }
}

window.customElements.define('k-control-volume', CKControlVolume);
// @language_out ES6
/* 2021, dev mail bigandrez@gmail.com, license type has not been selected yet */

class CKVideo extends HTMLVideoElement{
    static get observedAttributes() {
        return ['src']; 
    }
    constructor() {
        super();
        this.kv_event_timeupdate = new Event('timeupdate',{cancelable: false, bubbles: true});
        this.kv_event_ended = document.createEvent('Event');
        this.kv_event_ended.initEvent('ended', true, true);
        this.kv_event_error = document.createEvent('Event');
        this.kv_event_error.initEvent('error', true, true);
        this.kv_event_waiting= document.createEvent('Event');
        this.kv_event_waiting.initEvent('waiting', true, true);
        this.kv_event_statusupdate = document.createEvent('Event');
        this.kv_event_statusupdate.initEvent('statusupdate', true, true);
    }
    setStatus(status, delay=false){
        clearTimeout(this.status_timer);
        let self = this;
        if (!delay){ 
            this.setAttribute('status',status);
            this.kv_event_statusupdate.status = status;
            this.dispatchEvent(this.kv_event_statusupdate);
            return;
        }
        this.status_timer = setTimeout(function(){
            self.status_timer = undefined;
            self.setAttribute('status',status);
            self.kv_event_statusupdate.status = status;
            self.dispatchEvent(self.kv_event_statusupdate);
        },50);
    }
    get currentUtcTime(){
        if (this.getAttribute('time')!==null)
            return parseInt(this.getAttribute('time')||0) + parseInt(super.currentTime*1000);
        if (this.getAttribute('playtime')!==null)
            return parseInt(this.getAttribute('playtime') || 0);
        return parseInt(super.currentTime*1000);
    }
    set currentUtcTime(time){
        this.setTimePromise(time).catch(function(){});
    }
    set playbackRate(rate){
        super.playbackRate = rate > 0 ? rate : 0;
    }
    get playbackRate(){
        return super.playbackRate;
    }
    set src(src){
        let self = this;
        let t = src.indexOf(';');let msec;let time;
        if (t<30 && parseInt(src.substr(0,t))!=src.substr(0,t)){
            let v = src.substr(0,t);
            let d = new Date(v);
            if (!isNaN(d)){
                time = d.getTime();
                src = src.substr(t+1);
            }
        }
        t = src.indexOf(';');
        if (t<10){
            let v = src.substr(0,t);
            if (!isNaN(parseInt(v))){
                msec = parseInt(v);
                src = src.substr(t+1);
            }
        }

        this.setSourcePromise(src,time,msec).catch(function(){}).finally(function(){
            if (time || msec){
                if (time) self.setAttribute('playtime',time);
                self.dispatchEvent(self.kv_event_timeupdate);
            }

        });
    }
    get src(){
        return this.original_src;
    }
    play(abort_controller)          {this.setAttribute('autoplay','');return this.playPromise(abort_controller);}
    pause(abort_controller)         {this.removeAttribute('autoplay');return this.pausePromise(abort_controller);}
    superSrc(src)   {super.src = src;}
    isEmpty()       {return !this.original_src;}
    isError()       {return this.getAttribute('error')!==null;}
    getFirstTime()  {return this.getAttribute('time')!==null ? parseInt(this.getAttribute('time') || 0) : undefined;}
    getLastTime()   {return this.getAttribute('msec')!==null ? ((parseInt(this.getAttribute('time') || 0)) + (parseInt((this.getAttribute('duration')||0)*1000) || parseInt(this.getAttribute('msec') || 0)) - 1) : undefined;}
    getInitialLastTime()   {return this.getAttribute('msec')!==null ? ((parseInt(this.getAttribute('time') || 0)) + (parseInt(this.getAttribute('msec') || 0)) - 1) : undefined;}
    isPlaying()     {return !this.paused && this.readyState > 2;}
    isPlayRequired(){return this.getAttribute('autoplay')!==null;}
    isWaiting()     {return this.getAttribute('status')=='waiting';}
    isReadyForPlay(){return super.src && this.getAttribute('loaded')==100;}
    isFull()        {return this.getAttribute('fullload')!==null;}
    isFilled()      {return this.src && (parseInt(this.getAttribute('msec'))>0 || parseInt(this.getAttribute('duration'))>0);}
    isLoaded()      {return !this.load_promise;}
    isSeeking()     {return this.seeking;}
    atStart()       {return this.currentTime==0;}
    atEnd()         {return this.currentTime==this.duration;}

    getRanges(from, to, interval){
        return [this.getFirstTime() || 0,this.getInitialLastTime()||this.getLastTime()||parseInt(this.duration*1000+(this.getFirstTime()||0))||0];
    }

    isOutOfBound(){
        let currentUtcTime = this.currentUtcTime;
        return currentUtcTime<this.getFirstTime() || currentUtcTime>this.getLastTime();
    }

    abort(abort_controller){
        if (this.abort_controller) this.abort_controller.abort();
        this.abort_controller = abort_controller ? abort_controller : new AbortController();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (this.do_not_attr_callback) return;
        if (name="src"){
            let utc_from_in_msec = this.getAttribute('time')===null ? undefined : parseInt(this.getAttribute('time'));
            let duration_msec = this.getAttribute('msec')===null ? undefined : parseInt(this.getAttribute('msec'));
            this.setSourcePromise(newValue, utc_from_in_msec, duration_msec, this.getAttribute('fullload')!==null).catch(function(e){});
        }
    }

    connectedCallback() {
        let self = this;
        this.players_layer = this;
        this.addEventListener("timeupdate", function() { 
            let time = self.currentUtcTime;
            if (isNaN(time) || self.isEmpty() || self.isError()) {
                self.removeAttribute('playtime');
                self.setStatus('pause');
            } else 
                if (self.isPlaying())
                    self.setAttribute('playtime', time);
//            if (time>0 && time<100000) debugger;
        },false);
        this.addEventListener("error", function(e) { 
            self.setStatus('error');
            self.removeAttribute('playtime');
            self.removeAttribute('duration');self.removeAttribute('loaded');self.removeAttribute('fullload');
            let err='MEDIA_ERR_UNDEFINED';
            if (e&&e.target&&e.target.error&&e.target.error.code){
                switch(e.target.error.code){
                    case e.target.error.MEDIA_ERR_ABORTED: err='MEDIA_ERR_ABORTED'; break;
                    case e.target.error.MEDIA_ERR_NETWORK: err='MEDIA_ERR_NETWORK'; break;
                    case e.target.error.MEDIA_ERR_DECODE: err='MEDIA_ERR_DECODE'; break;
                    case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED: err='MEDIA_ERR_SRC_NOT_SUPPORTED'; break;
                }
            } 
            self.setAttribute('error',err);
            if (self.pause_promise) self.pause_promise_reject();
            if (self.play_promise) self.play_promise_reject(self.abort_controller);
            if (self.load_promise) self.load_promise_reject(self.abort_controller);
            if (self.seek_promise) self.seek_promise_reject(self.abort_controller);
        },false);
        this.addEventListener("durationchange", function(r) { 
            self.setAttribute('duration',this.duration || 0);
        });
        this.addEventListener("canplay", function(r) { 
            if (self.getAttribute('loaded')===null) self.setAttribute('loaded',0);
            if (self.load_promise) self.load_promise_resolve(self.abort_controller);
//            self.setStatus(self.isPlayRequired() ? 'playing' : 'pause');
        });
        this.addEventListener("canplaythrough", function(r) { 
            self.setAttribute('loaded',100);
//            self.setStatus(self.isPlayRequired() ? 'playing' : 'pause');
        });
        this.addEventListener("ended", function() { 
//            self.playRequired = false;
            self.setStatus('pause');
            if (self.play_promise) self.play_promise_reject(self.abort_controller);
            if (self.pause_promise) self.pause_promise_resolve();
        },false);
        this.addEventListener("waiting", function() { 
            self.setStatus('loading',true);
        },false);
        this.addEventListener("playing", function() { 
            self.setStatus('playing');
            if (self.play_promise) self.play_promise_resolve(self.abort_controller);
            if (self.pause_promise) self.pause_promise_reject();
        },false);
        this.addEventListener("pause", function() { 
            self.setStatus('pause');
            if (self.play_promise) self.play_promise_reject(self.abort_controller);
            if (self.pause_promise) self.pause_promise_resolve();
        },false);
        this.addEventListener("loadstart", function() { 
            self.setStatus('loading',true);
            self.removeAttribute('duration');self.setAttribute('loaded',0);
        },false);
        this.addEventListener("seeking", function() { 
            self.setStatus('seeking',true);
        },false);
        this.addEventListener("seeked", function() { 
            if (self.isPlayRequired()) self.setStatus('playing'); else self.setStatus('pause');
            if (self.seek_promise) self.seek_promise_resolve(self.abort_controller);
        },false);
        this.addEventListener("emptied", function() { 
            self.setStatus('pause');
            self.removeAttribute('playtime');
            self.removeAttribute('duration');self.removeAttribute('loaded');
            if (self.play_promise) self.play_promise_reject(self.abort_controller);
            if (self.pause_promise) self.pause_promise_resolve();
            if (self.seek_promise) self.seek_promise_reject(self.abort_controller);
        },false);
        this.addEventListener("progress", function(r) { 
            let percent = null;
            if (r.srcElement.buffered.length > 0 && r.srcElement.buffered.end && r.srcElement.duration) {
                percent = r.srcElement.buffered.end(0) / r.srcElement.duration;
            } else if (r.srcElement.bytesTotal != undefined && r.srcElement.bytesTotal > 0 && r.srcElement.bufferedBytes != undefined) {
                percent = r.srcElement.bufferedBytes / r.srcElement.bytesTotal;
            }
            self.setAttribute('duration',r.srcElement.duration || 0);
            if (percent !== null) {
                percent = 100 * Math.min(1, Math.max(0, percent));
                if (self.getAttribute('loaded')!==null && parseInt(self.getAttribute('loaded'))<percent)
                    self.setAttribute('loaded',parseInt(percent));
            }
        },false);
    }

    loadPromise(){
        if (this.load_promise) return this.load_promise;
        return new Promise(function(resolve, reject){resolve();});
    }
    clearAllFlags(){
        this.removeAttribute('time');
        this.removeAttribute('msec');
        this.removeAttribute('playtime');
        this.removeAttribute('duration');
        this.removeAttribute('loaded');
        this.removeAttribute('error');
        this.removeAttribute('fullload');
        this.poster = '';
//        this.removeAttribute('status');
    }

    setSourcePromise(src, utc_from_in_msec, duration_msec, full_load, thumbnail){
        let self = this;
        if (src) {
            if (this.original_src == src){
                if (this.load_promise) return this.load_promise;
                return new Promise(function(resolve, reject){resolve(self.abort_controller);});
             }
            this.original_src = src;
        } else {
            this.clearAllFlags();
            this.removeAttribute('status');
            if (!this.original_src) {
                if (this.load_promise) return this.load_promise;
                return new Promise(function(resolve, reject){resolve(self.abort_controller);});
            }
            this.original_src = undefined;
            self.removeAttribute('src');
//            try{self.load();}catch(e){};
            return new Promise(function(resolve, reject){resolve(self.abort_controller);});
        }
        this.abort();

        this.clearAllFlags();
        this.poster = thumbnail ? thumbnail : '';
        this.setStatus('loading',true);
        if (src && !isNaN(utc_from_in_msec))
            self.setAttribute('time',parseInt(utc_from_in_msec));
        if (src && !isNaN(duration_msec))
            self.setAttribute('msec',parseInt(duration_msec));
//        if (duration_msec>100000) debugger;

        if (self.pause_promise) self.pause_promise_reject(); self.pause_promise = undefined;
        if (self.play_promise) self.play_promise_reject(self.abort_controller); self.play_promise = undefined;
        if (self.seek_promise) self.seek_promise_reject(self.abort_controller); self.seek_promise = undefined;
        if (self.load_promise) self.load_promise_reject(self.abort_controller); self.load_promise = undefined;

        function tryLoad(src){
            if (self.abort_controller) self.abort_controller.signal.addEventListener('abort', function(){
                if (self.load_promise) self.load_promise_reject(self.abort_controller);
                self.load_promise=undefined;
            });
            self.load_promise = new Promise(function(resolve, reject){
                self.load_promise_resolve = resolve;
                self.load_promise_reject = reject;
            }).then(function(){
                self.load_promise=undefined;
                if (self.isPlayRequired()) self.setStatus('playing'); else self.setStatus('pause');
                return self.abort_controller;
            },function(err){
                self.load_promise=undefined;
//                if (self.isPlayRequired()) self.setStatus('playing'); else self.setStatus('pause');
                if (!(err instanceof AbortController)) self.setStatus('error');
                throw err;
            });
            self.do_not_attr_callback=true;
            if (!src)
                self.removeAttribute('src');
            else{
                self.setAttribute('src',src);
                self.superSrc(src);
            }
            delete self.do_not_attr_callback;
            self.load();
            return self.load_promise;
        }
        if (full_load!==undefined && !full_load || full_load!==undefined && self.getAttribute('fulload')===null) return tryLoad(src);
        self.setAttribute('loaded',0);
        self.dispatchEvent(self.kv_event_waiting);

        return fetch(src,{signal:self.abort_controller.signal,  headers: { range: 'bytes=0-100000000' } }).then(function(res){
            if (parseInt(res.status/100)!==2)
                return tryLoad(src);
            return res.blob().then(function(blob){
                self.setAttribute('fullload','');
                return tryLoad(window.URL.createObjectURL(blob));
            });
        },function(err){
            if (err.code!==undefined && err.code == err.ABORT_ERR){
                if (self.isPlayRequired()) self.setStatus('playing'); else self.setStatus('pause');
                throw err;
            }
//            console.warn('Full load failed. May be CORS?')
            return tryLoad(src);
        });
    }
    toStart(){
        let time = parseInt(this.getAttribute('time')||0);
        return this.setTimePromise(time);
    }
    toEnd(abort_controller){
        if (abort_controller && this.abort_controller!=abort_controller) {
            this.abort_controller.abort();
            this.abort_controller = abort_controller;
        }
        let time = parseInt(this.getAttribute('time')||0) + parseInt(this.getAttribute('msec')||0);
        return this.setTimePromise(time, abort_controller);
    }
    setTimePromise(utc_milliseconds, abort_controller){
        if (!this.isPlaying())
            this.setAttribute('playtime', utc_milliseconds);
        if (abort_controller && this.abort_controller!=abort_controller) {
            this.abort_controller.abort();
            this.abort_controller = abort_controller;
        }

        let self = this;
        let time = parseInt(self.getAttribute('time')) || 0;
        let currentTime = parseFloat(utc_milliseconds - time)/1000;
        if (this.seek_promise) {
            this.setSuperCurrentTime(currentTime);
            return this.seek_promise;
        }
        if (this.isEmpty() || this.isError())
            return new Promise(function(resolve, reject){reject();});
        if (super.currentTime!=currentTime){
//console.log('Seeking to '+currentTime);
            self.seek_promise = new Promise(function(resolve, reject){
                self.seek_promise_resolve = resolve;
                self.seek_promise_reject = reject;
            }).then(function(){
//console.log('Seek end');
                if (self.isPlayRequired()) self.setStatus('playing'); else {
                    if (utc_milliseconds>self.getLastTime() || utc_milliseconds<self.getFirstTime())
                        self.setStatus('nodata');
                    else
                        self.setStatus('pause');
                }
                self.seek_promise=undefined;
                return abort_controller;
            },function(err){
//console.log('Seek fail');
                if (self.isPlayRequired()) self.setStatus('playing'); else self.setStatus('pause');
                self.seek_promise=undefined;
                throw err;
            });
//            self.setStatus('loading');
            self.setSuperCurrentTime(currentTime);
            if (abort_controller) abort_controller.signal.addEventListener('abort', function(){
                if (self.seek_promise) self.seek_promise_reject(self.abort_controller);
                self.seek_promise=undefined;
            });
            return self.seek_promise;
        }
        return new Promise(function(resolve, reject){resolve(abort_controller);});
    }
    setPlaybackRatePromise(speed){
        this.playbackRate = speed;
        return new Promise(function(resolve, reject){resolve();});
    }
    disconnectedCallback(){
        if (this.play_promise)  this.play_promise_reject();
        if (this.seek_promise)  this.seek_promise_reject();
        if (this.pause_promise) this.pause_promise_reject();
        if (this.load_promise)  this.load_promise_reject();
    }

    setSuperCurrentTime(time){
        if (isNaN(time))
            debugger;
        super.currentTime = time;
    }
    preparePlay(abort_controller){
        if (abort_controller && this.abort_controller!=abort_controller) {
            this.abort_controller.abort();
            this.abort_controller = abort_controller;
        }
        let self = this;
        if (this.pause_promise)
            this.pause_promise_reject();
        if (this.isEmpty()) setTimeout(function(){self.dispatchEvent(self.kv_event_ended);},0);
        if (this.isError()) setTimeout(function(){if (self.isError()) self.dispatchEvent(self.kv_event_error);},0);
        if (this.isEmpty() || this.isError())
            return new Promise(function(resolve, reject){reject();});
        if (this.isPlaying())
            return new Promise(function(resolve, reject){resolve();});
        if (this.play_promise) 
            return this.play_promise;
    }
    playPromise(abort_controller){
        this.setAttribute('autoplay','')
        let self = this;
        let p = this.preparePlay(abort_controller);
        if (p) return p;
        if (this.atEnd()){
            setTimeout(function(){self.dispatchEvent(self.kv_event_ended);},0);
            if (this.getAttribute('norepeat')!==null)
                return new Promise(function(resolve, reject){resolve(abort_controller);});
        }
        this.play_promise = new Promise(function(resolve, reject){
            self.play_promise_resolve = resolve;
            self.play_promise_reject = reject;
        }).then(function(abort_controller){
            self.setStatus('playing');
            self.play_promise=undefined;
            return abort_controller;
        },function(err){
            self.play_promise=undefined;
//            if (err instanceof AbortController) return err;
            throw err;
        });
        super.play();
        if (abort_controller) abort_controller.signal.addEventListener('abort', function(){
            if (self.play_promise) self.play_promise_reject(self.abort_controller);
            self.play_promise=undefined;
        });
        return this.play_promise;
    }
    superPause(){
        super.pause();
    }
    pausePromise(abort_controller){
        this.removeAttribute('autoplay')
        if (abort_controller && this.abort_controller!=abort_controller)
            this.abort(abort_controller);
        let self = this;
        if (self.play_promise) self.play_promise_reject(self.abort_controller);
        if (this.pause_promise) return this.pause_promise;
        if (!this.isPlaying())
            return new Promise(function(resolve, reject){resolve();});
        self.pause_promise = new Promise(function(resolve, reject){
            self.pause_promise_resolve = resolve;
            self.pause_promise_reject = reject;
        }).then(function(abort_controller){
            self.setStatus('pause');
            self.pause_promise=undefined;
            return abort_controller;
        },function(err){
            self.pause_promise=undefined;
            throw err;
        });
        super.pause();
        if (abort_controller) abort_controller.signal.addEventListener('abort', function(){
            if (self.pause_promise) self.pause_promise_reject(self.abort_controller);
            self.pause_promise=undefined;
        });
        return self.pause_promise;
    }
}

window.customElements.define('k-video', CKVideo, {extends: 'video'});

/* 2021, dev mail bigandrez@gmail.com, license type has not been selected yet */

class CKVideoReverse extends CKVideo{
    constructor() {
        super();
        this.reverse_event_ended = document.createEvent('Event');
        this.reverse_event_ended.initEvent('ended', true, true);
        this.reverse_event_playing= document.createEvent('Event');
        this.reverse_event_playing.initEvent('playing', true, true);
        this.reverse_event_pause= document.createEvent('Event');
        this.reverse_event_pause.initEvent('pause', true, true);
        this.speed=1;
    }

    get reverseFramerate(){
        const REVERSE_FRAME_RATE = 25; // 12 frame per second in reverse play
        let rf = this.getAttribute('reverse-frame-rate');
        rf = rf === null ? REVERSE_FRAME_RATE : parseInt(rf);
        if (rf<1) rf=1; if (rf>30) rf=30;
        return rf;
    }
    set playbackRate(rate){
        this.setPlaybackRatePromise(rate).catch(function(){});
    }
    get playbackRate(){
        return this.speed;
    }
    pause(abort_controller){
        this.removeAttribute('autoplay');
        return this.pauseWithReversePromise(abort_controller);
    }
    play(abort_controller){
        this.setAttribute('autoplay','');
        if (this.speed>=0)
            return super.play();
        let pr = this.preparePlay(abort_controller);
        if (pr) return pr;
        return this.playWithReversePromise(abort_controller);
    }
    isPlaying() {
        return this.play_reverse_timer || super.isPlaying();
    }
    setSourcePromise(src, utc_from_in_msec, duration_msec, full_load, thumbnail){
        if (this.play_reverse_timer) clearInterval(this.play_reverse_timer); this.play_reverse_timer = undefined;
        return super.setSourcePromise(src, utc_from_in_msec, duration_msec, full_load, thumbnail);
    }
    setPlaybackRatePromise(speed){
        let self = this;
        if (speed<0){
            let p = this.getAttribute('autoplay')!==null;
            self.speed = speed;
            self.setSuperPlaybackRate(-self.speed);
            let r = super.pause().then(function(abort_controller){
                if (self.getAttribute('autoplay')!==null && self.isPlayRequired() && !self.isPlaying() && !self.atStart())
                    return self.play(abort_controller);
                return new Promise(function(resolve, reject){resolve(abort_controller);});
            });
            if (p) this.setAttribute('autoplay','');
            return r;
        }
        if (this.speed<0 && this.isPlayRequired()){
            this.clearReverseTimer();
        }
        this.speed = speed;
        this.setSuperPlaybackRate(speed);
        return new Promise(function(resolve, reject){resolve();}).then(function(){
            if (!self.atEnd() && self.isPlayRequired() && !self.isPlaying()) return self.play();
        });
    }
    disconnectedCallback(){
        this.clearReverseTimer();
        super.disconnectedCallback();
    }

    clearReverseTimer(){
        if (this.play_reverse_timer) {
//console.log('Clear timer');
            clearTimeout(this.play_reverse_timer);
            this.play_reverse_timer = undefined;
        }
    }
    clearPlay(){
        if (this.pause_promise) this.pause_promise_resolve();
        if (this.play_promise) this.play_promise_reject(this.abort_controller);
        this.clearReverseTimer();
        this.setStatus('pause');
        this.dispatchEvent(this.reverse_event_ended);
    }
    playReverseTimer(){
        if (this.speed>=0 || !this.isPlayRequired() || this.play_reverse_timer) 
            return;
        if (super.isPlaying()) 
            super.superPause();

        this.play_reverse_timer = undefined;
        this.setStatus('playing');
        let self = this;
        let time_correct = new Date().getTime();
        let t = self.currentUtcTime - 1/self.reverseFramerate*(-self.speed)*1000;
        if (t<this.getFirstTime() && self.currentUtcTime==this.getFirstTime()){
            this.clearPlay();
            return;
        }
        if (t<this.getFirstTime()) t=this.getFirstTime();
        if (t>this.getLastTime()) t=this.getLastTime();
//console.log('Timer fired');
        return this.setTimePromise(t).catch(function(err){
//console.log('Set time fail');
        }).finally(function(){
//console.log('Set time ok');
            let time = parseInt(self.getAttribute('time')||0);
            if (t>=time) {
                if (!self.play_reverse_timer && self.isPlayRequired()) {
                    let c = new Date().getTime() - time_correct;
                    c = c > 1000/self.reverseFramerate-10 ? 1000/self.reverseFramerate-10 : c;
//console.log('Set timer '+(1000/self.reverseFramerate - c));
                    self.play_reverse_timer = setTimeout(function(){
                        self.play_reverse_timer=undefined;
                        self.playReverseTimer();
                    },1000/self.reverseFramerate - c);
                }
                if (!self.play_reverse_timer){
                    self.setStatus('pause');
                }
                if (self.pause_promise) self.pause_promise_reject();
                if (self.play_promise) self.play_promise_resolve(self.abort_controller);
                return;
            }
            self.clearPlay();
        });
    }
    setSuperPlaybackRate(rate){
        super.playbackRate = rate;
    }
    pauseWithReversePromise(abort_controller){
        if (abort_controller && this.abort_controller!=abort_controller)
            this.abort(abort_controller);
        this.clearReverseTimer();
        if (this.play_promise) this.play_promise_reject(this.abort_controller);
        if (this.speed>=0){
            if (!super.isPlaying())
                return new Promise(function(resolve, reject){resolve();});
            let p = this.getAttribute('autoplay')!=null;
            let r = super.pause(abort_controller);
            if (p) this.setAttribute('autoplay','');
            return r;
        } else
            this.dispatchEvent(this.reverse_event_pause);
        this.setStatus('pause');
        return new Promise(function(resolve, reject){resolve();});
    }
    playWithReversePromise(abort_controller){
        let self = this;
        if (this.atStart()){
            setTimeout(function(){self.dispatchEvent(self.reverse_event_ended);},0);
            if (this.getAttribute('norepeat')!==null)
                return new Promise(function(resolve, reject){resolve(abort_controller);});
            return this.toEnd(abort_controller).then(function(abort_controller){
                if (self.atStart()) return abort_controller;
                return self.playWithReversePromise(abort_controller);
            });
        }

        if (abort_controller && this.abort_controller!=abort_controller)
            this.abort(abort_controller);
        this.play_promise = new Promise(function(resolve, reject){
            self.play_promise_resolve = resolve;
            self.play_promise_reject = reject;
        }).then(function(){
            if (self.pause_promise) self.pause_promise_reject();
            self.dispatchEvent(self.reverse_event_playing);
            self.play_promise=undefined;
        },function(err){
            if (self.play_promise) self.play_promise_reject(self.abort_controller);
            if (self.pause_promise) self.pause_promise_resolve();
            self.clearReverseTimer();
            if (self.play_promise) self.play_promise_reject(self.abort_controller);
            self.setStatus('pause');
            self.play_promise=undefined;
//            if (err instanceof AbortController) return err;
            throw err;
        });
        self.playReverseTimer();
        return this.play_promise;
    }
}

window.customElements.define('k-video-reverse', CKVideoReverse, {extends: 'video'});
/* 2021, dev mail bigandrez@gmail.com, license type has not been selected yet */

class CKVideoSet extends HTMLElement{
    get LEFT_BUFFER_SIZE(){return this.options.left_prefetch || 3;};
    get RIGHT_BUFFER_SIZE(){return this.options.right_prefetch  || 3;};
    constructor() {
        super();
        this.event_timeupdate = new Event('timeupdate',{cancelable: false, bubbles: true});
        this.event_loadstart = new Event('loadstart',{cancelable: false, bubbles: true});
        this.options = this.getAttribute('options')===null ? {} : JSON.parse(this.getAttribute('options'));

        this.event_statusupdate = document.createEvent('Event');
        this.event_statusupdate.initEvent('statusupdate', true, true);
    }
    getRanges(from, to, interval){
        let ret = [];

        for(let srcelement of this.source_list_element.children) {
            let time = srcelement.getAttribute('time');
            let msec = srcelement.getAttribute('msec');
            if (time===null || msec===null) continue;
            time = parseInt(time);
            if (isNaN(time)) continue;
            msec = parseInt(msec);
            if (isNaN(msec)) continue;
            ret.push(time);
            ret.push(time+msec-1);
        }
        return ret;
    }
    sendTimeUpdate(){
        this.dispatchEvent(this.event_timeupdate);
    }
    // overload base functions
    get currentUtcTime(){
        return parseInt(this.getAttribute('playtime')||0);
//        return this.shadow.querySelector('[pos="0"]').currentUtcTime;
    }
    set currentUtcTime(time){
        if (this.shadow.querySelector('[pos="0"]').currentUtcTime == time) 
            return;
        this.setTimePromise(time).catch(function(){});
    }
    get playbackRate(){
        return this.speed;
    }
    set playbackRate(speed){
        this.setPlaybackRatePromise(speed).catch(function(){});
    }
    get volume(){
        return this.shadow.querySelector('[pos="0"]').volume;
    }
    set volume(volume){
        volume = volume > 1 ? 1 : (volume<0?0:volume);
        for (let i=-this.LEFT_BUFFER_SIZE; i<=this.RIGHT_BUFFER_SIZE; i++)
            this.shadow.querySelector('[pos="'+i+'"]').volume = volume;
    }
    isPlaying(){
        return this.getAttribute('autoplay')!==null;
    }
    get videoHeight(){
        return this.shadow.querySelector('[pos="0"]').videoHeight;
    }
    get videoWidth(){
        return this.shadow.querySelector('[pos="0"]').videoWidth;
    }
    play(){
        this.setAttribute('autoplay','');
//        this.removeAttribute('nodata');
        let player = this.shadow.querySelector('[pos="0"]');
//        this.setAttribute('playing','');
        if (0 && this.speed<0 && !player.isEmpty() && !player.isFull()){
            this.setStatus('seeking', this.speed<0);
//            this.setWait();
            let src = player.src; 
            let time = player.getFirstTime(); 
            let msec = parseInt(parseInt(player.getAttribute('duration')*1000) || player.getAttribute('msec') || 0);
            return player.updateState();
/*
            return player.setSourcePromise().then(function(abort_controller){
                return player.setSourcePromise(src, time, msec, true).then(function(abort_controller){
                    return player.updateState(abort_controller);
                });
            });
*/
        }

        if (player.isPlaying() || player.isWaiting()) 
            return new Promise(function(resolve, reject){resolve();});
        return player.play().catch(function(){});
    }
    pause(){
        this.removeAttribute('autoplay');
//        this.setStatus('pause');
        return this.shadow.querySelector('[pos="0"]').pause();
    }

    // debug info
    onDebugInfo(){
        return '';
    }
    connectedCallback() {
        let self = this;
        this.setStatus('nodata');
        if (this.innerText=='') this.innerHTML='';
        this.shadow = this.attachShadow({mode: 'open'});
        let video_tag = 'k-video-reverse';
        if (typeof CKVideoReverse==="undefined" || this.getAttribute('noreverse')!==null) {
            if (typeof CKVideo==="undefined"){
                console.error('No CKVideo or CKVideoReverse class - player disabled');
                return;
            }
            video_tag = 'k-video';
        }

        let pb = '<video preload norepeat is="'+video_tag+'" pos="0"></video>';
        for (let i=0; i<this.LEFT_BUFFER_SIZE; i++) pb = '<video preload norepeat is="'+video_tag+'" pos="-'+(i+1)+'"></video>' + pb;
        for (let i=0; i<this.RIGHT_BUFFER_SIZE; i++) pb += '<video preload norepeat is="'+video_tag+'" pos="'+(i+1)+'"></video>';
        this.shadow.innerHTML = '<style>'+this.getCss()+'</style>'+(this.getAttribute('debuginfo')!==null?'<div class="debuginfo"></div>':'')+'<div class="players">'+pb+'</div>';
        this.players_layer = this.shadow.querySelector('.players');
        this.debuginfo = this.shadow.querySelector('.debuginfo');
        if (typeof this.updateDebugInfo=="function") this.updateDebugInfo();

        function setSourceForTimePromise(utctime, to_left, accuracy){
            let it = this;
            let source_data = to_left===true ? self.getLastSrcBeforeTime(utctime+1) : self.getFirstSrcFromTime(utctime);
            if (accuracy && !to_left && source_data && source_data.time>utctime)
                source_data = self.getLastSrcBeforeTime(utctime);

            if (!source_data/* || (accuracy && (source_data.time>utctime || source_data.time+source_data.msec<utctime))*/) 
                return this.setSourcePromise();
            return this.setSourcePromise(source_data.src, source_data.time, source_data.msec, to_left /*&& self.isPlaying()*//*,utctime*/, source_data.tn).finally(function(){
                if (accuracy) return it.setTimePromise(utctime);
//                if (it.getAttribute('pos')==0 && it.isReadyForPlay())
//                    self.clearWait();
            });
        }
        function updateState(abort_controller){
//console.log('updateState');
            let it = this;
            if (!abort_controller) abort_controller = this.abort();

            if (this.getAttribute('pos')!=0){
                if (this.isError() || this.isEmpty())
                    return new Promise(function(resolve, reject){resolve(abort_controller);});
                if (parseInt(this.getAttribute('pos'))<0)
                    return this.toEnd().then(function(){
                        if (it.isPlaying())
                            return it.pause(abort_controller).catch(function(){});
                        return new Promise(function(resolve, reject){resolve(abort_controller);});
                    }).catch(function(e){});

                if (this.isPlaying())
                    return this.pause(abort_controller).catch(function(){});
                return new Promise(function(resolve, reject){resolve(abort_controller);}).then(function(){
                    if (self.getAttribute('autoplay')===null) return abort_controller;
                    let cp = self.shadow.querySelector('[pos="0"]');
                    if (!cp.isPlaying() && self.isPlaying() && (it.getAttribute('pos')==1 && self.speed>=0 || it.getAttribute('pos')==-1 && self.speed<0))
                        self.onPlayNextBlock();
                    return abort_controller;
                });
            }
            if (this.isError() || this.isEmpty()){
//                self.clearWait();
                self.setStatus('nodata');
                if (this.isError()) return new Promise(function(resolve, reject){reject();});
                return new Promise(function(resolve, reject){resolve();});
            }
            let playtime = parseInt(self.getAttribute('playtime')||0);
            if (self.getAttribute('autoplay')!=null){
                if (playtime<this.getFirstTime() || playtime>this.getLastTime()){
//                    self.clearWait();
                    self.setStatus('nodata');
                }else{
//                    self.setStatus('pause');
                }
            }

            return this.setTimePromise(playtime, abort_controller).then(function(abort_controller){
                return it.setPlaybackRatePromise(self.speed).then(function(){
                    if (it.getAttribute('pos')!=0)
                        return it.isPlaying() ? it.pause(abort_controller).catch(function(){}) : abort_controller;
//                    self.clearWait();
                    if (self.getAttribute('autoplay')===null && it.isReadyForPlay()){
                        let playtime = parseInt(self.getAttribute('playtime')||0);
                        if (playtime<it.getFirstTime() || playtime>it.getLastTime())
                            self.setStatus('nodata');
                        else
                            self.setStatus('pause');
                    }
                    if (self.getAttribute('autoplay')!==null && !it.isPlaying())
                        return it.play(abort_controller).catch(function(err){
                            if (err instanceof AbortController)
                                return err;
                            self.setStatus('nodata');
                        });
                    if (self.getAttribute('autoplay')===null && it.isPlaying())
                        return it.pause(abort_controller).catch(function(){});
                    return new Promise(function(resolve, reject){resolve(abort_controller);});
                });
            },function(err){
                if (it.getAttribute('pos')==0){
//                    self.clearWait();
                    self.setStatus('nodata');
                }
                throw err;
            });
        }
        function setTimeWithSourcePromise(utctime, to_left, accuracy, not_create_promise=false){
            let it = this;

            if (parseInt(it.getAttribute('pos'))!==0){
                let player = self.shadow.querySelector('[pos="0"]');
                clearTimeout(it.set_time_timer);
                if (not_create_promise!==true){
                    if (it.set_time_promise_reject) it.set_time_promise_reject(); 
                    it.set_time_promise_reject=undefined;
                    it.set_time_promise = undefined;
                }
                if (!player.isLoaded() || player.isSeeking()){
                    if (!it.set_time_promise)
                        it.set_time_promise = new Promise(function(resolve, reject){
                            it.set_time_promise_resolve = resolve; it.set_time_promise_reject = reject;
                        });
                    it.set_time_timer = setTimeout(function(){
                        it.setTimeWithSourcePromise(utctime, to_left, accuracy, true).then(function(e){
                            if (it.set_time_promise_resolve) it.set_time_promise_resolve(e);
                            it.set_time_promise = undefined;
                            it.set_time_promise_resolve = undefined;
                        },function(e){
                            if (it.set_time_promise_reject) it.set_time_promise_reject(e);
                            it.set_time_promise = undefined;
                            it.set_time_promise_reject = undefined;
                        });
                    },2000);
                    return it.set_time_promise;
                }
            }

            return this.setSourceForTimePromise(utctime, to_left, accuracy).then(function(abort_controller){
                return it.updateState(abort_controller);
            },function(abort_controller){
                if (abort_controller instanceof AbortController) throw abort_controller;
                return abort_controller;
            });
        }

        this.setListiners(this.shadow.querySelector('[pos="0"]'));

        for (let i = -this.LEFT_BUFFER_SIZE; i<=this.RIGHT_BUFFER_SIZE; i++){
            this.shadow.querySelector('[pos="'+i+'"]').addEventListener("error", function(e){
                self.dispatchEvent(new CustomEvent("error", {detail: { src: this} }));
            },{once:false});
            this.shadow.querySelector('[pos="'+i+'"]').addEventListener("loadedmetadata", function(event){
                self.dispatchEvent(new CustomEvent("loadedmetadata", {detail: { src: event.srcElement} }));
            },{once:false});
        }

        for (let s of this.shadow.querySelectorAll('video')) {
            s.setSourceForTimePromise = setSourceForTimePromise;
            s.setTimeWithSourcePromise = setTimeWithSourcePromise;
            s.updateState = updateState;
        }

        this.speed=1;
        this.setSourceListObserver(this);

        this.addEventListener("loadstart", function(){
            let player = self.shadow.querySelector('[pos="0"]');
            if (player && player.isEmpty())
                self.setStatus('loading');
        },{once:false});
        this.addEventListener("waiting", function(){
            self.setStatus('loading');
        },{once:false});

    }
    setWait2(deferred){
        let self = this;
        if (this.set_wait_timer) clearTimeout(this.set_wait_timer);
        if (!deferred){
            this.setAttribute('waiting','');
            return;
        }
        this.set_wait_timer = setTimeout(function(){
            self.setAttribute('waiting','');
        },200);
    }
    clearWait2(){
//console.trace();
        if (this.set_wait_timer) clearTimeout(this.set_wait_timer);
        delete this.set_wait_timer;
        this.removeAttribute('waiting');
    }
    setPlayTime(time){
if (time<0) debugger;
        this.setAttribute('playtime', time);
    }
    setListiners(player){
        let self = this;
        this.onTimeUpdateEvent = function(){
//            self.clearWait();
            if (!self.shadow || !this.isLoaded()) return;
            if (this.isPlaying() && this.playbackRate<0) self.setStatus('playing');
            const player = self.shadow.querySelector('[pos="0"]');
            if (!player) return;
            let time = player.currentUtcTime;
           if (time<=0) debugger;

            if (!isNaN(time)) {
                if (self.getAttribute('playtime')!=time){
                    self.prev_time = parseInt(self.getAttribute('playtime')||0);
                    self.setPlayTime(time);

                    let current_time = new Date().getTime();
                    if (!self.last_time_update || current_time - self.last_time_update >500){
                        setTimeout(function(){self.sendTimeUpdate();},0);
                        self.last_time_update = current_time;
                    }
                }
            }
        }
/*
        this.onSeeking= function(){
            self.setStatus('seeking', self.speed<0);
        }
        this.onSeekend= function(){
            self.setStatus(self.getAttribute('autoplay')!==null ? 'playing' : 'pause');
        }
*/
        this.onLoading = function(e){
            self.dispatchEvent(self.event_loadstart);
//console.log('onLoading');
//            self.setStatus('loading');
        }
        this.onPlayNextBlock = function(){
            self.setStatus('seeking',true);
            let player = self.shadow.querySelector('[pos="0"]');
            if (self.speed>=0){
                let lt = player.getLastTime();
                if (lt!==undefined) {
                    self.prev_time = parseInt(self.getAttribute('playtime')||0);
                    self.setPlayTime(lt+1);
                }
            } else {
                let lt = player.getFirstTime();
                if (lt!==undefined) {
                    self.prev_time = parseInt(self.getAttribute('playtime')||0);
                    self.setPlayTime(lt-1);
                }
            }

            if (/*player.isEmpty() && */!self.checkNextBlock()){
                self.updateCache();
                return;
            }
            player = self.shiftToNextBlock();
            if (player.isEmpty()){
                self.setStatus('nodata');
                self.updateCache();
                return;
            }
            if (!player.isError()){
                self.setPlayTime(self.speed>=0 ? player.getFirstTime() : player.getLastTime());
                if (!player.isLoaded()){
                    self.setStatus('loading',true);
                    return;
                }
                player.setTimeWithSourcePromise(self.speed>=0 ? player.getFirstTime() : player.getLastTime(),false,true).catch(function(){}).finally(function(){
                    self.updateCache();
                });
                return;
            } else
                self.setStatus('nodata');
            self.onPlayNextBlock();
        }
        this.onStatusUpdate = function(event){
            self.setStatus(event.status);
        }
        player.addEventListener("statusupdate", this.onStatusUpdate,{once:false});

//        player.addEventListener("seeking", this.onSeeking,{once:false});
//        player.addEventListener("seekend", this.onSeekend,{once:false});
        player.addEventListener("ended", this.onPlayNextBlock,{once:false});
        player.addEventListener("waiting", this.onLoading,{once:false});
        player.addEventListener("loadstart", this.onLoading,{once:false});
        player.addEventListener("timeupdate", this.onTimeUpdateEvent,{once:false});
    }
    setStatus(status, delay=false){
//console.log(status);
//console.trace();
        clearTimeout(this.status_timer);
        if (this.getAttribute('status')===status) return;
        let self = this;
        if (!delay){ 
            this.setAttribute('status',status);
            this.event_statusupdate.status = status;
            this.dispatchEvent(this.event_statusupdate);
            return;
        }
        this.status_timer = setTimeout(function(){
            self.status_timer = undefined;
            self.setAttribute('status',status);
            self.event_statusupdate.status = status;
            self.dispatchEvent(self.event_statusupdate);
        },50);
    }

    shiftToNextBlock(){
        if (this.speed>=0){
            let p = this.shadow.querySelector('[pos="-'+this.LEFT_BUFFER_SIZE+'"]');
            for (let i = -this.LEFT_BUFFER_SIZE+1; i<=this.RIGHT_BUFFER_SIZE; i++){
                let np = this.shadow.querySelector('[pos="'+i+'"]');
                this.swapPlayers(p,np);
                np.pause().catch(function(){});
            }
            p.setSourcePromise().catch(function(err){});
            return this.shadow.querySelector('[pos="0"]');
        }
        let p = this.shadow.querySelector('[pos="'+this.RIGHT_BUFFER_SIZE+'"]');
        for (let i = this.RIGHT_BUFFER_SIZE-1; i>=-this.LEFT_BUFFER_SIZE; i--){
            let np = this.shadow.querySelector('[pos="'+i+'"]');
            this.swapPlayers(p,np);
            np.pause().catch(function(){});
        }
        p.setSourcePromise().catch(function(err){});
        return this.shadow.querySelector('[pos="0"]');
    }
    removeListiners(player){
        player.removeEventListener("statusupdate", this.onStatusUpdate);

        player.removeEventListener("waiting", this.onLoading);
        player.removeEventListener("loadstart", this.onLoading);
//        player.removeEventListener("seeking", this.onSeeking);
//        player.removeEventListener("seekend", this.onSeekend);
        player.removeEventListener("ended", this.onPlayNextBlock);
        player.removeEventListener("error", this.onPlayNextBlock);
        player.removeEventListener("timeupdate", this.onTimeUpdateEvent);
        player.removeEventListener("loadedmetadata", this.onLoadedmetadata);
    }
    setSourceListObserver(v){
        let self = this;
        this.source_list_element = v;
        this.source_list_observer = new MutationObserver(function(mutations) {self.onSourceListChange(mutations);});
        this.source_list_observer.observe(v, {childList: true}); // attributes: true, characterData: true, subtree: true, attributeOldValue: true, characterDataOldValue: true,
    }
    onSourceListChange(mutations){
        this.updateCache();
    }
    setPlaybackRatePromise(speed){
        if ((typeof CKVideoReverse==="undefined" || this.getAttribute('noreverse')!==null) && speed<0) speed=0;
        let self = this;
        const player = this.shadow.querySelector('[pos="0"]');
        this.speed = speed;
        if (speed>=0) this.removeAttribute('reverseplay');
        else this.setAttribute('reverseplay','');
        return player.setPlaybackRatePromise(speed).finally(function(){
            if (parseInt(player.getAttribute('pos'))!==0) return;
            if (self.getAttribute('autoplay')!==null)
                return player.play().catch(function(){});
        }).catch(function(){});
    }

    setTimePromise(utctime){
//if (utctime===0) debugger;
        if (this.getAttribute('playtime')!==null && parseInt(this.getAttribute('playtime'))==utctime)
            return new Promise(function(resolve, reject){resolve();});
        this.shift_to_more = (this.last_time||0) <= utctime;
        this.last_time = utctime;
        let self = this;
        for (let i=-self.LEFT_BUFFER_SIZE; i<=self.RIGHT_BUFFER_SIZE; i++){
            if (i===0) continue;
            let p = this.shadow.querySelector('[pos="'+i+'"]');
            if (!p.isLoaded() || p.isSeeking()){
                p.setSourcePromise();
//                console.log('Player '+p.getAttribute('pos')+' set to empty');
            }
        }

        let player = this.shadow.querySelector('[pos="0"]');
        if (!player.isPlaying() && !player.isWaiting()){
            if (isNaN(utctime))
                debugger;
            this.prev_time = parseInt(this.getAttribute('playtime')||0);
            this.setPlayTime(utctime);
        }
        let source_data = this.speed<0 ? this.getLastSrcBeforeTime(utctime+1) : this.getFirstSrcFromTime(utctime);
        if (this.speed>=0 && source_data && source_data.time>utctime)
            source_data = this.getLastSrcBeforeTime(utctime);
        if (self.getAttribute('autoplay')===null && (!source_data || utctime<source_data.time || utctime>=source_data.time+source_data.msec)){
            this.setStatus('nodata');
        } else {
            let op = source_data&&source_data.src ? this.getPlayerWithSrc(source_data.src) : undefined;
            if (op && op!==player){
                this.swapPlayers(player,op);
                player = op;
            }
        }
        this.setStatus(this.getAttribute('autoplay')!==null ? 'playing' : 'pause');
        return player.setTimeWithSourcePromise(utctime, this.speed<0, true).catch(function(){}).then(function(){
            self.updateCache();
        }).catch(function(){});
    }
    getTime(){
        const player = this.shadow.querySelector('[pos="0"]');
        return player.currentUtcTime();
    }
    swapPlayers(v1, v2){
        let pos1 = parseInt(v1.getAttribute('pos'));
        let pos2 = parseInt(v2.getAttribute('pos'));
        if (pos1 == pos2 || v1==v2) return;
        if (pos1==0) this.removeListiners(v1);
        if (pos2==0) this.removeListiners(v2);

        v1.setAttribute('pos',pos2);
        v2.setAttribute('pos',pos1);

        if (pos1==0) this.setListiners(v2);
        if (pos2==0) this.setListiners(v1);
    }
    getPlayerWithSrc(src){
        if (!src) return;
        for (let i=-this.LEFT_BUFFER_SIZE; i<=this.RIGHT_BUFFER_SIZE; i++) {
            let p = this.shadow.querySelector('[pos="'+i+'"]');
            if (p.src==src)
                return p;
        }
    }
    getEmptyPlayer(){
        for (let i=-this.LEFT_BUFFER_SIZE; i<=this.RIGHT_BUFFER_SIZE; i++) {
            let p = this.shadow.querySelector('[pos="'+i+'"]');
            if (p.isEmpty())
                return p;
        }
    }
    invalidate(){
        let self = this;
        return this.pause().finally(function(){
            for (let i=-self.LEFT_BUFFER_SIZE; i<=self.RIGHT_BUFFER_SIZE; i++)
                self.shadow.querySelector('[pos="'+i+'"]').setSourcePromise().catch(function(){});
            self.setStatus('nodata');
            self.updateCache();
        }).catch(function(){});
    }
    updateCache(){
        let self = this;
        let player = this.shadow.querySelector('[pos="0"]');
        if (!player) return;
        let playtime = parseInt(this.getAttribute('playtime'));
        if (isNaN(playtime)){
            playtime = this.getLastTime();
            if (playtime!==undefined){
                this.setPlayTime(playtime);
                setTimeout(function(){self.sendTimeUpdate();},0);
            } else
                playtime = new Date().getTime();
            this.setAttribute('playtime',playtime);
        }

        let last_left = player.getFirstTime()!==undefined ? player.getFirstTime() : playtime;
        let last_right = player.getInitialLastTime()!==undefined ? player.getInitialLastTime()+1 : playtime; 
        let no_data_before, no_data_from;
        function tryToRight(onlymain){
            for (let i=0; i<=self.RIGHT_BUFFER_SIZE; i++) {
                if (i==0 && !player.isEmpty()) continue;
                if (onlymain && i>0) return;
                let p = self.shadow.querySelector('[pos="'+i+'"]');
                if (i!=0) p.pause().catch(function(){});
                let src = self.getFirstSrcFromTime(last_right);
                if (!src && (no_data_from===undefined || no_data_from>last_right)){
                    no_data_from = last_right;
                    self.setAttribute('reqfrom',no_data_from);
                } else
                if ((!p.src && !src) || (src && p.src == src.src)) {
                    if (src) last_right = src.time+src.msec;
                    continue;
                }
                if (src && i==0 && src.time>last_right){
                    continue;
                }
                let op = src ? self.getPlayerWithSrc(src.src) : undefined;
                if (op){
                    self.swapPlayers(p,op);
                    last_right = op.getInitialLastTime()+1;
                    op.setTimeWithSourcePromise(op.getFirstTime(),false,true).catch(function(){});
                    continue;
                }
                if (!src)
                    p.setSourcePromise().catch(function(){});
                else {
                    if (last_left>src.time-1) last_left=src.time-1;
                    p.setTimeWithSourcePromise(last_right,false).catch(function(){});
                    last_right = src.time+src.msec;
                }
            }
        }
        function tryToLeft(){
            for (let i = 0; i<=self.LEFT_BUFFER_SIZE; i++) {
                if (i==0 && !player.isEmpty()) continue;
                let p = self.shadow.querySelector('[pos="'+(i>0?'-':'')+i+'"]');
                p.pause().catch(function(){});
                let src = self.getLastSrcBeforeTime(last_left);
                if (!src && (no_data_before===undefined || no_data_before<last_left)){
                    no_data_before = last_left;
                    self.setAttribute('reqbefore',no_data_before);
                }
                if ((!p.src && !src) || (src && p.src == src.src)) {
                    if (src) last_left = src.time;
                    continue;
                }
                let op = src ? self.getPlayerWithSrc(src.src) : undefined;
                if (op){
                    self.swapPlayers(p,op);
                    last_left = op.getFirstTime();
                    op.setTimeWithSourcePromise(op.getFirstTime(),false,true).catch(function(){});
                    continue;
                }
                if (!src)
                    p.setSourcePromise().catch(function(){});
                else {
                    if (last_right<src.time+src.msec) last_right=src.time+src.msec;
                    p.setTimeWithSourcePromise(last_left-1,true).catch(function(){});
                    last_left = src.time;
                }
            }
        }
        if (this.prev_time < playtime){
            tryToRight(true);
            tryToLeft();
            tryToRight();
        } else {
            tryToRight();
            tryToLeft();
        }
        if (player.isEmpty() || player.isError() || player.isOutOfBound() || playtime<player.getFirstTime() || playtime>player.getLastTime())
            this.setStatus('nodata');
        else if (player.isPlaying())
            this.setStatus('playing');
        else
            this.setStatus('pause');

        if (no_data_before===undefined) this.removeAttribute('reqbefore');
        if (no_data_from===undefined) this.removeAttribute('reqfrom');
            this.onUpdateCache(no_data_before, no_data_from);
    }

    checkNextBlock(){
        if (this.speed>=0) return this.checkAfter();
        return this.checkBefore();
    }
    checkBefore(){
        let i = -this.LEFT_BUFFER_SIZE;
        for (; i<0; i++){
            let p = this.shadow.querySelector('[pos="'+i+'"]');
            if (!p.isEmpty()) break;
        }
        if (i==0) return false;
        return true;
    }
    checkAfter(){
        let i = 1;
        for (; i<=this.RIGHT_BUFFER_SIZE; i++){
            let p = this.shadow.querySelector('[pos="'+i+'"]');
            if (!p.isEmpty()) break;
        }
        if (i>this.RIGHT_BUFFER_SIZE) return false;
        return true;
    }
    getFirstSrcFromTime(from){
        let ret;
        for(let srcelement of this.source_list_element.children) {
            let time = srcelement.getAttribute('time');
            if (time!==null){
                time = parseInt(time);
                if (isNaN(time)) time=0;
            } else time=0;
            let msec = parseInt(srcelement.getAttribute('msec')) || 0;
            if (from<=time+msec-1 && (!ret || ret.time > time)){
                let src = srcelement.getAttribute('src');
                ret = {src:src,time:time,msec:msec};
            }
        }
        return ret;
    }
    getLastSrcBeforeTime(before){
        let ret;
        for(let srcelement of this.source_list_element.children) {
            let time = srcelement.getAttribute('time');
            let msec = srcelement.getAttribute('msec');
            let src = srcelement.getAttribute('src');
            if (time===null || msec===null || src===null) continue;
            time = parseInt(time);
            if (isNaN(time)) continue;
            msec = parseInt(msec);
            if (isNaN(msec)) continue;
            if (before>time && (!ret || ret.time < time)){
                let src = srcelement.getAttribute('src');
                ret = {src:src,time:time,msec:msec};
            }
        }
        return ret;
    }
    getLastTime(){
        let ret=0;
        for(let srcelement of this.source_list_element.children) {
            let time = srcelement.getAttribute('time');
            let msec = srcelement.getAttribute('msec');
            if (time===null || msec===null) continue;
            time = parseInt(time);
            if (isNaN(time)) continue;
            msec = parseInt(msec);
            if (isNaN(msec)) continue;
            if (ret<time+msec) ret=time+msec;
        }
        return ret;
    }
    disconnectedCallback(){
        this.removeListiners(this.shadow.querySelector('[pos="0"]'));
        this.shadow.innerHTML='';
//        delete this.event_timeupdate;
        delete this.event_beforenextblock;
        delete this.event_afternextblock;
    }
    onUpdateCache(no_data_before, no_data_from){
    }

    getCss() {
        return `
.players{width:100%;height:100%;position:relative;}
video{position:absolute;width:100%;height:100%;left:0;}
.cachetable{width:100%;height:1em;display:flex;}
.cachetable > div{text-align:center;background:lightgray;flex:1;border:1px solid darkslategray;height:1.2em;width:20px;overflow:hidden;font-size:9px;margin-left:-1px;cursor:pointer;}
.cachetable .center{border:1px solid white;position:relative;z-index:1000;}
.cachetable .error{background:#ff5050;}
.cachetable .ready{background:#50ff50;}
.cachetable .wait{background:#ffff50;}
video:not([pos="0"]),video:not([status]),video[status="error"]{visibility:hidden;}
.debuginfo{font-size:12px;position:absolute;background:#ffffffc0;padding:10px;z-index:10000;font-family:monospace;display:none;}
.cachetable > div:hover{border:1px solid blue;}
`;
    }
}

window.customElements.define('k-video-set', CKVideoSet);
/* 2021, dev mail bigandrez@gmail.com, license type has not been selected yet */

class CKVideoAsync extends CKVideoSet{
    get VIDEO_LIMIT(){return this.options.video_limit || 10;};
    constructor() {
        super();
        this.base_url = undefined;
        this.times = [];
        this.durations = [];
        this.urls = [];
        this.thumbnails = [];
        this.mean_duration = 60000;
        this.max_buffer_duration = 10*60*1000;
        this.options = this.getAttribute('options')===null ? {} : JSON.parse(this.getAttribute('options'));
    }
    onCacheUpdated(){
        this.innerHTML = this.innerHTML==''?' ':'';
    }
    invalidate(){
        this.times = [];
        this.durations = [];
        this.urls = [];
        this.thumbnails = [];
        delete this.no_data_before;
        delete this.no_data_from;
        return super.invalidate();
    }
    add(url, time, duration) {
//if (duration<-3000) debugger;
//if (time==0) debugger;
//console.log(new Date(time).toISOString()+' '+duration);
        let endtime = time+Math.abs(duration);
        let i=0;
        for (;i<this.times.length;i++){
            if (endtime <= this.times[i]) break;
            let et = this.times[i] + Math.abs(this.durations[i]);
            if (this.times[i]<=time && endtime<=et) return;
            if (time==et) continue;
            if (this.times[i]<=time && time<=et || this.times[i]<=endtime && endtime<=et) {
                if (duration>0 && endtime==this.times[i]) break;
                if (i===this.times.length-1 && duration>0 && time===this.times[i] && this.durations[i]<0){
                    this.durations[i] = duration;
                    this.urls[i] = url;
                    return;
                }
                if (duration>0){
                    console.warn('Invalid block detected - '+(new Date(time).toISOString()));
                    return;
                }
                this.times[i] = this.times[i]<time ? this.times[i] : time;
                this.durations[i] = - (et > endtime ? et - this.times[i] : endtime - this.times[i]);
                return;
            }
        }

        this.times.splice(i,0,time);
        this.durations.splice(i,0,duration);
        this.urls.splice(i,0, typeof this.compressUrl === 'function' ? this.compressUrl(url) : url);
        this.thumbnails.splice(i,0, '');

    }
    onThumbnailsReceived(times, urls){
        for (let i=0;i<times.length;i++){
            for (let j=0;j<this.times.length;j++){
                if (this.times[j]<=times[i] && this.times[j] + Math.abs(this.durations[j]) > times[i]){
                    this.thumbnails[j] = urls[i];
                    break;
                }
            }
        }
    }
    rangeRequest(from, to, interval){
        return {times:this.times,durations:this.durations};
    }

    getUrl(index){
        if (typeof this.decompressUrl !== 'function') return this.urls[index];
        return this.decompressUrl(this.urls[index]);
    }

    preLoadData(){
        let self = this;
        if (this.mean_duration>0) return false;
        if (this.mean_duration===0) return true;
        this.mean_duration = 0;
        this.preload_promise = this.onGetData(0,false,10).then(function(r){
            self.mean_duration = 0;let c=0;
            for (let i in r.objects){
                let d = (new Date(r.objects[i]['end']+'Z')).getTime() - (new Date(r.objects[i]['start']+'Z')).getTime();
                if (!isNaN(d) && d>5000) {self.mean_duration +=d;c++;}
            }
            if (c>0) self.mean_duration = parseInt(self.mean_duration / c);
            else {
                console.warn('No info for mean duration calculate. Set to 60 seconds');
                self.mean_duration = 60000;
            }
            if (r.objects.length){
                self.start_archive_time = (new Date(r.objects[0]['start']+'Z')).getTime();
//console.log('start_archive_time='+self.start_archive_time);
            }
            self.total_count = r.total_count;
//console.log('total_count='+self.total_count);
//console.log('mean_duration='+self.mean_duration);
            self.startLoader();
        }).catch(function(e){
            console.error('Failed get acrhive info');
            self.startLoader(5000);
            throw e;
        });
        return true;
    }
    startLoader(){
//        if (this.preLoadData()) return;
        if (this.load_data_promise) return this.load_data_promise;
        clearTimeout(this.loader_timer);
        let self = this;
        this.loader_timer = setTimeout(function(){
            self.loader_timer = undefined;
            try{self.loadData();} catch(e){}
        },50);
    }
    loadData(){
        if (this.load_data_promise) return this.load_data_promise;
        let self = this;
        if (this.no_data_before===undefined && this.no_data_from===undefined) return new Promise(function(resolve, reject){resolve();});
        if (this.no_data_from!==undefined && this.getFirstSrcFromTime(this.no_data_from,true)!==undefined) delete this.no_data_from;
        if (this.no_data_before!==undefined && this.getLastSrcBeforeTime(this.no_data_before,true)!==undefined) delete this.no_data_before;
        if (this.no_data_before===undefined && this.no_data_from===undefined) return new Promise(function(resolve, reject){resolve();});

        let reverse = !this.no_data_from;
        let no_data_before = this.no_data_before;
        if (reverse && this.no_data_before===undefined || !reverse && this.no_data_from===undefined) return;
        let req_time = reverse ? this.no_data_before: this.no_data_from;
        this.load_data_promise = this.onGetData(req_time,reverse,this.VIDEO_LIMIT).then(function(r){
            self.load_data_promise = undefined;
            let m=0; let c=0;
            for (let i in r.objects){
                let st = (new Date(r.objects[i]['start']+'Z')).getTime();
                let et = (new Date(r.objects[i]['end']+'Z')).getTime();
                if (isNaN(et) || isNaN(st)){
                    console.warn('Invalid time value for archive block');
                    continue;
                }
                let duration = et - st;
                if (duration<=0){
                    console.warn('Invalid duration for archive block');
                    continue;
                }
                if (duration>0) {m+=duration;c++;}
                if (!reverse && st-req_time>0)
                    self.add('', req_time, req_time - st);
                if (reverse && req_time-et>0)
                    self.add('', et, et - req_time);
                req_time = reverse ? st : et;
                self.add(r.objects[i]['url'], st, duration);
            }
            if (reverse && self.times.length>0 && r.objects.length!=self.VIDEO_LIMIT){
                self.add('', 0, -self.times[0]);
            }
            if (!r.objects.length && reverse)
                self.add('', 0, -req_time);
            if (c) self.mean_duration = parseInt(m/c);
            if (!reverse)
                delete self.no_data_from;
            else
                delete self.no_data_before;
            if (reverse){
                if (r.objects.length!=self.VIDEO_LIMIT)
                    if (self.times[0])
                        self.min_archive_time = self.times[0];
                    else
                        self.min_archive_time = no_data_before;
            }

            self.onCacheUpdated();
            if (reverse) self.no_data_before=undefined; else self.no_data_from=undefined;
            return self.loadData();
        }).catch(function(){
            self.load_data_promise = undefined;
        });
        return this.load_data_promise;
    }
    clearBufferIfNeed(time){
        if (this.durations.length) {
            let st = this.times[0];
            let et = this.times[this.times.length-1]+Math.abs(this.durations[this.durations.length-1]);
            if (time<st) st=time;
            if (time>et) et=time;
            if (et-st>this.max_buffer_duration){
                this.times = [];
                this.durations = [];
                this.urls = [];
                this.thumbnails = [];
            }
        } 
    }
    getFirstSrcFromTime(from, noload){
        let self = this;
//        this.clearBufferIfNeed(from);
        if (this.times.length && from < this.times[0]) {
            this.times = [];
            this.durations = [];
            this.urls = [];
            this.thumbnails = [];
        }

        if (!this.durations.length) {
            this.no_data_from = from;
            clearTimeout(this.start_loader_timer);
            this.start_loader_timer = setTimeout(function(){
                self.startLoader();
            },from==this.last_no_data_from ? 5000 : 0);
            this.last_no_data_from = from;
            return;
        }
        let i;
        for (i=0; i<this.times.length;i++)
            if (this.durations[i]>=0 && from < this.times[i] + Math.abs(this.durations[i]))
                return {time:this.times[i],msec:this.durations[i],src:this.getUrl(i),tn:this.thumbnails[i]};

        if (noload) return;
        if (this.durations.length) {
            if (i>this.durations.length-1) i=this.durations.length-1;
            this.no_data_from = this.times[i]+Math.abs(this.durations[i]);
        }

        if (this.no_data_from==this.last_no_data_from)
            delete this.no_data_from;
        clearTimeout(this.start_loader_timer);
        this.start_loader_timer = setTimeout(function(){
            if (!self.no_data_from) self.no_data_from = self.last_no_data_from;
            self.startLoader();
        }, from==this.last_no_data_from ? 5000 : 0 );
        this.last_no_data_from = from;
    }
    getLastSrcBeforeTime(before, noload){
        if (before<=0) debugger;
//        if (this.min_archive_time!==undefined && this.min_archive_time>before)
//            return;
        let self = this;
//        this.clearBufferIfNeed(before);
        if (this.times.length && before > this.times[this.times.length-1]+Math.abs(this.durations[this.durations.length-1])) {
            this.times = [];
            this.durations = [];
            this.urls = [];
            this.thumbnails = [];
        }

        if (!this.durations.length) {
            if (this.no_data_before===0) return;
            this.no_data_before = before;
            setTimeout(function(){
                self.startLoader();
            },0);
            return;
        }
        let i;
        for (i=this.times.length-1;i>=0;i--)
            if (this.times[i] < before){
                if (this.durations[i]>=0)
                    return {time:this.times[i],msec:this.durations[i],src:this.getUrl(i),tn:this.thumbnails[i]};
//                break;
            }
        if (noload || this.times.length>0 && this.times[0]==0) return;
        this.no_data_before = before;
if (this.no_data_before===0) debugger;

        if (this.durations.length) {
            if (i<0) i=0;
            this.no_data_before = this.times[i];
if (this.no_data_before===0) debugger;

        }
        clearTimeout(this.start_loader_timer2);
        this.start_loader_timer2 = setTimeout(function(){self.startLoader();},0);
    }
    getLastTime(){
        if (!this.durations.length) return;
        return this.times[this.times.length-1] + Math.abs(this.durations[this.durations.length-1]);
    }
    sendRangeUpdate(times,durations){
        let self = this;
        if (!this.kv_event_rangeupdate){
            this.kv_event_rangeupdate = document.createEvent('Event');
            this.kv_event_rangeupdate.initEvent('rangeupdate', true, true);
        }
        this.kv_event_rangeupdate.times = times;
        this.kv_event_rangeupdate.durations = durations;
        clearTimeout(this.rangeupdate_timer);
        this.rangeupdate_timer = setTimeout(function(){self.dispatchEvent(self.kv_event_rangeupdate);},10);
    }

    getRanges(from, to, interval){
        return {times:[],durations:[]};
    }
    compressUrl(url){
        return url;

/*
            let u = new URL(url);
            if (this.base_url===undefined) this.base_url = u;
            if (this.base_url.pathname !== u.pathname)
                r['pathname'] = u.pathname;
            for(let key of u.searchParams.keys()) {
                if (!key) continue;
                if (this.base_url.searchParams.get(key) !== u.searchParams.get(key))
                    r[key] = u.searchParams.get(key);
            }

*/    }
    decompressUrl(url){
        return url;
    }
    onGetData(time,reverse,limit){
        return [];
    }
    disconnectedCallback(){
        this.shadow.innerHTML='';
    }
}

//window.customElements.define('k-video-async', CKVideoAsync, {extends: 'video'});
/* 2021, dev mail bigandrez@gmail.com, license type has not been selected yet */

class CCloudCamera{
    constructor(access_key){
        this.access_key = access_key;
        try{
            this.token = JSON.parse(atob(access_key));
            this.auth_type = 'Acc';
        } catch(e){
            this.token = {};
        };
        if (!this.token.api) this.token.api = 'web.skyvr.videoexpertsgroup.com';
        if (!this.token.api_sp) this.token.api_sp = 443;
        if (!this.token.api_p) this.token.api_p = 80;
        this.abort_controllers = [];
    }
    getHeaders(){
        return {'Authorization': this.auth_type + ' ' + this.access_key};
    }
    getUrl(){
        let port = (location.protocol=='https:' || location.protocol=='file:') ? (this.token['api_sp'] ? ':' + this.token['api_sp'] : "") : (this.token['api_p'] ? ':' + this.token['api_p'] : "");
        let protocol = location.protocol=='file:'?'https:':location.protocol;
        return protocol+"//" + this.token.api + port;
    }
    getStorageRecords(time,reverse,limit){
        if (time<=0)
            return new Promise(function(resolve, reject){resolve({meta:{expire: "2000-08-06T11:30:54.668005",limit: limit,next: null,offset: 0,previous: null,total_count:0},objects:[]});})
        let path = '';
        if (reverse)  path += (path?'&':'?') + 'order_by=-time';
        path += (path?'&':'?') + (reverse?'end=':'start=') + (new Date(time+ (!reverse?1000:0))).toISOString().substr(0,19);
        path += (path?'&':'?') + 'limit='+(limit||50);

        let controller = new AbortController();
        this.abort_controllers.push(controller);
        let p = fetch(this.getUrl()+'/api/v4/storage/records/'+path,{signal:controller.signal, headers: this.getHeaders()}).then(function(r){
            for (let i in self.abort_controllers) if (self.abort_controllers[i]===controller){self.abort_controllers.splice(i,1); break;};
            if (r.status!==200) throw r;
            return r.json();
        },function(e){
            for (let i in self.abort_controllers) if (self.abort_controllers[i]===controller){delete self.abort_controllers[i]; break;};
            throw e;
        });

        p.abort = function(){
            controller.abort();
        }
        return p;
    }
    getStorageThumbnails(time,reverse,limit){
        if (time<=0)
            return new Promise(function(resolve, reject){resolve({meta:{expire: "2000-08-06T11:30:54.668005",limit: limit,next: null,offset: 0,previous: null,total_count:0},objects:[]});})
        let path = '';
        if (reverse)  path += (path?'&':'?') + 'order_by=-time';
        path += (path?'&':'?') + (reverse?'end=':'start=') + (new Date(time+ (!reverse?1000:0))).toISOString().substr(0,19);
        path += (path?'&':'?') + 'limit='+(limit||50);

        let controller = new AbortController();
        this.abort_controllers.push(controller);
        let p = fetch(this.getUrl()+'/api/v2/storage/thumbnails/'+path,{signal:controller.signal, headers: this.getHeaders()}).then(function(r){
            for (let i in self.abort_controllers) if (self.abort_controllers[i]===controller){self.abort_controllers.splice(i,1); break;};
            return r.json();
        },function(e){
            for (let i in self.abort_controllers) if (self.abort_controllers[i]===controller){delete self.abort_controllers[i]; break;};
            throw e;
        });

        p.abort = function(){
            controller.abort();
        }
        return p;
    }
    destroy(){
        for (let i in this.abort_controllers)
            this.abort_controllers[i].abort();
    }
}

class CKVgxVideo extends CKVideoAsync{
    get TIMELINE_LIMIT(){return this.options.timeline_limit || 1000;};
    constructor() {
        super();
        this.range_times = [];
        this.range_durations = [];
        this.options = this.getAttribute('options')===null ? {} : JSON.parse(this.getAttribute('options'));
/*
        this.addToRange(0, 1);
        this.addToRange(10, 10);
        this.addToRange(5, -10);
        this.addToRange(0, -1);
*/
    }
    connectedCallback() {
        super.connectedCallback();
        let self = this;
        this.addEventListener("error", function(e){
            if (e && e.detail && e.detail.src && e.detail.src.error && e.detail.src.error.code===4)
                self.invalidate();
        });

    }
    get src(){
        return this.camera.access_key;
    }
    set src(token){
        this.camera = new CCloudCamera(token);
        this.invalidate();
    }
    invalidate(){
        this.range_times = [];
        this.range_durations = [];
        return super.invalidate();
    }
    addToRange(time, duration){
        let block_before=-1;
        let block_after=-1;
        let i=0;
        for (;i<this.range_times.length;i++){
            if (this.range_times[i] <= time) block_before=i;
            if (this.range_times[i] < time + Math.abs(duration)) block_after=i;
            if (this.range_times[i] >= time + Math.abs(duration)) 
                break;
        }
        if (this.range_times.length>0 && i==this.range_times.length){
            if (this.range_times[i-1]+Math.abs(this.range_durations[i-1]) <= time) block_before=i;
            if (this.range_times[i-1]+Math.abs(this.range_durations[i-1]) <= time + Math.abs(duration)) block_after=i;
            if (block_before==i || block_after==i){
                this.range_times.push(time);
                this.range_durations.push(0);
            }
        }
        let width_before = block_before<0 ? 0 : time - this.range_times[block_before];
        let pause_before = 0;
        if (block_before>=0){ 
            if (width_before > Math.abs(this.range_durations[block_before])){
                pause_before = width_before - Math.abs(this.range_durations[block_before]);
                width_before = Math.abs(this.range_durations[block_before]);
            }
            if (this.range_durations[block_before]<0) width_before = -width_before;
        }
        let width_after = block_after<0 ? 0 : this.range_times[block_after] + Math.abs(this.range_durations[block_after]) - time - Math.abs(duration);
        if (width_after<0) width_after=0;
        if (block_after>=0 && this.range_durations[block_after]<0) width_after = -width_after;

        if (block_after>=0){
            this.range_times.splice(block_before>=0?block_before:0,block_after + 1 - (block_before>0?block_before:0));
            this.range_durations.splice(block_before>=0?block_before:0,block_after + 1 - (block_before>0?block_before:0));
        }

        if (width_after!==0){
            this.range_times.splice(block_before>=0?block_before:0, 0, time + Math.abs(duration));
            this.range_durations.splice(block_before>=0?block_before:0, 0, width_after);
        }

        this.range_times.splice(block_before>=0?block_before:0, 0, time);
        this.range_durations.splice(block_before>=0?block_before:0, 0, duration);

        if (width_before!==0){
            this.range_times.splice(block_before>=0?block_before:0, 0, time - Math.abs(width_before) - pause_before);
            this.range_durations.splice(block_before>=0?block_before:0, 0, width_before);
        }

        for (i=this.range_times.length-2;i>=0;i--){
            if (this.range_durations[i+1]>=0 && this.range_durations[i]<0) continue;
            if (this.range_durations[i]>=0 && this.range_durations[i+1]<0) continue;
            if (this.range_times[i] + Math.abs(this.range_durations[i]) < this.range_times[i+1]) continue;
            let l = this.range_times[i+1] + Math.abs(this.range_durations[i+1]) - this.range_times[i];
            this.range_durations.splice(i, 2, this.range_durations[i+1]<0 ? -l : l);
            this.range_times.splice(i, 2, this.range_times[i]);
        }


        return;


// Сделать чтобы вновь добавляемый диапазон от нуля удалял уже имеющиеся блоки
/*
        let i=0;
        for (;i<this.range_times.length;i++){
            if (this.range_times[i] + Math.abs(this.range_durations[i]) <= time) continue;
            if (this.range_times[i]<=time && time < this.range_times[i] + Math.abs(this.range_durations[i])) return;
            if (this.range_times[i]<=time + Math.abs(duration)-1 && time + Math.abs(duration)-1 < this.range_times[i] + Math.abs(this.range_durations[i])) return;
            if (this.range_times[i]<=time && time + Math.abs(duration) <= this.range_times[i] + Math.abs(this.range_durations[i])) return;
            break;
        }
        if (i>0 && time == this.range_times[i-1] + Math.abs(this.range_durations[i-1]) && (this.range_durations[i-1]>=0 && duration>=0 || this.range_durations[i-1]<0 && duration<0)){
            this.range_durations[i-1] += duration;
            if (this.range_times[0]+Math.abs(this.range_durations[0]) > this.range_times[1]) {debugger; this.addToRange(time,duration);}
            return;
        }
        if (i!==this.range_times.length && this.range_times[i]==time+Math.abs(duration) && (this.range_durations[i]>=0 && duration>=0 || this.range_durations[i]<0 && duration<0)){
            this.range_durations[i] += duration;
            this.range_times[i] -= Math.abs(duration);
            if (this.range_times[0]+Math.abs(this.range_durations[0]) > this.range_times[1]) {debugger; this.addToRange(time,duration);}
            return;
        }
        this.range_times.splice(i,0,time);
        this.range_durations.splice(i,0,duration);
        if (this.range_times[0]+Math.abs(this.range_durations[0]) > this.range_times[1]) {debugger; this.addToRange(time,duration);}
*/
    }
    rangeRequest(from, to, interval){
        this.updateRange(from, to);
        return {times:this.range_times,durations:this.range_durations};
    }
    updateRange(from, to){
        if (isNaN(from) || isNaN(to)) return;
        if (!this.range_times.length) return;
        if (to > new Date().getTime()-10000) {
            to = new Date().getTime()-10000;
        }
        let self = this;
        this.range_from = from;
        this.range_to = to;
        if (this.get_range_promise) return;
        clearTimeout(this.update_range_timer);
        this.update_range_timer = setTimeout(function(){
            if (self.archive_right_time !==undefined && self.range_to>self.archive_right_time) self.range_to=self.archive_right_time;
            if (self.archive_left_time !==undefined && self.range_from<self.archive_left_time) self.range_from=self.archive_left_time;
            let last = self.range_to - 1;
            if (self.range_times.length>0 && last<self.range_times[0]) last = self.range_times[0];
            for (let i=self.range_times.length-1;i>=0;i--){
                if (self.range_times[i]>last) continue;
                if (self.range_times[i]+Math.abs(self.range_durations[i])<self.range_from) return;
                if (last < self.range_times[i]+Math.abs(self.range_durations[i])){
                    last = self.range_times[i]-1;
                    if (last<0) return;
                    continue;
                }
                if (i+1!==self.range_times.length){
                    last = self.range_times[i+1]-1;
                }
                break;
            }
            self.get_range_promise = self.onGetData(last+10000,true,self.TIMELINE_LIMIT,true).finally(function(){
                self.get_range_promise = undefined;
            }).catch(function(){});
        },50);
    }

    updateThumbnails(time,reverse,limit){
        if (this.getAttribute('thumbnails')===null) return;
        let self = this;
        this.camera.getStorageThumbnails(time,reverse,limit).then(function(r){
            if (!r || !r.objects || !r.objects.length || typeof self.onThumbnailsReceived !== 'function') return;
            let times=[]; let urls=[];
            for (let i=0;i<r.objects.length;i++){
                times.push((new Date(r.objects[i]['time']+'Z')).getTime());
                urls.push(r.objects[i]['url']);
            }
            self.onThumbnailsReceived(times,urls);
        },function(){});
    }
    onGetData(time,reverse,limit,no_thumbnails){
        if (this.getAttribute('status')==='invalidtoken') return new Promise(function(resolve, reject){setTimeout(function(){reject();},0);});
        let self = this;
        let reqtime = parseInt(time);
        let prevattr = this.getAttribute('status');
        if (prevattr!=='playing')
            this.setStatus('loading');

        return this.camera.getStorageRecords(time,reverse,limit).then(function(r){
            if (!no_thumbnails) self.updateThumbnails(time,reverse,limit);
            let last_time = reqtime; let first_time = reqtime;
            let first_data=false;
            if (reverse && !r.objects.length && self.times.length>0 && self.times[0]>0){
                self.addToRange(0, -self.times[0]);
                first_data = true;
            }
            for (let i in r.objects){
                let st = (new Date(r.objects[i]['start']+'Z')).getTime();
                let et = (new Date(r.objects[i]['end']+'Z')).getTime();
                if (isNaN(et) || isNaN(st)){
                    console.warn('Invalid time value for archive block');
                    continue;
                }
                let duration = et - st;
                if (duration<=0){
                    console.warn('Invalid duration for archive block');
                    continue;
                }
                if (i>0){
                    if (st>last_time)
                        self.addToRange(last_time, -st+last_time);
                    if (et<first_time)
                        self.addToRange(et, -first_time + et);
                } else if (st>reqtime){
                    self.addToRange(reqtime, reqtime-st);
                }
                self.addToRange(st, duration);
                first_time = st;
                last_time = st + duration;
            }
            if (r.objects.length>0 && r.objects.length!==limit){
                if (reverse) {
                    let t = (new Date(r.objects[r.objects.length-1]['start']+'Z')).getTime();
//                    if (self.archive_left_time===undefined){
                        self.addToRange(0, -t);
//                    }
                    self.archive_left_time = t;
                }
                else self.archive_right_time = (new Date(r.objects[r.objects.length-1]['end']+'Z')).getTime();
            }
            if (reverse && !r.objects.length){
//                debugger;
                self.addToRange(0, -reqtime);
            }
            if (r.objects.length==0 && !reverse && self.archive_right_time==undefined){
                self.archive_right_time = reqtime;
            }
            if (reverse && Math.abs(reqtime-new Date().getTime())<100000 && r.objects.length>0){
                self.archive_right_time = (new Date(r.objects[0]['end']+'Z')).getTime();
            }

            if (first_data || r.objects.length && self.range_times.length)
                self.sendRangeUpdate(self.range_times,self.range_durations);
            return {objects:r.objects, limit:r.meta.limit, total_count:r.meta.total_count};
        },function(r){
            if (r && r.status || r instanceof TypeError){
                self.removeAttribute('autoplay');
                return self.invalidate().then(function(){
                    self.setStatus('invalidtoken');
                    throw r;
                });
            }
            throw r;
        });
    }
/*
    setSource(token_or_lkey, channel_id){
        this.token_or_lkey = token_or_lkey;
        this.channel_id = channel_id;
        return this.invalidate();
    }
*/
    disconnectedCallback(){
        this.camera.destroy();
        this.shadow.innerHTML='';
    }
}

window.customElements.define('k-video-vxg', CKVgxVideo);


/* 2021, dev mail bigandrez@gmail.com, license type has not been selected yet */

class CKPlayer extends HTMLElement {
    static get observedAttributes() {
        return ['src','time','msec']; 
    }
    sendTimeUpdate(){
        this.dispatchEvent(this.kp_event_timeupdate);
    }
    constructor() {
        super();
        this.kp_event_timeupdate = new Event('timeupdate',{cancelable: false, bubbles: true});
        this.controls = [];
    }
    connectedCallback() {
        let self = this;
        this.style.position='relative';
        this.style.overflow='hidden';
        this.style.userSelect='none';
        this.style['-moz-user-select']='none';
        this.style['-webkit-user-select']='none';
        this.style['-ms-user-select']='none';

        this.shadow = this.attachShadow({mode: 'open'});
        let player_tag = this.getAttribute('videomodule')!==null ? this.getAttribute('videomodule') : 'k-video-vxg';
        let tag = player_tag == 'k-video' || player_tag == 'k-video-reverse' ? 'video' : player_tag;
        let controls = 'k-control-play k-control-timeinfo k-control-timepicker k-control-speed';
        if (this.getAttribute('controls')!==null) controls=this.getAttribute('controls');
        let controls_html='';let top_html='';
        controls = controls.split(' ');
        for (let i = 0; i<controls.length; i++){
            let el = window.customElements.get(controls[i]);
            if (!el) continue;
            el = new el();
            if (!(el instanceof CKControl)) {
                console.warn(controls[i]+' is not instance of CKControl')
                continue;
            }
            let type = el.getType();
            if (type=='top')
                top_html += '<'+controls[i]+'></'+controls[i]+'>';
            else
                controls_html += '<div class="'+type+'"><'+controls[i]+'></'+controls[i]+'></div>';
            el = undefined;
        }
        let options = this.getAttribute('options')===null ? '' : " options='"+this.getAttribute('options')+"'";

        let playtime = isNaN(parseInt(this.getAttribute('playtime'))) ? '' : ' playtime="'+parseInt(this.getAttribute('playtime'))+'"';
        this.shadow.innerHTML = '<style>'+CKPlayer.css+'</style>'+'<'+tag+(tag=='video'?' is="'+player_tag+'"':'')
            +(this.getAttribute('debuginfo')!==null?' debuginfo':'')
            +(this.getAttribute('autoplay')!==null?' autoplay':'')
            +(this.getAttribute('thumbnails')!==null?' thumbnails':'')
            +playtime+options+' class="player"></'+tag+'><div class="over"><div class="top">'
            +top_html+'</div><div class="bottom">'+controls_html+'</div></div>';
        this.player = this.shadow.querySelector('.player');
        if (!(this.player instanceof CKVideoAsync) && typeof this.player.setSourceListObserver === 'function'){
            this.player.setSourceListObserver(this);
            this.innerHTML+=' ';
        }
        this.over = this.shadow.querySelector('.over');
        this.shadow.querySelectorAll('.bottom > div > *, .top > *').forEach(function(el){
            if (typeof el.setPlayer !== 'function') return;
            self.controls.push(el);
            el.setPlayer(self);
        });
        if (playtime)
            setTimeout(function(){self.sendTimeUpdate();},0);
        this.player.addEventListener("timeupdate", function(event){
            if (self.player.getAttribute('playtime')===null) return;
            if (!self.player.isPlaying() && !self.new_src) return;
            delete self.new_src;
            self.sendTimeUpdate();
        },{once:false});
        this.player.addEventListener("statusupdate", function(event){
            self.setAttribute('status',event.status);
        },{once:false});
        this.player.addEventListener("loadedmetadata", function(event){
            let w = !event ? 0 : (event.target && event.target.videoWidth ? event.target.videoWidth : (event.detail&&event.detail.src&&event.detail.src.videoWidth?event.detail.src.videoWidth:0));
            let h = !event ? 0 : (event.target && event.target.videoHeight ? event.target.videoHeight : (event.detail&&event.detail.src&&event.detail.src.videoHeight?event.detail.src.videoHeight:0));
            if (self.getAttribute('autoprop')===null || !w || !h) return;
            self.media_width = w;
            self.media_height = h;
            if (self.clientWidth)
                self.style.height = ''+(self.clientWidth * h / w )+'px';
        },{once:false});
        window.addEventListener("resize", function() {
            if (self.getAttribute('autoprop')===null || !self.media_width || !self.media_height) return;
            self.style.height = ''+(self.clientWidth * self.media_height / self.media_width )+'px';
        });
    }
    disconnectedCallback(){
        this.player.pause().catch(function(){});
        this.shadow.innerHTML='';
    }
    get currentUtcTime(){
        return this.player.currentUtcTime;
    }
    set currentUtcTime(time){
        this.player.currentUtcTime = time;
    }
    get playbackRate(){
        return this.player.speed;
    }
    set playbackRate(speed){
        this.player.setPlaybackRatePromise(speed).catch(function(){});
    }
    get volume(){
        return this.player.volume;
    }
    set volume(volume){
        this.player.volume = volume;
    }

    play(){
        let self = this;
        return this.player.play().then(function(){
            self.controls.forEach(function(el){
                if (typeof el.onPlay === 'function') el.onPlay();
            });
        }).catch(function(){});
    }
    pause(){
        let self = this;
        return this.player.pause().catch(function(){}).finally(function(){
            self.controls.forEach(function(el){
                if (typeof el.onPause === 'function') el.onPause();
            });
        });
    }
    isPlaying(){return this.player.isPlaying();}

    attributeChangedCallback(name, oldValue, newValue) {
        let self=this;
        if (name==='src') setTimeout(function(){
            self.new_src = true; 
            self.player.src = newValue;
            if (self.getAttribute('autoplay')!==null)
                self.play();
        },0);
        if (name==='time') setTimeout(function(){self.player.setAttribute('time',newValue);},0);
        if (name==='msec') setTimeout(function(){self.player.setAttribute('msec',newValue);},0);
    }
    static get css() {
        return `
.player{width:100%;height:100%;}
.over{position:absolute;left:0;right:0;top:0;bottom:0;display:flex;flex-direction:column;}
.top{flex:100;position:relative;}
.bottom{background:#0004;flex:1;min-height:40px;display:flex;flex-direction:row;}
.bottom > div{background:#00000080;}
.bottom .min{flex:1;min-width:40px;max-width:40px;}
.bottom .double{flex:1;min-width:80px;min-width:80px;}
.bottom .full{flex:100;}
k-timeline-picker{display:block;width:100%;height:100%;background:#00000080;color:white;font-family:monospace;font-size:15px;}
.player[status]:before {font-size:40px;color:black;z-index:10000;display:block;background:#fffb;padding:10px 20px;position:absolute;right:0;}
.player[status="loading"]:before {content:"loading";}
.player[status="seeking"]:before {content:"seeking";}
.player[status="playing"]:before {content:"playing";}
.player[status="error"]:before {content:"error";}
.player[status="pause"]:before {content:"pause";}
.player[status="invalidtoken"]:before {content:"invalid token";}
.player[status="nodata"]:before {content:"nodata";}
`;
    }
}

window.customElements.define('k-player', CKPlayer);/* 2021, dev mail bigandrez@gmail.com, license type has not been selected yet */

function CKAddVideoDebug(){
    let self = this;
    if (typeof CKVideoSet==="undefined"){
        setTimeout(function(){
            CKAddVideoDebug();
        },10);
        return;
    }

    CKVideoSet.prototype.updateDebugInfo = function(){
        clearTimeout(this.update_debug_info_timer);this.update_debug_info_timer=undefined;
        let self = this;
        if (!this.debuginfo) return;
        let status = 'pause';
        if (this.getAttribute('playing')!==null) status = 'play';
        if (this.getAttribute('waiting')!==null) status = 'wait';
        let playtime = parseInt(this.getAttribute('playtime'));
        if (!isNaN(playtime)) playtime = new Date(parseInt(this.getAttribute('playtime'))).toISOString().replace('T','&nbsp;'); else playtime='';
        let sel_cache='';
        let cache_table='<div class="cachetable">';
        for (let i = -this.LEFT_BUFFER_SIZE; i<=this.RIGHT_BUFFER_SIZE; i++){
            let np = this.shadow.querySelector('[pos="'+i+'"]');
            if (!np){
                this.update_debug_info_timer = setTimeout(function(){self.updateDebugInfo();},300);
                return;
            }

            let loaded = np.getAttribute('loaded'); let style='';
            let text = '';
            if (loaded){
                loaded = parseInt(loaded);
                style = ' style="background: linear-gradient(to right, #50FF50 0%,#50FF50 '+loaded+'%, #FFFF50 '+loaded+'%,#FFFF50 100%);"';
                text = ''+loaded+'%';
            }
            if (np.getAttribute('fullload')!==null){
                style = ' style="background: #40b040;"';
            }
            if (loaded=="100"){
                let l1 = parseInt(np.getAttribute('msec'));
                let l2 = parseFloat(np.getAttribute('duration'));
                if (!isNaN(l1) && !isNaN(l2)){
                    text = (parseInt(l2*1000-l1))/1000;
                    if (text>0) text = '+'+text;
                }
            }
            if (np.getAttribute('seeking')!==null) text='&hArr;';
            cache_table += '<div id="'+i+'" class="block ' + (np.isError()?' error':(np.isReadyForPlay()?' ready':((np.isEmpty() || np.isError())?'':' wait'))) + (i==0?' center':'') + '"' + style + '>'+text+'</div>';
            if (i==self.selected_cache){
                let l=0,d='';
                if (np.getFirstTime()){
                    l = (np.getInitialLastTime() - np.getFirstTime() + 1)/1000;
                    d = new Date(np.getFirstTime()).toISOString().replace('T','&nbsp;');
                }
                l = isNaN(l) ? 'undefined' : l.toFixed(3);
                let l2 = np.getAttribute('duration')!==null ? ''+parseFloat(np.getAttribute('duration')).toFixed(3) : 'undefined';
                let f = np.isEmpty() ? 'empty' : (np.getAttribute('fullload')!==null ? 'fully loaded' : (np.isError() ? 'error' : (np.getAttribute('loaded')=='100'?'simply loaded':'loading')));
                sel_cache = '<div>[.player'+self.selected_cache+']&nbsp;'+f;
                if (!np.isEmpty()) sel_cache+='<br/>len/dur: '+l+'&nbsp;/&nbsp;'+l2+'&nbsp;sec<br/>&nbsp;&nbsp;&nbsp;Time: '+d+'</div>';
            }
        }
        cache_table+='</div>';

        let req_before = this.getAttribute('reqbefore'); if (req_before===null) req_before='no need'; else req_before = new Date(parseInt(req_before)).toISOString().replace('T','&nbsp;');
        let req_from = this.getAttribute('reqfrom'); if (req_from===null) req_from='no need'; else req_from = new Date(parseInt(req_from)).toISOString().replace('T','&nbsp;');

        let di = this.onDebugInfo();
        this.debuginfo.innerHTML = `
            Status/speed: <span>`+status+` / `+this.speed+`</span><br/>
            &nbsp;Mean block duration: <span>`+this.mean_duration+` ms</span><br/>
            &nbsp;&nbsp;Time: <span>`+playtime+`</span><br/>
            Before: <span>`+req_before+`</span><br/>
            &nbsp;After: <span>`+req_from+`</span><br/>
            `+cache_table+ sel_cache + di;
        let z = this.debuginfo.getElementsByClassName('cachetable')[0].children;
        for (let i=0; i<z.length;i++){
            z[i].addEventListener('click',function(){
                self.selected_cache = this.getAttribute('id');
            });
        }
        this.debuginfo.style.display="block";
        this.update_debug_info_timer = setTimeout(function(){self.updateDebugInfo();},300);
    }
}
CKAddVideoDebug();