textMark = function(){
    this.textVector;
    this.markerElement;
    this.nowid;
    this.elementId = 'marker';

    this.create = function(v,text){

        if(!params.neuron_mark) return;


        if(!(this.markerElement === undefined) && parseInt(this.nowid)==parseInt(text))return;
        else if(!(this.markerElement === undefined) && parseInt(this.nowid)!=parseInt(text))this.delete();
        this.textVector = v;
        this.nowid = text;

        var newElement = document.createElement('div');
        var newText = document.createTextNode(text);
        newElement.id = this.elementId;
        newElement.style.position = 'absolute';
        newElement.style.width  = '80px';
        newElement.style.height = '25px';
        newElement.style.fontSize = 'x-large';
        newElement.style.textAlign = 'center';
        newElement.style.color = '#FFF';
        newElement.style.cursor = 'default';
        newElement.style.zIndex = 0;

        newElement.style.userSelect = "none";
        newElement.style.webkitUserSelect = "none";
        newElement.style.MozUserSelect = "none";
        newElement.setAttribute("unselectable", "on"); // For IE and Opera

        newElement.appendChild(newText);
        document.body.appendChild(newElement);
        this.markerElement = document.getElementById(this.elementId);

        this.update();

    }

    this.delete = function(){
        if(this.markerElement === undefined)return;
        this.markerElement.remove();
        delete this.markerElement;
    }

    this.update = function(){
        if(this.markerElement === undefined)return;

        var screen_pos = toScreenPosition(this.textVector, camera);
        this.markerElement.style.top = screen_pos.y+"px";
        this.markerElement.style.left = screen_pos.x+3+"px";
    }

    function toScreenPosition(p, camera)//transform vector3 to xy-screen
    {

        var vec = new THREE.Vector3(p.x,p.y,p.z);
        var width = renderer.context.canvas.width;
        var height = renderer.context.canvas.height;

        var vector = vec.project(camera);
        vector.x = (vector.x + 1) / 2 * width;
        vector.y = -(vector.y - 1) / 2 * height;

        return {
            x: vector.x,
            y: vector.y
        };

    };
    
}