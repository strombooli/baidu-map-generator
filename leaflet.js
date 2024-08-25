var xhr = new XMLHttpRequest();
xhr.open('GET', './utils/china-provinces.json', true);
xhr.onload = function () {
    if (xhr.status === 200) {
        borders = JSON.parse(xhr.responseText);
        addDefaultGeojson(borders)
    }
};
xhr.send();

const satelliteBaseLayer = L.tileLayer.baiDuTileLayer("img")
const svLayer = new L.TileLayer.BaiDuTileLayer('streetview')
const satelliteLabelsLayer = L.tileLayer.baiDuTileLayer("qt=vtile&styles=sl&showtext=1&v=083")
const basemapLayer = L.tileLayer.baiDuTileLayer("qt=vtile&styles=pl&showtext=0")
const baseLabelsLayer = L.tileLayer.baiDuTileLayer("qt=vtile&styles=pl&showtext=1&v=083")
const osmLayer = L.tileLayer("https://{s}.tile.osm.org/{z}/{x}/{y}.png");
const gsvLayer = L.tileLayer("https://www.google.com/maps/vt?pb=!1m7!8m6!1m3!1i{z}!2i{x}!3i{y}!2i9!3x1!2m8!1e2!2ssvv!4m2!1scc!2s*211m3*211e2*212b1*213e2*211m3*211e3*212b1*213e2*212b1*214b1!4m2!1ssvl!2s*211b0*212b1!3m8!2sen!3sus!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m4!1e0!8m2!1e1!1e1!6m6!1e12!2i2!11e0!39b0!44e0!50e0");
const gsvLayer2 = L.tileLayer("https://www.google.com/maps/vt?pb=!1m7!8m6!1m3!1i{z}!2i{x}!3i{y}!2i9!3x1!2m8!1e2!2ssvv!4m2!1scc!2s*211m3*211e2*212b1*213e2*212b1*214b1!4m2!1ssvl!2s*211b0*212b1!3m8!2sen!3sus!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m4!1e0!8m2!1e1!1e1!6m6!1e12!2i2!11e0!39b0!44e0!50e0");
const gsvLayer3 = L.tileLayer("https://www.google.com/maps/vt?pb=!1m7!8m6!1m3!1i{z}!2i{x}!3i{y}!2i9!3x1!2m8!1e2!2ssvv!4m2!1scc!2s*211m3*211e3*212b1*213e2*212b1*214b1!4m2!1ssvl!2s*211b0*212b1!3m8!2sen!3sus!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m4!1e0!8m2!1e1!1e1!6m6!1e12!2i2!11e0!39b0!44e0!50e0");
const googleLayer = L.tileLayer("https://www.google.com/maps/vt?pb=!1m5!1m4!1i{z}!2i{x}!3i{y}!4i256!2m1!2sm!3m17!2sen!3sUS!5e18!12m4!1e68!2m2!1sset!2sRoadmap!12m3!1e37!2m1!1ssmartmaps!12m4!1e26!2m2!1sstyles!2ss.e:l|p.v:ff,s.t:0.7|s.e:g.s|p.v:on!5m1!5f1.5");
const googleLabelsLayer = L.tileLayer("https://www.google.com/maps/vt?pb=!1m7!8m6!1m3!1i{z}!2i{x}!3i{y}!2i9!3x1!2m2!1e0!2sm!3m5!2sen!3sus!5e1105!12m1!1e15!4e0!5m4!1e0!8m2!1e1!1e1!6m6!1e12!2i2!11e0!39b0!44e0!50e0");
const googleSatelliteLayer = L.tileLayer("https://www.google.com/maps/vt?pb=!1m7!8m6!1m3!1i{z}!2i{x}!3i{y}!2i9!3x1!2m2!1e1!2sm!3m3!2sen!3sus!5e1105!4e0!5m4!1e0!8m2!1e1!1e1!6m6!1e12!2i2!11e0!39b0!44e0!50e0");
const terrainLayer = L.tileLayer("https://maps.googleapis.com/maps/vt?pb=!1m5!1m4!1i{z}!2i{x}!3i{y}!4i256!2m1!2sm!2m2!1e5!2sshading!2m2!1e6!2scontours!3m17!2sen!3sUS!5e18!12m4!1e68!2m2!1sset!2sTerrain!12m3!1e37!2m1!1ssmartmaps!12m4!1e26!2m2!1sstyles!2ss.e:l|p.v:off,s.t:0.7|s.e:g.s|p.v:on!5m1!5f1.5");
const hwLayer = L.tileLayer("https://maprastertile-drcn.dbankcdn.cn/display-service/v1/online-render/getTile/23.12.09.11/{z}/{x}/{y}/?language=zh&p=46&scale=2&mapType=ROADMAP&presetStyleId=standard&pattern=JPG&key=DAEDANitav6P7Q0lWzCzKkLErbrJG4kS1u%2FCpEe5ZyxW5u0nSkb40bJ%2BYAugRN03fhf0BszLS1rCrzAogRHDZkxaMrloaHPQGO6LNg==")


