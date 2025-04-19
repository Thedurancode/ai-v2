#!/usr/bin/env python3
"""
Test script for Dura API
Tests the main endpoints to ensure they're working correctly
"""

import requests
import json
import sys
import time

BASE_URL = "http://localhost:5018"  # Change to match your local port

def test_health():
    """Test the health endpoint"""
    print("Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check successful: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing health endpoint: {str(e)}")
        return False

def test_root():
    """Test the root endpoint"""
    print("\nTesting root endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            print(f"✅ Root endpoint successful: {response.status_code}")
            return True
        else:
            print(f"❌ Root endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing root endpoint: {str(e)}")
        return False

def run_tests():
    """Run all tests"""
    print("=== DURA API TESTS ===\n")
    
    health_success = test_health()
    root_success = test_root()
    
    print("\n=== TEST SUMMARY ===")
    print(f"Health endpoint: {'✅ PASS' if health_success else '❌ FAIL'}")
    print(f"Root endpoint: {'✅ PASS' if root_success else '❌ FAIL'}")
    
    if health_success and root_success:
        print("\n✅ All tests passed! Your API is ready for deployment.")
        return 0
    else:
        print("\n❌ Some tests failed. Please fix the issues before deploying.")
        return 1

if __name__ == "__main__":
    sys.exit(run_tests()) 