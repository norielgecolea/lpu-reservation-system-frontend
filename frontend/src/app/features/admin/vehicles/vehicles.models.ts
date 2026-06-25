export const VAN_FACILITY_ID = 2;

export interface VehicleRow {
  capacity: number;
  vehicleDescription: string;
  status: string;
  id: number;
  facilityId: number;
  plate_num: string;
  brand: string;
  facilityName: string;
  image?: string;
}

export interface PopulateVehiclesResponse {
  success: boolean;
  message: string;
  equipment?: VehicleRow[];
  vehicles?: VehicleRow[];
}

export interface CreateVehicleRequest {
  capacity: number;
  vehicleDescription: string;
  status: string;
  id: number;
  plate_num: string;
  brand: string;
  image?: File | null;
}

export interface UpdateVehicleRequest {
  id: number;
  facilityId: number;
  capacity: number;
  vehicleDescription: string;
  status: string;
  plate_num: string;
  brand: string;
  image?: File | null;
}

export interface VehicleStatementResponse {
  success: boolean;
  message: string;
}
