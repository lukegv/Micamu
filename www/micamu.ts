/*
    Micamu client implementation

    This is based on AngularJS and defines a model, which is bound to the elements in the HTML view.
*/

/// <reference path="json-rpc.js" />
/// <reference path="devices_generated.js" />

// Global angular scope, required for view updates
let AngularScope;

// Represents a software container on a virtual MICA
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
        this.request('start_container', { 'name': this.Name }, this.onCommandResult);
    }

    stop(): void {
        this.request('stop_container', { 'name': this.Name }, this.onCommandResult);
    }

    requestState(): void {
        this.request('get_state', { 'name': this.Name }, this.onStateResult);
    }

    setState(state: boolean): void {
        this.IsRunning = state;
    }

    /* Requests */

    request(method: string, params: any, onResult: any): void {
        // Store instance for callbacks
        var instance = this;
        route_request(instance.ParentDevice.Endpoint, method, params, function(result: any, error: any) {
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

// Provides the possible device connection states
enum DeviceState {
    Connected = 0,
    Pending = 1,
    Disconnected = 2
}

// Represents a virtual MICA device
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
        this.request('get_containers', {}, this.onContainerResult);
    }

    setContainers(containers): void {
        this.Containers = [];
        for (var container in containers) {
            this.Containers.push(new Container(container, this, containers[container]));
        }
    }

    reboot(): void {
        this.request('reboot', {}, () => {});
    }

    isContainerNameValid(name: string): boolean {
        if (name && name.length > 0) {
            return this.Containers.map(c => c.Name).indexOf(name) == -1;
        } else {
            return false;
        }
    }

    installContainer(name: string): void {
        this.request('install_container', { 'name': name }, this.onCommandResult);
    }

    deleteContainer(container: Container): void {
        this.request('delete_container', { 'name': container.Name }, this.onCommandResult);
    }

    /* Requests */

    request(method: string, params: any, onResult: any) : void {
        // Set the state to pending if currently disconnected
        if (this.State == DeviceState.Disconnected) {
            this.State = DeviceState.Pending;
        }
        // Store instance for callbacks
        var instance = this;
        route_request(this.Endpoint, method, params, function(result: any, error: any) {
            if (instance.hasNoError(error)) { // Check for error
                instance.State = DeviceState.Connected;
                onResult(instance, result);
            }
            AngularScope.$apply(); // Update the view from the callback
        });
    }

    /* Error detection */

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

/*
    AngularJS model for the complete Micamu client
    This handles a Micamu client browser window session
*/
class Session {
    Helper: Helper;

    Devices: Device[];
    SelectedDevice: Device;

    constructor($scope) {
        AngularScope = $scope; // Set global angular scope
        this.Helper = new Helper();
        this.loadDevices();
    }

    loadDevices(): void {
        // Extract the devices from the generated devices.js file
        this.Devices = endpoints.map((endpoint) => new Device(endpoint));
    }

    saveDevices(): void {
        // Save the devices via JSON RPC call
        save_endpoints(this.Devices.map(device => device.Endpoint), function(response, error) {
            
        });
    }

    addDevice(newEndpoint: string): void {
        this.Devices.push(new Device(newEndpoint));
    }

    selectDevice(device: Device): void {
        if (this.isDeviceSelected(device)) {
            this.SelectedDevice = null;
        } else {
            this.SelectedDevice = device;
        }
    }

    isDeviceSelected(device: Device): boolean {
        return this.SelectedDevice === device;
    }

    removeDevice(device: Device): void {
        if (this.isDeviceSelected(device)) {
            this.SelectedDevice = null;
        }
        var index = this.Devices.indexOf(device);
        this.Devices.splice(index, 1);
    }
}

// Provides some static helper functions
class Helper {
    // Creates an amount of empty javascript elements
    getPseudos(count: number): any[] {
        return new Array(count);
    }

    // Checks if a given string contains a network endpoint (IP:PORT)
    validateEndpoint(str: string): boolean {
        var endpointRegex = /^([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3}):([0-9]{1,5})$/;
        return endpointRegex.test(str);
    }
}

angular.module('Micamu', []).controller('Session', Session);

