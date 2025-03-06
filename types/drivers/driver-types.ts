export interface Driver {
    id?: string;
    name: string;
    email: string;
    phone: string;
    document: string;
    picture: string;
    driverLicense: string;
    driverFiles: Record<string, string>;
    driverCars: DriverCar[];
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
