import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../../environments/environment';
import {
  CreateEquipmentRequest,
  EquipmentStatementResponse,
  Facility,
  PopulateEquipmentsResponse,
  UpdateEquipmentRequest,
} from './equipments.models';

@Injectable({ providedIn: 'root' })
export class EquipmentsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  list() {
    return this.http.get<PopulateEquipmentsResponse>(`${this.base}/admin/equipment`);
  }

  listFacilities() {
    return this.http.get<Facility[]>(`${this.base}/admin/facility`);
  }

  create(payload: CreateEquipmentRequest) {
    return this.http.post<EquipmentStatementResponse>(
      `${this.base}/admin/createequipment`,
      payload,
    );
  }

  update(payload: UpdateEquipmentRequest) {
    return this.http.put<EquipmentStatementResponse>(
      `${this.base}/admin/updateequipment`,
      payload,
    );
  }

  remove(id: number) {
    return this.http.delete<EquipmentStatementResponse>(`${this.base}/admin/deleteequipment`, {
      params: { id },
    });
  }

  toggleStatus(id: number) {
    return this.http.patch<EquipmentStatementResponse>(
      `${this.base}/admin/toggleequipmentstat`,
      {},
      { params: { id } },
    );
  }
}
