from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.category import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,)
from app.services import category_service
from app.utils.exceptions import (
    ConflictException,
    NotFoundException,
    )

router = APIRouter(
    prefix="/categories",
    tags=["Categories"])


@router.post(
    "/",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db)):
    try:
        return category_service.create_category(
            db,
            data
        )
    except ConflictException as e:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=409,
            detail=e.message)


@router.get(
    "/",
    response_model=list[CategoryResponse])
def get_categories(
    db: Session = Depends(get_db)):
    return category_service.get_categories(db)


@router.put(
    "/{category_id}",
    response_model=CategoryResponse)
def update_category(
    category_id: int,
    data: CategoryUpdate,
    db: Session = Depends(get_db)):
    try:
        return category_service.update_category(
            db,
            category_id,
            data)

    except NotFoundException as e:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=404,
            detail=e.message)

    except ConflictException as e:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=409,
            detail=e.message)


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db)):
    try:
        category_service.delete_category(
            db,
            category_id)

    except NotFoundException as e:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=404,
            detail=e.message)

    except ConflictException as e:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=409,
            detail=e.message)