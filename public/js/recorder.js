var btn_undo = document.getElementById( 'btn_undo' );
btn_undo.addEventListener( 'click', function ( event ) {
    rec.undo();
}, false );

var btn_redo = document.getElementById( 'btn_redo' );
btn_redo.addEventListener( 'click', function ( event ) {
    rec.redo();
}, false );

var btn_save = document.getElementById( 'btn_save' );
btn_save.addEventListener( 'click', function ( event ) {
    rec.save();
}, false );

//--------handle load btn--------------------------
var btn_load = document.getElementById( 'btn_load' );
btn_load.style.cursor = "pointer";
btn_load.addEventListener( 'change', function ( event ) {
    rec.load(event);
}, false );

var btn_load_show = document.getElementById( 'btn_load_show' );
btn_load.addEventListener( 'mouseover', function ( event ) {
    btn_load_show.style.color = "rgba(0,255,255,0.75)";
    btn_load_show.style.backgroundColor = "rgba(0,255,255,0.5)";
}, false );

btn_load.addEventListener( 'mouseout', function ( event ) {
    btn_load_show.style.color = "rgba(0,255,255,0.75)";
    btn_load_show.style.backgroundColor = "rgba(0,255,255,0)";
}, false );

btn_load.addEventListener( 'mousedown', function ( event ) {
    btn_load_show.style.color = "#000000";
    btn_load_show.style.backgroundColor = "rgba(0,255,255,0.75)";
}, false );

btn_load.addEventListener( 'mouseup', function ( event ) {
    btn_load_show.style.color = "rgba(0,255,255,0.75)";
    btn_load_show.style.backgroundColor = "rgba(0,255,255,0.5)";
}, false );

//--------handle upload btn--------------------------
var btn_upload = document.getElementById( 'btn_upload' );
btn_upload.style.cursor = "pointer";
btn_upload.addEventListener( 'change', function ( event ) {
    rec.upload(event);
}, false );

var btn_upload_show = document.getElementById( 'btn_upload_show' );
btn_upload.addEventListener( 'mouseover', function ( event ) {
    btn_upload_show.style.color = "rgba(0,255,255,0.75)";
    btn_upload_show.style.backgroundColor = "rgba(0,255,255,0.5)";
}, false );

btn_upload.addEventListener( 'mouseout', function ( event ) {
    btn_upload_show.style.color = "rgba(0,255,255,0.75)";
    btn_upload_show.style.backgroundColor = "rgba(0,255,255,0)";
}, false );

btn_upload.addEventListener( 'mousedown', function ( event ) {
    btn_upload_show.style.color = "#000000";
    btn_upload_show.style.backgroundColor = "rgba(0,255,255,0.75)";
}, false );

btn_upload.addEventListener( 'mouseup', function ( event ) {
    btn_upload_show.style.color = "rgba(0,255,255,0.75)";
    btn_upload_show.style.backgroundColor = "rgba(0,255,255,0.5)";
}, false );

//--------------------------------------------------



var btn_print = document.getElementById( 'btn_print' );
btn_print.addEventListener( 'click', function ( event ) {
    rec.print();
}, false );


