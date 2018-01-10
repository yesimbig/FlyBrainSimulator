var socket = io();

//處理伺服器傳來的訊息
socket.on('error_msg', function(data) {
    console.log(data);
    alert(data);
});

//處理群組功能，定義目前群組擁有那些ID
socket.on('group', function(data) {
    var data_key = JSON.stringify({ database:data.database ,number:data.gid});
    groupMember[data_key].push(data.id);
  //  console.log( data_key);
});

var soma_point_geometry = null;

//取得soma點資料
var soma_key = 0;
socket.on('soma', function(data) {

    if(!params.soma_point)return;
    soma_key++;
    soma_point_geometry = new THREE.Geometry(); //soma point
    var soma = $.map(data.vertices, function(el) { return el });
    for (var i = 0; i < soma.length; i+=3) {
        var vertex = new THREE.Vector3();
        vertex.x = soma[i];
        vertex.y = soma[i+1];
        vertex.z = soma[i+2];
        soma_point_geometry.vertices.push(vertex);
    }

    var sprite = new THREE.TextureLoader().load( "sprites/disc.png" );
    var soma_point_particle = new THREE.Points(soma_point_geometry, new THREE.PointsMaterial({
        transparent: true,
        opacity: 0.9,
        blending: "MultiplyBlending",
        map: sprite,
        alphaTest: 0.5,
        color: 0xffff00,
        size: 3,
    }));

    soma_point_particle.name = "_soma";
    soma_point_particle.visible = true;
    soma_point_particle.renderOrder = 0;
    scene.add(soma_point_particle);

});

