import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../../environments/environment';
import {
  AccountStatementResponse,
  CreateAccountRequest,
  PopulateUsersResponse,
  UpdateUserRequest,
} from '../../admin/users/users.models';

@Injectable({ providedIn: 'root' })
export class FacilitiesUsersService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/facilities`;

  list() {
    return this.http.get<PopulateUsersResponse>(`${this.base}/users`);
  }

  create(payload: CreateAccountRequest) {
    return this.http.post<AccountStatementResponse>(`${this.base}/createuser`, payload);
  }

  update(payload: UpdateUserRequest) {
    return this.http.put<AccountStatementResponse>(`${this.base}/updateuser`, payload);
  }

  remove(empId: string) {
    return this.http.delete<AccountStatementResponse>(`${this.base}/deleteacc`, { params: { empId } });
  }

  toggleStatus(empId: string) {
    return this.http.patch<AccountStatementResponse>(`${this.base}/toggleaccstat`, {}, { params: { empId } });
  }
}
