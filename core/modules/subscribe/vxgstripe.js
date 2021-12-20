window.vxgstripe = window.vxgstripe || {
    vxgstripe_url: 'http://192.168.100.9:18096/'
};

window.vxgstripe.invalidate = function(){
    if (window.vxgstripe.user_info)
        delete window.vxgstripe.user_info;
}

window.vxgstripe.getUserInfo = function(firebase_user_token){
/*
    if (window.vxgstripe.user_info){
        return new Promise(function(resolve, reject){setTimeout(function(){resolve(window.vxgstripe.user_info);}, 0);});
    }
*/
    return $.ajax({
        type: 'GET',
        url: window.vxgstripe.vxgstripe_url+'/api/v1/getinfo/',
        contentType: "application/json",
        cache: true,
        headers: {'Token': firebase_user_token}
    }).then(function(r){
        r = JSON.parse(r);
        window.vxgstripe.user_info = r;
        return r;
    });
}

window.vxgstripe.setTaxInfo = function(firebase_user_token, country, state, postalzip){
    let token = firebase_user_token;
    return $.ajax({
        type: 'POST',
        url: window.vxgstripe.vxgstripe_url+'/api/v1/settaxinfo/',
        contentType: "application/json",
        headers: {'Token': firebase_user_token},
        data: JSON.stringify({country:country, state:state, postalzip:postalzip})
    }).then(function(){
        vxgstripe.invalidate();
        return vxgstripe.getUserInfo(token);
    });
}

window.vxgstripe.getTaxRate = function(firebase_user_token, amount){
    let token = firebase_user_token;
    return $.ajax({
        type: 'POST',
        url: window.vxgstripe.vxgstripe_url+'/api/v1/gettaxrate/',
        contentType: "application/json",
        headers: {'Token': firebase_user_token},
        data: JSON.stringify({amount:amount})
    });
}

window.vxgstripe.getPk = function(firebase_user_token){
    let token = firebase_user_token;
    return $.ajax({
        type: 'GET',
        url: window.vxgstripe.vxgstripe_url+'/api/v1/getpk/',
        cache: true,
        contentType: "application/json",
        headers: {'Token': firebase_user_token}
    });
}

window.vxgstripe.setCard = function(firebase_user_token, stripe_card_token){
    return $.ajax({
        type: 'POST',
        url: window.vxgstripe.vxgstripe_url+'/api/v1/setcard/',
        contentType: "application/json",
        headers: {'Token': firebase_user_token},
        data: JSON.stringify({cardtoken:stripe_card_token})
    });
}

window.vxgstripe.setPlan = function(firebase_user_token, stripe_plan_id, quantity){
    return $.ajax({
        type: 'POST',
        url: window.vxgstripe.vxgstripe_url+'/api/v1/setplan/',
        contentType: "application/json",
        headers: {'Token': firebase_user_token},
        data: JSON.stringify({stripe_plan_id:stripe_plan_id, quantity: quantity})
    });
}

window.vxgstripe.unsubscribeAll = function(firebase_user_token){
    return $.ajax({
        type: 'POST',
        url: window.vxgstripe.vxgstripe_url+'/api/v1/unsubscribeall/',
        contentType: "application/json",
        headers: {'Token': firebase_user_token}
    });
}
