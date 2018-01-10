
THREE.MeshLine = function() {

    this.positions = [];

    this.previous = [];
    this.next = [];
    this.side = [];
    this.width = [];
    this.indices_array = [];
    this.uvs = [];

    this.geometry = new THREE.BufferGeometry();

    this.widthCallback = null;

}

THREE.MeshLine.prototype.setGeometry = function( g, c ) {

    this.widthCallback = c;

    this.positions = [];

    if( g instanceof THREE.Geometry ) {
        for( var j = 0; j < g.vertices.length; j++ ) {
            var v = g.vertices[ j ];
            this.positions.push( v.x, v.y, v.z );
            this.positions.push( v.x, v.y, v.z );
        }
    }

    if( g instanceof THREE.BufferGeometry ) {
        // read attribute positions ?
    }

    if( g instanceof Float32Array ||g instanceof Array ) {
        for( var j = 0; j < g.length; j += 3 ) {
            this.positions.push( g[ j ], g[ j + 1 ], g[ j + 2 ] );
            this.positions.push( g[ j ], g[ j + 1 ], g[ j + 2 ] );
        }
    }

    this.process();

}

THREE.MeshLine.prototype.setNeuronID = function( neuron_id ,group_database,group_id ) { //copy the id to mesh_line, double the id
    this.neuron_id = [];
    this.group_database = [];
    this.group_id = [];
    for(var i = 0; i < neuron_id.length ; i++){
        this.neuron_id.push(neuron_id[i]);
        this.neuron_id.push(neuron_id[i]);
        this.group_database.push(group_database);
        this.group_database.push(group_database);
        this.group_id.push(group_id);
        this.group_id.push(group_id);

    }
}

THREE.MeshLine.prototype.compareV3 = function( a, b ) {

    var aa = a * 6;
    var ab = b * 6;
    return ( this.positions[ aa ] === this.positions[ ab ] ) && ( this.positions[ aa + 1 ] === this.positions[ ab + 1 ] ) && ( this.positions[ aa + 2 ] === this.positions[ ab + 2 ] );

}

THREE.MeshLine.prototype.copyV3 = function( a ) {

    var aa = a * 6;
    return [ this.positions[ aa ], this.positions[ aa + 1 ], this.positions[ aa + 2 ] ];

}

