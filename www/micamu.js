// Global angular scope
var AngularScope;
var Container = (function () {
    function Container(name, parent, isRunning) {
        this.Name = name;
        this.ParentDevice = parent;
        this.IsRunning = isRunning;
    }
    Container.prototype.start = function () {
        json_rpc(this.ParentDevice.Endpoint, 'start_container', { 'name': this.Name }, this.onResult);
    };
    Container.prototype.stop = function () {
        json_rpc(this.ParentDevice.Endpoint, 'stop_container', { 'name': this.Name }, this.onResult);
    };
    Container.prototype.onResult = function (result, error) {
    };
    return Container;
}());
var Device = (function () {
    function Device(endpoint) {
        this.Endpoint = endpoint;
        this.IsOffline = false;
        this.invoke('get_containers', {}, this.onContainerResult);
    }
    Device.prototype.invoke = function (method, params, onResult) {
        var copy = this;
        json_rpc(this.Endpoint, method, params, function (result, error) {
            onResult(copy, result, error);
        });
    };
    Device.prototype.checkError = function (error) {
        this.IsOffline = (error !== null);
    };
    /* Callbacks */
    Device.prototype.onContainerResult = function (instance, result, error) {
        instance.checkError(error);
        AngularScope.$apply(); // required to update the view from the callback
    };
    return Device;
}());
var Session = (function () {
    function Session($scope) {
        AngularScope = $scope; // set global angular scope
        this.Helper = new Helper();
        this.Devices = [
            new Device("localhost:8001")
        ];
    }
    Session.prototype.add = function (newEndpoint) {
        this.Devices.push(new Device(newEndpoint));
    };
    Session.prototype.select = function (device) {
        if (this.isSelected(device)) {
            this.SelectedDevice = null;
        }
        else {
            this.SelectedDevice = device;
        }
    };
    Session.prototype.isSelected = function (device) {
        return this.SelectedDevice === device;
    };
    Session.prototype.remove = function (device) {
        if (this.isSelected(device)) {
            this.SelectedDevice = null;
        }
        var index = this.Devices.indexOf(device);
        this.Devices.splice(index, 1);
    };
    return Session;
}());
var Helper = (function () {
    function Helper() {
    }
    Helper.prototype.getPseudos = function (count) {
        return new Array(count);
    };
    Helper.prototype.validateEndpoint = function (str) {
        var endpointRegex = /^([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3}):([0-9]{1,5})$/;
        return endpointRegex.test(str);
    };
    return Helper;
}());
angular.module('Micamu', []).controller('Session', Session);
