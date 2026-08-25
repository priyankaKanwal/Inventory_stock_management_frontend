from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    name: str
    sku: str
    category_id: int
    supplier_id: int
    unit_price: Decimal = Field(gt=0)
    quantity_in_stock: int = Field(default=0, ge=0)
    reorder_level: int = Field(default=10, ge=0)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(ProductBase):
    pass


class ProductResponse(ProductBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    stock_status: str

    model_config = ConfigDict(from_attributes=True)


class StockAdjustment(BaseModel):
    change: int
    reason: str