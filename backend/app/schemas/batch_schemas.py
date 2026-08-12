from datetime import date, datetime, time
from typing import List, Optional

from pydantic import BaseModel, Field


# ============================================================
# Batch Create
# ============================================================

class BatchCreate(BaseModel):
    name: str = Field(..., max_length=150)
    course_id: int
    start_date: date
    end_date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    max_strength: int = Field(default=30, ge=1)


# ============================================================
# Batch Update
# ============================================================

class BatchUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=150)
    course_id: Optional[int] = None
    trainer_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    max_strength: Optional[int] = Field(default=None, ge=1)
    status: Optional[str] = None


# ============================================================
# Batch Response
# ============================================================

class BatchResponse(BaseModel):
    id: int
    name: str
    course_id: int
    trainer_id: Optional[int]
    start_date: date
    end_date: date
    start_time: Optional[time]
    end_time: Optional[time]
    max_strength: int
    status: str
    created_by: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


# ============================================================
# Batch List Response
# ============================================================

class BatchListResponse(BaseModel):
    batches: List[BatchResponse]
    total: int


# ============================================================
# Add Trainees
# ============================================================

class BatchTraineeAdd(BaseModel):
    trainee_ids: List[int]


# ============================================================
# Batch Trainee Response
# ============================================================

class BatchTraineeResponse(BaseModel):
    id: int
    batch_id: int
    trainee_id: int
    joined_at: datetime
    status: str

    model_config = {
        "from_attributes": True
    }


# ============================================================
# Assign Trainer
# ============================================================

class BatchTrainerAssign(BaseModel):
    trainer_id: int


# ============================================================
# Trainer Assignment Response
# ============================================================

class BatchTrainerResponse(BaseModel):
    message: str
    trainer_id: int