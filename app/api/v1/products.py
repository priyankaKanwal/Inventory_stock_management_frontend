from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db

from app.schemas.product import (
    ProductCreate,
    ProductListResponse,
    ProductResponse,
    ProductSummaryResponse,
    ProductUpdate,
    StockAdjustment,
)

from app.services import product_service

from app.utils.exceptions import (
    ConflictException,
    NotFoundException,
)

from app.utils.constraints import (
    DEFAULT_PAGE,
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
)

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


@router.post(
    "/",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED
)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db)
):
    try:
        product = product_service.create_product(
            db,
            data
        )

        return add_stock_status(product)

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


@router.get(
    "/summary",
    response_model=ProductSummaryResponse
)
def get_summary(
    db: Session = Depends(get_db)
):
    return product_service.get_product_summary(db)


@router.get(
    "/",
    response_model=ProductListResponse
)
def get_products(
    page: int = Query(
        DEFAULT_PAGE,
        ge=1
    ),

    page_size: int = Query(
        DEFAULT_PAGE_SIZE,
        ge=1,
        le=MAX_PAGE_SIZE
    ),

    search: str | None = None,

    category_id: int | None = Query(
        default=None,
        gt=0
    ),

    stock_status: str | None = None,

    db: Session = Depends(get_db)
):
    result = product_service.get_products(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        category_id=category_id,
        stock_status=stock_status
    )

    result["items"] = [
        add_stock_status(product)
        for product in result["items"]
    ]

    return result


@router.get(
    "/{product_id}",
    response_model=ProductResponse
)
def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    try:
        product = product_service.get_product(
            db,
            product_id
        )

        return add_stock_status(product)

    except NotFoundException as e:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=404,
            detail=e.message
        )


@router.put(
    "/{product_id}",
    response_model=ProductResponse
)
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db)
):
    try:
        product = product_service.update_product(
            db,
            product_id,
            data
        )

        return add_stock_status(product)

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


@router.patch(
    "/{product_id}/stock",
    response_model=ProductResponse
)
def adjust_stock(
    product_id: int,
    data: StockAdjustment,
    db: Session = Depends(get_db)
):
    try:
        product = product_service.adjust_stock(
            db,
            product_id,
            data
        )

        return add_stock_status(product)

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


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    try:
        product_service.delete_product(
            db,
            product_id
        )

    except NotFoundException as e:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=404,
            detail=e.message
        )


def add_stock_status(product):
    product.stock_status = (
        product_service.calculate_stock_status(
            product.quantity_in_stock,
            product.reorder_level
        )
    )

    return product