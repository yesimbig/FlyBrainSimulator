var camera, scene, renderer,target;
var stats;
var BackMaterial = [], FrontMaterial = [], Materialnum = 0;
var controls;
var particle = {}, group = {}, exist = {}, group_exist = {};
var group_key = {},gen_key = 0;
var neural_number = 27899, group_number = 2133;
var controlPanel,groupMessage;

var params = {
    opacity: 0.1,
    exposure: 1.0,
    show_point: true,
    color_depth: true,
    soma_point: false,
    neuron_mark: true,
    highlight: false,
    fancy: false,
    texture_map: false,
    rotate: false
};

var databaseName = ["DATA_group","upload_group","template_group"];
var singleParams = {Number:1},groupCustomParams = {Database:1,Number:0},objParams = {};


var resolution = new THREE.Vector2( window.innerWidth, window.innerHeight );

var groupMember = {};
var gui;

var colors = [0xff0000,0x00ff00,0xffff00,0xff00ff,0x00ffff,0x7777ff,0xffffff];
var MaterialList = {};//store every line's material

var light,o_camera_position = new THREE.Vector3(0,0,700), o_light_position = new THREE.Vector3(0,0,1000),o_light_vec3;

var rec = new recorder();

init();
animate();

function init() {

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 5000 );
    //camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 5000 );
    camera.position.set(o_camera_position.x,o_camera_position.y,o_camera_position.z);
    scene = new THREE.Scene();
    //scene.add( new THREE.AmbientLight( 0x222222 ) );

    var dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight.color.setRGB( 1, 1, 1 );
    dirLight.position.set( 0, 1.75, 1 );
    dirLight.position.multiplyScalar( 50 );
    scene.add( dirLight );

    var dirLight2 = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight2.color.setRGB( 1, 1, 1 );
    dirLight2.position.set( 0, 1.75, -1 );
    dirLight2.position.multiplyScalar( 50 );
    scene.add( dirLight2 );

    var dirLight3 = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight3.color.setRGB( 1, 1, 1 );
    dirLight3.position.set( 0, -1.75, 1 );
    dirLight3.position.multiplyScalar( 50 );
    scene.add( dirLight3 );

    var dirLight4 = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight4.color.setRGB( 1, 1, 1 );
    dirLight4.position.set( 0, -1.75, -1 );
    dirLight4.position.multiplyScalar( 50 );
    scene.add( dirLight4 );


    // Create light
    light = new THREE.PointLight(0xffffff, 0.0);
    light.position.set(o_light_position.x,o_light_position.y,o_light_position.z);
    //set o_light_vec3
    o_light_vec3 = new THREE.Vector3();
    detectAngle(o_light_vec3,light.position);

    scene.add(light);

    //-------------------brain drawing--------------------------------------------------------

    renderer = new THREE.WebGLRenderer( { antialias: true , alpha: true, preserveDrawingBuffer: true} );
    renderer.transparency = THREE.OrderIndependentTransperancy;
    renderer.setClearColor( new THREE.Color( 0x000000 ) );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = 0;
    renderer.toneMappingExposure = 1;
    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    //renderer.sortObjects = false;
    document.getElementById( 'container' ).appendChild( renderer.domElement );

    //----------events-------------
    renderer.domElement.addEventListener( 'mousemove', onMouseMoveHighLight, false );
    renderer.domElement.addEventListener( 'mousedown', onMouseDownHighLight, false );
    renderer.domElement.addEventListener( 'mouseup', onMouseUpHighLight, false );

    stats = new Stats();
    document.getElementById( 'container' ).appendChild( stats.dom );



    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.rotateSpeed = 0.35;
    controls.addEventListener( 'change', render );

    window.addEventListener( 'resize', onWindowResize, false );

    gui = new dat.GUI();
    controlPanel = new controlPanels();
    load_basic_control_page();
    load_single_neuron_page();
    load_group_custom_page();
    load_neuropils();
    gui.open();

    groupMessage = new groupMessenger();
    groupMessage.init();

/*
    sphere2.position.copy(new THREE.Vector3(0,0,0));
    sphere2.scale.set( 2.0, 2.0, 2.0 );
    scene.add( sphere2 );
*/
}

