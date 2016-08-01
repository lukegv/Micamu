/*
    Encapsulates the JSON RPC calls from the micamu client
    This uses an external JSON RPC library based on JQuery.
*/

// Initialize JSON RPC communication
$.jsonRPC.setup({
    endPoint: '/'
});

// Routes any JSON RPC request over the Micamu server to a given endpoint
function route_request(endpoint, method, params, onResult) {
    // Save the requested endpoint and method in the parameters
    params['endpoint'] = endpoint;
    params['method'] = method;
    $.jsonRPC.request('route', {
        params: params,
        success: function (response) {
            onResult(response.result, null);
        },
        error: function (error) {
            onResult(null, error.error);
        }
    });
}

// Start JSON RPC request to save an endpoint list on the Micamu server
function save_endpoints(endpoints, onResult) {
    params = {};
    params['endpoints'] = endpoints;
    $.jsonRPC.request('save', {
        params: params,
        success: function(response) {
            onResult(response.result, null);
        },
        error: function(error) {
            onResult(null, error.error);
        }
    });
}