class Container {
    Name: string;
}

class Device {
    Name: string;
    Endpoint: string;

    Containers: Container[];

    constructor(name: string, endpoint: string) {
        this.Name = name;
        this.Endpoint = endpoint;
        call("127.0.0.1:8001", 'get_containers', {});
    }

    setContainers(result) {
        
    }
}

class Session {
    Helpers: Helpers;

    Devices: Device[];
    SelectedDevice: Device;

    constructor() {
        this.Helpers = new Helpers();
        this.Devices = [
            new Device("Device 1", "localhost:8001")
        ];
    }

    select(device: Device) {
        this.SelectedDevice = device;
    }

    isSelected(device: Device): boolean {
        return this.SelectedDevice === device;
    }
}

class Helpers {
    getPseudos(count: number): any[] {
        return new Array(count);
    }
}

angular.module("MicamuApp", []).controller("Session", Session);

