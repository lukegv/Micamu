/*
	Micamu server implementation for Node.js

	Usage:
	node micamu_server.js [port]
*/

// Various package imports to provide web server functionality
var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');
var mime = require('mime');
// Different json-rpc packages are used for server and client functionality of the route function
var rpc_server = require('jsonrpc');
var rpc_client = require('node-json-rpc');

// Extract the port from the command line arguments
var args = process.argv.slice(2);
var port = (args.length > 0) ? parseInt(args[0]) : 8000;

console.log("Micamu server listening on port " + port);
// Run a web server on the given port
http.createServer(function(request, response) {
	// Serve GET requests like a web server (simple file deliveries)
	if (request.method == "GET") {
		var uri = url.parse(request.url).pathname;
		var file = path.join(process.cwd(), '/www', uri);
		handleFileRequest(file, response);
	}
	// Serve POST requests as JSON RPC requests
	if (request.method == "POST") {
		new rpc_server.RPCHandler(request, response, rpcMethods, true);
	}
}).listen(port);

var idCounter = 0;

// Define the served JSON RPC methods
rpcMethods = {
	// RPC method to route any JSON RPC request to a given endpoint
	route: function(rpc, params) {
		// Extract the endpoint and the method from the parameters
		var endpoint = params.endpoint.split(':'); delete params.endpoint;
		var method = params.method; delete params.method;
		// Configure the RPC client
		var options = {
			port: parseInt(endpoint[1]),
			host: endpoint[0],
			path: "/",
			strict: false
		};
		var client = new rpc_client.Client(options);
		// Call the method on the remote device
		client.call({'jsonrpc': '2.0', 'method': method, 'params': params, 'id': idCounter++}, function (error, response) {
			if (!error && !response) {
				// Special error when the call is handled, but neither a result nor an error is returned
				rpc.error({
					"code": "ENORPCRESP",
					"address": options.host,
					"port": options.port
				});
			} else {
				if (error) {
					rpc.error(error);
				} else {
					rpc.response(response.result);
				}
			}
		});
	},
	// RPC method to store a list of endpoints in a generated javascript file
	save: function(rpc, params) {
		var declaration = "var endpoints = ";
		fs.writeFile("www/devices_generated.js", declaration + JSON.stringify(params.endpoints), function(error) {
			if (error) {
				rpc.error(err);
			} else {
				rpc.response("Saved endpoints");
			}
		});
	}
}

// Handles a file request
function handleFileRequest(file, response) {
	if (fs.existsSync(file)) {
		if (fs.statSync(file).isDirectory()) {
			// Use index.html if a directory is requested
			file += "/index.html";
			handleFileRequest(file, response);
		} else {
			var contentType = mime.lookup(file);
			fs.readFile(file, function(err, content) {
				if (err) {
					// Return 500 if the file is not accessible
					response.writeHead(500, {"Content-Type": "text/plain"});
					response.end("500 Could Not Read File")
				} else {
					// Return the requested file with its content type
					response.writeHead(200, {"Content-Type": contentType});
					response.write(content);
					response.end();
				}
			});
		}
	} else {
		// Return 404 if the file is not found
		response.writeHead(404, {"Content-Type": "text/plain"});
		response.end("404 Not Found");
	}
}