function load_basic_control_page(){
    var BasicControlPage = gui.addFolder('Basic control');
    BasicControlPage.add( params, 'exposure', 0, 3 ).listen().onChange(
        controlPanel.change_exposure,params.exposure  ).onFinishChange(rec.record);
    BasicControlPage.add( params, 'opacity', 0, 0.5 ).listen().onChange(
        controlPanel.change_mainShell_opacity,params.opacity  ).onFinishChange(rec.record);
    BasicControlPage.add( params, 'show_point').listen().onChange(
        function(value){
            controlPanel.change_showPoint(value);
            rec.record();
        });
    BasicControlPage.add( params, 'color_depth').listen().onChange(
        function(value){
            controlPanel.change_colorDepth(value);
            rec.record();
        });
    BasicControlPage.add( params, 'soma_point').listen().onChange(
        function(value) {
            for(var i=0; i < scene.children.length; i++)
                if(scene.children[i].name == "_soma")
                    scene.children[i].visible = value;

            var msg = {id:1, key:soma_key};
            if(params.soma_point)
                socket.emit('soma_point_on', msg);
            else
                socket.emit('soma_point_off', msg);
        });
    BasicControlPage.add( params, 'neuron_mark').listen().onChange(
        function(value){
            if(value==false) {
                neuron_marker.delete();
            }
            rec.record();
        });
    BasicControlPage.add( params, 'fancy').listen().onChange(
        function(value){
            controlPanel.change_fancy(value);
            //rec.record();
        });
    BasicControlPage.add( params, 'texture_map').listen().onChange(
        function(value){
            controlPanel.change_texture_map(value);
        });

    BasicControlPage.add( params, 'rotate').listen().onChange(
        function(value){
            controlPanel.rotate_camera(value);
            //rec.record();
        });

    params["reset_camera"] = function () {
        controls.reset();
        rec.record();
    }

    BasicControlPage.add(params,"reset_camera");
    BasicControlPage.open();
}

function load_single_neuron_page(){
    var SingleNeuronPage = gui.addFolder('Single neuron (1~'+neural_number+')');
    controlPanel.SingleNeuronPage_number = SingleNeuronPage.add(singleParams,'Number').min(1).step(1);
    singleParams["add_neuron"] = function () {
        var key = singleParams['Number']; // select number
        if(key > neural_number){
            alert('Neuron number is too big!!');
        }else if(exist[key]){
            alert('Neuron has existed!!');
        }
        else{
            controlPanel.add_singleNeuron(key);
            rec.record();
        }
    }
    singleParams["previous"] = function () {
        var key = singleParams['Number']; // select number
        if(key > neural_number){
            alert('Neuron number is too big!!');
        }else if(!exist[key] || exist[key]==false){
            controlPanel.add_singleNeuron(key);
            rec.record();
        }else if(key>1){
            controlPanel.delete_singleNeuron(key)
            controlPanel.add_singleNeuron(key-1);
            singleParams['Number']--;
            controlPanel.SingleNeuronPage_number.updateDisplay();
            rec.record();
        }
    }
    singleParams["next"] = function () {
        var key = singleParams['Number']; // select number
        if(key > neural_number){
            alert('Neuron number is too big!!');
        }else if(!exist[key] || exist[key]==false){
            controlPanel.add_singleNeuron(key);
            rec.record();
        }else{
            controlPanel.delete_singleNeuron(key)
            controlPanel.add_singleNeuron(key+1);
            singleParams['Number']++;
            controlPanel.SingleNeuronPage_number.updateDisplay();
            rec.record();
        }
    }
    singleParams["delete_neuron"] = function () {
        var key = singleParams['Number']; // select number
        if(!exist[key] || exist[key]==false){
            alert('Neuron not exist!!');
        }else{
            exist[key] = false;
            controlPanel.remove_scene_key(key);
            socket.emit('db_off', key);
            rec.record();
        }
    }
    singleParams["delete_all"] = function () {
        for(var key in exist){
            if(exist[key]) {
                exist[key] = false;
                controlPanel.remove_scene_key(key);
                socket.emit('db_off', key);
            }
        }
        rec.record();
    }
    SingleNeuronPage.add(singleParams,"add_neuron");
    SingleNeuronPage.add(singleParams,"previous");
    SingleNeuronPage.add(singleParams,"next");
    SingleNeuronPage.add(singleParams,"delete_neuron");
    SingleNeuronPage.add(singleParams,"delete_all");
    SingleNeuronPage.open();
}

