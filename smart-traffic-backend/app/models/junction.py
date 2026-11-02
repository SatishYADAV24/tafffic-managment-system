from pydantic import BaseModel, Field


class JunctionCreate(BaseModel):

    junction_id: str

    name: str

    latitude: float

    longitude: float