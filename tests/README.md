# OmniPizza QA Platform Tests

This directory contains automated tests for the OmniPizza API.

## Contract Tests

Contract tests validate that the API implementation matches its OpenAPI specification using [Schemathesis](https://schemathesis.readthedocs.io/).

### Setup

```bash
pip install -r requirements.txt
```

### Running Tests

Make sure the API is running first:

```bash
# In one terminal
cd backend
python main.py

# In another terminal
cd tests
pytest test_contract.py -v
```

### What is Tested

1. **Schema Validation**: All API responses match the OpenAPI spec
2. **Authentication Flow**: Login, token generation, protected endpoints
3. **Country-Specific Logic**: Field validations per country
4. **User Behaviors**: All 5 test user types
5. **Chaos Endpoints**: Debug/performance endpoints
6. **Error Handling**: Proper error codes and messages

### Test Reports

Generate detailed HTML report:

```bash
pytest test_contract.py --html=report.html --self-contained-html
```

### Continuous Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Contract Tests
  run: |
    cd tests
    pytest test_contract.py --junitxml=junit.xml
```

## Test Coverage

- ✅ Authentication endpoints
- ✅ Pizza catalog with multi-currency
- ✅ Checkout flow with country validations
- ✅ User behavior patterns
- ✅ Debug/chaos endpoints
- ✅ Error responses
