var http = require("http");
var	RPCHandler = require("jsonrpc").RPCHandler;

var state = {
	base:true,
	Container1: true,
	Container2: false
}

var args = process.argv.slice(2);
var port = (args.length > 0) ? parseInt(args[0]) : 8000;
console.log("VirtualMICA listening on port " + port)

// Start server
http.createServer(function (request, response) {
    if(request.method == "POST") {
        // if POST request, handle RPC
        new RPCHandler(request, response, RPCMethods, true);
    } else {
        // if GET request, response with greeting
        response.end("Hello world!");
    }
}).listen(port);

// Available RPC methods
RPCMethods = {
    // NB! private method names are preceeded with an underscore
    stop_container: function(rpc, param1){
		if (typeof state[param1.name] == 'undefined'){
			var answere = {container_state:"container unknown"}
		}
		else{
			var answere = {stopped_container:param1.name}
			state[param1.name] = false
		}
		rpc.response(answere);
    },
    start_container: function(rpc, param1){
		if (typeof state[param1.name] == 'undefined'){
			var answere = {container_state:"container unknown"}
		}
		else{
			var answere = {started_container:param1.name}
			state[param1.name] = true
		}
		rpc.response(answere);
    },
    delete_container: function(rpc, param1){
		if (typeof state[param1.name] == 'undefined'){
			var answere = {container_state:"container unknown"}
		}
		else{
			var answere = {deleted_container:param1.name}
			delete state[param1.name];
		}
		rpc.response(answere);
    },
	install_container: function(rpc, param1){
		if (typeof state[param1.name] == 'undefined'){
			var answere = {installed_container:param1.name}
			state[param1.name] = true
		}
		else{
			var answere = {container_state:"container already exists"}
		}
		rpc.response(answere);
	},
	get_state: function(rpc, param1){
		if (typeof state[param1.name] == 'undefined'){
			var answere = {container_state:"container unknown"}
		}
		else{
			var answere = {container_state:state[param1.name]}
		}
		rpc.response(answere);
    },
    get_containers: function(rpc, param1){
		var answere = state;
		rpc.response(answere);
    },
	reboot: function(rpc, param1){
		var answere = null;
		rpc.response(answere);
    },
    _private: function(){
        // this method can't be accessed from the public interface
    }
}
