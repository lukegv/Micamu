var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');
var mime = require('mime');
// Different packages are used for server and client functionality
var rpc_server = require('jsonrpc');
var rpc_client = require('node-json-rpc');

http.createServer(function(request, response) {
	if (request.method == "GET") {
		var uri = url.parse(request.url).pathname;
		var file = path.join(process.cwd(), '/view', uri);
		handleFileRequest(file, response);
	}
	if (request.method == "POST") {
		new rpc_server.RPCHandler(request, response, rpcMethods, true);
	}
}).listen(8000);

rpcMethods = {
	call: function(rpc, params) {
		var endpoint = params.endpoint.split(':'); delete params.endpoint;
		var func_name = params.func_name; delete params.func_name;
		var options = {
			port: parseInt(endpoint[1]),
			host: endpoint[0],
			path: "/",
			strict: false
		};
		var client = new rpc_client.Client(options);
		client.call({'jsonrpc': '2.0', 'method': func_name, 'params': params, 'id': 0}, function (error, response) {
			if (error) {
				rpc.error(error);
			} else {
				rpc.response(response);
			}
		});
	}
}

function handleFileRequest(file, response) {
	if (fs.existsSync(file)) {
		if (fs.statSync(file).isDirectory()) {
			file += "/index.html";
			handleFileRequest(file, response);
		} else {
			var contentType = mime.lookup(file);
			fs.readFile(file, function(err, content) {
				if (err) {
					response.writeHead(500, {"Content-Type": "text/plain"});
					response.end("500 Could Not Read File")
				} else {
					response.writeHead(200, {"Content-Type": contentType});
					response.write(content);
					response.end();
				}
			});
		}
	} else {
		response.writeHead(404, {"Content-Type": "text/plain"});
		response.end("404 Not Found");
	}
}