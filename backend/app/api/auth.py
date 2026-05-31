from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from uuid import uuid4
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, verify_token
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.auth_schema import (
    UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse, MessageResponse
)
from app.api.deps import get_current_user, get_client_ip
from app.core.config import settings
import jwt

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=MessageResponse, status_code=201)
async def register(request: Request, body: UserRegisterRequest, db: Session = Depends(get_db)):
    """Register a new patient user."""
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user_id = str(uuid4())
    new_user = User(
        id=user_id,
        email=body.email,
        password_hash=hash_password(body.password),
        first_name=body.first_name,
        last_name=body.last_name,
        date_of_birth=body.date_of_birth,
        gender=body.gender,
        phone_number=body.phone_number
    )
    db.add(new_user)

    # Audit log
    audit = AuditLog(
        id=str(uuid4()),
        user_id=user_id,
        action="USER_REGISTER",
        table_name="users",
        record_id=user_id,
        ip_address=get_client_ip(request)
    )
    db.add(audit)
    db.commit()

    return MessageResponse(status="success", message="User registered successfully")


@router.post("/login", response_model=TokenResponse)
async def login(request: Request, body: UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return JWT tokens."""
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)

    # Audit log
    audit = AuditLog(
        id=str(uuid4()),
        user_id=user.id,
        action="USER_LOGIN",
        table_name="users",
        record_id=user.id,
        ip_address=get_client_ip(request)
    )
    db.add(audit)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: Request, db: Session = Depends(get_db)):
    """Issue new access token using a valid refresh token."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Refresh token required")

    token = auth_header.split(" ")[1]
    try:
        payload = verify_token(token, is_refresh=True)
        user_id = payload.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or deactivated")

    new_access = create_access_token(subject=user.id)
    new_refresh = create_refresh_token(subject=user.id)

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return current_user
