var sphereGeometry = new THREE.SphereGeometry( 1, 32, 32 );
var sphereMaterial = new THREE.MeshBasicMaterial( { color: 0xff1111,transparent: true, opacity: 0.7, shading: THREE.FlatShading } );
var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
sphere.name = "trackPoint";
sphere.renderOrder = 5;

var sphereGeometry2 = new THREE.SphereGeometry( 1, 32, 32 );
var sphereMaterial2 = new THREE.MeshBasicMaterial( { color: 0x11ff11,transparent: true, opacity: 0.7, shading: THREE.FlatShading } );
var sphere2 = new THREE.Mesh( sphereGeometry2, sphereMaterial2 );

var rayCaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var is_find;
var is_highlight = false, is_move = 0;//判斷移動幾格後才算點擊
var now_tract,now_point, now_highlight = 0;
var neuron_id_record = {};
var neuron_marker = new textMark();

function onMouseMoveHighLight(event){

    is_move++;
    /*var intersected;
    var intersections;
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    rayCaster.setFromCamera( mouse, camera );
    intersections = rayCaster.intersectObjects( scene.children );

    is_find = false;

    if ( intersections.length > 0 ) {
        for(var i = 0;i <intersections.length;i++) {
            intersected = intersections[i].object;
            if(intersected.name.substring(0,3)=="_ps"){

                var filename = intersected.name.substring(3);

                if(neuron_id_record[filename][ intersections[i].index ]){
                    is_find = true;
                    now_tract = neuron_id_record[filename][ intersections[i].index ];
                    now_point = intersections[i].point;
                    if(!is_highlight){
                        set_highlight(now_tract);
                        neuron_marker.create(now_point, now_tract);
                    }

                    sphere.position.copy(intersections[i].point);
                    sphere.scale.set( 1.0, 1.0, 1.0 );
                    scene.add( sphere );
                    break;
                }

            }
        }
    }

    if(!is_find){
        if(!is_highlight){
            set_highlight(0);
            neuron_marker.delete();
        }
        scene.remove(sphere);
    }
*/
}

var down_tract;
function onMouseDownHighLight(event){
    is_move = 0;

    if(is_find){ down_tract = now_tract;}
    else down_tract = 0;
}

function onMouseUpHighLight(event){

    var intersected;
    var intersections;
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    rayCaster.setFromCamera( mouse, camera );
    intersections = rayCaster.intersectObjects( scene.children );

    is_find = false;

    if ( intersections.length > 0 ) {
        for(var i = 0;i <intersections.length;i++) {
            intersected = intersections[i].object;
            if(intersected.name.substring(0,3)=="_ps"){

                var filename = intersected.name.substring(3);

                if(neuron_id_record[filename][ intersections[i].index ]){
                    is_find = true;
                    now_tract = neuron_id_record[filename][ intersections[i].index ];
                    now_point = intersections[i].point;
                    if(!is_highlight){
                        set_highlight(now_tract);
                        neuron_marker.create(now_point, now_tract);
                    }

                    sphere.position.copy(intersections[i].point);
                    sphere.scale.set( 1.0, 1.0, 1.0 );
                    scene.add( sphere );
                    break;
                }

            }
        }
    }
    if(!is_find){
        if(!is_highlight){
            set_highlight(0);
            neuron_marker.delete();
        }
        scene.remove(sphere);
        neuron_marker.delete();
    }


    if(is_highlight && is_move<2 && !is_find){
        is_highlight = false;
        set_highlight(0);
        rec.record();
    }
    else if(is_find /*&& down_tract == now_tract*/){
        is_highlight = true;
        set_highlight(now_tract);
        neuron_marker.create(now_point, now_tract);
        rec.record();
    }

    if(is_move<2)
        controlPanel.setGroupHighlight(); //remove group highlight
}

function set_highlight(number){
    now_highlight = number;
    for(var key in MaterialList){
        if(!params.fancy) {
            MaterialList[key].meshLine.depthTest =
            MaterialList[key].tipsPoint.depthTest =
            MaterialList[key].somaPoint.depthTest = controlPanel.defineDepth(params.fancy,number);
        }
        MaterialList[key].meshLine.uniforms.highlight_id =
        MaterialList[key].tipsPoint.uniforms.highlight_id =
        MaterialList[key].somaPoint.uniforms.highlight_id = {type:'f', value: number};
    }
}