var map = L.map("map", { crs: L.CRS.Baidu, center: [33.915, 108.404], zoom: 5, zoomControl: false, attributionControl: false, doubleClickZoom: false, preferCanvas: true })

var drawnItems = new L.FeatureGroup().addTo(map);
var drawControl = new L.Control.Draw({
    edit: {
        featureGroup: drawnItems,
        poly: {
            allowIntersection: false
        }
    },
    draw: {
        polygon: {
            allowIntersection: false,
            showArea: true
        },
        polyline: false,
        circle: false,
        marker: false,
        circlemarker: false
    },
    position: 'bottomleft',
 
});


map.on(L.Draw.Event.CREATED, function (event) {
    var layer = event.layer;
    drawnItems.addLayer(layer);
});

baseLabelsLayer.addTo(map)
svLayer.addTo(map)

function addDefaultGeojson(borders) {
    const geojson = L.geoJson(borders, {
        style: style,
        onEachFeature: onEachFeature,
        contextmenu: true
    });
    geojson.addTo(map)
}
const customPolygonsLayer = new L.FeatureGroup();
const markerLayer = L.markerClusterGroup({
    maxClusterRadius: 100,
    disableClusteringAtZoom: 15
})
markerLayer.addTo(map)

L.DomEvent.disableClickPropagation(document.getElementById("settingContainer"))
L.DomEvent.disableScrollPropagation(document.getElementById("settingContainer"))
L.DomEvent.disableClickPropagation(document.getElementById("panel-container"))
L.DomEvent.disableScrollPropagation(document.getElementById("panel-container"))

const bdRoadmapLayers = { "去除标签": basemapLayer, "街景覆盖": svLayer }
const bdSatelliteLayers = { "路网标注": satelliteLabelsLayer, "街景覆盖": svLayer }
var gsvLayers = { "街景覆盖": gsvLayer, "官方覆盖": gsvLayer2, "非官方覆盖": gsvLayer3, "地图标签": googleLabelsLayer }
const baseLayers = { "百度地图": baseLabelsLayer, "百度卫星图": satelliteBaseLayer, "华为地图": hwLayer, "谷歌地图": googleLayer, "谷歌地形图": terrainLayer, "谷歌卫星图": googleSatelliteLayer, "OSM": osmLayer }

var layerControl = L.control.layers(baseLayers, bdRoadmapLayers, { autoZIndex: false, position: "bottomleft" }).addTo(map)
var opacityControl = L.control.opacityControl(svLayer, { position: 'topright' }).addTo(map);
map.addControl(drawControl);

map.on('baselayerchange', function (event) {
    var newBaseLayer = event.layer;
    if (newBaseLayer instanceof L.TileLayer && newBaseLayer._url) {
        if (newBaseLayer._url.includes('starpic') || newBaseLayer._url.includes('bdimg')) {
            if (map.options.crs != L.CRS.Baidu) {
                var currentCenter = map.getCenter()
                var currentZoom = map.getZoom()
                map.removeLayer(googleLabelsLayer);
                map.options.crs = L.CRS.Baidu;
                map.setView(currentCenter, currentZoom + 1);
                map.removeControl(opacityControl)
                opacityControl = L.control.opacityControl(svLayer, { position: 'topright' }).addTo(map);
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
                var currentCenter = map.getCenter()
                var currentZoom = map.getZoom()
                map.removeLayer(svLayer);
                map.options.crs = L.CRS.EPSG3857;
                map.setView(currentCenter, currentZoom - 1);
                map.removeControl(opacityControl)
                opacityControl = L.control.opacityControl(gsvLayer, { position: 'topright' }).addTo(map);
            }

            map.removeControl(layerControl);

            layerControl = L.control.layers(baseLayers, gsvLayers, { autoZIndex: false, position: "bottomleft" });
            gsvLayer.addTo(map).bringToFront();
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

        }
    }

})
function getRandomColor() {
    const red = Math.floor(((1 + Math.random()) * 256) / 2);
    const green = Math.floor(((1 + Math.random()) * 256) / 2);
    const blue = Math.floor(((1 + Math.random()) * 256) / 2);
    return "rgb(" + red + ", " + green + ", " + blue + ")";
}
function style() {
    return {
        opacity: 0,
        fillOpacity: 0
    };
}
function highlighted() {
    return {
        fillColor: getRandomColor(),
        fillOpacity: 0.5,
    };
}
function removeHighlight() {
    return { fillOpacity: 0 };
}
function customPolygonStyle() {
    return {
        weight: 2,
        opacity: 1,
        color: getRandomColor(),
        fillOpacity: 0,
    };
}

