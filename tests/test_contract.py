"""
Contract Tests for OmniPizza API using Schemathesis

This test suite validates that the API implementation matches its OpenAPI specification.
Schemathesis automatically generates test cases based on the OpenAPI schema.
"""

import schemathesis
from hypothesis import settings, Phase

# API base URL (update for your environment)
API_BASE_URL = "http://localhost:8000"

# Load the OpenAPI schema from the running API
schema = schemathesis.from_uri(f"{API_BASE_URL}/api/openapi.json")


@schema.parametrize()
@settings(
    max_examples=50,  # Number of test cases to generate per endpoint
    phases=[Phase.explicit, Phase.generate],  # Include explicit and generated examples
    deadline=5000,  # 5 second timeout per test
)
def test_api_contract(case):
    """
    Test that API responses conform to the OpenAPI specification
    
    This test:
    1. Generates requests based on the OpenAPI schema
    2. Sends requests to the API
    3. Validates responses match the schema
    4. Checks status codes are valid
    5. Verifies response headers and content types
    """
    response = case.call()
    
    # Validate response against schema
    case.validate_response(response)


@schema.parametrize(endpoint="/api/auth/login", method="POST")
def test_auth_login_contract(case):
    """Test authentication endpoint specifically"""
    response = case.call()
    case.validate_response(response)
    
    # Additional assertions for login endpoint
    if response.status_code == 200:
        assert "access_token" in response.json()
        assert "username" in response.json()
        assert "behavior" in response.json()


@schema.parametrize(endpoint="/api/pizzas", method="GET")
def test_pizzas_requires_country_header(case):
    """Test that pizzas endpoint requires X-Country-Code header"""
    # Test without header (should fail)
    response = case.call()
    
    if "X-Country-Code" not in case.headers:
        assert response.status_code == 400


@schema.parametrize(endpoint="/api/checkout", method="POST")
def test_checkout_validation(case):
    """Test checkout endpoint validations"""
    response = case.call()
    case.validate_response(response)
    
    # Checkout requires authentication
    if "Authorization" not in case.headers:
        assert response.status_code == 401


# Custom test for user behaviors
def test_locked_out_user_behavior():
    """Test that locked_out_user gets proper error"""
    import requests
    
    response = requests.post(
        f"{API_BASE_URL}/api/auth/login",
        json={"username": "locked_out_user", "password": "pizza123"}
    )
    
    assert response.status_code == 403
    assert "locked out" in response.json()["detail"].lower()


def test_standard_user_flow():
    """Test complete flow for standard_user"""
    import requests
    
    # 1. Login
    login_response = requests.post(
        f"{API_BASE_URL}/api/auth/login",
        json={"username": "standard_user", "password": "pizza123"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    
    # 2. Get pizzas
    pizzas_response = requests.get(
        f"{API_BASE_URL}/api/pizzas",
        headers={
            "Authorization": f"Bearer {token}",
            "X-Country-Code": "MX"
        }
    )
    assert pizzas_response.status_code == 200
    pizzas = pizzas_response.json()["pizzas"]
    assert len(pizzas) > 0
    
    # 3. Checkout
    checkout_response = requests.post(
        f"{API_BASE_URL}/api/checkout",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        json={
            "country_code": "MX",
            "items": [{"pizza_id": pizzas[0]["id"], "quantity": 1}],
            "name": "Test User",
            "address": "Test Address 123",
            "phone": "5512345678",
            "colonia": "Test Colonia"
        }
    )
    assert checkout_response.status_code == 200
    assert "order_id" in checkout_response.json()


def test_country_specific_validations():
    """Test country-specific field validations"""
    import requests
    
    # Login first
    login_response = requests.post(
        f"{API_BASE_URL}/api/auth/login",
        json={"username": "standard_user", "password": "pizza123"}
    )
    token = login_response.json()["access_token"]
    
    # Get a pizza
    pizzas_response = requests.get(
        f"{API_BASE_URL}/api/pizzas",
        headers={
            "Authorization": f"Bearer {token}",
            "X-Country-Code": "US"
        }
    )
    pizza_id = pizzas_response.json()["pizzas"][0]["id"]
    
    # Test US checkout without ZIP code (should fail)
    checkout_response = requests.post(
        f"{API_BASE_URL}/api/checkout",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        json={
            "country_code": "US",
            "items": [{"pizza_id": pizza_id, "quantity": 1}],
            "name": "Test User",
            "address": "Test Address 123",
            "phone": "5551234567"
            # Missing zip_code
        }
    )
    assert checkout_response.status_code == 400
    
    # Test with valid ZIP code
    checkout_response = requests.post(
        f"{API_BASE_URL}/api/checkout",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        json={
            "country_code": "US",
            "items": [{"pizza_id": pizza_id, "quantity": 1}],
            "name": "Test User",
            "address": "Test Address 123",
            "phone": "5551234567",
            "zip_code": "12345"
        }
    )
    assert checkout_response.status_code == 200


def test_debug_endpoints():
    """Test chaos engineering endpoints"""
    import requests
    import time
    
    # Test latency spike
    start = time.time()
    response = requests.get(f"{API_BASE_URL}/api/debug/latency-spike")
    duration = time.time() - start
    
    assert response.status_code == 200
    assert duration >= 0.5  # Should have at least 0.5s delay
    
    # Test CPU load
    response = requests.get(f"{API_BASE_URL}/api/debug/cpu-load")
    assert response.status_code == 200
    assert "fibonacci_35" in response.json()
    
    # Test metrics
    response = requests.get(f"{API_BASE_URL}/api/debug/metrics")
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/plain; charset=utf-8"


if __name__ == "__main__":
    # Run with: pytest test_contract.py -v
    pass
