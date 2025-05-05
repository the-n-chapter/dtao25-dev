import pytest
from typing import Any, Dict, List, Optional, Union
from datetime import datetime, timedelta

def mock_response(
    status_code: int = 200,
    json_data: Optional[Dict[str, Any]] = None,
    text: Optional[str] = None,
    headers: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Create a mock response object for testing API calls.
    
    Args:
        status_code: HTTP status code
        json_data: JSON response data
        text: Text response data
        headers: Response headers
        
    Returns:
        Dict containing mock response data
    """
    return {
        "status_code": status_code,
        "json": lambda: json_data if json_data else {},
        "text": text or "",
        "headers": headers or {},
    }

def generate_test_data(
    count: int = 10,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> List[Dict[str, Any]]:
    """
    Generate test data for testing purposes.
    
    Args:
        count: Number of data points to generate
        start_date: Start date for the data range
        end_date: End date for the data range
        
    Returns:
        List of dictionaries containing test data
    """
    if not start_date:
        start_date = datetime.now() - timedelta(days=30)
    if not end_date:
        end_date = datetime.now()
    
    data = []
    for i in range(count):
        timestamp = start_date + (end_date - start_date) * (i / count)
        data.append({
            "id": f"test_{i}",
            "timestamp": timestamp.isoformat(),
            "value": i * 10,
            "metadata": {
                "source": "test",
                "version": "1.0"
            }
        })
    return data

def assert_dict_contains_subset(
    actual: Dict[str, Any],
    expected: Dict[str, Any],
    path: str = ""
) -> None:
    """
    Assert that a dictionary contains all the key-value pairs from another dictionary.
    
    Args:
        actual: The dictionary to check
        expected: The dictionary containing expected key-value pairs
        path: Current path in the dictionary (used for error messages)
    """
    for key, value in expected.items():
        new_path = f"{path}.{key}" if path else key
        assert key in actual, f"Key '{new_path}' not found in actual dictionary"
        
        if isinstance(value, dict):
            assert_dict_contains_subset(actual[key], value, new_path)
        else:
            assert actual[key] == value, f"Value mismatch at '{new_path}': expected {value}, got {actual[key]}"

@pytest.fixture
def test_data() -> List[Dict[str, Any]]:
    """
    Fixture that provides test data for multiple tests.
    """
    return generate_test_data() 