let state = {
    started: false,
    polygonID: 0
}
let selected = []
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: function(e) {
            highlightFeature(e);
            markFeature(e.target.feature.properties.name);
        },
        mouseout: function(e) {
            resetHighlight(e)
            markFeature()
        },
        click: selectFeature,
    });
}

function markFeature(text){
    const panel=document.getElementById('mouse-on-layer')
    if(text) panel.textContent=text
    else panel.textContent='请绘制或导入一个你要生成街景的区域'
}

function highlightFeature(e) {
    if (state.started) return;
    const layer = e.target;
    if (!selected.some((x) => x === layer)) layer.setStyle(highlighted());
    // layer.setStyle(highlighted());
    // select.value = `${getName(layer)} ${layer.found ? "(" + layer.found.length + ")" : "(0)"}`;
}

function resetHighlight(e) {
    const layer = e.target;
    if (!selected.some((x) => x === layer)) layer.setStyle(removeHighlight());
    // layer.setStyle(removeHighlight())
    // select.value = "Select a country or draw a polygon";
}

function initLayer(layer) {
    if (!layer.found) layer.found = [];
    if (!layer.nbNeeded) layer.nbNeeded = 100;
    if (!layer.checkedPanos) layer.checkedPanos = new Set();
    return layer;
}
function selectFeature(e) {
    if (state.started) return;
    const country = e.target;
    initLayer(country);
    const index = selected.findIndex((x) => x == country);
    if (index == -1) {
        country.setStyle(highlighted());
        selected.push(country);
    } else {
        selected.splice(index, 1);
        resetHighlight(e);
    }
    updateSelected()
}

function updateSelected() {
    const container = document.getElementById('provinces-container');
    container.innerHTML = ""
    for (province of selected) {
        const existingWrappers = container.getElementsByTagName('div').length
        const wrapper = document.createElement('div');
        wrapper.style.marginBottom = '5px';
        wrapper.style.justifyContent = 'space-between';
        wrapper.style.display = 'flex';
        wrapper.id = province.feature.properties.name
        wrapper.className = 'wrapper'

        const selectionLabel = document.createElement('span');
        selectionLabel.innerText = province.feature.properties.name ? province.feature.properties.name : `选中区域${existingWrappers + 1}`
        // selectionLabel.style.color = color
        selectionLabel.style.marginLeft = '20px'
        selectionLabel.style.marginRight = '50px'

        selectionLabel.addEventListener('click', () => {
            const customName = prompt('修改选中区域的名称:', selectionLabel.innerText);
            if (customName != null && customName != '') {
                selectionLabel.innerText = customName;
            }
        });

        const countContainer = document.createElement('div');

        const numberLabel = document.createElement('span');
        numberLabel.innerText = '0';
        numberLabel.style.marginRight = '15px';

        const seperateLable = document.createElement('span');
        seperateLable.innerText = '/';
        seperateLable.style.marginRight = '15px';

        const input = document.createElement('input');
        input.type = 'number';
        input.placeholder = province.nbNeeded;
        input.style.width = '60px'
        input.style.height = '20px'

        countContainer.appendChild(numberLabel);
        countContainer.appendChild(seperateLable);
        countContainer.appendChild(input);

        wrapper.appendChild(selectionLabel);
        wrapper.appendChild(countContainer);
        container.appendChild(wrapper);
    }
}

