import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AdminShell } from '../../../shared/layout/admin-shell/admin-shell';
import { UiButton, UiFormFeedback, UiIcon, UiInput, UiSelect } from '../../../shared/ui';
import { VEHICLE_STATUS_OPTIONS } from './vehicle-status';
import { VAN_FACILITY_ID } from './vehicles.models';
import { VehiclesService } from './vehicles.service';

@Component({
  selector: 'app-add-vehicle',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AdminShell,
    UiButton,
    UiFormFeedback,
    UiIcon,
    UiInput,
    UiSelect,
  ],
  templateUrl: './add-vehicle.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddVehicle {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(VehiclesService);
  private readonly router = inject(Router);

  protected readonly statuses = VEHICLE_STATUS_OPTIONS;
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly imagePreview = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    brand: ['', [Validators.required]],
    plate_num: ['', [Validators.required]],
    capacity: [1, [Validators.required, Validators.min(1)]],
    status: ['active', [Validators.required]],
    vehicleDescription: ['', [Validators.required]],
    image: [null as File | null],
  });

  protected onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.form.controls.image.setValue(file);
    this.imagePreview.set(file ? URL.createObjectURL(file) : null);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Please complete all required fields');
      return;
    }

    const v = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);

    this.api
      .create({
        brand: v.brand,
        plate_num: v.plate_num,
        capacity: Number(v.capacity),
        vehicleDescription: v.vehicleDescription,
        status: v.status,
        id: VAN_FACILITY_ID,
        image: v.image,
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);

          if (res?.success) {
            this.router.navigateByUrl('/vehicles');
          } else {
            this.error.set(res?.message ?? 'Failed to create vehicle');
          }
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err?.error?.message ?? 'Unable to reach the server');
        },
      });
  }
}
