// Global angular scope
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

    start() {
        json_rpc(this.ParentDevice.Endpoint, 'start_container', { 'name': this.Name}, this.onResult);
    }

    stop() {
        json_rpc(this.ParentDevice.Endpoint, 'stop_container', { 'name': this.Name }, this.onResult);
    }

    onResult(result: any, error: any) {
        
    }
}

class Device {
    Endpoint: string;

    Containers: Container[];

    IsOffline: boolean;
    ErrorMessage: string;

    constructor(endpoint: string) {
        this.Endpoint = endpoint;
        this.IsOffline = false;
        this.invoke('get_containers', {}, this.onContainerResult);
    }

    invoke(method, params, onResult) {
        var copy = this;
        json_rpc(this.Endpoint, method, params, function(result: any, error: any) {
            onResult(copy, result, error);
        });
    }

    checkError(error: any) {
        this.IsOffline = (error !== null);
    }

    /* Callbacks */

    onContainerResult(instance: Device, result: any, error: any) {
        instance.checkError(error);
        AngularScope.$apply(); // required to update the view from the callback
    }
}

class Session {
    Helper: Helper;

    Devices: Device[];
    SelectedDevice: Device;

    EndpointInput: string;
    EndpointValid: boolean;

    constructor($scope) {
        AngularScope = $scope; // set global angular scope
        this.Helper = new Helper();
        this.Devices = [
            new Device("localhost:8001")
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

