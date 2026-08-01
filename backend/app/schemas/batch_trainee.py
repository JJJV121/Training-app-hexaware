from datetime import datetime

from pydantic import BaseModel


class BatchTraineeBase(BaseModel):
    batch_id: int
    trainee_id: int


class BatchTraineeCreate(BatchTraineeBase):
    pass


class BatchTraineeResponse(BatchTraineeBase):
    joined_at: datetime

    class Config:
        from_attributes = True