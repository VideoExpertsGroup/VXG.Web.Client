window.controls = window.controls || {};

window.controls['heatmap'] = {
    js: [window.core.getPath('heatmap.js') + 'VXGHeatmap/Heatmap.js'],
    observedAttributes: function () {
        return [
            'access_token', 'start_time', 'end_time', 'origin', 'fuzz',
            'max_amount_thumbnails_analysis', 'radius', 'threshold', 'peak', 'debug',
        ];
    },
    on_init: function () {
        let self = this, a = (e) => this.getAttribute(e);
        this._model = new VXGHeatmapModel(
            a('access_token'), a('start_time'), a('end_time'), a('origin'),
            Number(a('max_amount_thumbnails_analysis')), Number(a('fuzz')),
            Number(a('radius')), Number(a('peak')), Number(a('threshold')),
            Boolean(a('debug')),
        );
        for (let attr of this.attributes) this._model[attr.name] = attr.value;
        this.render = function () {
            self._model.prepareData().done(function () {
                self._model.render($(self));
            }).fail(console.error);
        };
        this.render();
    },
    attributeChangedCallback: function (name, value) {
        this._model[name] = value
    },
}