function load_group_custom_page(){
    var GroupCustom = gui.addFolder('Groups custom');
    GroupCustom.add(groupCustomParams,"Database",{uploaded:1,1337:0,saved:2}).listen();
    groupCustomParams["copy_to_saved"] = function () {
        if (confirm('Are you sure you want to copy the uploaded data to saved database?'))
            socket.emit('copy_group',true);
    }
    GroupCustom.add(groupCustomParams,"copy_to_saved");
    controlPanel.GroupCustomPage_number = GroupCustom.add(groupCustomParams,'Number').min(0).step(1);

    groupCustomParams["add_group"] = function () {
        var key = { database: databaseName[groupCustomParams['Database']] ,number:groupCustomParams['Number']}; // select number
        var JSON_key = JSON.stringify(key);

        if(key.number > group_number){
            alert('Group number is too big!!');
        }else if(group_exist[JSON_key]){
            alert('Group has existed!!');
        }
        else{
            controlPanel.add_group(JSON_key,groupCustomParams["color"]);
            rec.record();
        }
    }
    groupCustomParams["previous"] = function () {
        var key = { database:databaseName[groupCustomParams['Database']] ,number:groupCustomParams['Number']}; // select number
        var JSON_key = JSON.stringify(key);

        if(key.number > group_number){
            alert('Group number is too big!!');
        }else if(group_exist[JSON_key]===undefined){
            controlPanel.add_group(JSON_key,groupCustomParams["color"]);
            rec.record();
        }else if(key.number>0){
            controlPanel.delete_group(JSON_key);
            key.number--;
            controlPanel.delete_group(JSON.stringify(key));
            controlPanel.add_group(JSON.stringify(key),groupCustomParams["color"]);
            groupCustomParams['Number']--;
            controlPanel.GroupCustomPage_number.updateDisplay();
            rec.record();
        }
    }
    groupCustomParams["next"] = function () {
        var key = { database:databaseName[groupCustomParams['Database']] ,number:groupCustomParams['Number']}; // select number
        var JSON_key = JSON.stringify(key);

        if(key.number > group_number){
            alert('Group number is too big!!');
        }else if( group_exist[JSON_key]===undefined){
            controlPanel.add_group(JSON_key,groupCustomParams["color"]);
            rec.record();
        }else{
            controlPanel.delete_group(JSON_key);
            key.number++;
            controlPanel.delete_group(JSON.stringify(key));
            controlPanel.add_group(JSON.stringify(key),groupCustomParams["color"]);
            groupCustomParams['Number']++;
            controlPanel.GroupCustomPage_number.updateDisplay();
            rec.record();
        }
    }
    groupCustomParams["delete_group"] = function () {
        var key = { database:databaseName[groupCustomParams['Database']] ,number:groupCustomParams['Number']}; // select number
        var JSON_key = JSON.stringify(key);
        console.log(JSON_key);
        if(group_exist[JSON_key]===undefined || group_exist[JSON_key]==false){
            alert('Group not exist!!');
        }else{
            controlPanel.delete_group(JSON_key);
            rec.record();
        }
    }

    groupCustomParams["delete_all"] = function () {
        for(var key in group_exist){
            if(group_exist[key]) {
                controlPanel.delete_group(key);
            }
        }
        rec.record();
    }

    groupCustomParams["color"] = -1;
    GroupCustom.add(groupCustomParams,"color",{random:-1,red:0,green:1,yellow:2,magenta:3,cyan:4,violet:5,white:6});
    GroupCustom.add(groupCustomParams,"add_group");
    GroupCustom.add(groupCustomParams,"previous");
    GroupCustom.add(groupCustomParams,"next");
    GroupCustom.add(groupCustomParams,"delete_group");
    GroupCustom.add(groupCustomParams,"delete_all");
    GroupCustom.open();
}

function load_neuropils(){
    var NeuropilPage = gui.addFolder('neuropil');

    $.getJSON('shells/filelistlight.json','parameters/data',function(result) {

        var objFiles = result.objfiles;

        objWriter("main.obj","main.obj",params.opacity, 0x212121,2,true);

        objParams["select_all"] = function () {
            controlPanel.change_all_neuropil_visible(true);
            rec.record();
        }
        objParams["deselect_all"] = function () {
            controlPanel.change_all_neuropil_visible(false);
            rec.record();
        }
        objParams["opacity"] = 0.3;

        NeuropilPage.add(objParams, "select_all");
        NeuropilPage.add(objParams, "deselect_all");
        NeuropilPage.add(objParams, "opacity" , 0 , 0.5).listen().onChange(function(value){
            controlPanel.change_all_neuropil_opacity(value);
        }).onFinishChange(function() {rec.record();});
        NeuropilPage.open();

        for (var f = 0; f < objFiles.length; f++) {
            objParams[objFiles[f].abbr] = false;
            NeuropilPage.add(objParams, objFiles[f].abbr).listen().onChange(
            function(value) {
                controlPanel.change_neuropil_visible(this.property,value);
                rec.record();
            });

            objWriter(objFiles[f].name,objFiles[f].abbr,objParams.opacity, colors[Math.floor(f / 2) % 6]/5,1,false);
        }
        //----------record-----------
        rec.record();
    });
}