function recorder(){

    var rec_stack = [];
    var pointer = -1;
    var max_pointer = -1;
    var user_id = "";

    this.setUser_id = function(name){
        user_id = name;
    }

    this.record = function(is_load){//is_load: 若是載入檔案而記錄的話,不需要做log
        var camera_target = controls.getTarget();
        var camera_pos = controls.getPosition();
        var camera_zoom = controls.getZoom();
        var show_point = params.show_point;
        var color_depth = params.color_depth;
        var exposure = params.exposure;
        var main_opacity = params.opacity;
        var obj_params = JSON.parse(JSON.stringify(objParams));
        var single_exist = JSON.parse(JSON.stringify(exist)); //record the neuron's and group's statement
        var single_number = singleParams['Number'];
        var group_neuron_exist = JSON.parse(JSON.stringify(group_exist)); //record the neuron's and group's statement
        var group_number = groupCustomParams['Number'];

        var tmp = {
            camera_pos: camera_pos,
            camera_target: camera_target,
            camera_zoom: camera_zoom,
            show_point: show_point,
            color_depth: color_depth,
            exposure: exposure,
            main_opacity: main_opacity,
            objParams: obj_params,
            single_exist: single_exist,
            single_number: single_number,
            group_exist: group_neuron_exist,
            group_number: group_number,
            highlight_number: now_highlight,
            is_highlight: is_highlight
        };

        if(rec_stack.length == pointer+1) {
            rec_stack.push(tmp);

        }
        else{
            rec_stack[pointer+1] = tmp;
        }

        if(pointer>=0 && !is_load){
            logParser(rec_stack[pointer+1],rec_stack[pointer]);
        }else if(!is_load){
            Log_in();
        }

        pointer++;
        max_pointer = pointer;



    }

    this.camera_state = function(){
        if(pointer < 0)return null;

        var now_stack = rec_stack[pointer];
        return { camera_target: now_stack.camera_target, camera_pos: now_stack.camera_pos, camera_zoom: now_stack.camera_zoom};
    }

    this.undo = function(){
        if(pointer > 0){
            pointer--;
            set_control(rec_stack[pointer]);
            logParser(rec_stack[pointer],rec_stack[pointer+1],"UNDO");
        }
    }

    this.redo = function(){
        if(pointer < max_pointer){
            pointer++;
            set_control(rec_stack[pointer]);
            logParser(rec_stack[pointer],rec_stack[pointer-1],"REDO");
        }
    }

    this.update = function(){


    }

    this.save = function(){
        var out_text = JSON.stringify(rec_stack[pointer]);
        var blob = new Blob([out_text], {type: "text/plain;charset=utf-8"});
        var Today =new Date();
        var filename = "FlyBrain27000_record_"+Today.getFullYear()+"_"+(Today.getMonth()+1)+"_"+Today.getDate()+"_"+Today.getHours()+"_"+Today.getMinutes()+"_"+Today.getSeconds()+".txt";

        saveAs(blob, filename);
        var msg = {userid: user_id , content: "Saved the state."};
        socket.emit('write_file', msg);
    }

    this.load = function(evt){
        var file = evt.target.files[0];
        var reader = new FileReader();
        reader.onloadend = function(event) {
            if (event.target.readyState == FileReader.DONE) {
                var result = event.target.result;
                var i = result.indexOf("{");
                if(i == -1){
                    alert("File format is not correct!");
                    return;
                }
                var sub_result = result.substring(i);
                try {
                    var set = JSON.parse(sub_result);
                    set_control(set);
                    rec.record(true);
                    var msg = {userid: user_id , content: "Loaded the state.\r\n" + sub_result};
                    socket.emit('write_file', msg);

                }catch(e) {
                    alert(e);
                }
            }
        };

        var blob = file.slice(0, file.size);
        reader.readAsBinaryString(blob);
        btn_load.value = "";

    }

    this.upload = function(evt){
        var file = evt.target.files[0];
        var reader = new FileReader();
        reader.onloadend = function(event) {
            if (event.target.readyState == FileReader.DONE) {
                var result = event.target.result;
                var i = result.indexOf("{");
                if(i == -1){
                    alert("File format is not correct!");
                    return;
                }
                var sub_result = result.substring(i);
                //字串處理成伺服器可讀格式
                var manage_string = "[\r\n\t";
                for(var i = 0;i<sub_result.length;i++){
                    manage_string += sub_result.charAt(i);
                    if(sub_result.charAt(i) == '}' && sub_result.length-i > 10)manage_string += ',';
                }
                manage_string += "]";

                try {
                    eval('var JSONencode_result='+manage_string+';');
                    var msg = {content: JSONencode_result};
                    socket.emit('upload_group',msg);
                }catch(e) {
                    alert(e);
                }
            }
        };

        var blob = file.slice(0, file.size);
        reader.readAsBinaryString(blob);
        btn_upload.value = "";

    }

    this.print = function(){

        var renderer2 = new THREE.WebGLRenderer( { antialias: true , alpha: true, preserveDrawingBuffer: true} );
        renderer2.setClearColor( new THREE.Color( 0x000000 ) );
        renderer2.setSize( 1920, 1080 );
        renderer2.domElement.style.position = 'absolute';
        renderer2.domElement.style.top = 0;
        renderer2.toneMappingExposure = 1;
        renderer2.gammaInput = true;
        renderer2.gammaOutput = true;

        var camera2 = camera.clone();
        camera2.aspect = 1920 / 1080;
        camera2.updateProjectionMatrix();
        renderer2.render( scene, camera2 );
        console.log(camera);
        console.log(camera2);
        THREEx.Screenshot.bindKey(renderer2);
        return false;
    }

    function Log_in(){
        var msg = {userid: user_id , content: "Logged in"};
        socket.emit('write_file',msg);
    }

    function set_control(now_stack){

        controls.setTo(now_stack.camera_target,now_stack.camera_pos, now_stack.camera_zoom);

        params.show_point = now_stack.show_point;
        controlPanel.change_showPoint(params.show_point);

        params.color_depth = now_stack.color_depth;
        controlPanel.change_colorDepth(params.color_depth);

        params.exposure = now_stack.exposure;
        controlPanel.change_exposure(params.exposure);

        params.opacity = now_stack.main_opacity;
        controlPanel.change_mainShell_opacity(params.opacity);

        objParams.opacity = now_stack.objParams.opacity;
        controlPanel.change_all_neuropil_opacity(objParams.opacity);

        is_highlight = now_stack.is_highlight;
        if(is_highlight)set_highlight(now_stack.highlight_number);
        else set_highlight(0);

        //neuropil
        for(var key in now_stack.objParams){
            controlPanel.change_neuropil_visible(key,now_stack.objParams[key]);
        }

        //single neuron
        for(var key in exist){
            if(now_stack.single_exist[key] && !exist[key]){
                controlPanel.add_singleNeuron(key);
            }else if(!now_stack.single_exist[key] && exist[key]){
                controlPanel.delete_singleNeuron(key);
            }
        }
        for(var key in now_stack.single_exist){
            if(now_stack.single_exist[key] && !exist[key]){
                controlPanel.add_singleNeuron(key);
            }else if(!now_stack.single_exist[key] && exist[key]){
                controlPanel.delete_singleNeuron(key);
            }
        }
        singleParams['Number'] = now_stack.single_number;
        controlPanel.SingleNeuronPage_number.updateDisplay();

        //group neuron
        for(var key in group_exist){
            if(!(now_stack.group_exist[key]===undefined) && group_exist[key]===undefined){
                controlPanel.add_group(key,now_stack.group_exist[key]);
            }else if((now_stack.group_exist[key]===undefined) && !(group_exist[key]===undefined)){
                controlPanel.delete_group(key);
            }
        }
        for(var key in now_stack.group_exist){
            if(!(now_stack.group_exist[key]===undefined) && group_exist[key]===undefined){
                controlPanel.add_group(key,now_stack.group_exist[key]);
            }else if(now_stack.group_exist[key]===undefined && !(group_exist[key]===undefined)){
                controlPanel.delete_group(key);
            }
        }
        groupCustomParams['Number'] = now_stack.group_number;
        controlPanel.GroupCustomPage_number.updateDisplay();
    }


    function logParser(nowLog,preLog,exmsg){

        var msg = {userid: user_id , content: ""};

        if(!nowLog.camera_pos.equals(preLog.camera_pos) || !nowLog.camera_target.equals(preLog.camera_target)){
            msg.content = "Set camera position to " + vec3toString(nowLog.camera_pos) + ", camera target to " + vec3toString(nowLog.camera_target);
        }

        if(nowLog.show_point != preLog.show_point){
            if(nowLog.show_point)
                msg.content = "show_point Opened";
            else{
                msg.content = "show_point closed";
            }
        }

        if(nowLog.color_depth != preLog.color_depth){
            if(nowLog.color_depth)
                msg.content = "color_depth opened";
            else{
                msg.content = "color_depth closed";
            }
        }

        if(nowLog.exposure != preLog.exposure){
            msg.content = "Set exposure to " + nowLog.exposure;
        }

        if(nowLog.main_opacity != preLog.main_opacity){
            msg.content = "Set main opacity to " + nowLog.main_opacity;
        }

        var aa  = 0;
        for(key in nowLog.objParams){
            if(nowLog.objParams[key] != preLog.objParams[key]){

                if(key == 'opacity'){
                    msg.content = "Set neuropil opacity to " + nowLog.objParams[key];
                }else {
                    aa++;
                    if (nowLog.objParams[key])msg.content = "Show neuropil \"" + key + "\"";
                    else msg.content = "Hide neuropil \"" + key + "\"";
                }
            }
        }
        if(aa > 1){
            if(nowLog.objParams['sog_l'])msg.content = "Show all neuropils";
            else msg.content = "Hide all neuropils";
        }

        //single neuron
        for(var key in nowLog.single_exist){
            if(nowLog.single_exist[key] && !preLog.single_exist[key]){
                msg.content += "Show single neuron \"" + key + "\", ";
            }else if(!nowLog.single_exist[key] && preLog.single_exist[key]){
                msg.content += "Hide single neuron \"" + key + "\", ";
            }
        }

        //group neuron
        for(var key in nowLog.group_exist){
            if(nowLog.group_exist[key] && !preLog.group_exist[key]){
                msg.content += "Show neuron group \"" + key + "\", ";
            }else if(!nowLog.group_exist[key] && preLog.group_exist[key]){
                msg.content += "Hide neuron group \"" + key + "\", ";
            }
        }

        if(nowLog.is_highlight != preLog.is_highlight || nowLog.is_highlight && nowLog.highlight_number!=preLog.highlight_number){
            if(nowLog.is_highlight){
                msg.content = "Set highlight to neuron \"" + nowLog.highlight_number + "\"";
            }else{
                msg.content = "Highlight Closed";
            }
        }


        if(exmsg){
            msg.content = "<" + exmsg + "> " + msg.content;
        }
        socket.emit('write_file',msg);
    }

    function vec3toString(v){
        return '['+v.x.toFixed(2) +','+v.y.toFixed(2)+','+v.z.toFixed(2)+']';
    }


};
