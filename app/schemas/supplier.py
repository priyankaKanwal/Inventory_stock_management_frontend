from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict


class SupplierBase(BaseModel):
    name: str
    contact_email: EmailStr
    phone: str | None = None
    address: str | None = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(SupplierBase):
    pass


class SupplierResponse(SupplierBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)