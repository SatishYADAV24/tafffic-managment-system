from pydantic import BaseModel, Field


class SignalRequest(BaseModel):

    junction_id: str

    vehicle_count: int = Field(ge=0)

    cars: int = Field(ge=0)

    bikes: int = Field(ge=0)

    buses: int = Field(ge=0)

    trucks: int = Field(ge=0)

    average_speed: float = Field(ge=0)

    hour: int = Field(ge=0, le=23)

    day_of_week: str

    weather: str


class SignalResponse(BaseModel):

    junction_id: str

    vehicle_count: int

    cars: int

    bikes: int

    buses: int

    trucks: int

    average_speed: float

    hour: int

    day_of_week: str

    weather: str

    congestion_level: str

    green_time: int

    yellow_time: int

    red_time: int

    priority: str