groupMessenger = function(){

    this.messengeBlock = {};
    this.neuron_number = {};
    this.blockElement;
    this.blockElementId = "messengeBlock";
    this.blockElementNameId = "messengeName";
    this.btnElementOnId = "btnElementOn";
    this.btnElementOffId = "btnElementOff";
    this.totalNeuron;

    this.init = function(){

        var newElement = document.createElement('div');
        newElement.id = this.blockElementId;
        newElement.style.position = 'absolute';
        newElement.style.bottom = "50px";
        newElement.style.left = "20px";


        document.body.appendChild(newElement);
        this.blockElement = document.getElementById(this.blockElementId);

        var onElement = document.createElement('div');
        onElement.id = this.blockElementId;
        onElement.style.position = 'absolute';
        onElement.style.top = "0px";
        onElement.style.left = "0px";
        onElement.style.backgroundColor = "red";
        onElement.style.width = "20px";
        onElement.style.height = "20px";


        this.totalNeuron = 0;
    }

    this.set = function(database,gid,number,color){
        var key = database+"("+gid+")";
        if(this.messengeBlock[key] === undefined){
            var newElement = document.createElement('div');
            newElement.style.position = 'relative';
            newElement.style.width = "500px";
            newElement.style.height = "23px";

            var NameElement = document.createElement('div');
            NameElement.style.position = 'absolute';
            NameElement.style.color = '#'+color.getHexString();
            NameElement.style.fontSize = 'medium';
            NameElement.style.top = "0";
            NameElement.style.left = "20px";

            var onElement = document.createElement('div');
            onElement.id = this.blockElementId;
            onElement.style.position = 'absolute';
            onElement.style.backgroundColor = "red";
            onElement.style.top = "0";
            onElement.style.left = "0";
            onElement.style.width = "18px";
            onElement.style.height = "18px";

            this.blockElement.appendChild(newElement);
            newElement.appendChild(onElement);
            newElement.appendChild(NameElement);


            this.neuron_number[key] = parseInt(number);

            var newText = document.createTextNode(key + ": "+ number + " neurons");



            this.messengeBlock[key] = {};
            this.messengeBlock[key].elementName = NameElement;
            this.messengeBlock[key].elementName.appendChild(newText);
            this.messengeBlock[key].elementName.onclick = function(){
                controlPanel.setGroupHighlight(database,gid);
                groupCustomParams.Database = databaseName.indexOf(database);
                groupCustomParams.Number = gid;
                controlPanel.GroupCustomPage_number.updateDisplay();
            };

            this.messengeBlock[key].is_on = true;
            this.messengeBlock[key].elementOn = onElement;
            this.messengeBlock[key].elementOn.onclick = function(){
                controlPanel.setGroupVisible(database,gid);
            };


        }else{
            this.neuron_number[key] += parseInt(number);
            var newText = document.createTextNode(key + ": "+ this.neuron_number[key] + " neurons");
            this.messengeBlock[key].elementName.replaceChild(newText,this.messengeBlock[key].elementName.childNodes[0]);
        }
        this.totalNeuron += parseInt(number);
    }

    this.delete = function(database,gid){
        var key = database+"("+gid+")";
        this.totalNeuron -= this.neuron_number[key];
        if(this.messengeBlock[key] === undefined)return;
        this.messengeBlock[key].elementName.remove();
        this.messengeBlock[key].elementOn.remove();
        delete this.messengeBlock[key];
        delete this.neuron_number[key];
    }

}
