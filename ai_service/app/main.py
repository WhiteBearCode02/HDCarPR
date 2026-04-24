from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor

app = FastAPI(title="ECO-DRIVE INSIGHT AI")


class Segment(BaseModel):
    id: int
    speed: float
    rpm: float
    accel_pedal: float
    traffic_index: float
    slope: float
    climate_load: float
    fuel_economy: float


class InferRequest(BaseModel):
    segments: List[Segment]


def build_features(segment: Segment) -> np.ndarray:
    return np.array([
        segment.speed,
        segment.rpm,
        segment.accel_pedal,
        segment.traffic_index,
        segment.slope,
        segment.climate_load,
    ])


def contribution_from_delta(segment: Segment, baseline: Dict[str, float]) -> Dict[str, float]:
    raw = {
        "급가속": max(0.0, segment.accel_pedal - baseline["accel_pedal"]),
        "교통체증": max(0.0, segment.traffic_index - baseline["traffic_index"]),
        "공조부하": max(0.0, segment.climate_load - baseline["climate_load"]),
        "고RPM": max(0.0, segment.rpm - baseline["rpm"]),
        "경사": max(0.0, segment.slope - baseline["slope"]),
    }
    total = sum(raw.values())
    if total == 0:
        return {k: 0.0 for k in raw}
    return {k: round(v / total * 100, 1) for k, v in raw.items()}


@app.get("/health")
def health() -> Dict[str, bool]:
    return {"ok": True}


@app.post("/infer")
def infer(req: InferRequest) -> Dict[str, Any]:
    if not req.segments:
        return {"results": [], "rmse": 0.0, "predicted_avg_fuel_economy": 0.0}

    X = np.array([build_features(s) for s in req.segments])
    y = np.array([s.fuel_economy for s in req.segments])

    model = GradientBoostingRegressor(random_state=42)
    model.fit(X, y)
    pred = model.predict(X)

    rmse = float(np.sqrt(np.mean((pred - y) ** 2)))
    baseline = {
        "rpm": float(np.mean([s.rpm for s in req.segments])),
        "accel_pedal": float(np.mean([s.accel_pedal for s in req.segments])),
        "traffic_index": float(np.mean([s.traffic_index for s in req.segments])),
        "slope": float(np.mean([s.slope for s in req.segments])),
        "climate_load": float(np.mean([s.climate_load for s in req.segments])),
    }

    results = []
    for idx, seg in enumerate(req.segments):
        contributions = contribution_from_delta(seg, baseline)
        dominant = max(contributions, key=contributions.get)
        coaching = f"{dominant} 영향이 높습니다. 해당 구간은 정속 주행과 부하 관리 전략을 권장합니다."
        results.append(
            {
                "id": seg.id,
                "segment_no": idx + 1,
                "predicted_fuel_economy": round(float(pred[idx]), 2),
                "actual_fuel_economy": seg.fuel_economy,
                "contributions": contributions,
                "coaching_guide": coaching,
            }
        )

    return {
        "results": results,
        "rmse": round(rmse, 4),
        "predicted_avg_fuel_economy": round(float(np.mean(pred)), 2),
    }
