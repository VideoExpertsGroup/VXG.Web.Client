const VXGHeatmapModel = function (
    accessToken, startTime, endTime, origin, maxAmountThumbnailsAnalysis,
    fuzz, radius, peak, threshold, debug,
) {
    this.accessToken = accessToken;
    if (!startTime || !endTime) {
        this.startTime = new Date();
        this.startTime.setHours(this.startTime.getHours() - 1);
        this.startTime = this.startTime.toISOString();
        this.endTime = (new Date()).toISOString();
    } else {
        this.startTime = (new Date(startTime)).toISOString();
        this.endTime = (new Date(endTime)).toISOString();
    }
    // note: Server API support date without 'Z' so we manually remove 'Z'
    this.startTime = this.startTime.replace('Z', '');
    this.endTime = this.endTime.replace('Z', '');

    this.maxAmountThumbnailsAnalysis = maxAmountThumbnailsAnalysis || 20;
    this.log = debug ? console.log : function () {};

    // configuration heatmap
    this.origin = origin || 'generated_from_live';
    this.fuzz = fuzz || 0.1;
    this.radius = radius || 5;
    this.peak = peak || 60;
    this.threshold = threshold || 200;

    // internal usage
    this._weights = new Map();
    this._heatmap = new Map();
    this._template = null;
    this._affectedList = new Map();
};

VXGHeatmapModel.prototype.getBaseURLFromToken = function (access_token) {
    let at;
    const default_host = 'web.skyvr.videoexpertsgroup.com';

    try {
        at = JSON.parse(atob(access_token));
    } catch (e) {
        return null;
    }

    const url = "https://" + (at['api'] ? at['api'] : default_host);
    return url + (at['api_p'] ? ':' + at['api_p'] : "");
};

VXGHeatmapModel.prototype.getThumbnailUrls = function () {
    return $.ajax({
        type: 'GET',
        url: this._baseurl + '/api/v4/storage/images/?order_by=time',
        headers: {'Authorization': 'Acc ' + this.accessToken},
        contentType: "application/json",
        data: {
            'start': this.startTime,
            'end': this.endTime,
            'limit': 1000,
            'origin': this.origin,
        }
    })
}

VXGHeatmapModel.prototype.getThumbnail = function (url) {
    let d = $.Deferred();
    let image = new Image();
    let result = {};

    image.onload = function () {
        let canvas = document.createElement('canvas');
        canvas.width = result.width = image.width;
        canvas.height = result.height = image.height;

        let ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);

        result.data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        result.canvas = canvas;
        d.resolve(result);
    }
    image.crossOrigin = 'anonymous';
    image.src = url;
    return d.promise();
}

VXGHeatmapModel.prototype.prepareData = function () {
    this._baseurl = this.getBaseURLFromToken(this.accessToken);
    this._preparingResult = $.Deferred();
    if (this._baseurl == null) {
        this._preparingResult.reject("can't parse access token");
        return this._preparingResult.promise();
    }
    this._affectedList = new Map();

    let self = this;
    let t0 = performance.now(), t1;
    this.getThumbnailUrls().then(function (ret) {
        let t = Math.floor(ret['objects'].length / self.maxAmountThumbnailsAnalysis);
        let urls = ret['objects']
            .map((th) => th['url'])
            .filter((_, i) => i % t === 0);
        return Promise.all(urls.map(self.getThumbnail));
    }).then(function (images) {
        t1 = performance.now();
        self.log("Network requests stage took " + (t1 - t0) + " milliseconds.");

        if (images.length === 0) {
            self._preparingResult.reject("there is no image");
            return;
        }
        self._template = images[0];

        for (let i = 0; i < self.radius; i++) {
            for (let j = (i !== 0); j < self.radius; j++) {
                if (i * i + j * j >= self.radius * self.radius) continue;
                let dist = 1 - ((i * i + j * j) / (self.radius * self.radius));

                if (!self._affectedList.get(dist)) self._affectedList.set(dist, []);
                self._affectedList.get(dist).push(
                    i * self._template.width + j, -i * self._template.width + j,
                    i * self._template.width - j, -i * self._template.width - j,
                );
            }
        }

        for (let current = 1; current < images.length; current++) {
            t0 = performance.now()
            if (!self.countWeights(images[current - 1], images[current])) return;
            t1 = performance.now()
            self.log("Call to countWeights took " + (t1 - t0) + " milliseconds.");
        }
        t0 = performance.now();
        self.collectToHeatmap();
        t1 = performance.now();
        self.log("Call to collectToHeatmap took " + (t1 - t0) + " milliseconds.");

        self._preparingResult.resolve(null);
    });
    return this._preparingResult;
}

VXGHeatmapModel.prototype.render = function (parent, algo = 0) {
    let t0 = performance.now();
    let canvas = document.createElement('canvas');
    canvas.width = this._template.width;
    canvas.height = this._template.height;
    canvas.style.maxWidth = '100%';
    canvas.style.maxHeight = '100%';
    let ctx = canvas.getContext("2d"), h;
    ctx.drawImage(this._template.canvas, 0, 0);
    ctx.globalAlpha = 0.2;

    this._heatmap.forEach((value, ind) => {
        if (value >= this.peak) h = 0;
        else h = 240 * (1 - (value / this.peak));
        if (h >= this.threshold) return;

        ctx.fillStyle = "hsl(" + h + ", 100%, 50%)";
        let i = Math.floor(ind / this._template.width), j = ind % this._template.width;
        ctx.fillRect(j, i, 1, 1);
    });
    (parent || $('body')).html(canvas);
    let t1 = performance.now();
    this.log("Call to render took " + (t1 - t0) + " milliseconds.");
}

VXGHeatmapModel.prototype.collectToHeatmap = function () {
    let heatmap = new Map();
    this._weights.forEach((times, at) => {
        this._affectedList.forEach((diffs, dist) => {
            diffs.forEach((diff) => {
                if (at + diff < 0 || at + diff >= this._template.data.length) return;
                heatmap.set(at + diff, (heatmap.get(at + diff) || 0) + (dist * times));
            });
        });
    });
    this._heatmap = heatmap;
}

VXGHeatmapModel.prototype.countWeights = function (one, two) {
    if (one.width !== two.width || one.height !== two.height) {
        this._preparingResult.reject('Thumbnails must have the same dimensions');
        return null;
    }

    for (let i = 0, j = 0; i < one.data.length; i += 4, j++) {
        let atOne = one.data.subarray(i, i + 3);
        let atTwo = two.data.subarray(i, i + 3);
        if (!this.arePixelsEqual(atOne, atTwo)) {
            this._weights.set(j, (this._weights.get(j) || 0) + 1);
        }
    }
    return true;
}

VXGHeatmapModel.prototype.arePixelsEqual = function (one, two) {
    let diff = Math.sqrt((
        Math.pow(one[0] - two[0], 2) +
        Math.pow(one[1] - two[1], 2) +
        Math.pow(one[2] - two[2], 2)
    ) / 3) / 255;
    return diff <= this.fuzz;
}
