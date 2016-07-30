/// <reference path="json-rpc.js" />
// Global angular scope, required for view updates
var AngularScope;
var Container = (function () {
    function Container(name, parent, isRunning) {
        this.Name = name;
        this.ParentDevice = parent;
        this.IsRunning = isRunning;
    }
    Container.prototype.start = function () {
        this.request('start_container', { 'name': this.Name }, this.onCommandResult);
    };
    Container.prototype.stop = function () {
        this.request('stop_container', { 'name': this.Name }, this.onCommandResult);
    };
    Container.prototype.requestState = function () {
        this.request('get_state', { 'name': this.Name }, this.onStateResult);
    };
    Container.prototype.setState = function (state) {
        this.IsRunning = state;
    };
    /* Requests */
    Container.prototype.request = function (method, params, onResult) {
        // Store instance for callbacks
        var instance = this;
        json_rpc(instance.ParentDevice.Endpoint, method, params, function (result, error) {
            if (instance.ParentDevice.hasNoError(error)) {
                instance.ParentDevice.State = DeviceState.Connected;
                onResult(instance, result);
            }
            AngularScope.$apply();
        });
    };
    /* Callbacks */
    Container.prototype.onCommandResult = function (instance, result) {
        instance.requestState();
    };
    Container.prototype.onStateResult = function (instance, result) {
        instance.setState(result.container_state);
    };
    return Container;
}());
var DeviceState;
(function (DeviceState) {
    DeviceState[DeviceState["Connected"] = 0] = "Connected";
    DeviceState[DeviceState["Pending"] = 1] = "Pending";
    DeviceState[DeviceState["Disconnected"] = 2] = "Disconnected";
})(DeviceState || (DeviceState = {}));
var Device = (function () {
    function Device(endpoint) {
        this.Endpoint = endpoint;
        this.Containers = [];
        this.State = DeviceState.Disconnected;
        this.requestContainers();
    }
    Device.prototype.isConnected = function () {
        return this.State == DeviceState.Connected;
    };
    Device.prototype.isPending = function () {
        return this.State == DeviceState.Pending;
    };
    Device.prototype.isDisconnected = function () {
        return this.State == DeviceState.Disconnected;
    };
    Device.prototype.hasNoContainers = function () {
        return this.isConnected() && this.Containers.length == 0;
    };
    Device.prototype.requestContainers = function () {
        this.request('get_containers', {}, this.onContainerResult);
    };
    Device.prototype.setContainers = function (containers) {
        this.Containers = [];
        for (var container in containers) {
            this.Containers.push(new Container(container, this, containers[container]));
        }
    };
    Device.prototype.reboot = function () {
        this.request('reboot', {}, function () { });
    };
    Device.prototype.isContainerNameValid = function (name) {
        if (name && name.length > 0) {
            return this.Containers.map(function (c) { return c.Name; }).indexOf(name) == -1;
        }
        else {
            return false;
        }
    };
    Device.prototype.installContainer = function (name) {
        this.request('install_container', { 'name': name }, this.onCommandResult);
    };
    Device.prototype.deleteContainer = function (container) {
        this.request('delete_container', { 'name': container.Name }, this.onCommandResult);
    };
    /* Requests */
    Device.prototype.request = function (method, params, onResult) {
        // Set the state to pending if currently disconnected
        if (this.State == DeviceState.Disconnected) {
            this.State = DeviceState.Pending;
        }
        // Store instance for callbacks
        var instance = this;
        json_rpc(this.Endpoint, method, params, function (result, error) {
            if (instance.hasNoError(error)) {
                instance.State = DeviceState.Connected;
                onResult(instance, result);
            }
            AngularScope.$apply(); // Update the view from the callback
        });
    };
    Device.prototype.hasNoError = function (error) {
        if (error) {
            this.State = DeviceState.Disconnected;
            this.LastError = JSON.stringify(error, null, 4);
        }
        return error == null;
    };
    /* Callbacks */
    Device.prototype.onCommandResult = function (instance, result) {
        instance.requestContainers();
    };
    Device.prototype.onContainerResult = function (instance, result) {
        instance.setContainers(result);
    };
    return Device;
}());
var Session = (function () {
    function Session($scope) {
        AngularScope = $scope; // Set global angular scope
        this.Helper = new Helper();
        this.Devices = [
            new Device("127.0.0.1:8001")
        ];
    }
    Session.prototype.addDevice = function (newEndpoint) {
        this.Devices.push(new Device(newEndpoint));
    };
    Session.prototype.selectDevice = function (device) {
        if (this.isDeviceSelected(device)) {
            this.SelectedDevice = null;
        }
        else {
            this.SelectedDevice = device;
        }
    };
    Session.prototype.isDeviceSelected = function (device) {
        return this.SelectedDevice === device;
    };
    Session.prototype.removeDevice = function (device) {
        if (this.isDeviceSelected(device)) {
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
