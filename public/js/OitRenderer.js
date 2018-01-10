function OitRenderer( renderer ){

    // accumulation shader

    this.oitMaterial = function(color, opacity) {
        var accumulationMaterial = new THREE.RawShaderMaterial({

            uniforms: {
                color: {type: 'c', value: new THREE.Color(color)},
                opacity: {type: 'f', value: opacity}
            },

            vertexShader: document.getElementById('vertexShader').textContent,
            fragmentShader: document.getElementById('fragmentShaderAccumulation').textContent,
            side: THREE.DoubleSide,
            depthWrite: false,
            depthTest: false,
            transparent: true,
            blending: THREE.CustomBlending,
            blendEquation: THREE.AddEquation,
            blendSrc: THREE.OneFactor,
            blendDst: THREE.OneFactor
        });
        return accumulationMaterial;
    }

    this.accumulationTexture = new THREE.WebGLRenderTarget(
        window.innerWidth, window.innerHeight,
        {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            type: THREE.FloatType,
            format: THREE.RGBAFormat,
            stencilBuffer: false,
        }
    );

    // revelage shader

    this.revealageMaterial = new THREE.RawShaderMaterial( {
        vertexShader: document.getElementById( 'vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentShaderRevealage' ).textContent,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: false,
        transparent: true,
        blending: THREE.CustomBlending,
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.ZeroFactor,
        blendDst: THREE.OneMinusSrcAlphaFactor
    });

    this.revealageTexture = new THREE.WebGLRenderTarget(
        window.innerWidth, window.innerHeight,
        {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            type: THREE.FloatType,
            format: THREE.RGBAFormat,
            stencilBuffer: false,
        }
    );

    this.brainShellHeightMaterial = new THREE.RawShaderMaterial( {

        uniforms: {
            color: {type: 'c', value: new THREE.Color(color)},
            opacity: {type: 'f', value: opacity}
        },

        vertexShader: document.getElementById( 'brainShellVertexShader' ).textContent,
        fragmentShader: document.getElementById( 'brainShellHeightShader' ).textContent,
        side: THREE.DoubleSide,
        depthWrite: true,
        depthTest: true,
        transparent: true,
        blending: THREE.CustomBlending,
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.ZeroFactor,
        blendDst: THREE.SrcAlphaFactor
    });

    this.brainShellHeightTexture = new THREE.WebGLRenderTarget(
        window.innerWidth, window.innerHeight,
        {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            type: THREE.FloatType,
            format: THREE.RGBAFormat,
            stencilBuffer: false,
        }
    );

    // compositing shader

    var compositingUniforms = {
        "tAccumulation": { type: "t", value: null },
        "tRevealage": { type: "t", value: null }
    };

    var compositingMaterial = new THREE.ShaderMaterial({
        uniforms: compositingUniforms,
        vertexShader: document.getElementById( 'vertexShaderQuad' ).textContent,
        fragmentShader: document.getElementById( 'fragmentShaderCompositing' ).textContent,
        transparent: true,
        blending: THREE.CustomBlending,
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.OneMinusSrcAlphaFactor
    });

    var quadCamera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
    var quadScene  = new THREE.Scene();
    quadScene.add( new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ), compositingMaterial ) );

    // events

    function onWindowResize(){

        // FIXME results in distorted image
        // accumulationTexture.setSize( window.innerWidth, window.innerHeight );
        // revealageTexture.setSize( window.innerWidth, window.innerHeight );

    }

    window.addEventListener( 'resize', onWindowResize, false );

    // background color

    var clearColor = new THREE.Color( 0, 0, 0 );

    this.setClearColor = function( newClearColor ){

        clearColor = newClearColor;

    }

    this.render = function( scene, camera ){

        renderer.setClearColor( clearColor, 1.0 );
        renderer.clearColor();

        //scene.overrideMaterial = this.accumulationMaterial;
        renderer.render( scene, camera, this.accumulationTexture );

        /*scene.overrideMaterial = revealageMaterial;*/
        renderer.render( scene, camera, this.revealageTexture );

        compositingUniforms[ "tAccumulation" ].value = this.accumulationTexture;
        compositingUniforms[ "tRevealage" ].value = this.revealageTexture;

        renderer.render( quadScene, quadCamera );

        //scene.overrideMaterial = null;

    }


}