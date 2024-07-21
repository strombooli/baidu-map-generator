(function () {
    let map, drawingManager, panoramaLayer, markerClusterer,popup
    let isStarted = false
    let selections = {}
    let overlayStates = {};
    let overlays = []
    let markers = []
    let manualPick = []
    let resultPanos = { "customCoordinates": [] }
    let pinSvg = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><title>70 Basic icons by Xicons.co</title><path d="M24,1.32c-9.92,0-18,7.8-18,17.38A16.83,16.83,0,0,0,9.57,29.09l12.84,16.8a2,2,0,0,0,3.18,0l12.84-16.8A16.84,16.84,0,0,0,42,18.7C42,9.12,33.92,1.32,24,1.32Z" fill="#ff9427"></path><path d="M25.37,12.13a7,7,0,1,0,5.5,5.5A7,7,0,0,0,25.37,12.13Z" fill="#ffffff"></path></g></svg>`
    const pinUrl = svgToUrl(pinSvg)
    let LLBAND = [75, 60, 45, 30, 15, 0];
    let LL2MC = [
        [-0.0015702102444, 111320.7020616939, 1704480524535203, -10338987376042340, 26112667856603880, -35149669176653700, 26595700718403920, -10725012454188240, 1800819912950474, 82.5],
        [0.0008277824516172526, 111320.7020463578, 647795574.6671607, -4082003173.641316, 10774905663.51142, -15171875531.51559, 12053065338.62167, -5124939663.577472, 913311935.9512032, 67.5],
        [0.00337398766765, 111320.7020202162, 4481351.045890365, -23393751.19931662, 79682215.47186455, -115964993.2797253, 97236711.15602145, -43661946.33752821, 8477230.501135234, 52.5],
        [0.00220636496208, 111320.7020209128, 51751.86112841131, 3796837.749470245, 992013.7397791013, -1221952.21711287, 1340652.697009075, -620943.6990984312, 144416.9293806241, 37.5],
        [-0.0003441963504368392, 111320.7020576856, 278.2353980772752, 2485758.690035394, 6070.750963243378, 54821.18345352118, 9540.606633304236, -2710.55326746645, 1405.483844121726, 22.5],
        [-0.0003218135878613132, 111320.7020701615, 0.00369383431289, 823725.6402795718, 0.46104986909093, 2351.343141331292, 1.58060784298199, 8.77738589078284, 0.37238884252424, 7.45]
    ];
    let MCBAND = [1.289059486E7, 8362377.87, 5591021, 3481989.83, 1678043.12, 0];
    let MC2LL = [
        [1.410526172116255E-8, 8.98305509648872E-6, -1.9939833816331, 200.9824383106796, -187.2403703815547, 91.6087516669843, -23.38765649603339, 2.57121317296198, -0.03801003308653, 1.73379812E7],
        [-7.435856389565537E-9, 8.983055097726239E-6, -0.78625201886289, 96.32687599759846, -1.85204757529826, -59.36935905485877, 47.40033549296737, -16.50741931063887, 2.28786674699375, 1.026014486E7],
        [-3.030883460898826E-8, 8.98305509983578E-6, 0.30071316287616, 59.74293618442277, 7.357984074871, -25.38371002664745, 13.45380521110908, -3.29883767235584, 0.32710905363475, 6856817.37],
        [-1.981981304930552E-8, 8.983055099779535E-6, 0.03278182852591, 40.31678527705744, 0.65659298677277, -4.44255534477492, 0.85341911805263, 0.12923347998204, -0.04625736007561, 4482777.06],
        [3.09191371068437E-9, 8.983055096812155E-6, 6.995724062E-5, 23.10934304144901, -2.3663490511E-4, -0.6321817810242, -0.00663494467273, 0.03430082397953, -0.00466043876332, 2555164.4],
        [2.890871144776878E-9, 8.983055095805407E-6, -3.068298E-8, 7.47137025468032, -3.53937994E-6, -0.02145144861037, -1.234426596E-5, 1.0322952773E-4, -3.23890364E-6, 826088.5]
    ];
    function getRange(cC, cB, T) {
        if (cB != null) {
            cC = Math.max(cC, cB);
        }
        if (T != null) {
            cC = Math.min(cC, T);
        }
        return cC;
    }

    function getLoop(cC, cB, T) {
        while (cC > T) {
            cC -= T - cB;
        }
        while (cC < cB) {
            cC += T - cB;
        }
        return cC;
    }

    function convertor(cC, cD) {
        if (!cC || !cD) {
            return null;
        }
        let T = cD[0] + cD[1] * Math.abs(cC.x);
        const cB = Math.abs(cC.y) / cD[9];
        let cE = cD[2] + cD[3] * cB + cD[4] * cB * cB +
            cD[5] * cB * cB * cB + cD[6] * cB * cB * cB * cB +
            cD[7] * cB * cB * cB * cB * cB +
            cD[8] * cB * cB * cB * cB * cB * cB;
        T *= (cC.x < 0 ? -1 : 1);
        cE *= (cC.y < 0 ? -1 : 1);
        return [T, cE];
    }

    function convertLL2MC(lat, lng) {
        let T = { x: getLoop(lng, -180, 180), y: getRange(lat, -74, 74) };
        let cD, cC, len;

        const cB = T;
        for (cC = 0, len = LLBAND.length; cC < len; cC++) {
            if (cB.y >= LLBAND[cC]) {
                cD = LL2MC[cC];
                break;
            }
        }

        if (!cD) {
            for (cC = LLBAND.length - 1; cC >= 0; cC--) {
                if (cB.y <= -LLBAND[cC]) {
                    cD = LL2MC[cC];
                    break;
                }
            }
        }

        const cE = convertor(T, cD);
        return cE;
    }

    function convertMC2LL(x, y) {
        const cC = {
            x: Math.abs(x),
            y: Math.abs(y)
        };
        let cE;
        for (let cD = 0, len = MCBAND.length; cD < len; cD++) {
            if (cC.y >= MCBAND[cD]) {
                cE = MC2LL[cD];
                break;
            }
        }
        const T = convertor(cC, cE);
        return T;
    }

    var x_pi = 3.14159265358979324 * 3000.0 / 180.0;
    function gcjToBd(mars_point) {
        var baidu_point = { lng: 0, lat: 0 };
        var x = mars_point.lon;
        var y = mars_point.lat;
        var z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * x_pi);
        var theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * x_pi);
        baidu_point.lng = z * Math.cos(theta) + 0.0065;
        baidu_point.lat = z * Math.sin(theta) + 0.006;
        return baidu_point;
    }

    var pi = 3.14159265358979324;
    var a = 6378245.0;
    var ee = 0.00669342162296594323;

    function outOfChina(lon, lat) {
        if ((lon < 72.004 || lon > 137.8347) && (lat < 0.8293 || lat > 55.8271)) {
            return true;
        } else {
            return false;
        }
    }
    function transformLat(x, y) {
        var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(y * pi) + 40.0 * Math.sin(y / 3.0 * pi)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(y / 12.0 * pi) + 320 * Math.sin(y * pi / 30.0)) * 2.0 / 3.0;
        return ret;
    }

    function transformLon(x, y) {
        var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(x * pi) + 40.0 * Math.sin(x / 3.0 * pi)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(x / 12.0 * pi) + 300.0 * Math.sin(x / 30.0 * pi)) * 2.0 / 3.0;
        return ret;
    }


    function wgsToGcj(wgLat, wgLon) {
        var mars_point = { lon: 0, lat: 0 };

        if (outOfChina(wgLon, wgLat)) {
            mars_point.lat = wgLat;
            mars_point.lon = wgLon;
        } else {
            var dLat = transformLat(wgLon - 105.0, wgLat - 35.0);
            var dLon = transformLon(wgLon - 105.0, wgLat - 35.0);
            var radLat = wgLat / 180.0 * pi;
            var magic = Math.sin(radLat);
            magic = 1 - ee * magic * magic;
            var sqrtMagic = Math.sqrt(magic);
            dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi);
            dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * pi);
            mars_point.lat = wgLat + dLat;
            mars_point.lon = wgLon + dLon;
        }

        return mars_point;
    }

    function gcjToWgs(gcjLat, gcjLon) {
        let d = delta(gcjLat, gcjLon)
        return {
            'lat': gcjLat - d.lat,
            'lon': gcjLon - d.lon
        }
    }

    function delta(lat, lon) {
        let a = 6378245.0
        let ee = 0.00669342162296594323
        let dLat = transformLat(lon - 105.0, lat - 35.0)
        let dLon = transformLon(lon - 105.0, lat - 35.0)
        let radLat = lat / 180.0 * pi
        let magic = Math.sin(radLat)
        magic = 1 - ee * magic * magic
        let sqrtMagic = Math.sqrt(magic)
        dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi)
        dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * pi)
        return {
            'lat': dLat,
            'lon': dLon
        }
    }

    function transformLat(x, y) {
        let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
        ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0
        ret += (20.0 * Math.sin(y * pi) + 40.0 * Math.sin(y / 3.0 * pi)) * 2.0 / 3.0
        ret += (160.0 * Math.sin(y / 12.0 * pi) + 320 * Math.sin(y * pi / 30.0)) * 2.0 / 3.0
        return ret
    }

    function transformLon(x, y) {
        let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
        ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0
        ret += (20.0 * Math.sin(x * pi) + 40.0 * Math.sin(x / 3.0 * pi)) * 2.0 / 3.0
        ret += (150.0 * Math.sin(x / 12.0 * pi) + 300.0 * Math.sin(x / 30.0 * pi)) * 2.0 / 3.0
        return ret
    }

    function processGeoJSON(geojson, coordinateSystem) {
        let results = [];

        const extractPolygons = (coordinates, coordinateSystem) => {
            return coordinates.map(polygon => {
                return polygon.map(linearRing => {
                    return linearRing.map(coord => {
                        const [lng, lat] = coord;
                        if (coordinateSystem === '3') {
                            return { lng, lat };
                        } else if (coordinateSystem === '2') {
                            return gcjToBd(wgsToGcj(lat, lng));
                        } else {
                            return gcjToBd({ "lat": lat, "lon": lng });
                        }
                    });
                });
            });
        };

        if (geojson.features) {
            geojson.features.forEach(feature => {
                if (feature.geometry && feature.geometry.type === 'MultiPolygon' && feature.geometry.coordinates) {
                    const polygons = extractPolygons(feature.geometry.coordinates);
                    results.push(...polygons);
                } else if (feature.geometry && feature.geometry.type === 'Polygon' && feature.geometry.coordinates) {
                    const polygon = extractPolygons([feature.geometry.coordinates]);
                    results.push(...polygon);
                } else {
                    displayPopup('Invalid feature geometry!');
                }
            });
        } else if (geojson.type === 'MultiPolygon' && geojson.coordinates) {
            const polygons = extractPolygons(geojson.coordinates);
            results.push(...polygons);
        } else if (geojson.type === 'Polygon' && geojson.coordinates) {
            const polygon = extractPolygons([geojson.coordinates]);
            results.push(...polygon);
        } else {
            displayPopup('Invalid GeoJSON format!');
        }
        return results;
    }

    function initMap() {
        map = new BMap.Map("baidu-map", { enableCopyrightControl: false });
        const point = new BMap.Point(108.404, 33.915);
        map.centerAndZoom(point, 5);
        var mapTypeControl = new BMap.MapTypeControl({
            mapTypes: [BMAP_NORMAL_MAP, BMAP_SATELLITE_MAP, BMAP_HYBRID_MAP]
        });
        map.addControl(mapTypeControl);
        map.enableScrollWheelZoom(true);
        panoramaLayer = new BMap.PanoramaCoverageLayer();
        map.addTileLayer(panoramaLayer);
        loadDrawingTool()

        document.getElementById("start").onclick = () => {
            isStarted = true
            if (Object.keys(selections).length === 0) {
                displayPopup('未选中任何区域！')
                isStarted = false
                return
            }
            initSearch()
            document.getElementById("start").style.display = 'none'
            document.getElementById("pause").style.display = 'block'
        }

        document.getElementById("pause").onclick = () => {
            updateMarkerCluster()
            isStarted = false
            document.getElementById("pause").style.display = 'none'
            document.getElementById("start").style.display = 'block'
        }

        document.getElementById("erase").onclick = () => {
            resultPanos.customCoordinates = []
            manualPick = []
            document.getElementById("export-panel").children[0].innerText = `输出结果`
        }
        document.getElementById("clear").onclick = () => {
            for (var i = 0; i < markers.length; i++) {
                map.removeOverlay(markers[i]);
            }
        }
        document.getElementById("remove").onclick = () => {
            for (var i = 0; i < overlays.length; i++) {
                map.removeOverlay(overlays[i]);
            }
            overlays = [];
            const wrappers = document.getElementById('selection-container').getElementsByClassName('wrapper');

            const wrapperArray = Array.from(wrappers);

            wrapperArray.forEach(wrapper => {
                wrapper.remove();
            });
        }
        document.getElementById("manual-export").onclick = () => {
            resultPanos.customCoordinates.push(...manualPick)
            document.getElementById("export-panel").children[0].innerText = `输出结果 (${resultPanos.customCoordinates.length} 个地点)`
            displayPopup("手选点已添加至输出！")
        }

        document.getElementById("select-all").onclick = () => {
            const container = document.getElementById('selection-container');
            if (overlays.length === 0) {
                return;
            }
            else {
                overlays.forEach(function (overlay) {
                    if (overlay.z.sg != 0.5) {
                        const key=overlay.pv.Je
                        const state = overlayStates[key];
                        state.isChecked = true
                        if (!selections[key]) {
                            selections[key] = overlay.getPath()
                        }
                        const color = getRandomColor();
                        overlay.setFillColor(color);
                        overlay.setFillOpacity('0.5');
                        state.currentWrapper = addInputElement(
                            color,
                            key,
                            state.label
                        );
                    }
                })
            }
        }

        document.getElementById("deselect-all").onclick = () => {
            const container = document.getElementById('selection-container');
            if (overlays.length === 0) {
                return;
            }
            else {
                overlays.forEach(function (overlay) {
                    const key=overlay.pv.Je
                    const state = overlayStates[key];
                    if (overlay.z.sg != 0.1) {
                        state.currentWrapper = null;
                        state.isChecked = false
                        const wrapper = document.getElementById(key)
                        container.removeChild(wrapper)
                        if (selections[key]) {
                            delete selections[key]
                        }
                        const color = getRandomColor();
                        overlay.setFillColor('#fff');
                        overlay.setFillOpacity('0.1');
                    }
                    else {
                        state.isChecked = true
                        if (!selections[key]) {
                            selections[key] = overlay.getPath()
                        }
                        const color = getRandomColor();
                        overlay.setFillColor(color);
                        overlay.setFillOpacity('0.5');
                        state.currentWrapper = addInputElement(
                            color,
                            key,
                            state.label
                        );
                    }
                })
            }
        }

        document.getElementById("import-geojson").onclick = () => {
            const fileInput = document.getElementById('geojsonFile');
            fileInput.click();

            fileInput.onchange = () => {
                const file = fileInput.files[0]
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const geojsonData = JSON.parse(event.target.result);
                        var coordinateSystem = prompt(`请选择坐标系:\n1：火星坐标GCJ-02（国内默认）\n2：WGS-84（国际通用）\n3：百度坐标BD-09（百度默认）`);
                        if (!['1', '2', '3'].includes(coordinateSystem)) {
                            displayPopup('请选择一个坐标系，默认为WGS-84')
                            coordinateSystem = '2'
                        }
                        const boundaryPaths = processGeoJSON(geojsonData, coordinateSystem);
                        const paths = [];
                        boundaryPaths.forEach(bd => {
                            if (bd.length > 0) {
                                const path = [];
                                bd[0].forEach(coord => {
                                    path.push(new BMap.Point(coord.lng, coord.lat));
                                });
                                paths.push(path);
                            }
                        });
                        paths.forEach(path => {
                            const polygon = new BMap.Polygon(path, {
                                strokeColor: getRandomColor(),
                                strokeWeight: 2.5,
                                fillOpacity: 0.1,
                                fillColor: "#fff"
                            });
                            map.addOverlay(polygon);
                            handleOverlay(polygon);
                        });
                    };
                    reader.readAsText(file);
                } else {
                    fileInput.value = null;
                    displayPopup('请上传一个 GeoJSON 文件。');
                }
            };
        }

        document.getElementById("search-geojson").onclick = () =>{
             searchBoundary()
         }

        loadExportPanel()
        var customSvControl = new StreetViewControl();
        map.addControl(customSvControl);
    }

    function StreetViewControl() {    

        this.defaultAnchor = BMAP_ANCHOR_TOP_RIGHT;    
        this.defaultOffset = new BMap.Size(78, 5);    
    }


    StreetViewControl.prototype = new BMap.Control();

    StreetViewControl.prototype.initialize = function(map) {    
        var div = document.createElement("div");    
        div.appendChild(document.createTextNode("街景")); 
        div.style.boxShadow = "rgba(0, 0, 0, 0.35) 2px 2px 3px";
        div.style.borderLeft = "1px solid rgb(139, 164, 220)";
        div.style.borderTop = "1px solid rgb(139, 164, 220)";
        div.style.borderBottom = "1px solid rgb(139, 164, 220)";
        div.style.background = "rgb(142, 168, 224)";
        div.style.padding = "2px 6px";
        div.style.font = "bold 12px / 1.3em Arial, sans-serif";
        div.style.textAlign = "center";
        div.style.whiteSpace = "nowrap";
        div.style.borderRadius = "3px 0px 0px 3px";
        div.style.color = "rgb(255, 255, 255)";
        div.style.cursor = "pointer";
        div.style.margin = "5px"
        div.style.height='15px'
        
        div.onclick = function(e) { 
            if (panoramaLayer) {
                    map.removeTileLayer(panoramaLayer);
                    panoramaLayer=null
                    div.style.color="#000000"
                    div.style.background="rgb(255, 255, 255)"
                    div.style.font="12px arial,sans-serif"
                    div.style.lineHeight='13.5px'
                } else {
                    panoramaLayer = new BMap.PanoramaCoverageLayer();
                    map.addTileLayer(panoramaLayer);
                    div.style.font = "bold 12px / 1.3em Arial, sans-serif"
                    div.style.color="rgb(255, 255, 255)"
                    div.style.lineHeight='15px'
                    
                    div.style.background = "rgb(142, 168, 224)";
                }
        };    
        map.getContainer().appendChild(div);   
        return div
    };

    const copyToClipboard = (text) => {
        const textArea = document.createElement('textarea')
        textArea.style.position = 'fixed'
        textArea.style.visibility = '-10000px'
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        if (!document.execCommand('copy')) {
            console.warn('浏览器不支持 document.execCommand("copy")')
            document.body.removeChild(textArea)
            return false
        } else {
            document.body.removeChild(textArea)
            return true
        }
    }

    function loadExportPanel() {

        document.getElementById("export-clipboard").onclick = () => {
            const textToCopy = JSON.stringify(resultPanos);
            if (copyToClipboard(textToCopy)) {
                displayPopup('JSON数据已复制到剪贴板!');
            } else {
                console.error('复制失败')
            }
        };

        document.getElementById("export-json").onclick = () => {
            const dataStr = JSON.stringify(resultPanos, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'resultPanos.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };
    }

    function displayPopup(text) {
        if (!popup) {
            popup = document.createElement('div');
            popup.className = 'popup'
            document.body.appendChild(popup);
        }
        popup.innerHTML = text
        popup.style.display = 'block';
        setTimeout(() => {
            popup.style.display = 'none';
        }, 2000);
    }
    
    function searchBoundary() {
        var bdary = new BMap.Boundary();
        
        var districtName = prompt('请输入一个行政区名称（例如：北京市海淀区）');
        if (!districtName) {
            displayPopup('输入的名称不能为空')
            return; 
        }
    
        bdary.get(districtName, function(rs) {
            var count = rs.boundaries.length;
            if (count === 0) {
                displayPopup('未能获取当前输入的行政区边界');
                return;
            }
    
            const color = getRandomColor();
            var pointArray = [];
            for (var i = 0; i < count; i++) {
                var ply = new BMap.Polygon(rs.boundaries[i], {
                    strokeWeight: 2.5,
                    strokeColor: color,
                    fillOpacity: 0.1,
                    fillColor: "#fff"
                });
                map.addOverlay(ply);
                handleOverlay(ply,districtName)
                pointArray = pointArray.concat(ply.getPath());
            }
            map.setViewport(pointArray);
        });
    }
    
    function addInputElement(color, key,label) {
        const container = document.getElementById('selection-container');
        const existingWrappers = container.getElementsByTagName('div').length
        const wrapper = document.createElement('div');
        wrapper.style.marginBottom = '5px';
        wrapper.id = key
        wrapper.className = 'wrapper'

        const selectionLabel = document.createElement('span');
        selectionLabel.innerText = label ? label : `选中区域${existingWrappers + 1}` 
        selectionLabel.style.color = color
        selectionLabel.style.marginLeft = '20px'
        selectionLabel.style.marginRight = '50px'

        selectionLabel.addEventListener('click', () => {
            const customName= prompt('修改选中区域的名称:', selectionLabel.innerText);
            if (customName != null && customName != '') {
                selectionLabel.innerText = customName;
            }
        });

        const numberLabel = document.createElement('span');
        numberLabel.innerText = '0';
        numberLabel.style.marginRight = '15px';

        const seperateLable = document.createElement('span');
        seperateLable.innerText = '/';
        seperateLable.style.marginRight = '15px';

        const input = document.createElement('input');
        input.type = 'number';
        input.placeholder = '10000';
        input.style.width = '60px'
        input.style.height = '20px'

        wrapper.appendChild(selectionLabel);
        wrapper.appendChild(numberLabel);
        wrapper.appendChild(seperateLable)
        wrapper.appendChild(input);
        container.appendChild(wrapper);

        return wrapper
    }

    function loadDrawingTool() {

        var styleOptions = {
            strokeColor: getRandomColor(),
            strokeWeight: 2.5,
            strokeOpacity: 0.8,
            fillOpacity: 0.1,
            fillColor: "#fff",
            strokeStyle: 'solid'
        }

        drawingManager = new BMapLib.DrawingManager(map, {
            isOpen: false,
            enableDrawingTool: true,
            drawingToolOptions: {
                scale:0.9,
                anchor: BMAP_ANCHOR_TOP_LEFT,
                offset: new BMap.Size(70, 10),
                drawingModes: [
                    BMAP_DRAWING_MARKER,
                    BMAP_DRAWING_POLYLINE,
                    BMAP_DRAWING_RECTANGLE
                ]
            },
            rectangleOptions: styleOptions,
            polylineOptions: styleOptions,
            markerOptions: {
                icon: new BMap.Icon(pinUrl, new BMap.Size(25, 25), {
                    imageOffset: new BMap.Size(0, 0),
                    anchor: new BMap.Size(0, 12.5)
                }),
            }
        });

        getLayerBound()

    }

    function getLayerBound() {
        drawingManager.addEventListener('overlaycomplete', function (event) {
            const overlay = event.overlay;

            handleOverlay(overlay)
        });
    }

    function handleOverlay(overlay,label) {
        if (overlay instanceof BMap.Marker) {
            const coord = overlay.getPosition();
            handleMarkerOverlay(overlay, coord);
        }
        else {
            const key = overlay.pv.Je;
            const bounds = overlay.getPath();

            overlays.push(overlay);

            overlayStates[key] = { isChecked: false, currentWrapper: null, "label":label};


            if (overlay instanceof BMap.Polygon) {
                handleShapeOverlay(overlay, bounds, key);
            }

            else if (overlay instanceof BMap.Polyline) {
                handlePolylineOverlay(overlay, bounds, key);
            }
        }
    }

    function handleMarkerOverlay(marker, coord) {
        const pin_bd09mc = convertLL2MC(coord.lat, coord.lng);

        searchPano(pin_bd09mc[0], pin_bd09mc[1], 16)
            .then(resultPano => {
                if (!resultPano) {
                    marker.remove();
                    displayPopup('这里没有街景覆盖！');
                    return null;
                }
                extractTag('手选点', resultPano, manualPick);
                return checkPano(resultPano.id);
            })
            .then(isPano => {
                marker.remove();
                if (!isPano) {
                    manualPick.pop();
                    displayPopup('这里没有街景覆盖！');
                } else {
                    const svLink = `https://map.baidu.com/@13057562,4799985#panoid=${isPano[3]}&panotype=street&heading=${isPano[2]}&pitch=0&l=21&tn=B_NORMAL_MAP&sc=0&newmap=1&shareurl=1&pid=${isPano[3]}`;
                    const newMarker = createMarker(isPano);
                    newMarker.addEventListener("click", () => window.open(svLink, '_blank'));
                    map.addOverlay(newMarker);
                }
            })
            .catch(error => {
                console.error('发生错误:', error);
            });
    }

    function createMarker(coord) {
        return new BMap.Marker(new BMap.Point(coord[0], coord[1]), {
            icon: new BMap.Icon(pinUrl, new BMap.Size(25, 25), {
                imageOffset: new BMap.Size(0, 0),
                anchor: new BMap.Size(0, 12.5)
            })
        });
    }

    function handleShapeOverlay(overlay, bounds, key) {
        const state = overlayStates[key];
        drawingManager.close();

        overlay.addEventListener("click", function () {
            toggleShapeSelection(overlay, state, bounds, key);
        });
    }

    function handlePolylineOverlay(overlay, bounds, key) {
        const state = overlayStates[key];
        drawingManager.close();

        const points = overlay.getPath();
        const polygon = new BMap.Polygon(points, {
            strokeColor: "black",
            fillColor: "#fff",
            fillOpacity: 0.1,
            strokeWeight: 2.5
        });

        map.addOverlay(polygon);
        overlay.remove();
        overlays.pop();
        overlays.push(polygon);

        polygon.addEventListener("click", function () {
            toggleShapeSelection(polygon, state, bounds, key);
        });
    }

    function toggleShapeSelection(overlay, state, bounds, key) {
        if (!state.isChecked) {
            if (!selections[key]) {
                selections[key] = bounds;
            }
            const color = getRandomColor();
            overlay.setFillColor(color);
            overlay.setFillOpacity(0.5);
            state.currentWrapper = addInputElement(
                color,
                key,
                state.label
            );
            state.isChecked = true;
        } else {
            if (selections[key]) {
                delete selections[key];
            }
            if (state.currentWrapper) {
                const container = document.getElementById('selection-container');
                container.removeChild(state.currentWrapper);
                state.currentWrapper = null;
                overlay.setFillColor("#fff");
                overlay.setFillOpacity(0.1);
            }
            state.isChecked = false;
        }
    }

    function getRandomColor() {
        const minBrightness = 50;
        const maxBrightness = 200;
        const minSaturation = 50;
        const maxSaturation = 100;
    
        const r = Math.floor(Math.random() * (maxBrightness - minBrightness + 1) + minBrightness);
        const g = Math.floor(Math.random() * (maxBrightness - minBrightness + 1) + minBrightness);
        const b = Math.floor(Math.random() * (maxBrightness - minBrightness + 1) + minBrightness);
    
        return `rgb(${r}, ${g}, ${b})`;
    }

    function svgToUrl(svgText) {
        const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
        const svgUrl = URL.createObjectURL(svgBlob);
        return svgUrl;
    }

