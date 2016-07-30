/// <reference path="json-rpc.js" />

// Global angular scope, required for view updates
let AngularScope;

class Container {
    Name: string;
    ParentDevice: Device;
    
    IsRunning: boolean;

    constructor(name: string, parent: Device, isRunning: boolean) {
        this.Name = name;
        this.ParentDevice = parent;
        this.IsRunning = isRunning;
    }

    start(): void {
        this.request(this, 'start_container', { 'name': this.Name }, this.onCommandResult);
    }

    stop(): void {
        this.request(this, 'stop_container', { 'name': this.Name }, this.onCommandResult);
    }

    requestState(): void {
        this.request(this, 'get_state', { 'name': this.Name }, this.onStateResult);
    }

    setState(state: boolean): void {
        this.IsRunning = state;
    }

    /* Requests */

    request(instance: Container, method: string, params: any, onResult: any): void {
        json_rpc(this.ParentDevice.Endpoint, method, params, function(result: any, error: any) {
            if (instance.ParentDevice.hasNoError(error)) {
                instance.ParentDevice.State = DeviceState.Connected;
                onResult(instance, result);
            }
            AngularScope.$apply();
        })
    }

    /* Callbacks */

    onCommandResult(instance: Container, result: any): void {
        instance.requestState();
    }

    onStateResult(instance: Container, result: any): void {
        instance.setState(result.container_state);
    }

}

enum DeviceState {
    Connected = 0,
    Pending = 1,
    Disconnected = 2
}

class Device {
    Endpoint: string;

    Containers: Container[];

    State: DeviceState;
    LastError: string;

    constructor(endpoint: string) {
        this.Endpoint = endpoint;
        this.Containers = [];
        this.State = DeviceState.Disconnected;
        this.requestContainers();
    }

    isConnected(): boolean {
        return this.State == DeviceState.Connected;
    }

    isPending(): boolean {
        return this.State == DeviceState.Pending;
    }

    isDisconnected(): boolean {
        return this.State == DeviceState.Disconnected;
    }

    hasNoContainers(): boolean {
        return this.isConnected() && this.Containers.length == 0;
    }

    requestContainers(): void {
        this.request(this, 'get_containers', {}, this.onContainerResult);
    }

    setContainers(containers): void {
        this.Containers = [];
        for (var container in containers) {
            this.Containers.push(new Container(container, this, containers[container]));
        }
    }

    reboot(): void {
        
    }

    isContainerNameValid(name: string): boolean {
        if (name && name.length > 0) {
            return this.Containers.map(c => c.Name).indexOf(name) == -1;
        } else {
            return false;
        }
    }

    installContainer(name: string): void {
        this.request(this, 'install_container', { 'name': name }, this.onCommandResult);
    }

    deleteContainer(container: Container): void {
        this.request(this, 'delete_container', { 'name': container.Name }, this.onCommandResult);
    }

    /* Requests */

    request(instance: Device, method: string, params: any, onResult: any) : void {
        // Set the state to pending if currently disconnected
        if (this.State == DeviceState.Disconnected) {
            this.State = DeviceState.Pending;
        }
        json_rpc(this.Endpoint, method, params, function(result: any, error: any) {
            if (instance.hasNoError(error)) { // Check for error
                instance.State = DeviceState.Connected;
                onResult(instance, result);
            }
            AngularScope.$apply(); // Update the view from the callback
        });
    }

    hasNoError(error: any): boolean {
        if (error) {
            this.State = DeviceState.Disconnected;
            this.LastError = JSON.stringify(error, null, 4);
        }
        return error == null;
    }

    /* Callbacks */

    onCommandResult(instance: Device, result: any): void {
        instance.requestContainers();
    }

    onContainerResult(instance: Device, result: any): void {
        instance.setContainers(result);
    }
    
}

class Session {
    Helper: Helper;

    Devices: Device[];
    SelectedDevice: Device;

    constructor($scope) {
        AngularScope = $scope; // Set global angular scope
        this.Helper = new Helper();
        this.Devices = [
            new Device("127.0.0.1:8001")
        ];
    }

    addDevice(newEndpoint: string) {
        this.Devices.push(new Device(newEndpoint));
    }

    selectDevice(device: Device) {
        if (this.isDeviceSelected(device)) {
            this.SelectedDevice = null;
        } else {
            this.SelectedDevice = device;
        }
    }

    isDeviceSelected(device: Device): boolean {
        return this.SelectedDevice === device;
    }

    removeDevice(device: Device) {
        if (this.isDeviceSelected(device)) {
            this.SelectedDevice = null;
        }
        var index = this.Devices.indexOf(device);
        this.Devices.splice(index, 1);
    }
}

class Helper {
    getPseudos(count: number): any[] {
        return new Array(count);
    }

    validateEndpoint(str: string): boolean {
        var endpointRegex = /^([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3}):([0-9]{1,5})$/;
        return endpointRegex.test(str);
    }
}

angular.module('Micamu', []).controller('Session', Session);

