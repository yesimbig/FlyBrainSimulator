controlPanels = function() {

    this.GroupCustomPage_number;
    this.SingleNeuronPage_number;

    this.change_exposure =  function (value) {
        renderer.toneMappingExposure = value;
    }

    this.change_mainShell_opacity = function(value) {
        BackMaterial[0].opacity = value;
        FrontMaterial[0].opacity = value;
    }

    this.change_all_neuropil_opacity = function(value) {
        for (var i = 1; i < Materialnum; i++) {
            BackMaterial[i].opacity = value;
            FrontMaterial[i].opacity = value;
        }
    }

    this.change_neuropil_visible = function(name, value) {
        if (value != true && value != false)return;
        scene.getObjectByName(name).visible = value;
    }

    this.change_all_neuropil_visible = function (value) {
        for (var f in objParams) {
            if (objParams[f] != true && objParams[f] != false)continue;
            objParams[f] = value;
            this.change_neuropil_visible(f, value);
        }
    }

    this.change_showPoint = function(value) {
        for (var key in exist) {
            if (scene.getObjectByName("_p" + key)) {
                scene.getObjectByName("_p" + key).visible = value;
                scene.getObjectByName("_ps" + key).visible = value;
            }
        }

        for (var key in group_exist) {
            if (!(groupMember[key] === undefined)) {
                for (var i = 0; i < groupMember[key].length; i++) {
                    if (scene.getObjectByName("_p" + groupMember[key][i])) {
                        scene.getObjectByName("_p" + groupMember[key][i]).visible = value;
                        scene.getObjectByName("_ps" + groupMember[key][i]).visible = value;
                    }
                }
            }
        }
    }

    this.change_colorDepth = function(value) {
        for (var key in MaterialList) {
            MaterialList[key].meshLine.uniforms["show_point"].value = value;
        }
    }

    this.change_fancy = function(value) {

        var t = value? 1.0 : 0.0;

        for(var key in MaterialList){
            MaterialList[key].meshLine.depthTest =
            MaterialList[key].tipsPoint.depthTest =
            MaterialList[key].somaPoint.depthTest = this.defineDepth(value,now_highlight);

            MaterialList[key].meshLine.uniforms.fancy =
            MaterialList[key].tipsPoint.uniforms.fancy =
            MaterialList[key].somaPoint.uniforms.fancy = {type:'f', value: t};
        }
    }

    this.change_texture_map = function(value) {

        var t = value? 1.0 : 0.0;

        for(var key in MaterialList){
            MaterialList[key].meshLine.uniforms.texture_map = {type:'f', value: t};
            MaterialList[key].somaPoint.uniforms.texture_map = {type:'f', value: t};
        }
    }

    this.rotate_camera = function(value){
        if(value==true){

        }


    }

    this.defineDepth = function(fancy,number){
        if(number==0 && !fancy && this.now_highlight_group_database==-1) return true;
        else return false;
    }

    this.remove_scene_key = function(key) {
        scene.remove(scene.getObjectByName("_p" + key));
        scene.remove(scene.getObjectByName("_ps" + key));
        scene.remove(scene.getObjectByName("_g" + key));

        delete MaterialList[key];
    }

    this.add_singleNeuron = function(key) {
        exist[key] = true;
        socket.emit('db_on', key);
    }

    this.delete_singleNeuron = function(key) {
        exist[key] = false;
        this.remove_scene_key(key);
        socket.emit('db_off', key);
    }


    this.add_group = function(JSON_key,color) {
        var key = JSON.parse(JSON_key);
        //groupParams[JSON_key] = true;
        group_exist[JSON_key] = color;

        var msg = {
            key: gen_key,
            data: key.number,
            database: key.database,
            color: color
        }
       // console.log(msg);
        group_key[JSON_key] = gen_key++;

        socket.emit('group_on', msg);
        groupMember[JSON_key] = [];
    }

    this.delete_group = function(JSON_key) {
        if(group_exist[JSON_key]===undefined)return;
        var key = JSON.parse(JSON_key);
        var msg = {
            key: gen_key,
            data: key.number,
            database: key.database
        }

        //groupParams[JSON_key] = false;
        group_exist[JSON_key] = false;
        delete group_exist[JSON_key];

        for (var i = 0; i < groupMember[JSON_key].length; i++) {
            this.remove_scene_key(groupMember[JSON_key][i]);
        }
        socket.emit('group_abort', msg);
        groupMember[JSON_key] = [];
        groupMessage.delete(key.database,key.number);
        controlPanel.setTotalNeuron(JSON_key);
    }


    this.setTotalNeuron = function(data_key){

        var jkey = JSON.parse(data_key);
        var jkey2 = jkey.database+"("+jkey.number+")";

        for(var i = 0; i< groupMember[data_key].length; i++){
            var key = groupMember[data_key][i];
            MaterialList[key].meshLine.uniforms.totalNeuron =
                MaterialList[key].tipsPoint.uniforms.totalNeuron =
                    MaterialList[key].somaPoint.uniforms.totalNeuron = {type:'i', value: groupMessage.neuron_number[jkey2]};
        }
    }


    this.now_highlight_group_database;
    this.now_highlight_group_database = -1;
    this.now_highlight_group_id;
    this.setGroupHighlight = function(database,gid){

        if(database===undefined){
            for(var f in  groupMessage.messengeBlock){
               groupMessage.messengeBlock[f].elementName.style.borderStyle = "none";
            }

            for(var key in MaterialList) {
                MaterialList[key].meshLine.uniforms.highlight_group_database =
                    MaterialList[key].tipsPoint.uniforms.highlight_group_database =
                        MaterialList[key].somaPoint.uniforms.highlight_group_database = {type: 'f', value: -1};
            }
            this.now_highlight_group_database = -1;
            return;
        }

        var key = database+"("+gid+")";
        for(var f in  groupMessage.messengeBlock){
            if(key == f) {
                groupMessage.messengeBlock[f].elementName.style.borderStyle = "solid";
                groupMessage.messengeBlock[f].elementName.style.borderColor = "#FFFF00";
            }
            else groupMessage.messengeBlock[f].elementName.style.borderStyle = "none";
        }

        this.now_highlight_group_id = gid;
        this.now_highlight_group_database = controlPanel.getDatabaseNumber(database);
        for(var key in MaterialList){

            MaterialList[key].meshLine.uniforms.highlight_group_database =
                MaterialList[key].tipsPoint.uniforms.highlight_group_database =
                    MaterialList[key].somaPoint.uniforms.highlight_group_database = {type:'f', value: controlPanel.getDatabaseNumber(database)};

            MaterialList[key].meshLine.uniforms.highlight_group_id =
                MaterialList[key].tipsPoint.uniforms.highlight_group_id =
                    MaterialList[key].somaPoint.uniforms.highlight_group_id = {type:'f', value: gid};

            MaterialList[key].meshLine.depthTest =
                MaterialList[key].tipsPoint.depthTest =
                    MaterialList[key].somaPoint.depthTest = this.defineDepth(params.fancy,now_highlight);
        }

    }

    this.setGroupVisible = function(database,gid){

        var key = database+"("+gid+")";
        var JSON_key = JSON.stringify({database:database ,number:gid});

        for(var f in  groupMessage.messengeBlock){
            if(key == f) {
                if(groupMessage.messengeBlock[f].is_on == true){
                    groupMessage.messengeBlock[f].is_on = false;
                    groupMessage.messengeBlock[f].elementOn.style.backgroundColor = "rgb(118,0,0)";
                }
                else{
                    groupMessage.messengeBlock[f].is_on = true;
                    groupMessage.messengeBlock[f].elementOn.style.backgroundColor = "red";
                }

                for (var i = 0; i < groupMember[JSON_key].length; i++) {
                    scene.getObjectByName("_p" + groupMember[JSON_key][i]).visible = groupMessage.messengeBlock[f].is_on;
                    scene.getObjectByName("_ps" + groupMember[JSON_key][i]).visible= groupMessage.messengeBlock[f].is_on;
                    scene.getObjectByName("_g" + groupMember[JSON_key][i]).visible= groupMessage.messengeBlock[f].is_on;
                }
            }
        }
    }

    this.getDatabaseNumber = function(key){
        for(var i = 0;i<databaseName.length;i++){
            if(key == databaseName[i])return i;
        }
        return -1;
    }
}