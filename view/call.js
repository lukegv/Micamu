$.jsonRPC.setup({
    endPoint: '/'
});

function call(endpoint, func_name, func_params, onResult) {
    func_params['endpoint'] = endpoint;
    func_params['func_name'] = func_name;
    $.jsonRPC.request('call', {
        params: func_params,
        success: function (result) {
            console.log(result);
        },
        error: function (result) {
            console.log(result);
        }
    })
}