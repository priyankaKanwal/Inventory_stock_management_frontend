import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  PredictionService,
  DeliveryPrediction,
  FulfillmentFeatures
} from '../../services/prediction.service';
import { OrderService, Order } from '../../services/order.service';
import { CustomerService, Customer } from '../../services/customers.service';

@Component({
  selector: 'app-predictions',
  templateUrl: './predictions.component.html'
})
export class PredictionsComponent implements OnInit, OnDestroy {

  orders: Order[] = [];
  customers: Customer[] = [];

  selectedOrderId = '';

  result: DeliveryPrediction | null = null;
  sourceLabel = '';

  isLoading = false;
  errorMessage = '';

  manualForm: FormGroup;

  private subscriptions: Subscription[] = [];

  private customerNames = new Map<string, string>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private predictionService: PredictionService,
    private orderService: OrderService,
    private customerService: CustomerService
  ) {
    this.manualForm = this.fb.group({
      order_quantity: [10, [Validators.required, Validators.min(1)]],
      number_of_items: [1, [Validators.required, Validators.min(1)]],
      current_stock: [10, [Validators.required, Validators.min(0)]],
      reorder_level: [5, [Validators.required, Validators.min(0)]],
      supplier_lead_time: [2, [Validators.required, Validators.min(0)]],
      processing_time: [1, [Validators.required, Validators.min(0)]],
      shipping_time: [3, [Validators.required, Validators.min(0)]],
      order_date: [this.todayInput()]
    });
  }

  ngOnInit(): void {
    this.loadOrders();
    this.loadCustomers();

    this.route.queryParamMap.subscribe((params) => {
      const orderId = params.get('orderId');

      if (orderId && !this.result) {
        this.selectedOrderId = orderId;
        this.predictSelectedOrder();
      }
    });
  }

  todayInput(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  loadOrders(): void {
    this.subscriptions.push(this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        this.orders = orders || [];
      },
      error: () => {
        this.orders = [];
      }
    }));
  }

  loadCustomers(): void {
    this.subscriptions.push(this.customerService.getAllCustomers().subscribe({
      next: (customers) => {
        this.customers = customers || [];
        this.customerNames.clear();
        this.customers.forEach((c) => this.customerNames.set(c.id, c.name));
      },
      error: () => {
        this.customers = [];
      }
    }));
  }

  customerName(id: string): string {
    return this.customerNames.get(id) || '#'.concat(id);
  }

  shortId(id: string): string {
    return id ? id.slice(0, 8) : '—';
  }

  selectedOrder(): Order | null {
    return this.orders.find((o) => o.id === this.selectedOrderId) || null;
  }

  // 1-Click order-based prediction
  predictSelectedOrder(): void {
    if (!this.selectedOrderId) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.result = null;

    this.subscriptions.push(
      this.predictionService.predictOrderDelivery(this.selectedOrderId).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.result = response;
          this.sourceLabel = 'Order-based prediction (auto feature extraction)';
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage =
            error.error?.detail ||
            'Failed to compute prediction for the selected order.';
        }
      })
    );
  }

  // Manual what-if simulation
  runManual(): void {
    if (this.manualForm.invalid) {
      this.manualForm.markAllAsTouched();
      return;
    }

    const value = this.manualForm.value;

    const features: FulfillmentFeatures = {
      order_date: new Date(`${value.order_date}T00:00:00`).toISOString(),
      order_quantity: Number(value.order_quantity),
      number_of_items: Number(value.number_of_items),
      current_stock: Number(value.current_stock),
      reorder_level: Number(value.reorder_level),
      supplier_lead_time: Number(value.supplier_lead_time),
      processing_time: Number(value.processing_time),
      shipping_time: Number(value.shipping_time)
    };

    this.isLoading = true;
    this.errorMessage = '';
    this.result = null;

    this.subscriptions.push(
      this.predictionService.predictDelivery(features).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.result = response;
          this.sourceLabel = 'Manual simulation (9 features)';
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage =
            error.error?.detail ||
            'Failed to run the simulation.';
        }
      })
    );
  }

  riskAssessment(): 'ON TIME' | 'DELAY RISK' {
    if (!this.result) {
      return 'ON TIME';
    }

    return this.result.predicted_fulfillment_days > 5
      ? 'DELAY RISK'
      : 'ON TIME';
  }

  stockSufficient(): boolean {
    const quantity = this.manualForm.get('order_quantity')?.value || 0;
    const stock = this.manualForm.get('current_stock')?.value || 0;
    return Number(stock) >= Number(quantity);
  }

  formatPredictionDate(): string {
    return this.result ? this.formatDate(this.result.predicted_delivery_date) : '—';
  }

  private formatDate(value: string | null | undefined): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}