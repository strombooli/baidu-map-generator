(function () {
    let map,drawingManager,panoramaLayer,popup
    let isStarted = false
    let selections = {}
    let overlayStates = {};
    let overlays=[]
    let markers=[]
    let manualPick=[]
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

    var x_pi=3.14159265358979324 * 3000.0 / 180.0;
    function gcjToBd(mars_point){
        var baidu_point={lng:0,lat:0};
        var x=mars_point.lon;
        var y=mars_point.lat;
        var z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * x_pi);
        var theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * x_pi);
        baidu_point.lng = z * Math.cos(theta) + 0.0065;
        baidu_point.lat = z * Math.sin(theta) + 0.006;
        return baidu_point;
    }

    var pi = 3.14159265358979324;
    var a = 6378245.0;
    var ee = 0.00669342162296594323;

    function outOfChina(lon, lat)
    {
        if ((lon < 72.004 || lon > 137.8347)&&(lat < 0.8293 || lat > 55.8271)){
            return true;
        }else {
            return false;
        }
    }
    function transformLat(x,y)
    {
        var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(y * pi) + 40.0 * Math.sin(y / 3.0 * pi)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(y / 12.0 * pi) + 320 * Math.sin(y * pi / 30.0)) * 2.0 / 3.0;
        return ret;
    }
     
    function transformLon(x,y)
    {
        var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(x * pi) + 40.0 * Math.sin(x / 3.0 * pi)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(x / 12.0 * pi) + 300.0 * Math.sin(x / 30.0 * pi)) * 2.0 / 3.0;
        return ret;
    }
     
    function wgsToGcj(wgLat,wgLon){
        var mars_point={lon:0,lat:0};
        if (outOfChina(wgLat, wgLon))
        {
            mars_point.lat = wgLat;
            mars_point.lon = wgLon;
            return;
        }
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
        return mars_point
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

    const extractCoordinates = (coords) => {
        return coords.flatMap(polygon =>
            polygon.flatMap(subPolygon =>
                subPolygon.map(coordinatePair => 
                    [coordinatePair[0], coordinatePair[1]] 
                )
            )
        );
    };

    if (geojson.features) {
        geojson.features.forEach(feature => {
            if (feature.geometry && feature.geometry.coordinates) {
                const coordinates = extractCoordinates(feature.geometry.coordinates);
                const marsCoordinates = coordinates.map(coord => {
                    const [lat, lng] = coord;
                    return coordinateSystem === '2' 
                        ? gcjToBd(wgsToGcj(lat, lng)) 
                        : gcjToBd({"lat":lat,"lon":lng});
                });
                results.push(...marsCoordinates);
            } else {
                console.error('Invalid feature geometry.');
                alert('Invalid feature geometry!');
            }
        });
    } else if (geojson.coordinates) {
        const coordinates = extractCoordinates(geojson.coordinates);
        const marsCoordinates = coordinates.map(coord => {
            const [lat, lng] = coord;
            return coordinateSystem === '2' 
                ? gcjToBd(wgsToGcj(lat, lng)) 
                : gcjToBd({"lat":lat,"lon":lng});
        });
        results.push(...marsCoordinates);
    } else if (geojson.geometry && geojson.geometry.coordinates) {
        const coordinates = extractCoordinates(geojson.geometry.coordinates);
        const marsCoordinates = coordinates.map(coord => {
            const [lat, lng] = coord;
            return coordinateSystem === '2' 
                ? gcjToBd(wgsToGcj(lat, lng)) 
                : gcjToBd({"lat":lat,"lon":lng});
        });
        results.push(...marsCoordinates);
    } else {
        console.error('Invalid GeoJSON format.');
        alert('Invalid GeoJSON format!');
    }

    return results;
}

    function initMap() {
        map = new BMap.Map("baidu-map",{enableCopyrightControl: false});
        const point = new BMap.Point(108.404, 33.915);
        map.centerAndZoom(point, 5);
        map.addControl(new BMap.MapTypeControl());
        map.enableScrollWheelZoom(true);
        panoramaLayer = new BMap.PanoramaCoverageLayer();
        map.addTileLayer(panoramaLayer);
        loadDrawingTool()

        document.getElementById("start").onclick = () =>{
            isStarted=true
            if (Object.keys(selections).length === 0){
                displayPopup('未选中任何区域！')
                isStarted=false
                return
            }
            initSearch()
            document.getElementById("start").style.display = 'none'
            document.getElementById("pause").style.display = 'block'
        }

        document.getElementById("pause").onclick = () =>{
            isStarted=false
            document.getElementById("pause").style.display = 'none'
            document.getElementById("start").style.display = 'block'
        }

        document.getElementById("erase").onclick = () =>{
            resultPanos.customCoordinates=[]
            manualPick=[]
            document.getElementById("export-panel").children[0].innerText = `输出生成结果`
        }
        document.getElementById("clear").onclick = () =>{
            for (var i = 0; i < markers.length; i++) {
                map.removeOverlay(markers[i]);
            }
        }
        document.getElementById("remove").onclick = () =>{
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
        document.getElementById("manual-export").onclick = () =>{
            resultPanos.customCoordinates.push(...manualPick)
            document.getElementById("export-panel").children[0].innerText = `输出生成结果 (${resultPanos.customCoordinates.length} 个地点)`
            displayPopup("手选点已添加至输出！")}

        document.getElementById("select-all").onclick = () => {
            const container = document.getElementById('selection-container');
            if (overlays.length === 0) {
                return; 
            } 
            else{
                overlays.forEach(function(overlay) {
                    const currentOpacity=overlay.K.Eg
                    if (currentOpacity!=0.5){
                        const key=overlay.ov.Me
                        const state = overlayStates[key];
                        state.isChecked=true
                        if(!selections[key]){
                            selections[key]=overlay.getPath()
                        }
                        const color = getRandomColor();
                        overlay.setFillColor(color);
                        overlay.setFillOpacity('0.5');
                        state.currentWrapper = addInputElement(
                            overlay instanceof BMap.Circle ? "圆形" : "多边形",
                            container,
                            color,
                            key
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
            else{
                overlays.forEach(function(overlay) {
                    const currentOpacity=overlay.K.Eg
                    const key=overlay.ov.Me
                    const state = overlayStates[key];
                    if (currentOpacity!=0.1){
                        state.currentWrapper = null;
                        state.isChecked=false
                        const wrapper=document.getElementById(key)
                        container.removeChild(wrapper)
                        if(selections[key]){
                            delete selections[key]
                        }
                        const color = getRandomColor();
                        overlay.setFillColor('#fff');
                        overlay.setFillOpacity('0.1');
                    }
                    else{
                        state.isChecked=true
                        if(!selections[key]){
                            selections[key]=overlay.getPath()
                        }
                        const color = getRandomColor();
                        overlay.setFillColor(color);
                        overlay.setFillOpacity('0.5');
                        state.currentWrapper = addInputElement(
                            overlay instanceof BMap.Circle ? "圆形" : "多边形",
                            container,
                            color,
                            key
                        );
                    }
                })
        }
    }

    document.getElementById("import-geojson").onclick = () =>{
         const fileInput = document.getElementById('geojsonFile');
            fileInput.click();

            fileInput.onchange = () => {
                const file = fileInput.files[0]
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const geojsonData = JSON.parse(event.target.result);
                        var coordinateSystem='1'
                        coordinateSystem = prompt(`请选择坐标系:\n 1：火星坐标GCJ-02（国内默认） 2：WGS-84（国际通用）`);
                        const boundaryPath = processGeoJSON(geojsonData, coordinateSystem);
                        const points=[]
                        boundaryPath.forEach(coord => {
                            points.push(new BMap.Point(coord.lat, coord.lng))
                        });
                        const polygon = new BMap.Polygon(points, { strokeColor: "#ff0000", strokeWeight: 2, fillOpacity: "0.1",fillColor:"#fff" });
                        map.addOverlay(polygon);
                        handleOverlay(polygon) 
                        fileInput.files=null
                    };
                    reader.readAsText(file);
                } else {
                    displayPopup('请上传一个 GeoJSON 文件。');
                }
            };
    }


        loadExportPanel()
        var customSvControl = new StreetViewControl();    
        map.addControl(customSvControl);
    }

    function StreetViewControl() {    

        this.defaultAnchor = BMAP_ANCHOR_TOP_RIGHT;    
        this.defaultOffset = new BMap.Size(115, 5);    
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
        
        div.onclick = function(e) { 
            if (panoramaLayer) {
                    map.removeTileLayer(panoramaLayer);
                    panoramaLayer=null
                    div.style.color="#000000"
                    div.style.background="rgb(255, 255, 255)"
                    div.style.font="12px arial,sans-serif"
                } else {
                    panoramaLayer = new BMap.PanoramaCoverageLayer();
                    map.addTileLayer(panoramaLayer);
                    div.style.font = "bold 12px / 1.3em Arial, sans-serif"
                    div.style.color="rgb(255, 255, 255)"
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
            console.log("复制成功")
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
        if (!popup){
            popup = document.createElement('div');
            popup.className='popup'
            document.body.appendChild(popup);
        }
            popup.innerHTML = text
        popup.style.display = 'block';
        setTimeout(() => {
            popup.style.display = 'none';
        }, 2000);
    }

    function addInputElement(labelText, container, color, key) {
        const existingWrappers = container.getElementsByTagName('div').length

        const wrapper = document.createElement('div');
        wrapper.style.marginBottom = '5px';
        wrapper.id = key
        wrapper.className = 'wrapper'

        const selectionLabel = document.createElement('span');
        selectionLabel.innerText = '选中' + labelText + `区域${existingWrappers+1}`;
        selectionLabel.style.color = color
        selectionLabel.style.marginLeft = '20px'
        selectionLabel.style.marginRight = '50px'

        selectionLabel.addEventListener('click', () => {
            const newText = prompt('修改选中区域的名称:', selectionLabel.innerText);
            if (newText != null && newText != '') {
                selectionLabel.innerText = newText;
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
            strokeColor: "black",
            strokeWeight: 2,
            strokeOpacity: 0.8,
            fillOpacity: 0.1,
            fillColor: "#fff",
            strokeStyle: 'solid'
        }

        drawingManager = new BMapLib.DrawingManager(map, {
            isOpen: false,
            enableDrawingTool: true,
            drawingToolOptions: {
                anchor: BMAP_ANCHOR_TOP_LEFT,
                offset: new BMap.Size(0, 0),
                drawingModes: [
                    BMAP_DRAWING_MARKER,
                    BMAP_DRAWING_CIRCLE,
                    BMAP_DRAWING_POLYLINE,
                    BMAP_DRAWING_POLYGON,
                    BMAP_DRAWING_RECTANGLE
                ]
            },
            polygonOptions: styleOptions,
            rectangleOptions: styleOptions,
            circleOptions: styleOptions,
            polylineOptions: styleOptions,
            markerOptions: {
                icon: new BMap.Icon(pinUrl, new BMap.Size(25, 25),{
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

    function handleOverlay(overlay) {
        if (overlay instanceof BMap.Marker) {
            const coord= overlay.getPosition();
            handleMarkerOverlay(overlay, coord);
        }
        else{
            const container = document.getElementById('selection-container');
            const key = overlay.ov.Me;
            const bounds = overlay.getPath();
            
            overlays.push(overlay);
            
            overlayStates[key] = { isChecked: false, currentWrapper: null };
        
    
            if (overlay instanceof BMap.Circle || overlay instanceof BMap.Polygon) {
                handleShapeOverlay(overlay, bounds, key, container);
            }
    
            else if (overlay instanceof BMap.Polyline) {
                handlePolylineOverlay(overlay, bounds, key, container);
            }
            }
    }
    
    function handleMarkerOverlay(marker, coord){
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
    
    function handleShapeOverlay(overlay, bounds, key, container) {
        const state = overlayStates[key];
        drawingManager.close();
        
        overlay.addEventListener("click", function() {
            toggleShapeSelection(overlay, state, bounds, key, container);
        });
    }
    
    function handlePolylineOverlay(overlay, bounds, key, container) {
        const state = overlayStates[key];
        drawingManager.close();
    
        const points = overlay.getPath();
        const polygon = new BMap.Polygon(points, {
            strokeColor: "black",
            fillColor: "#fff",
            fillOpacity: 0.1,
            strokeWeight: 2
        });
    
        map.addOverlay(polygon);
        overlay.remove();
        overlays.pop();
        overlays.push(polygon);
    
        polygon.addEventListener("click", function() {
            toggleShapeSelection(polygon, state, bounds, key, container);
        });
    }
    
    function toggleShapeSelection(overlay, state, bounds, key, container) {
        if (!state.isChecked) {
            if (!selections[key]) {
                selections[key] = bounds;
            }
            const color = getRandomColor();
            overlay.setFillColor(color);
            overlay.setFillOpacity(0.5);
            state.currentWrapper = addInputElement(
                overlay instanceof BMap.Circle ? "圆形" : "多边形",
                container,
                color,
                key
            );
            state.isChecked = true;
        } else {
            if (selections[key]) {
                delete selections[key];
            }
            if (state.currentWrapper) {
                container.removeChild(state.currentWrapper);
                state.currentWrapper = null;
                overlay.setFillColor("#fff");
                overlay.setFillOpacity(0.1);
            }
            state.isChecked = false;
        }
    }
    
    function getRandomColor() {
        const r = Math.floor(Math.random() * 128 + 127);
        const g = Math.floor(Math.random() * 128 + 127);
        const b = Math.floor(Math.random() * 128 + 127);

        return `rgb(${r}, ${g}, ${b})`;
    }

    function svgToUrl(svgText) {
        const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
        const svgUrl = URL.createObjectURL(svgBlob);
        return svgUrl;
    }

    function convertCoord(point) {
        var x_pi = 3.14159265358979324 * 3000.0 / 180.0
        var x = point.lng,
            y = point.lat;
        var z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * x_pi);
        var theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * x_pi);
        point.lng = (z * Math.cos(theta) + 0.0065).toFixed(5);
        point.lat = (z * Math.sin(theta) + 0.006).toFixed(5);
        return point;
    };

    async function initSearch() {
            for (const key in selections) {
                const wrapper = document.getElementById(key)
                if (wrapper) {
                    const polygon_label = wrapper.querySelector('span:nth-child(1)')
                    const polygon_name = polygon_label.innerText
                    const bounds = selections[key]
                    const input = wrapper.querySelector('input');
                    const needNum = parseInt(input.value ? input.value : 0);
                    const numberLabel = wrapper.querySelector('span:nth-child(2)')
                    var findNum = parseInt(numberLabel.innerText ? numberLabel.innerText : 0);
                    const aroundPoints = []
                        while (findNum < needNum&&isStarted) {
                            const aroundPoint = genPoints(bounds);
                            const bd09mcPoint=convertLL2MC(aroundPoint.lat, aroundPoint.lng)
                            const resultPano=await searchPano(bd09mcPoint[0],bd09mcPoint[1],15)
                            if(!resultPano||!resultPano.id) continue
                            
                            const isChecked=await checkPano(resultPano.id)
                            if (!isChecked) continue
                            else{
                                extractTag(polygon_name,resultPano,resultPanos.customCoordinates)
                                findNum+=1
                                numberLabel.innerText=findNum
                                const marker = new BMap.Marker(new BMap.Point(isChecked[0], isChecked[1]), {
                                    icon: new BMap.Icon(pinUrl, new BMap.Size(25, 25), {
                                        imageOffset: new BMap.Size(0, 0),
                                        anchor: new BMap.Size(0, 12.5)
                                    })
                                });
                                if(marker) {
                                    map.addOverlay(marker)
                                    markers.push(marker)
                                    const svLink=`https://map.baidu.com/@13057562,4799985#panoid=${isChecked[3]}&panotype=street&heading=${isChecked[2]}&pitch=0&l=21&tn=B_NORMAL_MAP&sc=0&newmap=1&shareurl=1&pid=${isChecked[3]}`
                                    marker.addEventListener("click",function(){
                                        window.open(svLink, '_blank');})
                                }
                            }
                        }
                }
            }
            if(isStarted){
                isStarted=false
                document.getElementById("export-panel").children[0].innerText = `输出生成结果 (${resultPanos.customCoordinates.length} 个地点)`
                document.getElementById("pause").style.display = 'none'
                document.getElementById("start").style.display = 'block'
                displayPopup("生成完毕！")
        }
    }


    function genPoints(path) {
        if (path.length < 3) {
            throw new Error("Polygon must have at least 3 points.");
        }

        const latitudes = path.map(point => point.lat);
        const longitudes = path.map(point => point.lng);

        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const minLng = Math.min(...longitudes);
        const maxLng = Math.max(...longitudes);

        let randomPoint;

        do {
            const g = maxLat;
            const h = minLat;
            const randomLat = Math.asin(
                Math.random() * (Math.sin(g * Math.PI / 180) - Math.sin(h * Math.PI / 180)) + Math.sin(h * Math.PI / 180)
            ) * 180 / Math.PI;
            const randomLng = minLng + Math.random() * (maxLng - minLng);
            randomPoint = { lng: randomLng, lat: randomLat };
        } while (!isInPolygon(randomPoint, path));

        return randomPoint;
    }

    function isInPolygon(point, polygon) {
        let isInside = false;
        const { lng, lat } = point;

        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const { lng: lng1, lat: lat1 } = polygon[i];
            const { lng: lng2, lat: lat2 } = polygon[j];

            if ((lat1 > lat) !== (lat2 > lat) &&
                (lng < (lng2 - lng1) * (lat - lat1) / (lat2 - lat1) + lng1)) {
                isInside = !isInside;
            }
        }
        return isInside;
    }

    function extractTag(name,pano,pool){
        var rN=pano.RoadName
        if (rN==="")rN="EMPTYRDNAME"
        const region_code=pano.id.substring(2,6)
        const type1=pano.id.substring(6,10)
        const type2=pano.id.substring(0,2)+"_"+pano.id.substring(25,27)
        const year=parseInt(pano.id.substring(10,12)).toString()+'年'
        const month=parseInt(pano.id.substring(12,14)).toString()+'月'
        pool.push({panoId:pano.id,source: "baidu_pano",extra:{"tags":[name,region_code,rN,type1,type2,year,month]}})
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
                            resolve([...convertMC2LL(data.content[0].X / 100, data.content[0].Y / 100),data.content[0].Heading,id])
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
