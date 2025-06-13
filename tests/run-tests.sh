#!/bin/bash

# DiskDominator Test Suite Runner
# Usage: ./tests/run-tests.sh [unit|integration|e2e|performance|all]

set -e

TEST_TYPE=${1:-all}

echo "🧪 DiskDominator Test Suite"
echo "=========================="
echo ""

# Function to run tests with timing
run_test_suite() {
    local suite_name=$1
    local test_command=$2
    
    echo "🔍 Running $suite_name tests..."
    start_time=$(date +%s)
    
    if eval "$test_command"; then
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        echo "✅ $suite_name tests passed in ${duration}s"
    else
        echo "❌ $suite_name tests failed"
        exit 1
    fi
    echo ""
}

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run Rust tests
if [ "$TEST_TYPE" = "unit" ] || [ "$TEST_TYPE" = "all" ]; then
    echo "🦀 Running Rust unit tests..."
    cd src-tauri
    cargo test --lib
    cd ..
    echo ""
fi

# Run TypeScript/React tests
if [ "$TEST_TYPE" = "unit" ] || [ "$TEST_TYPE" = "all" ]; then
    run_test_suite "React/TypeScript unit" "npm test -- --selectProjects=unit --coverage"
fi

# Run integration tests
if [ "$TEST_TYPE" = "integration" ] || [ "$TEST_TYPE" = "all" ]; then
    run_test_suite "Integration" "npm test -- --selectProjects=integration"
fi

# Run E2E tests
if [ "$TEST_TYPE" = "e2e" ] || [ "$TEST_TYPE" = "all" ]; then
    echo "🌐 Starting dev server for E2E tests..."
    npm run dev &
    DEV_PID=$!
    
    # Wait for server to start
    sleep 5
    
    run_test_suite "E2E" "npm test -- --selectProjects=e2e"
    
    # Stop dev server
    kill $DEV_PID
fi

# Run performance tests
if [ "$TEST_TYPE" = "performance" ] || [ "$TEST_TYPE" = "all" ]; then
    run_test_suite "Performance" "npm test -- --selectProjects=performance"
fi

# Generate coverage report
if [ "$TEST_TYPE" = "all" ]; then
    echo "📊 Generating coverage report..."
    npm run coverage:report
    echo ""
    echo "📈 Coverage Summary:"
    cat coverage/coverage-summary.txt
fi

echo ""
echo "🎉 All tests completed successfully!"

# Check if we should open coverage report
if [ "$2" = "--open-coverage" ]; then
    echo "📂 Opening coverage report..."
    if command -v xdg-open &> /dev/null; then
        xdg-open coverage/lcov-report/index.html
    elif command -v open &> /dev/null; then
        open coverage/lcov-report/index.html
    fi
fi