THREE.MeshLine.prototype.process = function() {

    var l = this.positions.length / 6;

    this.previous = [];
    this.next = [];
    this.side = [];
    this.width = [];
    this.indices_array = [];
    this.uvs = [];

    for( var j = 0; j < l; j++ ) {
        this.side.push( 1 );
        this.side.push( -1 );
    }

    var w;
    for( var j = 0; j < l; j++ ) {
        if( this.widthCallback ) w = this.widthCallback( j / ( l -1 ) );
        else w = 1;
        this.width.push( w );
        this.width.push( w );
    }

    for( var j = 0; j < l; j++ ) {
        this.uvs.push( j / ( l - 1 ), 0 );
        this.uvs.push( j / ( l - 1 ), 1 );
    }

    var v;

    if( this.compareV3( 0, l - 1 ) ){
        v = this.copyV3( l - 2 );
    } else {
        v = this.copyV3( 0 );
    }
    this.previous.push( v[ 0 ], v[ 1 ], v[ 2 ] );
    this.previous.push( v[ 0 ], v[ 1 ], v[ 2 ] );
    for( var j = 0; j < l - 1; j++ ) {
        v = this.copyV3( j );
        this.previous.push( v[ 0 ], v[ 1 ], v[ 2 ] );
        this.previous.push( v[ 0 ], v[ 1 ], v[ 2 ] );
    }

    for( var j = 1; j < l; j++ ) {
        v = this.copyV3( j );
        this.next.push( v[ 0 ], v[ 1 ], v[ 2 ] );
        this.next.push( v[ 0 ], v[ 1 ], v[ 2 ] );
    }

    if( this.compareV3( l - 1, 0 ) ){
        v = this.copyV3( 1 );
    } else {
        v = this.copyV3( l - 1 );
    }
    this.next.push( v[ 0 ], v[ 1 ], v[ 2 ] );
    this.next.push( v[ 0 ], v[ 1 ], v[ 2 ] );

    for( var j = 0; j < l - 1; j++ ) {
        var n = j * 2;
        this.indices_array.push( n, n + 1, n + 2 );
        this.indices_array.push( n + 2, n + 1, n + 3 );
    }

    this.attributes = {
        position: new THREE.BufferAttribute( new Float32Array( this.positions ), 3 ),
        previous: new THREE.BufferAttribute( new Float32Array( this.previous ), 3 ),
        next: new THREE.BufferAttribute( new Float32Array( this.next ), 3 ),
        side: new THREE.BufferAttribute( new Float32Array( this.side ), 1 ),
        width: new THREE.BufferAttribute( new Float32Array( this.width ), 1 ),
        uv: new THREE.BufferAttribute( new Float32Array( this.uvs ), 2 ),
        index: new THREE.BufferAttribute( new Uint16Array( this.indices_array ), 1 ),
        neuron_id: new THREE.BufferAttribute( new Uint16Array( this.neuron_id ), 1 ),
        group_database: new THREE.BufferAttribute( new Uint16Array( this.group_database ), 1 ),
        group_id: new THREE.BufferAttribute( new Uint16Array( this.group_id ), 1 )
    }

    this.geometry.addAttribute( 'position', this.attributes.position );
    this.geometry.addAttribute( 'previous', this.attributes.previous );
    this.geometry.addAttribute( 'next', this.attributes.next );
    this.geometry.addAttribute( 'side', this.attributes.side );
    this.geometry.addAttribute( 'width', this.attributes.width );
    this.geometry.addAttribute( 'uv', this.attributes.uv );
    this.geometry.addAttribute( 'neuron_id', this.attributes.neuron_id );
    this.geometry.addAttribute( 'group_database', this.attributes.group_database );
    this.geometry.addAttribute( 'group_id', this.attributes.group_id );

    this.geometry.setIndex( this.attributes.index );

}

THREE.MeshLineMaterial = function() {
    var loader = new THREE.TextureLoader();
    console.log(loader.load('/sprites/height_map.png'));
    this.material = new THREE.ShaderMaterial( {
        uniforms: THREE.UniformsUtils.merge([
            THREE.UniformsLib['lights'],
            {
            lineWidth: { type: 'f', value: 1 },
            map: { type: 't', value: strokeTexture },
            useMap: { type: 'f', value: 0 },
            color: { type: 'c', value: new THREE.Color( colors[ ~~Maf.randomInRange( 0, colors.length ) ] ) },
            resolution: { type: 'v2', value: resolution },
            sizeAttenuation: { type: 'f', value: 1 },
            highlight_id: { type: 'f', value: 0 },
            highlight_group_database: { type: 'f', value: -1},
            highlight_group_id: { type: 'f', value: 0 },
            fancy: { type: 'f', value: 0 },
            totalNeuron: { type: 'i', value: 0 },
            near: { type: 'f', value: camera.near },
            far: { type: 'f', value: camera.far },
            show_point: {type: 'i', value: params.color_depth? 1:0},
            texture_map: { type: 'f', value: params.texture_map? 1:0 },
            height_map: {type: 't', value: null}
        }]),
        vertexShader: document.getElementById( 'vs-line' ).textContent,
        fragmentShader: document.getElementById( 'fs-line' ).textContent,
        lights: true,
        side: THREE.DoubleSide,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveAlphaBlending,

    });
    this.material.uniforms.height_map.value = loader.load('sprites/height_map.png');

}



