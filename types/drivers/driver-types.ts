export interface Driver {
    id?: string;
    name: string;
    email: string;
    phone: string;
    document: string;
    driverLicense: string;
    driverFiles: DriverFiles;
    driverCars: DriverCar[];
    address: Record<string, string>;
    rideArea: string;
    rating: Array<any>;
    history: Array<any>;
    status: string;
    enabled: boolean;
}

type DriverCar = {
    carModel: string;
    carColor: string;
    carPlate: string;
    carYear: string;
};

type DriverFiles = {
    picture: {
        name: string;
        url: string;
    };
    cnhCopy: {
        name: string;
        url: string;
    };
    addressCopy: {
        name: string;
        url: string;
    };
    bankCopy: {
        name: string;
        url: string;
    };
};
