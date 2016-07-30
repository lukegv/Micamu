$.jsonRPC.setup({
    endPoint: '/'
});

function json_rpc(endpoint, method, params, onResult) {
    params['endpoint'] = endpoint;
    params['method'] = method;
    $.jsonRPC.request('proxy', {
        params: params,
        success: function (response) {
            onResult(response.result, null);
        },
        error: function (error) {
            onResult(null, error.error);
        }
    })
}