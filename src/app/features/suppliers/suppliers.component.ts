import { Component, OnInit } from '@angular/core';
import { SupplierService } from '../../services/supplier.service';

//supplier interface
export interface Supplier {
  id: number;
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

  // Whether current user is an admin (full CRUD access)
  isAdmin =
    localStorage.getItem('role')?.toUpperCase() === 'ADMIN';

  constructor(private supplierService: SupplierService) {}

  ngOnInit(): void {
    this.getSuppliers();
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
}