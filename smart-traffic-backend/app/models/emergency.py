from pydantic import BaseModel


class EmergencyRequest(BaseModel):

    junction_id: str

    emergency_type: str

    direction: str

    detected: bool = True


class EmergencyResponse(BaseModel):

    junction_id: str

    emergency_type: str

    direction: str

    status: str

    priority: str

    signal_action: str