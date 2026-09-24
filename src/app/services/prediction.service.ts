import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

export interface DeliveryPrediction {
  order_id?: string | null;
  predicted_fulfillment_days: number;
  predicted_delivery_date: string;
  model_version: string;
  training_data_type: string;
}

export interface FulfillmentFeatures {
  order_id?: string;
  order_date?: string;
  order_quantity: number;
  number_of_items: number;
  current_stock: number;
  reorder_level: number;
  supplier_lead_time: number;
  processing_time: number;
  shipping_time: number;
}

@Injectable({ providedIn: 'root' })
export class PredictionService extends ApiService {

  constructor(http: HttpClient) {
    super(http);
  }

  // 1-Click order ETA: backend extracts features from the order + inventory.
  predictOrderDelivery(orderId: string): Observable<DeliveryPrediction> {
    return this.http.post<DeliveryPrediction>(
      this.buildUrl(`predictions/orders/${orderId}`),
      {}
    );
  }

  // Manual what-if simulation (all features passed as query parameters).
  predictDelivery(features: FulfillmentFeatures): Observable<DeliveryPrediction> {
    let params = new HttpParams();

    Object.entries(features).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.post<DeliveryPrediction>(
      this.buildUrl('predictions/delivery'),
      {},
      { params }
    );
  }
}