map.on("draw:created", (e) => {
    state.polygonID++;
    const polygon = e.layer;
    polygon.feature = e.layer.toGeoJSON();
    polygon.found = [];
    polygon.nbNeeded = 100;
    polygon.checkedPanos = new Set();
    polygon.feature.properties.name = `绘制区域 ${state.polygonID}`;
    polygon.setStyle(customPolygonStyle());
    polygon.setStyle(highlighted());
    polygon.on("mouseover", (e) => {
        highlightFeature(e)
        markFeature(`绘制区域 ${state.polygonID}`)
    });
    polygon.on("mouseout", (e) => {
        resetHighlight(e)
        markFeature()
    });
    polygon.on("click", (e) => selectFeature(e));
    customPolygonsLayer.addLayer(polygon);
    selected.push(polygon);
});

map.on("draw:edited", (e) => {
    e.layers.eachLayer((layer) => {
        const polygon = layer;
        polygon.feature = layer.toGeoJSON();
        const index = selected.findIndex((x) => x === layer);
        if (index != -1) selected.value[index] = polygon;
    })
});

map.on("draw:deleted", (e) => {
    e.layers.eachLayer((layer) => {
        const index = selected.findIndex((x) => x === layer);
        if (index != -1) selected.splice(index, 1);
    });
    updateSelected()
});

//map.on("click",async (e) =>{getPano(e.latlng)})

function randomPointInPoly(polygon) {
    const bounds = polygon.getBounds();
    const x_min = bounds.getEast();
    const x_max = bounds.getWest();
    const y_min = bounds.getSouth();
    const y_max = bounds.getNorth();
    const lat = (Math.asin(Math.random() * (Math.sin(y_max * Math.PI / 180) - Math.sin(y_min * Math.PI / 180)) + Math.sin(y_min * Math.PI / 180))) * 180 / Math.PI;
    const lng = x_min + Math.random() * (x_max - x_min);
    return { lat: lat, lng: lng };
}

const generate = async (province) => {
    while (province.found.length < province.nbNeeded) {
        // if (!state.started) return;
        var genNum = Math.min(province.nbNeeded * 100, 10);
        var randomPoints = []
        while (randomPoints.length < genNum) {
            const point = randomPointInPoly(province);
            if (province.contains({ lat: point.lat, lng: point.lng })) {
                randomPoints.push(point);
            }
        }
        for (const pointGroup of randomPoints.chunk(50)) {
            await Promise.allSettled(pointGroup.map((g) => getPano(g, province)))
        }
    }
}



async function getPano(point, province) {

    let [x,y]=gcoord.transform([point.lng, point.lat],gcoord.WGS84, gcoord.BD09MC)
    pano = await searchPanoByXYL(x, y, 17)
    // console.log(province.found)
    if (pano) {
        const [lng,lat] = gcoord.transform([pano.x/100,pano.y/100],gcoord.BD09MC, gcoord.WGS84)
        const pointFound = { lat: lat, lng: lng, panoId: pano.id };
        addPoint(pointFound);
        //province.found.push(pointFound);
    }
}

async function searchPanoByXYL(x, y, l) {
    const url = `https://mapsv${Math.ceil(Math.random())}.bdimg.com/?qt=qsdata&x=${x}&y=${y}&l=${l}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        if (data.content.id) return data.content;
        else return false;
    } catch (error) {
        return false;
    }
}

function addPoint(location) {
    console.log('add marker', location)
    L.marker([location.lat, location.lng])
        .on('click', () => {
            window.open(`https://maps.baidu.com/#panoid=${location.panoId}&panotype=street&pitch=0&l=13&tn=B_NORMAL_MAP&sc=0&newmap=1&shareurl=1&pid=${location.panoId}`, '_blank');
        })
        // .setZIndexOffset(zIndex)
        .addTo(markerLayer);
}

Array.prototype.chunk = function (n) {
    if (!this.length) return [];
    return [this.slice(0, n)].concat(this.slice(n).chunk(n))
}

const start = async () => {
    //     if (settings.oneCountryAtATime) for (const polygon of selected.value) await generate(polygon);
    //   const generator = [];
    //   for (let polygon of selected.value) {
    //       for (let i = 0; i < settings.num_of_generators; i++) {
    //           generator.push(generate(polygon));
    //       }
    //   }
    //   await Promise.all(generator);
    //   state.started = false;
    // for (const province of selected) {
    //     await generate(province);
    // }
    let generator = []
    for (const province of selected) {
        generator.push(generate(province))
    }

    await Promise.all(generator)
};
