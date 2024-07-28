    L.Projection.BaiduMercator = L.Util.extend({}, L.Projection.Mercator, {
        R: 6378206,
        R_MINOR: 6356584.314245179,
        bounds: new L.Bounds([-20037725.11268234, -19994619.55417086], [20037725.11268234, 19994619.55417086])
    });

    L.CRS.Baidu = L.Util.extend({}, L.CRS.Earth, {
        code: 'EPSG:Baidu',
        projection: L.Projection.BaiduMercator,
        transformation: new L.Transformation(1, 0.5, -1, 0.5),
        scale: function (zoom) { return 1 / Math.pow(2, (18 - zoom)); },
        zoom: function (scale) { return 18 - Math.log(1 / scale) / Math.LN2; },
    });

    L.TileLayer.BaiDuTileLayer = L.TileLayer.extend({
        initialize: function (param, options) {
            var templateImgUrl = "//maponline{s}.bdimg.com/starpic/u=x={x};y={y};z={z};v=009;type=sate&qt=satepc&fm=46&app=webearth2&v=009";
            var templateUrl = "//maponline{s}.bdimg.com/tile/?x={x}&y={y}&z={z}&{p}";
            var streetViewUrl = "//mapsv1.bdimg.com/?qt=tile&styles=pl&x={x}&y={y}&z={z}";
            var myUrl;
            if (param === "img") {
                myUrl = templateImgUrl;
            } else if (param === "streetview") {
                myUrl = streetViewUrl;
            } else {
                myUrl = templateUrl;
            }
            options = L.extend({
                getUrlArgs: function (o) { return { x: o.x, y: (-1 - o.y), z: o.z }; },
                p: param, subdomains: "0123", minZoom: 3, maxZoom: 19, minNativeZoom: 3, maxNativeZoom:19 
            }, options);
            L.TileLayer.prototype.initialize.call(this, myUrl, options);
        },

        getTileUrl: function (coords) {
            if (this.options.getUrlArgs) {
                return L.Util.template(this._url, L.extend({ s: this._getSubdomain(coords), r: L.Browser.retina ? '@2x' : '' }, this.options.getUrlArgs(coords), this.options));
            } else {
                return L.TileLayer.prototype.getTileUrl.call(this, coords);
            }
        },
        _setZoomTransform: function (level, center, zoom) {
            center = L.latLng(gcoord.transform([center.lng, center.lat], gcoord.WGS84, gcoord.BD09).reverse());
            L.TileLayer.prototype._setZoomTransform.call(this, level, center, zoom);
        },
        _getTiledPixelBounds: function (center) {
            center = L.latLng(gcoord.transform([center.lng, center.lat], gcoord.WGS84, gcoord.BD09).reverse());
            return L.TileLayer.prototype._getTiledPixelBounds.call(this, center);
        }
    });

    L.tileLayer.baiDuTileLayer = function (param, options) { return new L.TileLayer.BaiDuTileLayer(param, options); };

    L.Control.OpacityControl = L.Control.extend({
        options: {
            position: 'topright'
        },
    
        initialize: function (layer, options) {
            this.layer = layer;
            L.setOptions(this, options);
        },
    
        onAdd: function (map) {
            var container = L.DomUtil.create('div', 'leaflet-control-opacity');
            container.innerHTML = `
                <input type="range" id="opacity-slider" min="0" max="100" value="100" step="10">
            `;
            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.disableScrollPropagation(container);
            L.DomEvent.on(container.querySelector('#opacity-slider'), 'input', function (e) {
                var opacity = e.target.value / 100; 
                this.layer.setOpacity(opacity)
            }.bind(this)); 
    
            return container;
        }
    });

    L.control.opacityControl = function(opts) {
        return new L.Control.OpacityControl(opts);
    };
