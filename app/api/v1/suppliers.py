from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.supplier import (
    SupplierCreate,
    SupplierResponse,
    SupplierUpdate,
)
from app.services import supplier_service
from app.utils.exceptions import (
    ConflictException,
    NotFoundException,
)

router = APIRouter(
    prefix="/suppliers",
    tags=["Suppliers"]
)


@router.post(
    "/",
    response_model=SupplierResponse,
    status_code=status.HTTP_201_CREATED
)
def create_supplier(
    data: SupplierCreate,
    db: Session = Depends(get_db)
):
    try:
        return supplier_service.create_supplier(
            db,
            data
        )

    except ConflictException as e:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=409,
            detail=e.message
        )


@router.get(
    "/",
    response_model=list[SupplierResponse]
)
def get_suppliers(
    db: Session = Depends(get_db)
):
    return supplier_service.get_suppliers(db)


@router.put(
    "/{supplier_id}",
    response_model=SupplierResponse
)
def update_supplier(
    supplier_id: int,
    data: SupplierUpdate,
    db: Session = Depends(get_db)
):
    try:
        return supplier_service.update_supplier(
            db,
            supplier_id,
            data
        )

    except NotFoundException as e:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=404,
            detail=e.message
        )


@router.delete(
    "/{supplier_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db)
):
    try:
        supplier_service.delete_supplier(
            db,
            supplier_id
        )

    except NotFoundException as e:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=404,
            detail=e.message
        )

    except ConflictException as e:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=409,
            detail=e.message
        )