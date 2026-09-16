import { Component, OnInit } from '@angular/core';
import { SupplierService } from '../../services/supplier.service';
import { TaskCoverageService } from '../../services/task-coverage.service';
import { hasFullInventoryAccess } from '../../auth/utils/roles';

//supplier interface
export interface Supplier {
  description: any;
  id: string;
  name: string;
  contact_email: string;
  phone: string;
  address: string;
  created_at: string;
}

@Component({
  selector: 'app-suppliers',
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.css'
})


export class SuppliersComponent implements OnInit {

  //array to hold suppliers
  suppliers: Supplier[] = [];

  canManage = hasFullInventoryAccess();

  constructor(
    private supplierService: SupplierService,
    private taskCoverage: TaskCoverageService
  ) {}

  ngOnInit(): void {
    this.taskCoverage.reload();
    this.getSuppliers();
  }

  canCreateType(): boolean {
    return this.canManage || this.taskCoverage.canCreate('SUPPLIER');
  }

  // fetch all suppliers
  getSuppliers(): void {
    this.supplierService.getSuppliers().subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers;
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
      }
    });
  }

  // Delete supplier
   deleteSupplier(id: string): void {
    this.supplierService.deleteSupplier(id).subscribe({
      next: () => {
        this.suppliers = this.suppliers.filter(
          supplier => supplier.id !== id
        );
      },
      error: (error) => {
        console.error('Error deleting supplier:', error);
      }
    });
  }
}