//接收單一神經，並繪出
socket.on('message', function(data){


    var data_key = JSON.stringify({ database:data.database ,number:data.gid});

    if(!(data.gid===undefined) && (group_exist[data_key]===undefined || group_key[data_key] != data.key)){
        console.log("GG");
        return;
    }
    var fileName = data.id;
    MaterialList[fileName] = {};//initialize file's materialList

    var color;
    if(!(data.msg_color===undefined) && parseInt(data.msg_color) != -1){
        color = colors[parseInt(data.msg_color)];
    }
    else if(!data.color)
        color = colors[ parseInt(data.id) % colors.length ];
    else color = data.color;
    MaterialList[fileName].meshLine = new THREE.MeshLineMaterial(
        {
            lineWidth: 4,
            useMap: false,
            resolution: resolution,
            color: new THREE.Color(color),
            sizeAttenuation: false,
            near: camera.near,
            far: camera.far,
            opacity: 0.85,
            transparent: true,
            fancy: params.fancy? 1.0: 0.0,
            highlight_id: is_highlight? now_highlight : 0,
            highlight_group_database: controlPanel.now_highlight_group_database,
            highlight_group_id: controlPanel.now_highlight_group_id
        }
    );

    var point_geometry = new THREE.BufferGeometry();
    var soma_geometry = new THREE.BufferGeometry(); //soma point
    var group_geometry = null; //the whole geometry
    var group_geometry_set = [];//prepare to merge all the geometry
    var index_length = 0,attri_length = 0; // record the whole length of the buffer geometry
    var vertices = $.map(data.vertices, function(el) { return el });
    var links = $.map(data.links, function(el) { return el });
    var tips = $.map(data.tips, function(el) { return el });
    var soma = $.map(data.soma, function(el) { return el });
    var neuron = $.map(data.neuron, function(el) { return el });

    neuron_id_record[fileName] = neuron;

    if(vertices.length == 0)return;


    var cmp_data = {
        data_map: {},
        used_map: {}
    };

    for(var i = 0; i < links.length; i+=2){
        add_value(cmp_data, links[i], links[i+1]);
    }

    //add the show point
    var point_positions = [], soma_positions = [], point_neuron_id = [], soma_neuron_id = [];//points positions and size
    var now_neuron_id = 0;

    for(var i =0; i<tips.length;i++){
        if(now_neuron_id != neuron.length-1 && i >= soma[now_neuron_id+1]){
            now_neuron_id++;
        }

        if(i==soma[now_neuron_id]){
            soma_positions.push(vertices[3*i]);
            soma_positions.push(vertices[3*i+1]);
            soma_positions.push(vertices[3*i+2]);
            soma_neuron_id.push(neuron[now_neuron_id]);
        }
        else if(tips[i]==1) {
            point_positions.push(vertices[3 * i]);
            point_positions.push(vertices[3 * i + 1]);
            point_positions.push(vertices[3 * i + 2]);
            point_neuron_id.push(neuron[now_neuron_id]);
        }
    }

    //為了使raycasting可以運作，必須新增一個假的soma點
     soma_positions.push(1000);
     soma_positions.push(1000);
     soma_positions.push(1000);
     soma_neuron_id.push(0);


    //將神經做BFS走訪，畫出路徑
    var newDataSet = BFSSort(cmp_data);
    var neuron_id = [];

    now_neuron_id = 0;
    for(var i = 0;i<newDataSet.length;i++){
        var points = [];
        neuron_id = [];

        if(now_neuron_id != neuron.length-1 && newDataSet[i][0] >= soma[now_neuron_id+1]) now_neuron_id++;

        for(var j = 0;j<newDataSet[i].length;j++){

            var vertex = new THREE.Vector3(vertices[3 * newDataSet[i][j]],vertices[3 * newDataSet[i][j]+1],vertices[3 * newDataSet[i][j]+2]);
            points.push(vertex);

        }

        //set up splines
        var lineGeometry = new THREE.Geometry();
        var spline = new THREE.Spline(points);
        var con = 3;//最大分割曲線數
        var max_dist = 5;//單位分割曲線距離
        for(var j = 0;j < points.length-1;j++){

            var idx_offset = j / (points.length-1);
            var cut = Math.ceil(points[j].distanceTo(points[j+1])/max_dist);
            if(cut > con) cut = con;
            for(var k = 0; k < cut;k++){
                var position = spline.getPoint( idx_offset + k/cut/points.length );

                var vec = new THREE.Vector3(position.x,position.y,position.z);
                lineGeometry.vertices.push(vec);
                neuron_id.push(neuron[now_neuron_id]);
            }
        }
        var position = spline.getPoint( 1. );
        var vec = new THREE.Vector3(position.x,position.y,position.z);
        lineGeometry.vertices.push(vec);
        neuron_id.push(neuron[now_neuron_id]);

        var line = new THREE.MeshLine();

        line.setNeuronID( neuron_id, controlPanel.getDatabaseNumber(data.database),data.gid );
        line.setGeometry( lineGeometry );


        //將線段放入group_set & octree中
        var mesh = new THREE.Mesh( line.geometry ); // this syntax could definitely be improved!

        mesh.updateMatrix();

        group_geometry_set.push(mesh.geometry);
        index_length += mesh.geometry.index.array.length;
        attri_length += mesh.geometry.attributes.side.array.length; // side count = 1

        if(!group_geometry) {//init the group geometry
            group_geometry = mesh.geometry.clone();
        }
    }

    merge_all(group_geometry, group_geometry_set, index_length, attri_length);

    //-----------draw tip point-----------------------------
    var loader = new THREE.TextureLoader();
    var sprite = loader.load( "sprites/disc.png" );

    point_geometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array(point_positions), 3 ) );
    soma_geometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array(soma_positions), 3 ) );
    point_geometry.addAttribute( 'neuron_id', new THREE.BufferAttribute( new Float32Array(point_neuron_id), 1 ) );
    soma_geometry.addAttribute( 'neuron_id', new THREE.BufferAttribute( new Float32Array(soma_neuron_id), 1 ) );

    MaterialList[fileName].tipsPoint = new THREE.ShaderMaterial( {
        uniforms: THREE.UniformsUtils.merge([
            THREE.UniformsLib['lights'],
            {
            color:     { value: new THREE.Color( color ) },
            opacity:    { value: 0.9},
            size:       {value: 1.0},
            fancy: { type: 'f', value: params.fancy? 1.0 : 0.0 },
            highlight_id: { type: 'f', value: is_highlight? now_highlight : 0 },
            highlight_group_database: { type: 'f', value: -1 },
            highlight_group_id: { type: 'f', value: 0 }
        }]),
        vertexShader:   document.getElementById( 'vertexshader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
        blending:       THREE.AdditiveBlending,
        depthTest:      controlPanel.defineDepth(params.fancy,is_highlight? now_highlight : 0),
        transparent:    true,
        lights: true
    });

    particle = new THREE.Points(point_geometry, MaterialList[fileName].tipsPoint );

    particle.name = "_p"+fileName;
    particle.visible = params['show_point'];
    particle.renderOrder = 1;
    scene.add(particle);

    //-----------draw soma-----------------------------

    MaterialList[fileName].somaPoint = new THREE.ShaderMaterial( {
        uniforms: {
            color:     { value: new THREE.Color( color ) },
            texture:   { value: sprite },
            opacity:    { value: 1.0},
            size:       {value: 4.0},
            fancy: { type: 'f', value: params.fancy? 1.0 : 0.0 },
            highlight_id: { type: 'f', value: is_highlight? now_highlight : 0 },
            texture_map: { type: 'f', value: params.texture_map? 1:0 },
            height_map: {type: 't', value: null}
        },
        vertexShader:   document.getElementById( 'somavertexshader' ).textContent,
        fragmentShader: document.getElementById( 'somafragmentshader' ).textContent,
        //blending:       THREE.AdditiveBlending,
        depthTest:      controlPanel.defineDepth(params.fancy,is_highlight? now_highlight : 0),
        transparent:    true,
        //lights: true
    });
    MaterialList[fileName].somaPoint.uniforms.height_map.value = loader.load('sprites/disc_normal.png');


    var soma_particle = new THREE.Points(soma_geometry, MaterialList[fileName].somaPoint);

    soma_particle.name = "_ps"+fileName;
    soma_particle.visible = params['show_point'];
    soma_particle.renderOrder = 0;
    scene.add(soma_particle);


    // console.log(group_geometry);

    group_geometry.computeFaceNormals();
    group = new THREE.Mesh(group_geometry,MaterialList[fileName].meshLine);
    group.matrixAutoUpdate = false;
    group.updateMatrix();
    group.name = "_g"+fileName;
    group.visable = true;

    group.renderOrder = 0;

    scene.add(group);
    if(!(data.gid===undefined)) {
        groupMessage.set(data.database, data.gid, soma.length, new THREE.Color(color));
        controlPanel.setTotalNeuron(data_key);
    }
});


