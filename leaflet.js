(function(){
    const satelliteBaseLayer= L.tileLayer.baiDuTileLayer("img")
    const svLayer = new L.TileLayer.BaiDuTileLayer('streetview')
    const satelliteLabelsLayer= L.tileLayer.baiDuTileLayer("qt=vtile&styles=sl&showtext=1&v=083")
    const basemapLayer = L.tileLayer.baiDuTileLayer("qt=vtile&styles=pl&showtext=0")
    const baseLabelsLayer = L.tileLayer.baiDuTileLayer("qt=vtile&styles=pl&showtext=1&v=083")
    const osmLayer = L.tileLayer("https://{s}.tile.osm.org/{z}/{x}/{y}.png");
    const gsvLayer = L.tileLayer("https://www.google.com/maps/vt?pb=!1m7!8m6!1m3!1i{z}!2i{x}!3i{y}!2i9!3x1!2m8!1e2!2ssvv!4m2!1scc!2s*211m3*211e2*212b1*213e2*211m3*211e3*212b1*213e2*212b1*214b1!4m2!1ssvl!2s*211b0*212b1!3m8!2sen!3sus!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m4!1e0!8m2!1e1!1e1!6m6!1e12!2i2!11e0!39b0!44e0!50e0");
    const gsvLayer2 = L.tileLayer("https://www.google.com/maps/vt?pb=!1m7!8m6!1m3!1i{z}!2i{x}!3i{y}!2i9!3x1!2m8!1e2!2ssvv!4m2!1scc!2s*211m3*211e2*212b1*213e2*212b1*214b1!4m2!1ssvl!2s*211b0*212b1!3m8!2sen!3sus!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m4!1e0!8m2!1e1!1e1!6m6!1e12!2i2!11e0!39b0!44e0!50e0");
    const gsvLayer3 = L.tileLayer("https://www.google.com/maps/vt?pb=!1m7!8m6!1m3!1i{z}!2i{x}!3i{y}!2i9!3x1!2m8!1e2!2ssvv!4m2!1scc!2s*211m3*211e3*212b1*213e2*212b1*214b1!4m2!1ssvl!2s*211b0*212b1!3m8!2sen!3sus!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m4!1e0!8m2!1e1!1e1!6m6!1e12!2i2!11e0!39b0!44e0!50e0");
    const googleLayer = L.tileLayer("https://www.google.com/maps/vt?pb=!1m7!8m6!1m3!1i{z}!2i{x}!3i{y}!2i9!3x1!2m2!1e0!2sm!3m5!2sen!3sus!5e1105!12m1!1e3!4e0!5m4!1e0!8m2!1e1!1e1!6m6!1e12!2i2!11e0!39b0!44e0!50e0");
    const googleLabelsLayer = L.tileLayer("https://www.google.com/maps/vt?pb=!1m7!8m6!1m3!1i{z}!2i{x}!3i{y}!2i9!3x1!2m2!1e0!2sm!3m5!2sen!3sus!5e1105!12m1!1e15!4e0!5m4!1e0!8m2!1e1!1e1!6m6!1e12!2i2!11e0!39b0!44e0!50e0");
    const googleSatelliteLayer = L.tileLayer("https://www.google.com/maps/vt?pb=!1m7!8m6!1m3!1i{z}!2i{x}!3i{y}!2i9!3x1!2m2!1e1!2sm!3m3!2sen!3sus!5e1105!4e0!5m4!1e0!8m2!1e1!1e1!6m6!1e12!2i2!11e0!39b0!44e0!50e0");
    const terrainLayer = L.tileLayer("https://www.google.com/maps/vt?pb=!1m7!8m6!1m3!1i{z}!2i{x}!3i{y}!2i9!3x1!2m2!1e0!2sm!2m1!1e4!3m7!2sen!3sus!5e1105!12m1!1e67!12m1!1e3!4e0!5m4!1e0!8m2!1e1!1e1!6m6!1e12!2i2!11e0!39b0!44e0!50e0");
    const hwLayer=L.tileLayer("https://maprastertile-drcn.dbankcdn.cn/display-service/v1/online-render/getTile/23.12.09.11/{z}/{x}/{y}/?language=zh&p=46&scale=2&mapType=ROADMAP&presetStyleId=standard&pattern=JPG&key=DAEDANitav6P7Q0lWzCzKkLErbrJG4kS1u%2FCpEe5ZyxW5u0nSkb40bJ%2BYAugRN03fhf0BszLS1rCrzAogRHDZkxaMrloaHPQGO6LNg==")


    var map = L.map("map", { crs: L.CRS.Baidu, center: [33.915,108.404], zoom: 5, zoomControl: false, attributionControl: false, doubleClickZoom: false,preferCanvas: true})
    baseLabelsLayer.addTo(map)
    svLayer.addTo(map).bringToFront()
    var otherElements = document.querySelectorAll('*');

    // 遍历所有元素
    otherElements.forEach(function(element) {
      // 检查元素是否不是id为"map"的元素
      if (element.id !== 'map') {
        // 禁用点击事件冒泡
        L.DomEvent.disableClickPropagation(element);
        // 禁用滚轮事件冒泡
        L.DomEvent.disableScrollPropagation(element);
      }
    });
    const bdRoadmapLayers = {"去除标签":basemapLayer,"街景覆盖":svLayer}
    const bdSatelliteLayers={"路网标注":satelliteLabelsLayer,"街景覆盖":svLayer }
    var gsvLayers={"街景覆盖": gsvLayer,"官方覆盖": gsvLayer2,"非官方覆盖": gsvLayer3,"地图标签":googleLabelsLayer}
    const baseLayers={ "百度地图": baseLabelsLayer,"百度卫星图":  satelliteBaseLayer,"华为地图":hwLayer,"谷歌地图":googleLayer,"谷歌地形图":terrainLayer,"谷歌卫星图":googleSatelliteLayer,"OSM":osmLayer }

    var layerControl=L.control.layers(baseLayers,bdRoadmapLayers,{ autoZIndex: false, position:"bottomleft"}).addTo(map)
    var opacityControl=L.control.opacityControl(svLayer, { position: 'topright' }).addTo(map);

    map.on('baselayerchange', function (event) {
        var newBaseLayer = event.layer;
        if (newBaseLayer instanceof L.TileLayer && newBaseLayer._url) {
            if (newBaseLayer._url.includes('starpic') || newBaseLayer._url.includes('bdimg')) {
                if (map.options.crs != L.CRS.Baidu) {
                    var currentCenter=map.getCenter()
                    var currentZoom=map.getZoom()
                    map.removeLayer(googleLabelsLayer);
                    map.options.crs = L.CRS.Baidu;
                    map.setView(currentCenter, currentZoom+1);
                    map.removeControl(opacityControl)
                    opacityControl=L.control.opacityControl(svLayer, { position: 'topright' }).addTo(map);
                }

                map.removeControl(layerControl);
                layerControl = L.control.layers(
                    baseLayers,
                    newBaseLayer._url.includes('starpic') ? bdSatelliteLayers : bdRoadmapLayers,
                    { autoZIndex: false, position: "bottomleft" }
                ).addTo(map);

                svLayer.addTo(map).bringToFront();
            } 
            else {
                if (map.options.crs === L.CRS.Baidu) {
                    var currentCenter=map.getCenter()
                    var currentZoom=map.getZoom()
                    map.removeLayer(svLayer);
                    map.options.crs = L.CRS.EPSG3857;
                    map.setView(currentCenter, currentZoom-1);
                    map.removeControl(opacityControl)
                    opacityControl=L.control.opacityControl(gsvLayer, { position: 'topright' }).addTo(map);
                }

                map.removeControl(layerControl);

                layerControl = L.control.layers(baseLayers, gsvLayers, { autoZIndex: false, position: "bottomleft" });

                if (newBaseLayer._url.includes('maprastertile') || newBaseLayer._url.includes('osm')) {
                    map.removeLayer(googleLabelsLayer);
                    layerControl = L.control.layers(
                        baseLayers,
                        { "街景覆盖": gsvLayer, "官方覆盖": gsvLayer2, "非官方覆盖": gsvLayer3 },
                        { autoZIndex: false, position: "bottomleft" }
                    );


                    
                } else {
                    googleLabelsLayer.addTo(map).bringToFront();
                }

                layerControl.addTo(map);
                gsvLayer.addTo(map).bringToFront();
            }
        }

    })

})();