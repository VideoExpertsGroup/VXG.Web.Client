window.screens = window.screens || {};

window.screens['bottomline'] = {
    'on_ready':function(){
        let t = '<div style="padding-bottom: 20px;text-align: center;"><a target="_blank" href="https://www.videoexpertsgroup.com/legal-docs/Privacy_Statement.html">Privacy Policy</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a target="_blank" href="https://www.videoexpertsgroup.com/legal-docs/EULA.html">Term of Use</a></div><div style="color:#808080;text-align:center;line-height: 14px;padding-bottom: 15px;">(c) 2017-2022,<br/>VXG Inc. All right reserved.</div>';
        if (window.skin && window.skin.bottom_line) t = window.skin.bottom_line;
        core.elements['global-menu-footer'].append('<div class="bottomline" style="line-height: 7px;font-size: 10px;;color: black;text-align: right;padding: 7px 7px;">'+t+'</div>');
    }
};