function merge_all(group_geometry, group_geometry_set, index_length, attri_length){//to merge a whole group geometry
    //OK, let's start merge them
    var index_result = new Uint16Array( index_length );
    var attribute_next_result = new Float32Array( attri_length*3 );
    var attribute_position_result = new Float32Array( attri_length*3 );
    var attribute_previous_result = new Float32Array( attri_length*3 );
    var attribute_side_result = new Float32Array( attri_length );
    var attribute_uv_result = new Float32Array( attri_length*2 );
    var attribute_width_result = new Float32Array( attri_length );
    var attribute_neuron_id_result = new Uint16Array( attri_length );
    var attribute_group_database_result = new Uint16Array( attri_length );
    var attribute_group_id_result = new Uint16Array( attri_length );


    var index_now = 0;
    var attributes_now = 0;
    for(var i = 0;i < group_geometry_set.length; i++){
        //merge index
        for(var j = 0 ;j<group_geometry_set[i].index.array.length;j++) {
            index_result[j + index_now] = group_geometry_set[i].index.array[j] + attributes_now;
        }
        index_now += group_geometry_set[i].index.array.length;

        //merge next,position,previous
        for(var j = 0;j<group_geometry_set[i].attributes.side.array.length*3;j++){
            attribute_next_result[j + attributes_now*3] = group_geometry_set[i].attributes.next.array[j];
            attribute_position_result[j + attributes_now*3] = group_geometry_set[i].attributes.position.array[j];
            attribute_previous_result[j + attributes_now*3] = group_geometry_set[i].attributes.previous.array[j];
        }

        //merge uv
        for(var j = 0;j<group_geometry_set[i].attributes.side.array.length*2;j++){
            attribute_uv_result[j + attributes_now*2] = group_geometry_set[i].attributes.uv.array[j];
        }

        //merge side, width, neuron_id, group_database, group_id
        for(var j = 0;j<group_geometry_set[i].attributes.side.array.length;j++){
            attribute_side_result[j + attributes_now] = group_geometry_set[i].attributes.side.array[j];
            attribute_width_result[j + attributes_now] = group_geometry_set[i].attributes.width.array[j];
            attribute_neuron_id_result[j + attributes_now] = group_geometry_set[i].attributes.neuron_id.array[j];
            attribute_group_database_result[j + attributes_now] = group_geometry_set[i].attributes.group_database.array[j];
            attribute_group_id_result[j + attributes_now] = group_geometry_set[i].attributes.group_id.array[j];
        }
        attributes_now += group_geometry_set[i].attributes.side.array.length;
    }

    //ok, set back to group_geometry
    group_geometry.index.array = index_result;
    group_geometry.attributes.next.array = attribute_next_result;
    group_geometry.attributes.position.array = attribute_position_result;
    group_geometry.attributes.previous.array = attribute_previous_result;
    group_geometry.attributes.uv.array = attribute_uv_result;
    group_geometry.attributes.side.array = attribute_side_result;
    group_geometry.attributes.width.array = attribute_width_result;
    group_geometry.attributes.neuron_id.array = attribute_neuron_id_result;
    group_geometry.attributes.group_database.array = attribute_group_database_result;
    group_geometry.attributes.group_id.array = attribute_group_id_result;
}

