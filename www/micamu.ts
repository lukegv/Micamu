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
        this.request('get_containers', {}, this.onContainerResult);
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

    refresh(): void {
        this.request('get_containers', {}, this.onContainerResult);
    }

    /* Requests */

    request(method: string, params: any, onResult: any) : void {
        // Set the state to pending
        if (this.State == DeviceState.Disconnected) {
            this.State = DeviceState.Pending;
        }
        // Store instance for callback
        var instance = this;
        json_rpc(this.Endpoint, method, params, function(result: any, error: any) {
            if (instance.checkError(error)) { // Check for error
                instance.State = DeviceState.Connected;
                onResult(instance, result);
            }
            AngularScope.$apply(); // Update the view from the callback
        });
    }

    checkError(error: any): boolean {
        if (error) {
            this.State = DeviceState.Disconnected;
            this.LastError = JSON.stringify(error, null, 4);
        }
        return error == null;
    }

    /* Callbacks */

    onContainerResult(instance: Device, containers: any): void {
        instance.Containers = [];
        for (var container in containers) {
            instance.Containers.push(new Container(container, instance, containers[container]));
        }
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

    add(newEndpoint: string) {
        this.Devices.push(new Device(newEndpoint));
    }

    select(device: Device) {
        if (this.isSelected(device)) {
            this.SelectedDevice = null;
        } else {
            this.SelectedDevice = device;
        }
    }

    isSelected(device: Device): boolean {
        return this.SelectedDevice === device;
    }

    remove(device: Device) {
        if (this.isSelected(device)) {
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

