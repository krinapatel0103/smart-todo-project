from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import date, time, datetime

class SubtaskItem(BaseModel):
    id        : Optional[int] = None
    title     : str
    completed : bool = False

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    confirm_password: str

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, confirm_password, values):
        if "password" in values.data and confirm_password != values.data["password"]:
            raise ValueError("Passwords do not match")
        return confirm_password

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime
    notifications_enabled: bool = True

    class Config:
        from_attributes = True

class TodoCreate(BaseModel):
    title: str
    priority: int = 1
    tags: str
    deadline_date: date
    deadline_time: time
    subtasks: Optional[list[SubtaskItem]] = []

    @field_validator("deadline_time", mode="before")
    @classmethod
    def parse_time(cls,value):
        if isinstance(value, str):
            value = value.replace("Z", "")
            if "." in value:
                value = value.split(".")[0]
        return value

class TodoUpdate(BaseModel):
    title: str
    completed: Optional[bool] = None
    priority:int = 1
    tags:str
    deadline_date: date
    deadline_time: time
    subtasks: Optional[list[SubtaskItem]] = []

    @field_validator("deadline_time", mode="before")
    @classmethod
    def parse_time(cls, value):
        if isinstance(value, str):
            value = value.replace("Z", "")
            if "." in value:
                value = value.split(".")[0]
        return value

class TodoResponse(BaseModel):
    id: int
    title: str
    completed: bool =False
    priority: int
    tags:str
    deadline_date: date
    deadline_time: time
    created_at: datetime
    updated_at: datetime
    user_id: int
    subtasks: list[SubtaskItem] = []

    class Config:
        from_attributes = True

class UserSettingsUpdate(BaseModel):
    notifications_enabled: bool