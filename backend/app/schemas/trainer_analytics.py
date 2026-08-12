from pydantic import BaseModel


class ModuleAnalyticsResponse(BaseModel):
    id: str
    name: str
    avgScore: float


class AnalyticsAlertResponse(BaseModel):
    id: str
    name: str
    avgScore: float
    alertType: str
    recommendation: str