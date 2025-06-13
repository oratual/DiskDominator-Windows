#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Running DiskDominator Test Suite"
echo "===================================="

# Function to run tests and check results
run_test_suite() {
    local suite_name=$1
    local command=$2
    
    echo -e "\n${YELLOW}Running ${suite_name}...${NC}"
    
    if eval "$command"; then
        echo -e "${GREEN}✅ ${suite_name} passed${NC}"
        return 0
    else
        echo -e "${RED}❌ ${suite_name} failed${NC}"
        return 1
    fi
}

# Track failures
FAILURES=0

# 1. Run Rust tests
if run_test_suite "Rust Backend Tests" "cd src-tauri && cargo test"; then
    :
else
    ((FAILURES++))
fi

# 2. Run Frontend Unit Tests
if run_test_suite "Frontend Unit Tests" "npm run test:unit"; then
    :
else
    ((FAILURES++))
fi

# 3. Run Integration Tests
if run_test_suite "Integration Tests" "npm run test:integration"; then
    :
else
    ((FAILURES++))
fi

# 4. Build the application
echo -e "\n${YELLOW}Building application...${NC}"
if npm run build; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    ((FAILURES++))
fi

# 5. Run E2E tests (only if build succeeded)
if [ $FAILURES -eq 0 ]; then
    if run_test_suite "E2E Tests" "npm run test:e2e"; then
        :
    else
        ((FAILURES++))
    fi
fi

# Summary
echo -e "\n===================================="
echo "📊 Test Summary"
echo "===================================="

if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo "The application is ready for deployment."
else
    echo -e "${RED}❌ ${FAILURES} test suite(s) failed${NC}"
    echo "Please fix the failing tests before proceeding."
    exit 1
fi

# Performance report
echo -e "\n${YELLOW}📈 Performance Metrics:${NC}"
echo "- Backend compilation time: Check cargo output above"
echo "- Frontend build size: Check build output above"
echo "- Test execution time: $(date)"

echo -e "\n${GREEN}🎉 Test suite complete!${NC}"