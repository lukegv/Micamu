var Container = (function () {
    function Container() {
    }
    return Container;
}());
var Device = (function () {
    function Device(name, endpoint) {
        this.Name = name;
        this.Endpoint = endpoint;
        call("127.0.0.1:8001", 'get_containers', {});
    }
    Device.prototype.setContainers = function (result) {
    };
    return Device;
}());
var Session = (function () {
    function Session() {
        this.Helpers = new Helpers();
        this.Devices = [
            new Device("Device 1", "localhost:8001")
        ];
    }
    Session.prototype.select = function (device) {
        this.SelectedDevice = device;
    };
    Session.prototype.isSelected = function (device) {
        return this.SelectedDevice === device;
    };
    return Session;
}());
var Helpers = (function () {
    function Helpers() {
    }
    Helpers.prototype.getPseudos = function (count) {
        return new Array(count);
    };
    return Helpers;
}());
angular.module("MicamuApp", []).controller("Session", Session);
