import copy

from fastapi.testclient import TestClient

from src.app import app, activities


client = TestClient(app)


# Capture the initial activities state so each test runs against a fresh copy
_INITIAL_ACTIVITIES = copy.deepcopy(activities)


import pytest


@pytest.fixture(autouse=True)
def reset_activities():
    # Reset the in-memory activities mapping before each test
    activities.clear()
    activities.update(copy.deepcopy(_INITIAL_ACTIVITIES))
    yield


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Basic smoke: one known activity should be present
    assert "Chess Club" in data


def test_signup_success_and_reflected():
    email = "tester1@mergington.edu"
    activity = "Chess Club"

    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    body = resp.json()
    assert "Signed up" in body.get("message", "")
    # Participant should now be present in the in-memory store
    assert email in activities[activity]["participants"]


def test_signup_duplicate_returns_400():
    # Use an existing participant for Chess Club
    existing = _INITIAL_ACTIVITIES["Chess Club"]["participants"][0]
    resp = client.post(f"/activities/Chess Club/signup?email={existing}")
    assert resp.status_code == 400


def test_unregister_success():
    email = "tempuser@mergington.edu"
    activity = "Programming Class"

    # First sign up
    r1 = client.post(f"/activities/{activity}/signup?email={email}")
    assert r1.status_code == 200

    # Then unregister
    r2 = client.post(f"/activities/{activity}/unregister?email={email}")
    assert r2.status_code == 200
    assert email not in activities[activity]["participants"]


def test_unregister_not_signed_returns_404():
    resp = client.post("/activities/Chess Club/unregister?email=not-signed@mergington.edu")
    assert resp.status_code == 404


def test_activity_not_found():
    resp = client.post("/activities/NoSuchActivity/signup?email=foo@bar.com")
    assert resp.status_code == 404
    resp2 = client.post("/activities/NoSuchActivity/unregister?email=foo@bar.com")
    assert resp2.status_code == 404
