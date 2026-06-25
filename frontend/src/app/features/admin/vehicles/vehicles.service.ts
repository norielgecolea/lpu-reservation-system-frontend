import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../../environments/environment';
import {
  CreateVehicleRequest,
  PopulateVehiclesResponse,
  UpdateVehicleRequest,
  VehicleStatementResponse,
} from './vehicles.models';

@Injectable({ providedIn: 'root' })
export class VehiclesService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  list() {
    return this.http.get<PopulateVehiclesResponse>(`${this.base}/admin/vehicle`);
  }

  create(payload: CreateVehicleRequest) {
    return this.http.post<VehicleStatementResponse>(
      `${this.base}/admin/createvehicle`,
      this.toFormData(payload),
    );
  }

  update(payload: UpdateVehicleRequest) {
    return this.http.put<VehicleStatementResponse>(
      `${this.base}/admin/updatevehicle`,
      this.toFormData(payload),
    );
  }

  private toFormData(payload: CreateVehicleRequest | UpdateVehicleRequest): FormData {
    const data = new FormData();

    for (const [key, value] of Object.entries(payload)) {
      if (value === null || value === undefined) {
        continue;
      }

      if (value instanceof File) {
        data.append(key, value);
      } else {
        data.append(key, String(value));
      }
    }

    return data;
  }

  remove(id: number) {
    return this.http.delete<VehicleStatementResponse>(`${this.base}/admin/deletevehicle`, {
      params: { id },
    });
  }

  toggleStatus(id: number) {
    return this.http.patch<VehicleStatementResponse>(
      `${this.base}/admin/togglevehiclestat`,
      {},
      { params: { id } },
    );
  }
}