function updateMarkerCluster() {
    if (markers.length<200) return
    if (markerClusterer) {
        markerClusterer.clearMarkers();
    }

    markerClusterer = new BMapLib.MarkerClusterer(map, { markers: markers });

    var options = {
        gridSize: 60, 
        maxZoom: 14 
    };

    markerClusterer = new BMapLib.MarkerClusterer(map, markers, options);
}

    async function initSearch() {
        if (Object.keys(selections).length === 0){
            isStarted=false
            displayPopup('未选中任何区域！')
        }
        
        for (const key in selections) {
            const wrapper = document.getElementById(key)
            if (wrapper) {
                const findPanos = [];
                const polygon_label = wrapper.querySelector('span:nth-child(1)')
                const polygon_name = polygon_label.innerText

                const input = wrapper.querySelector('input');
                const needNum = parseInt(input.value ? input.value : 10);
                
                const numberLabel = wrapper.querySelector('span:nth-child(2)')
                var findNum = parseInt(numberLabel.innerText ? numberLabel.innerText : 0);
                
                const motherOverlay=getOverlayByKey(key)
                const grids=await recursiveDividePly(motherOverlay)

                while (findNum < needNum && isStarted) {

                const randomPoints = genPoints(grids, needNum);
                try {
                    const promises = randomPoints.map(async (randomPoint) => {
                        const bd09mcPoint = convertLL2MC(randomPoint.lat, randomPoint.lng);
                        const resultPano = await searchPano(bd09mcPoint[0], bd09mcPoint[1], 12);
            
                        if (resultPano && resultPano.id) {
                            const isChecked = await checkPano(resultPano.id);
            
                            if (isChecked) {
                                const checkPoint = new BMap.Point(isChecked[0], isChecked[1]);
                                const isIn = isInOverlay(checkPoint, motherOverlay);
            
                                let isAccepted = true;
                                if (isIn) {
                                    for (let coord of findPanos) {
                                        const distance = map.getDistance(checkPoint, coord);
                                        if (distance < 2000) {
                                            isAccepted = false;
                                            break;
                                        }
                                    }

                                    if (isAccepted) {
                                        findPanos.push(new BMap.Point(isChecked[0], isChecked[1]));
                                        if (findNum<needNum&&isStarted) {
                                            findNum++
                                            genMarker(isChecked);
                                            extractTag(polygon_name, resultPano, resultPanos.customCoordinates);
                                        }
                                        numberLabel.innerText = findNum;
                                    }
                                }
                            }
                        }
                    });
            
                    await Promise.all(promises);
                } catch (err) {
                    console.error("Error in findAndProcessPoints:", err);
                }
                    }
                }
            }
        
        if (isStarted) {
            isStarted = false
            updateMarkerCluster()
            document.getElementById("export-panel").children[0].innerText = `输出结果 (${resultPanos.customCoordinates.length} 个地点)`
            document.getElementById("pause").style.display = 'none'
            document.getElementById("start").style.display = 'block'
            displayPopup("生成完毕！")
        }
    }

    function getOverlayByKey(key){
        var overlay
         for (let i = 0; i < overlays.length; i++) {
            if (overlays[i].pv && overlays[i].pv.Je === parseFloat(key)) {
                overlay = overlays[i];
                break;
            }
        }
        if (!overlay) {
            throw new Error('Overlay with key ' + key + ' not found.');
        }
        return overlay
    } 

    async function recursiveDividePly(motherPly) {
        async function recursiveCall(overlay, currentL) {
            const { grids, l } = await dividePly(overlay, motherPly);
    
            if (l >= 9) {
                return grids;
            } else {
                const promises = grids.map(async (grid) => {
                    const nextLevelGrids = await recursiveCall(grid, l);
                    return nextLevelGrids || []; 
                });
    
                const results = await Promise.all(promises);
    
                let finalGrids = [];
                results.forEach((nextLevelGrids) => {
                    finalGrids.push(...nextLevelGrids);
                });
    
                return finalGrids;
            }
        }
    
        return await recursiveCall(motherPly, undefined);
    }
    
    async function dividePly(overlay,motherPly) {
        const bounds = overlay.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        const diagonalLength = map.getDistance(new BMap.Point(sw.lng, sw.lat), new BMap.Point(ne.lng, ne.lat));
        let numCols, numRows;
        const thresholds = [
            { max: 4064, gridSize: 1016, l: 14 },
            { max: 7136, gridSize: 1784, l: 13 },
            { max: 21304, gridSize: 5326, l: 12 },
            { max: 67640, gridSize: 16910, l: 11 },
            { max: 109904, gridSize: 27476, l: 10 },
            { max: 159056, gridSize: 39764, l: 9 },
        ];
        
        let defaultThreshold ={ max: 257360, gridSize: 64340, l: 8 }

        let { gridSize, l } = thresholds.find(threshold => diagonalLength <= threshold.max) || defaultThreshold;
    
        numCols = Math.ceil(diagonalLength / gridSize);
        numRows = Math.ceil(diagonalLength / gridSize);
    
        const commonStep = Math.max((ne.lng - sw.lng) / numCols, (ne.lat - sw.lat) / numRows);
    
        const grids = [];
        const tasks = [];
        for (let i = 0; i < numRows; i++) {
            for (let j = 0; j < numCols; j++) {
                const gridSW = new BMap.Point(sw.lng + j * commonStep, sw.lat + i * commonStep);
                const gridNE = new BMap.Point(sw.lng + (j + 1) * commonStep, sw.lat + (i + 1) * commonStep);

                const gridPath = [
                    gridSW,
                    new BMap.Point(gridNE.lng, gridSW.lat),
                    gridNE,
                    new BMap.Point(gridSW.lng, gridNE.lat),
                    gridSW
                ];
                const gridCenter = new BMap.Point((gridSW.lng + gridNE.lng) / 2, (gridSW.lat + gridNE.lat) / 2);
                const vertices = [
                    new BMap.Point(gridSW.lng, gridSW.lat), 
                    new BMap.Point(gridNE.lng, gridSW.lat),
                    new BMap.Point(gridNE.lng, gridNE.lat),
                    new BMap.Point(gridSW.lng, gridNE.lat) 
                ];
    
                let allInside = false;
                for (let i = 0; i < vertices.length; i++) {
                    if (isInOverlay(vertices[i], motherPly)) {
                        allInside = true;
                        break;
                    }
                }
               if(!allInside) continue
    
                const task = (async () => {
                    try {
                        const pano = await searchPano(convertLL2MC(gridCenter.lat, gridCenter.lng)[0], convertLL2MC(gridCenter.lat, gridCenter.lng)[1], l);
                        if (!pano || !pano.id) return null;
                        const isChecked = await checkPano(pano.id);
                        if (!isChecked) return null;
                        return new BMap.Polygon(gridPath);
                    } catch (error) {
                        console.error('Error processing grid:', error);
                        return null;
                    }
                })();

        tasks.push(task);
            }
        }
        const results = await Promise.all(tasks);
        results.filter(grid => grid !== null).forEach(grid => {grids.push(grid)});

        return {grids,l};
    }

    function genPoints(overlays, num) {
        const randomPoints = [];
        var genNum = Math.min(num * 100, 1000)/overlays.length;
        overlays.forEach(overlay => {
            const path = overlay.getPath();
            if (path.length < 3) {
                throw new Error("Polygon must have at least 3 points.");
            }
    
            const latitudes = path.map(point => point.lat);
            const longitudes = path.map(point => point.lng);
    
            const minLat = Math.min(...latitudes);
            const maxLat = Math.max(...latitudes);
            const minLng = Math.min(...longitudes);
            const maxLng = Math.max(...longitudes);
    
            for (let i = 0; i < genNum; i++) {
                let randomPoint;
    
                do {
                    const randomLat = Math.asin(
                        Math.random() * (Math.sin(maxLat * Math.PI / 180) - Math.sin(minLat * Math.PI / 180)) + Math.sin(minLat * Math.PI / 180)
                    ) * 180 / Math.PI;
                    const randomLng = minLng + Math.random() * (maxLng - minLng);
                    randomPoint = new BMap.Point(randomLng, randomLat);
                } while (!isInOverlay(randomPoint, overlay));
    
                randomPoints.push(randomPoint);
            }
        });
        randomPoints.sort(() => Math.random() - 0.5);
        return randomPoints;
    }


        function isInOverlay(point, overlay) {
        if (!(point instanceof BMap.Point)) {
            throw new Error('point should be an instance of BMap.Point');
        }
        if (overlay instanceof BMap.Bounds) {
            return overlay.containsPoint(point);
        } else if (overlay instanceof BMap.Polygon) {
            return BMapLib.GeoUtils.isPointInPolygon(point, overlay)
        } else {
            throw new Error('Unsupported overlay type');
        }
    }
    
    function genMarker(pano) {
    
        const marker = new BMap.Marker(new BMap.Point(pano[0], pano[1]), {
            icon: new BMap.Icon(pinUrl, new BMap.Size(25, 25), {
                imageOffset: new BMap.Size(0, 0),
                anchor: new BMap.Size(0, 12.5)
            })
        });
        map.addOverlay(marker);
        markers.push(marker);
    
        const svLink = `https://map.baidu.com/@13057562,4799985#panoid=${pano[3]}&panotype=street&heading=${pano[2]}&pitch=0&l=21&tn=B_NORMAL_MAP&sc=0&newmap=1&shareurl=1&pid=${pano[3]}`;
        marker.addEventListener("click", function () {
            window.open(svLink, '_blank');
        });
                    
    }
    
    function extractTag(name, pano, pool) {
        var rN = pano.RoadName
        if (rN === "") rN = "未知道路"
        const region_code = pano.id.substring(2, 6)
        const type1 = pano.id.substring(6, 10)
        const type2 = pano.id.substring(0, 2) + "_" + pano.id.substring(25, 27)
        const year = parseInt(pano.id.substring(10, 12)).toString() + '年'
        const month = parseInt(pano.id.substring(12, 14)).toString() + '月'
        pool.push({ panoId: pano.id, source: "baidu_pano", extra: { "tags": [name, region_code, rN, type1, type2, year, month] } })
    }

    async function searchPano(x, y, l) {
        const url = `https://mapsv0.bdimg.com/?qt=qsdata&x=${x}&y=${y}&l=${l}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            if (data.content.id) {
                return data.content
            }
            else {
                return false
            }
        } catch (error) {
            return false
        }
    }

    function checkPano(id) {
        return new Promise((resolve, reject) => {
            const url = `https://mapsv0.bdimg.com/?qt=sdata&sid=${id}`;
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    try {
                        if (data.result.error !== 404) {
                            resolve([...convertMC2LL(data.content[0].X / 100, data.content[0].Y / 100), data.content[0].Heading, id])
                        }
                        else {
                            resolve(false)
                        }
                    }
                    catch (error) {
                        resolve(false)
                    }
                })
                .catch(error => {
                    console.error('Request failed:', error);
                    reject(error);
                });
        });
    }


    async function getTiles(id) {
        const url = `https://mapsv1.bdimg.com/?qt=sdata&sid=${id}`;
        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            if (data.content[0]) {
                return data.content[0].ImgLayer;
            }
        } catch (error) {
            console.error('Fetch error:', error);
        }
    }

    initMap()
})();
