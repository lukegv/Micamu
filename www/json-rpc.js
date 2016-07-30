$.jsonRPC.setup({
    endPoint: '/'
});

function route_request(endpoint, method, params, onResult) {
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
    })
}