function is_pass(vertex0,vertex1,vertex2){
    return true;
    var x0 = new THREE.Vector3(vertex1.x-vertex0.x,vertex1.y-vertex0.y,vertex1.z-vertex0.z);
    var x1 = new THREE.Vector3(vertex1.x-vertex2.x,vertex1.y-vertex2.y,vertex1.z-vertex2.z);

    var ang = Math.acos((x0.x * x1.x + x0.y * x1.y + x0.z * x1.z)/ (x0.length()*x1.length())) * 180 / 3.14159265;
    delete x0;
    delete x1;

    /*console.log(x0);
     console.log(x1);
     console.log(ang);
     */
    //return true;

    if(ang >110 || ang < 40 ) {
        return false;
    }
    else return true;
}


function add_value(cmp_data, p0, p1)//add new data_set(p0,p1) into cmp_data
{
    if(!cmp_data){
        cmp_data = {
            data_map: {},
            used_map: {}
        };
    }
    if(!cmp_data.data_map[p0]){
        cmp_data.data_map[p0] = [];
        cmp_data.used_map[p0] = 0;
    }
    if(!cmp_data.data_map[p1]){
        cmp_data.data_map[p1] = [];
        cmp_data.used_map[p1] = 0;
    }
    cmp_data.data_map[p0].push(p1);
    cmp_data.data_map[p1].push(p0);
    cmp_data.used_map[p0]++;
    cmp_data.used_map[p1]++;
}

function remove_value(cmp_data, p0, p1)//remove data_set(p0,p1)
{
    var index;
    if(cmp_data.data_map[p0]) {
        index = cmp_data.data_map[p0].indexOf(parseInt(p1));
        if (index > -1) {
            cmp_data.data_map[p0].splice(index, 1);
        }
    }
    if(cmp_data.data_map[p1]) {
        index = cmp_data.data_map[p1].indexOf(parseInt(p0));
        if (index > -1) {
            cmp_data.data_map[p1].splice(index, 1);
        }
    }
}

var seg_num;
function BFSSort(cmp_data){ //detect all line segment
    var line_seg = [];
    var queue = [];
    seg_num = 0;
    for(var p in cmp_data.used_map){
        if(cmp_data.used_map[p] == 1) {
            queue.push(p);
            line_seg.push([p]);
            go_through_path(cmp_data, queue, line_seg);
        }
    }
    return line_seg;
}

function go_through_path(cmp_data, queue, line_seg){

    while(queue.length>0){
        var head = queue.shift();
        cmp_data.used_map[head]--;

        var next_point = cmp_data.data_map[head].pop();
        remove_value(cmp_data,head,next_point);

        var now_point = next_point;
        cmp_data.used_map[now_point]--;
        // console.log(now_point+" "+cmp_data.used_map[now_point]);

        while(cmp_data.used_map[now_point] == 1){//直到走到分岔點
            cmp_data.used_map[now_point]--;
            line_seg[seg_num].push(now_point);
            next_point = cmp_data.data_map[now_point].pop();
            remove_value(cmp_data,now_point,next_point);
            now_point = next_point;
            cmp_data.used_map[now_point]--;
            // console.log(now_point+" "+cmp_data.used_map[now_point]);
        }

        line_seg[seg_num].push(now_point);
        //   console.log(line_seg[seg_num]);

        remove_value(cmp_data,now_point,next_point);

        for(var p in cmp_data.data_map[now_point]){

            queue.push(now_point);
            line_seg.push([now_point]);
        }
        // console.log("HERE");
        seg_num++;
    }
    //console.log("seg_num: "+seg_num);
}