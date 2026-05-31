from datetime import datetime, timedelta, timezone
from typing import Union, Dict, Any
import bcrypt
import jwt
from app.core.config import settings

def hash_password(password: str) -> str:
    """Computes a cryptographically secure bcrypt hash of a raw password."""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain text password against a saved bcrypt hash."""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )

def create_access_token(subject: str, expires_delta: Union[timedelta, None] = None) -> str:
    """Generates a short-lived access JWT token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "access"
    }
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(subject: str, expires_delta: Union[timedelta, None] = None) -> str:
    """Generates a long-lived refresh JWT token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh"
    }
    return jwt.encode(to_encode, settings.JWT_REFRESH_SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_token(token: str, is_refresh: bool = False) -> Dict[str, Any]:
    """Decodes and validates a JWT token. Returns the payload or raises jwt.PyJWTError."""
    key = settings.JWT_REFRESH_SECRET_KEY if is_refresh else settings.JWT_SECRET_KEY
    payload = jwt.decode(token, key, algorithms=[settings.ALGORITHM])
    
    # Ensure types are correct
    expected_type = "refresh" if is_refresh else "access"
    if payload.get("type") != expected_type:
        raise jwt.InvalidTokenError("Invalid token type")
        
    return payload
