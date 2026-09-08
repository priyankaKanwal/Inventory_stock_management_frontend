import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SupplierService } from '../../../../services/supplier.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-suplier-form',
  templateUrl: './suplier-form.component.html',
  styleUrl: './suplier-form.component.css'
})
export class SuplierFormComponent implements OnInit {

  supplierForm: FormGroup;

  isEditMode = false;
  supplierId: number | null = null;
  errorMessage = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private supplierService: SupplierService
  ) {
    // Create supplier form
    this.supplierForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      contact_email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      address: ['', Validators.required]
    });
  }

  ngOnInit(): void {

    // Get supplier ID from URL
    this.checkEditMode();
  }

  checkEditMode(): void {

    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam) {
      return;
    }

    this.isEditMode = true;
    this.supplierId = Number(idParam);

    this.supplierService.getSupplierById(this.supplierId).subscribe({

      next: (supplier) => {

        this.supplierForm.patchValue({
          name: supplier.name,
          contact_email: supplier.contact_email,
          phone: supplier.phone,
          address: supplier.address
        });

      },

      error: (error: HttpErrorResponse) => {

        console.error('Error loading supplier:', error);

        this.errorMessage = 'Could not load supplier.';

      }

    });

  }



  onSubmit(): void {

    // Check form validation
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      return;
    }

    // Get form data
    const formValue = this.supplierForm.value;

    // Data sent to API
    const payload = {
      name: formValue.name,
      contact_email: formValue.contact_email,
      phone: formValue.phone,
      address: formValue.address
    };

    this.errorMessage = '';
    this.isLoading = true;

    // Update supplier
    if (this.isEditMode && this.supplierId) {

      this.supplierService
        .updateSupplier(this.supplierId, payload)
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.router.navigate(['/suppliers']);
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error updating supplier:', error);
            this.errorMessage =
              error.status === 409
                ? 'A supplier with this name already exists.'
                : 'Unable to update the supplier. Please try again.';
          }
        });

      return;
    }

    // Add supplier
    this.supplierService.addSupplier(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/suppliers']);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error adding supplier:', error);
        this.errorMessage =
          error.status === 409
            ? 'A supplier with this name already exists.'
            : 'Unable to add the supplier. Please try again.';
      }
    });
  }

  // Go back to supplier list
  cancel(): void {
    this.router.navigate(['/suppliers']);
  }
}