function objWriter(fileName,objName,opacity,color,order,visible){

    BackMaterial.push(new THREE.MeshPhongMaterial( {
        map: null,
        color: color,
        specular: 0x000000,
        shininess: 50.0,
        opacity: opacity,
        side: THREE.BackSide,
        transparent: true,
        shading: THREE.SmoothShading,
        depthWrite: false,
        premultipliedAlpha: true
    } ));

    FrontMaterial.push(new THREE.MeshPhongMaterial( {
        map: null,
        color: color,
        shininess: 50.0,
        specular: 0x000000,
        opacity: opacity,
        side: THREE.FrontSide,
        transparent: true,
        shading: THREE.SmoothShading,
        depthWrite: false,
        premultipliedAlpha: true
    } ));

    var num = Materialnum++;

    FrontMaterial[num].needsUpdate = BackMaterial[num].needsUpdate = true;

    var objLoader = new THREE.OBJLoader();
    objLoader.load( "obj/"+fileName, function ( object ) {

        object.traverse( function ( child ) {
            //var simplified = modifer.modify( child, child.vertices.length * 0.5 | 0 );
            if ( child instanceof THREE.Mesh ) {
                child.renderOrder = order;
                child.material = BackMaterial[num];
                var second = child.clone();
                second.renderOrder = order;
                second.material = FrontMaterial[num];

                var parent = new THREE.Group();
                parent.add( second );
                parent.add( child );

                scene.add( parent );
                parent.name = objName;
                parent.visible = visible;
            }
        });
    });
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
    resolution.set( window.innerWidth, window.innerHeight );
}

function animate() {

    setTimeout( function() {
        requestAnimationFrame( animate );
    }, 1000 / 45 );

    stats.begin();
    TWEEN.update();
    controls.update();
    rec.update();
    neuron_marker.update();

    render();
    stats.end();
}


function detectAngle(o_vec,i_vec){
    var camera_phi = Math.atan(Math.sqrt(i_vec.z*i_vec.z + i_vec.x*i_vec.x)/i_vec.y);
    var camera_the = Math.atan(i_vec.x/i_vec.z);
    var dist = Math.sqrt(i_vec.x*i_vec.x+i_vec.y*i_vec.y+i_vec.z*i_vec.z);

    if(i_vec.z<0)camera_the += Math.PI;
    if(camera_phi<0)camera_phi += Math.PI;

    if(camera_the<0)camera_the+= 2*Math.PI;

    o_vec.set(camera_the,camera_phi,dist);

    return o_vec;
}

function render() {
/*    var lrotSpeed = 0.05;
    var lx = light.position.x,
        ly = light.position.y,
        lz = light.position.z;
    light.position.y = ly * Math.cos(lrotSpeed) + lz * Math.sin(lrotSpeed);
    light.position.z = lz * Math.cos(lrotSpeed) - ly * Math.sin(lrotSpeed);
*/

    if(params.texture_map) {
        var camera_vec3 = new THREE.Vector3();


        var lookAt = controls.getTarget();

        detectAngle(camera_vec3, new THREE.Vector3(camera.position.x-lookAt.x,camera.position.y-lookAt.y,camera.position.z-lookAt.z));

        var d = o_light_vec3.z;
         //camera_vec3.x += Math.PI/4;
        light.position.x = (d * Math.sin(camera_vec3.y) * Math.sin(camera_vec3.x)) + lookAt.x;
        light.position.y = (d * Math.cos(camera_vec3.y))+ lookAt.y;
        light.position.z = (d * Math.sin(camera_vec3.y) * Math.cos(camera_vec3.x))+ lookAt.z;
    }

    if(params.rotate==true){
        var rotSpeed = 0.01;
        var x = camera.position.x,
            y = camera.position.y,
            z = camera.position.z;
        camera.position.x = x * Math.cos(rotSpeed) + z * Math.sin(rotSpeed);
        camera.position.z = z * Math.cos(rotSpeed) - x * Math.sin(rotSpeed);
        camera.lookAt(controls.getTarget());
    }
    renderer.render( scene, camera );

}
