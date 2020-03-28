function generate_tips(neuron){
	// HOT FIX: new database has no tips, use this function to generate it.
	var tips = Array(neuron.vertices.length / 3).fill(0);
	var vertices_count = Array(neuron.vertices.length / 3).fill(0);

	for(var i=0; i<neuron.links.length; i++){
		vertices_count[neuron.links[i]]++;
	}

	for(var i=0; i<tips.length; i++){
		if(vertices_count[i] == 1)
			tips[i] = 1;
	}

	return tips;
}

module.exports = function(server, configDB){
	var io = require('socket.io').listen(server); // �[�J Socket.IO
	var fs = require('fs');
	var assert = require('assert');
	var accept = {};//store which group could be shown
	var activeTransportSocket = {};


	
	io.on('connection', function(socket){
		console.log('a user connected');
		socket.on('disconnect', function(){
			console.log('user disconnected');
		});
		socket.on('db_on', function(msg){
			//console.log('message: ' + msg);
			
			MongoClient.connect(configDB.neuralUrl, function(err, db) {
				assert.equal(null, err);
				opendb({ "id": parseInt(msg) },socket,db, function() {
						db.close();
						});
				
			});
		});
		
		socket.on('group_on', function(msg){
			console.log('message: ' + msg.database+" "+msg.data);
			activeTransportSocket[socket.id] = msg.database+" "+msg.data;
			MongoClient.connect(configDB.neuralUrl, function(err, db) {
				//assert.equal(null, err);
				if(err)socket.emit('error_msg',err);
				else{
					opendbGroup(msg.data,msg.database,msg.key,msg.color,socket,db, function() {
						db.close();
					},l);
					l++;
				}
			});
		});
		
		socket.on('soma_point_on', function(msg){
			console.log('show soma point'+msg.key);
			MongoClient.connect(configDB.neuralUrl, function(err, db) {
				assert.equal(null, err);
				opendbSoma({"id":parseInt(msg.data)},parseInt(msg.key),socket,db, function() {
					db.close();
				});
				
			});
		});
		
		socket.on('group_abort', function(msg){
			console.log('abort: ' + msg.database+" "+msg.data);
			delete activeTransportSocket[socket.id];
		});
		
		socket.on('write_file', function(msg){
			var filename = "log/" + msg.userid + ".txt";
			var encode = "utf8";
			fs.readFile(filename, encode, function(err, file) {
				var filemsg = '';
				if(file) filemsg = file + '\r\n';
				var now = new Date();
				filemsg += '[' + now.getFullYear() + '/' + padLeft((now.getMonth()+1),2) + '/' + padLeft(now.getDate(),2) + ' ' + 
							padLeft(now.getHours(),2) + ':' + padLeft(now.getMinutes(),2) + ':' + padLeft(now.getSeconds(),2) + '] '+ 
							msg.userid + ': ' + msg.content;
				
				fs.writeFile(filename, filemsg, function(err) {
					if(err) {
						console.log(err);
					} 
				});

			});

		});
		
		socket.on('upload_group', function(msg){
			MongoClient.connect(configDB.neuralUrl, function(err, db) {
				assert.equal(null, err);
				db.collection('upload_group').deleteMany({},
					function(err, results) {					
						db.collection('upload_group').insertMany(msg.content, function(err, r) {
							if(err) socket.emit('error_msg',err);	
							else socket.emit('error_msg','Upload '+msg.content.length+' groups succeeded!!');
							db.close();
						});
					});
			});
		});
		
		socket.on('copy_group', function(msg){
			MongoClient.connect(configDB.neuralUrl, function(err, db) {
				assert.equal(null, err);
				db.collection('template_group').deleteMany({},
					function(err, results) {	
						db.collection('upload_group').find({}).each( function(err,c){
							if(err)socket.emit('error_msg',err);
							else if(c!=null){
								db.collection('template_group').insert(c) 
							}else{
								socket.emit('error_msg','Copy succeeded!!');
							}
						})						
					});
			});
		});
		
	});


	var mongodb = require('mongodb');
	var MongoClient = mongodb.MongoClient;
	var mongodbServer = new mongodb.Server('localhost', 27017, { auto_reconnect: true, poolSize: 10 });
	var db = new mongodb.Db('neural', mongodbServer);

	//----------------------handle single neural database-------------------------------------------
	var opendb = function(findQuery,socket,db, callback,color) {
		var cursor =db.collection('DATA').find( findQuery );
	   cursor.each(function(err, doc) {
		  assert.equal(err, null);
		  if (doc != null) {
			  var dataset = {id: doc.id,
							 vertices: doc.vertices,
							 links: doc.links,
							 tips: generate_tips(doc),
							 color: color,
							 soma: ['0']
							};
			 socket.emit('message',dataset);
			 //console.dir(doc.vertices);
		  } else {
			 callback();
		  }
	   });
	};

	var colors = [0xff0000,0x00ff00,0xffff00,0xff00ff,0x00ffff,0xffffff,0x6666ff];
	var l = 0;


	//----------------------handle group database-------------------------------------------
	
	var opendbGroup = function(id,database,key,msg_color,socket,db, callback,color) {
		var cursor =db.collection(database).find( {"id":parseInt(id)} );
		cursor.each(function(err, doc) {
			assert.equal(err, null);
			if (doc != null) {
				
				var wholeFindset = []; //the whole findset
				var findset = []; // every 10 neurons could be a findset
				for(var i = 0;i < doc.groups.length; i++){		 
					findset.push({ "id": parseInt(doc.groups[i])+1 });
					if(i!= 0 && i % 50 == 0){//50���@��
						wholeFindset.push(findset);
						findset = [];
					}
				}
				console.log(wholeFindset.length);
				if(findset.length!=0)wholeFindset.push(findset);
				
				for(var i = 0;i<wholeFindset.length;i++){
					
					var cursor2 = db.collection('DATA').find( { $or: wholeFindset[i] });
					var dataset = {vertices:[] , links: [], neuron: [], tips: [], soma: [], neuron_name: []};
					cursor2.each(function(err, doc2) {
						if(!socket.connected /*|| activeTransportSocket[socket.id] != database+" "+id*/){
							return;
						}
						if (doc2 != null) {	
							if(dataset.vertices.length > 35000){
								socket.emit('group',{database: database,gid:doc.id , id: dataset.id});
								socket.emit('message',dataset);
								//console.log(dataset.vertices.length);
								dataset = {vertices:[], links: [],neuron: [], tips: [], soma: [],neuron_name: []};
							}
						
							var old_vertices = dataset.vertices;
							var old_links = dataset.links;
							var old_neuron = dataset.neuron;
							var old_tips = dataset.tips;
							var old_soma = dataset.soma;
							var old_neuron_name = dataset.neuron_name;
							
							for(var j = 0;j< doc2.links.length;j++){
								doc2.links[j] += old_vertices.length/3;
							}

							//bug:1125
							dataset = {
									 database: database,
									 gid: doc.id,
									 id: "g_"+database+"_"+doc.id+"_"+doc2.id,
									 key: key,
									 msg_color: msg_color,
									 vertices: old_vertices.concat(doc2.vertices),
									 links: old_links.concat(doc2.links),
									 neuron: old_neuron.concat(doc2.id),
									 tips: old_tips.concat(generate_tips(doc2)),
									 soma: old_soma.concat(old_vertices.length/3),
									 neuron_name: old_neuron_name.concat(doc.neuron),
									 color: colors[color%colors.length]
							};
						} else{
							socket.emit('group',{database: database,gid:doc.id , id: dataset.id});
							socket.emit('message',dataset);
							//console.log(dataset.vertices.length);
							dataset = {vertices:[], links: [],neuron: [], tips: [], soma: [],neuron_name: []};
							
							db.close();
						}
					});	
				
				}
				
			}else {
				callback();
			}
		  
	   });
	};
	


	//-----------get soma points--------------------------------
	var opendbSoma = function(findQuery,key,socket,db, callback) {
		var cursor =db.collection('DATA').find( {} ).skip(key*1000);
		var dataset = {
			  key: key,
			  vertices: []
			};
		var w = 0;
		var last = 0;
		if(key >= 28)return;
	   cursor.each(function(err, doc) {
		  assert.equal(err, null);
		  if (doc != null) {
			w++;
			
			var old_vertices = dataset.vertices;
			//console.log(dataset);
			var x = doc.vertices[0];
			var y = doc.vertices[1];
			var z = doc.vertices[2];
			dataset = {
				key: key,
				vertices: old_vertices.concat(x,y,z)
			};
			
			if(w%1000 == 0){
				socket.emit('soma',dataset);
				dataset = {
					key: key,
					vertices: []
				};
			}
		 
		  } else {
			 socket.emit('soma',dataset);
			 //console.dir(doc.vertices);
			 callback();
		  }
	   });
	};
	
	//------------------------conplement 0s-----------------------------
	function padLeft(str,lenght){
		str = str.toString();
		if(str.length >= lenght)
			return str;
		else
			return padLeft("0" +str,lenght);
	}
	
}
