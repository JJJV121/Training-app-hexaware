from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request
from app.schemas.auth import ActivateAccountRequest,LoginRequest,ForgotPasswordRequest,ResetPasswordRequest
from app.services.auth_service import activate_account,login_user,create_user,generate_activation_token,forgot_password,reset_password
from app.database.session import get_db
from app.schemas.user import UserCreate, UserResponse


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post(
    "/users",
    response_model=UserResponse
)
async def create_user_endpoint(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):

    try:
        user = await create_user(
            db,
            user_data
        )

        await generate_activation_token(
            db,
            user.id
        )

        return user

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    


@router.post("/activate")
async def activate_user(
    data: ActivateAccountRequest,
    db: AsyncSession = Depends(get_db)
):

    try:
        user = await activate_account(
            db,
            data.token,
            data.password
        )

        return {
            "message": "Account activated successfully",
            "user_id": user.id
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )



@router.post("/login")
async def login(
    request: Request,
    data: LoginRequest,  
    db: AsyncSession = Depends(get_db)
):

    return await login_user(
        db,
        data.email,
        data.password,
        request
    )
    


@router.post("/forgot-password")
async def forgot_password_api(
    data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):

    return await forgot_password(db, data.email)



@router.post("/reset-password")
async def reset_password_api(
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):

    try:
        return await reset_password(
            db,
            data.token,
            data.new_password
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    


'''@router.post("/request-activation")
async def request_activation_api(
    payload: RequestActivation,
    db: AsyncSession = Depends(get_db)
):
    return await request_activation(db, payload.email) '''
