class CTimeLinePicker extends HTMLElement {
    static get observedAttributes() {
        return ['scale','centerutctime','selectedutctime']; 
    }
    constructor() {
        super();
    }
    connectedCallback() {
        let self = this;
        $(this).bind('mousewheel', function(e){
            if (e.originalEvent.wheelDeltaX==0 && e.originalEvent.pageX - $(self).offset().left < $(self).width()/2){
                let scale = $(self).attr('scale');
                scale = scale===undefined ? self.default_scale : (scale);
                if(e.originalEvent.wheelDelta /120 > 0) {
                    scale = (scale/1.5);
                    let req_frames = $(self).attr('frames') || 1;
                    if (req_frames>1 && self.req_frames*frames <= 1/scale)
                        scale = 1 / self.min_frame_width / req_frames;
                    if (req_frames<=1 && 1/scale > self.min_hoursec_width)
                        scale = 1 / self.min_hoursec_width;
                }
                else{
                    let new_scale = (scale*1.5);
                    if (self.min_year_width <= 60*60*24*365*1000 / new_scale)
                        scale = new_scale;
                }
                $(self).attr('scale',scale>1?scale:1);
                return false;
            } else {
                let new_time = parseInt($(self).attr('centerutctime')) + this.one_shift_time*e.originalEvent.wheelDelta/120;
                $(self).attr('centerutctime',new_time);
                return false;
            }
        });

        let handleMouseUp = function(event){
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousemove', handleMouseMove);
            delete self.down_mouse_posx, self.down_mouse_time;
        };
        let handleMouseMove = function(event){
            let scale = parseFloat($(self).attr('scale'));
            let pixel_shift = event.pageX - self.down_mouse_posx;
            let new_time = parseInt(self.down_mouse_time - pixel_shift*scale);
            $(self).attr('centerutctime',new_time);
        };
        this.addEventListener('mousedown', function(event){
            self.down_mouse_posx = event.pageX;
            self.down_mouse_time = parseInt($(self).attr('centerutctime'));
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('mousemove', handleMouseMove);
            return event.preventDefault ? event.preventDefault() : event.returnValue = false;
        })

        $( window ).resize(function() {
            self.update();
        });

        this.min_year_width = this.textWidth('0000');
        this.min_months_width = this.textWidth('M');
        this.min_year_month_width = this.textWidth('2020 M')+2;
        this.min_day_width = this.textWidth('00')*1.5;
        this.min_day_hour_width = this.textWidth('22 Feb 2020')+2;
        this.min_hour_width = this.textWidth('00:00');
        this.min_hoursec_width = this.textWidth('00:00:00');
        this.min_frame_width = this.textWidth('00')+2;
        this.min_sec_frame_width = this.textWidth('22 Feb 2020, 00:00:000')+2;
        this.center_shift_px = 0;

        this.default_scale = 60*60*24*365/(this.min_year_width*1);

        this.style.display="block";
        this.shadow = this.attachShadow({mode: 'open'});
        this.shadow.innerHTML = CTimeLinePicker.css;
//        $(this).css('position','relative').css('overflow','hidden');
        this.shadow.innerHTML += '<div class="body"><div class="centerpos"></div><div class="twrap"><table><tr><td>123</td></tr><tr></tr></table></div></div>';
        this.table = $(this.shadow).find('table');
        this.line1 = $(this.shadow).find('table tr:first-child');
        this.line2 = $(this.shadow).find('table tr:last-child');
        if ($(this).attr('scale')===undefined || $(this).attr('centerutctime')===undefined){
            if ($(this).attr('scale')===undefined)
                $(this).attr('scale', this.default_scale); // 50 pixels per year
            if ($(this).attr('centerutctime')===undefined)
                $(this).attr('centerutctime', (Date.now()));
        }
        else
            this.attributeChangedCallback();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        let self = this;
        if (!this.table) return;
        if (name=='centerutctime'){
            let shift_time = parseInt(oldValue) - parseInt(newValue);
            let scale = $(self).attr('scale');
            if (this.down_mouse_posx!==undefined)
                self.update();
            else
                this.moveAnimate(parseInt(shift_time / scale));
            return;
        }
        if (name=='scale'){
            this.scaleAnimate(parseFloat(oldValue));
            return;
        }
        this.update();
    }
    scaleAnimate(oldscale){
        let self = this;
        let scale = parseFloat($(this).attr('scale'));
        scale = oldscale/scale;

        if (this.scale_timer) return;
        this.scale_timer = setTimeout(function(){
            $(self.table).css('bottom', 1).animate({bottom: scale},{
                step: function(now,fx) {
                    $(self.table).parent().css('transform','scaleX('+now+')');  
                },
                duration: 100,
                easing: "linear",
                done: function() {
                    $(self.table).parent().css('transform', 'scaleX(1)');
                    self.update();
                    delete self.scale_timer;
                }
            });
        },0);
    }
    moveAnimate(animate_move_pixels){
        let self = this;
        this.last_move_pixels = animate_move_pixels + (this.last_move_pixels!==undefined?this.last_move_pixels:0);
        if (this.animate_move_pixels!==undefined) 
            return;
        this.animate_move_pixels = this.last_move_pixels;
        delete self.last_move_pixels;
        return this.table.animate({
            left: "+="+this.animate_move_pixels,
        }, 100, function() {
            if (self.last_move_pixels!==undefined){
                delete self.animate_move_pixels;
                setTimeout(function(){
                    self.moveAnimate(0);
                },0);
                return;
            }
            delete self.animate_move_pixels;
            self.table.css('left',0);
            self.update();
        });
    }
    divider(val,arr){
        for (let i=0; i<arr.length; i++)
            if (val>arr[i]) return arr[i];
        return val;
    }
    static get RANGES(){
        return;
    }
    update(){
        let self = this;
        if (!this.table) return;
        let screen_width = $(this).width();
//        if (this.update_timer) clearTimeout(this.update_timer);
//        if (!screen_width) {this.update_timer = setTimeout(function(){delete self.update_timer;self.update();},500);return;}

        const scale = parseFloat($(this).attr('scale'));
        const MAX_PIXELS_PER_YEAR = parseInt(60*60*24*365*1000 / scale);
        const MAX_PIXELS_PER_MONTH = parseInt(60*60*24*31*1000 / scale);
        const PIXELS_PER_DAY = 60*60*24*1000 / scale;
        const PIXELS_PER_HOUR = 60*60*1000 / scale;
        const PIXELS_PER_MINUTE = 60*1000 / scale;
        const PIXELS_PER_SECOND = 1000 / scale;

        this.one_shift_time = 1000;

        this.center_shift_px = - (this.table.width()-$(this).width())/2;
        // Seconds per pixel
        let centerutctime = parseInt($(this).attr('centerutctime')) || Date.now();
//console.log(new Date(centerutctime).toISOString());
        if (centerutctime===undefined || scale===undefined) return;
        let selectedutctime = $(this).attr('selectedutctime');
//        centerutctime = parseInt(centerutctime*1000)/1000;
//        console.log('centerutctime: '+new Date(centerutctime*1000).toISOString());


        let left_time = centerutctime - scale*screen_width*3/2;

//        console.log('left_time: '+new Date(left_time*1000).toISOString());
        let right_time = centerutctime + scale*screen_width*3/2;
//        console.log('right_time: '+new Date(right_time*1000).toISOString());


        // as "only years" mode
        let only_years_mode = this.min_months_width >= MAX_PIXELS_PER_MONTH;
        let seconds_frame_mode = this.min_sec_frame_width < PIXELS_PER_SECOND;
        let day_seconds_mode = seconds_frame_mode ? false : this.min_hoursec_width < PIXELS_PER_HOUR/2;
        let day_hour_mode = seconds_frame_mode||day_seconds_mode ? false : this.min_day_hour_width <= PIXELS_PER_DAY;
        let months_day_mode = seconds_frame_mode||day_hour_mode||day_seconds_mode ? false : this.min_year_month_width < MAX_PIXELS_PER_MONTH;
        let year_months_mode = seconds_frame_mode||months_day_mode||day_hour_mode||day_seconds_mode ? false : (this.min_months_width < MAX_PIXELS_PER_MONTH);

        let left_year_time = this.roundYearDown(left_time);
        let right_year_time = this.roundYearUp(right_time);

        let left_month_time = this.roundMonthDown(left_time);
        let right_month_time = this.roundMonthUp(right_time);

        let left_day_time = this.roundDayDown(left_time);
        let right_day_time = this.roundDayUp(right_time);

        let left_hour_time = this.roundHourDown(left_time);
        let right_hour_time = this.roundHourUp(right_time);

        let left_second_time = this.roundSecondDown(left_time);
        let right_second_time = this.roundSecondUp(right_time);

        let line1 = '', line2='';
        let start_year = (new Date(left_year_time+this.getOffset())).getFullYear();
        let end_year = (new Date(right_year_time+this.getOffset())).getFullYear();
        if (only_years_mode || year_months_mode){
            let prev_pos = 0, sum_milli_seconds=0;
            for (let i= start_year; i<end_year;i++){
                sum_milli_seconds+=this.getYearSeconds(i);
                let next_pos = sum_milli_seconds/scale;
                let ys = Math.round(next_pos - prev_pos);
                line1 += '<td style="min-width:'+ys+'px;max-width:'+ys+'px"'+(only_years_mode?' rowspan=2':'')+(year_months_mode?' colspan=12':'')+'><div>'+i+'</div></td>';
                prev_pos += ys;
            }
            this.center_shift_px = - (centerutctime - left_year_time)/scale + $(this).width()/2;
            this.one_shift_time = 60*60*24*365*1000/4;
        }
        let months_names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
//            let months_names = ['January','February','March','April','May','June','Jule','August','September','October','November','December'];
        if (year_months_mode){
            let prev_pos=0,month_seconds_sum=0;
            for (let i= start_year; i<end_year;i++){
                for (let j= 0; j<12; j++){
                    month_seconds_sum += this.getMonthSeconds(i,j);
                    let next_pos = month_seconds_sum/scale;
                    let ms = Math.round(next_pos - prev_pos);
                    line2 += '<td style="min-width:'+ms+'px;max-width:'+ms+'px";"><div>'+months_names[j]+'</div></td>';
                    prev_pos += ms;
                }
            }
            this.center_shift_px = - (centerutctime - left_year_time)/scale + $(this).width()/2;
            this.one_shift_time = 60*60*24*30*1000;
        }
        if (months_day_mode){
            let month_divider = this.divider(MAX_PIXELS_PER_MONTH / this.min_day_width, [10,6,4,3,2,1]);

            let b = new Date(left_month_time);
            let e = new Date(right_month_time);
            let start_month = 12 * b.getFullYear() + b.getMonth();
            let end_month = 12 * e.getFullYear() + e.getMonth();
            let prev_month_pos=0, day_sum=0;
            for (let month=start_month; month < end_month; month++){
                let y = parseInt(month/12);
                let m = month%12;
                let dim = this.getDaysInMonth(y,m);
                day_sum+=dim;

                let next_month_pos = PIXELS_PER_DAY * day_sum;
                let month_width = Math.round(next_month_pos-prev_month_pos);

                let mw = PIXELS_PER_DAY * dim;
                let md = parseInt(mw / this.min_day_width) < dim ? parseInt(mw / this.min_day_width) : dim;
                line1 += '<td colspan='+md+' style="width:'+month_width+'px;min-width:'+month_width+'px;max-width:'+month_width+'px";"><div>'+months_names[m]+' '+y+'</div></td>';
                let days_step = dim / md;
                let day_pos=0,prev_pos=0;
                let day=1 - days_step;
                for (let step=0;step<md;step++){
                    day += days_step;
                    day_pos = PIXELS_PER_DAY*parseInt(day-1+days_step);
                    let dw = (day_pos) - prev_pos;
                    let style = ' style="width:'+(dw).toFixed(0)+'px;min-width:'+(dw).toFixed(0)+'px;max-width:'+(dw).toFixed(0)+'px;"';
                    if (mw<dw+this.min_day_width) 
                        style='';
                    line2 += '<td'+style+'><div>'+parseInt(day)+'</div></td>';
                    mw -= dw;
                    prev_pos += dw;
                }
                prev_month_pos += month_width;
            }
            this.center_shift_px = - (centerutctime - left_month_time)/scale + $(this).width()/2;
            this.one_shift_time = 60*60*24*1000;
        }
        if (day_hour_mode){
            let day_divider = this.divider(PIXELS_PER_DAY / this.min_hour_width, [24,12,8,6,4,3,2,1]);

            line1 = line2 = '';
            let prev_pos=0;
            for (let utcday = left_day_time; utcday < right_day_time; utcday+=60*60*24*1000){
                let date = new Date(utcday+this.getOffset());
                let day = date.getDate();
                let month = date.getMonth();
                let year = date.getFullYear();
                let next_pos = ((utcday - left_day_time)/(60*60*24*1000)+1) * PIXELS_PER_DAY;
                let full_width = Math.round(next_pos - prev_pos);
                line1 += '<td colspan='+day_divider+' style="width:'+(full_width)+'px;min-width:'+(full_width)+'px;max-width:'+(full_width)+'px";"><div>'+day+' '+months_names[month]+' '+year+'</div></td>';
                for (let hour = 0; hour<24; hour+= 24 / day_divider){
                    line2 += '<td>&nbsp;<div>'+hour+':00</div></td>';
                }
                prev_pos += full_width;
            }
            this.center_shift_px = - (centerutctime - left_day_time)/scale + $(this).width()/2;
            this.one_shift_time = parseInt(60*60*24*1000/day_divider);
        }
        if (day_seconds_mode){

            let day_width = 60*60*24*1000 / scale;
            let hour_divider = this.divider(day_width / this.min_hoursec_width / 24,[60*60,60*30,60*20,60*15,60*12,60*10,60*6,60*5,60*4,60*3,60*2,60,30,20,15,12,10,6,5,4,3,2,1]);

            let left_sec_time = parseInt(left_time / (60*60*1000/hour_divider)) * (60*60*1000/hour_divider);
            let r = parseInt(right_time / (60*60*1000/hour_divider)) * (60*60*1000/hour_divider) + 60*60*1000/hour_divider;
            let right_sec_time = r == right_time + 60*60*1000/hour_divider ?  right_time : r;

            let border_mode = (new Date(left_hour_time+this.getOffset())).getDate() != (new Date(right_hour_time+this.getOffset())).getDate();
            let seconds_before_border = left_day_time + 60*60*24*1000 - left_hour_time;
            let full_width = parseInt((right_sec_time - left_sec_time) / scale);
            let cols_count = parseInt((right_sec_time - left_sec_time) / (60*60*1000/hour_divider));
            let cols_count_before = parseInt(seconds_before_border / (60*60*1000/hour_divider));
            let col_width = 60*60*1000/hour_divider / scale;

            let ldate = new Date(left_sec_time+this.getOffset());
            let rdate = new Date(right_sec_time+this.getOffset());
            let style = '';//'width:'+(full_width)+'px;min-width:'+(full_width)+'px;max-width:'+(full_width)+'px;';
            let style_first = 'text-align:right;'//width:'+parseInt(seconds_before_border/scale)+'px;min-width:'+parseInt(seconds_before_border/scale)+'px;max-width:'+parseInt(seconds_before_border/scale)+'px;';
            let t = parseInt((right_sec_time - left_sec_time - seconds_before_border)/scale);
            let style_last = 'text-align:left;'//width:'+(t)+'px;min-width:'+(t)+'px;max-width:'+(t)+'px;';
            if (!border_mode)
                line1 = '<td colspan='+cols_count+' style="'+style+'"><div style="text-align:center;">'+ldate.getDate()+' '+months_names[ldate.getMonth()]+' '+ldate.getFullYear()+'</div></td>';
            else
                line1 = '<td colspan='+cols_count_before+' style="'+style_first+'"><div>'+ldate.getDate()+' '+months_names[ldate.getMonth()]+' '+ldate.getFullYear()+'</div></td>'+
                '<td colspan='+(cols_count-cols_count_before)+' style="'+style_last+'"><div>'+rdate.getDate()+' '+months_names[rdate.getMonth()]+' '+rdate.getFullYear()+'</div></td>';
            let has_seconds = false;
            let prev_pos=0;
            for (let utc = left_sec_time; utc < right_sec_time; utc += 60*60*1000/hour_divider){
                let next_pos = ((utc - left_sec_time + 60*60*1000/hour_divider)/(60*60*1000)) * PIXELS_PER_HOUR;
                let hw = Math.round(next_pos - prev_pos);
                let d = new Date(utc); d = new Date(utc+this.getOffset());
                if (!has_seconds) has_seconds = d.getSeconds()>0;
                let datetext = d.getHours();
                if (col_width > this.min_hour_width) datetext += ':'+(d.getMinutes()<10?'0':'')+d.getMinutes();
                if (has_seconds) datetext += '<sup>:'+(d.getSeconds()<10?'0':'')+d.getSeconds()+'</sup>';
                line2 += '<td style="width:'+hw+'px;min-width:'+hw+'px;max-width:'+hw+'px;">&nbsp;<div>'+datetext+'</div></td>';
                prev_pos += hw;
            }
            this.center_shift_px = - (centerutctime - left_sec_time)/scale + $(this).width()/2;
            this.one_shift_time = parseInt(60*60*1000/hour_divider);
        }
        if (seconds_frame_mode){

            let req_frames = $(this).attr('frames') || 1;
            let max_frames = parseInt(PIXELS_PER_SECOND / this.min_frame_width);
            let frame_divider;
            for (frame_divider = max_frames; frame_divider>1; frame_divider--)
                if (!(req_frames % frame_divider)) break;

            let prev_pos=0;
            for (let utctime = left_second_time; utctime<right_second_time; utctime+=1000){
                let date = new Date(utctime+this.getOffset()); 
                let day = date.getDate();
                let month = date.getMonth();
                let year = date.getFullYear();
                let time = date.toLocaleTimeString();
                let next_pos = PIXELS_PER_SECOND*(utctime-left_second_time+1000)/1000;
                let ws = parseInt(next_pos - prev_pos);
                let style = 'width:'+parseInt(ws)+'px;min-width:'+parseInt(ws)+'px;max-width:'+parseInt(ws)+'px";';
                if (parseInt(left_second_time/1000+1)==parseInt(right_second_time/1000)) style+='text-align:center;';
                line1 += '<td colspan='+frame_divider+' style="'+style+'"><div>'+time + ', ' + day+' '+months_names[month]+' '+year+'</div></td>';
                for (let frame = 0; frame < req_frames; frame += req_frames / frame_divider){
                    line2 += '<td>&nbsp;<div>'+frame+'</div></td>';
                }
                prev_pos += ws;
            }
            this.center_shift_px = - (centerutctime - left_second_time)/scale + $(this).width()/2;
            this.one_shift_time = parseInt(1000/frame_divider);
        }
        this.line1.html(line1);
        this.line2.html(line2);
        this.table.css('margin-left',''+parseInt(this.center_shift_px)+'px');
        $(this).change();
    }
    getOffset(){
        if ($(this).attr('utc')!==undefined) return (new Date()).getTimezoneOffset()*60*1000;
        return 0;
    }
    getOffset2(){
        if ($(this).attr('utc')===undefined) return (new Date()).getTimezoneOffset()*60*1000;
        return 0;
    }
    roundYear(utctime){
        let d = new Date(utctime+this.getOffset());
        if (d.getMonth()>=6)
            return Date.UTC(d.getFullYear()+1, 0, 1, 0, 0, 0);
        return Date.UTC((new Date(utctime+this.getOffset())).getFullYear(), 0, 1, 0, 0, 0);
    }
    roundYearDown(utctime){
        return Date.UTC((new Date(utctime+this.getOffset())).getFullYear(), 0, 1, 0, 0, 0);
    }
    roundYearUp(utctime){
        return Date.UTC((new Date(utctime+this.getOffset())).getFullYear()+1, 0, 1, 0, 0, 0);
    }
    roundMonthDown(utctime){
        let d = new Date(utctime+this.getOffset());
        return Date.UTC(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
    }
    roundMonthUp(utctime){
        let d = new Date(utctime+this.getOffset());
        return Date.UTC(d.getFullYear(), d.getMonth()+1, 1, 0, 0, 0);
    }
    roundDayDown(utctime){
        let d = new Date(utctime+this.getOffset());
        return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).getTime() - this.getOffset();
    }
    roundDayUp(utctime){
        let d = new Date(utctime+this.getOffset());
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()+1, 0, 0, 0).getTime() - this.getOffset();
    }
    roundHourDown(utctime){
        let d = new Date(utctime);
        return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), 0, 0);
    }
    roundHourUp(utctime){
        let d = new Date(utctime);
        return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()+1, 0, 0);
    }
    roundSecondDown(utctime){
        return parseInt(utctime/1000)*1000;
    }
    roundSecondUp(utctime){
        return parseInt(Math.ceil(utctime/1000))*1000;
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
    dateDiff(a, b) {
        let utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate(), a.getHours(), a.getMinutes(), a.getSeconds());
        let utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate(), b.getHours(), b.getMinutes(), b.getSeconds());
        return Math.floor((utc2 - utc1) );
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
        el = document.body.appendChild(el);
        let w = el.offsetWidth;
        el.parentNode.removeChild(el);
        return w;
    }
    static get css() {
        return `<style>
table{border-spacing: 0px;position: absolute;height: 100%;min-height: 3em;color:inherit;}
table tr td{padding: 0;}
table tr:first-child td{box-shadow: 1px 0px 0px gray;vertical-align:middle;height: 1em;}
table tr:first-child td:first-child > div{text-align:right;}
table tr:first-child td:last-child > div{text-align:left;}
table tr:first-child td > div{padding: 3px 3px;text-align:center;height: 1em;overflow:hidden;word-break: break-all;}
table tr:last-child td > div{height: 1.2em;word-break: break-all;overflow: hidden;width: 100%;position: absolute;text-align: center;top: 6px;left: -50%;}
table tr:last-child td{height: 1em;text-align:right;vertical-align: middle;position: relative;}
table tr:last-child td.year{border-left:1px solid gray;border-top:2px solid gray;}
table tr:last-child td:not(.year){border-top: 2px solid gray;}
table tr:last-child td:not(.year):after{margin-left: 0px;content: '';width: 0px;height: 5px;border-left: 1px solid;position: absolute;top: 0;border-left-color: inherit;}
table tr:last-child td.odd{background-color:#80808040;}
table td sup{vertical-align: baseline;}
.centerpos{width:41px;background:none;background: linear-gradient(90deg, #0000, #f888 40%,#f888 45%, #f88f 49%,#0000 50%, #f88f 51%, #f888 55%, #f888 60%, #0000);height:100%;position:absolute;left:calc(50% - 20px);top:0;z-index: 10;}
.centerpos div{margin:0 auto;width:1px;height:100%;background:red;}
*{-moz-user-select: none;-webkit-user-select: none;-ms-user-select: none;user-select: none;}
.body{position: relative;overflow: hidden;width: 100%;height: 100%;}
.twrap{position: relative;overflow: hidden;width: 100%;height: 100%;}

</style>`;
    }

}

window.customElements.define('time-line-picker', CTimeLinePicker);