THREE.MeshLineMaterial = function ( parameters ) {

    function check( v, d ) {
        if( v === undefined ) return d;
        return v;
    }

    THREE.Material.call( this );

    parameters = parameters || {};

this.lineWidth = check( parameters.lineWidth, 1 );
this.map = check( parameters.map, null );
this.useMap = check( parameters.useMap, 0 );
this.color = check( parameters.color, new THREE.Color( 0xffffff ) );
this.opacity = check( parameters.opacity, 1 );
this.resolution = check( parameters.resolution, new THREE.Vector2( 1, 1 ) );
this.sizeAttenuation = check( parameters.sizeAttenuation, 1 );
this.highlight_id = check( parameters.highlight_id, 0 );
this.highlight_group_database = check( parameters.highlight_group_database, -1 );
this.highlight_group_id = check( parameters.highlight_group_id, 0 );
this.fancy = check( parameters.fancy, 0 );
this.totalNeuron = check( parameters.fancy, 0 );
this.near = check( parameters.near, 1 );
this.far = check( parameters.far, 1 );
this.dashArray = check( parameters.dashArray, [] );
this.useDash = ( this.dashArray !== [] ) ? 1 : 0;

var loader = new THREE.TextureLoader();
var material = new THREE.ShaderMaterial( {
    uniforms:THREE.UniformsUtils.merge([
        THREE.UniformsLib['lights'],
        {
        lineWidth: { type: 'f', value: this.lineWidth },
        map: { type: 't', value: this.map },
        useMap: { type: 'f', value: this.useMap },
        color: { type: 'c', value: this.color },
        opacity: { type: 'f', value: this.opacity },
        resolution: { type: 'v2', value: this.resolution },
        sizeAttenuation: { type: 'f', value: this.sizeAttenuation },
        highlight_id: { type: 'f', value: this.highlight_id },
        highlight_group_database: { type: 'f', value: this.highlight_group_database },
        highlight_group_id: { type: 'f', value: this.highlight_group_id },
        fancy: { type: 'f', value: this.fancy },
        totalNeuron: { type: 'i', value: this.totalNeuron },
        near: { type: 'f', value: this.near },
        far: { type: 'f', value: this.far },
        dashArray: { type: 'v2', value: new THREE.Vector2( this.dashArray[ 0 ], this.dashArray[ 1 ] ) },
        useDash: { type: 'f', value: this.useDash },
        show_point: {type: 'i', value: params.color_depth? 1:0},
        texture_map: { type: 'f', value: params.texture_map? 1:0 },
        height_map: {type: 't', value: null}
    }]),

    vertexShader: document.getElementById( 'meshlinevertexshader' ).textContent,
    fragmentShader: document.getElementById( 'meshlinefragmentshader' ).textContent,
    lights: true,
    depthTest: controlPanel.defineDepth(params.fancy,this.highlight_id,this.highlight_group_database)
});
material.uniforms.needsUpdate = true;
material.uniforms.height_map.value = loader.load('sprites/height_map.png');

delete parameters.lineWidth;
delete parameters.map;
delete parameters.useMap;
delete parameters.color;
delete parameters.opacity;
delete parameters.resolution;
delete parameters.sizeAttenuation;
delete parameters.highlight_id;
delete parameters.highlight_group_database;
delete parameters.highlight_group_id;
delete parameters.fancy;
delete parameters.totalNeuron;
delete parameters.near;
delete parameters.far;
delete parameters.dashArray;

material.type = 'MeshLineMaterial';

material.setValues( parameters );

return material;

};

THREE.MeshLineMaterial.prototype = Object.create( THREE.Material.prototype );
THREE.MeshLineMaterial.prototype.constructor = THREE.MeshLineMaterial;

THREE.MeshLineMaterial.prototype.copy = function ( source ) {

    THREE.Material.prototype.copy.call( this, source );

    this.lineWidth = source.lineWidth;
    this.map = source.map;
    this.useMap = source.useMap;
    this.color.copy( source.color );
    this.opacity = source.opacity;
    this.resolution.copy( source.resolution );
    this.sizeAttenuation = source.sizeAttenuation;
    this.highlight_id = source.highlight_id;
    this.highlight_group_database = source.highlight_group_database;
    this.highlight_group_id = source.highlight_group_id;
    this.fancy = source.fancy;
    this.totalNeuron = source.totalNeuron;
    this.near = source.near;
    this.far = source.far;

    return this;

};