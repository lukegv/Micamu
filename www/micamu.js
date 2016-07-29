/// <reference path="json-rpc.js" />
// Global angular scope, required for view updates
var AngularScope;
var Container = (function () {
    function Container(name, parent, isRunning) {
        this.Name = name;
        this.ParentDevice = parent;
        this.IsRunning = isRunning;
    }
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
        this.request('get_containers', {}, this.onContainerResult);
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
    Device.prototype.refresh = function () {
        this.request('get_containers', {}, this.onContainerResult);
    };
    /* Requests */
    Device.prototype.request = function (method, params, onResult) {
        // Set the state to pending
        if (this.State == DeviceState.Disconnected) {
            this.State = DeviceState.Pending;
        }
        // Store instance for callback
        var instance = this;
        json_rpc(this.Endpoint, method, params, function (result, error) {
            if (instance.checkError(error)) {
                instance.State = DeviceState.Connected;
                onResult(instance, result);
            }
            AngularScope.$apply(); // Update the view from the callback
        });
    };
    Device.prototype.checkError = function (error) {
        if (error) {
            this.State = DeviceState.Disconnected;
            this.LastError = JSON.stringify(error, null, 4);
        }
        return error == null;
    };
    /* Callbacks */
    Device.prototype.onContainerResult = function (instance, containers) {
        instance.Containers = [];
        for (var container in containers) {
            instance.Containers.push(new Container(container, instance, containers[container]));
        }
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
